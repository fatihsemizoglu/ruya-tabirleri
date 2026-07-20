import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Profile, AppRole } from '@/types/database';
import { AuthContext, type AuthContextType, type AuthError, type SocialProvider } from './auth-context';

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'E-posta veya şifre hatalı.',
    'Email not confirmed': 'E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.',
    'User already registered': 'Bu e-posta adresi zaten kayıtlı.',
    'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalıdır.',
    'Signup requires a valid password': 'Geçerli bir şifre belirleyin.',
    'Invalid email': 'Geçersiz e-posta adresi.',
    'Email rate limit exceeded': 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.',
    'User not found': 'Bu e-posta adresine ait hesap bulunamadı.',
    'Only an admin can invoke this': 'Bu işlem için yetkiniz bulunmuyor.',
    'New password should be different from the old password': 'Yeni şifreniz eskisinden farklı olmalıdır.',
    'Invalid refresh token': 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
    'Session expired': 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
  };
  return map[message] || message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [session, setSession] = useState<AuthContextType['session']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Race condition önleme: aynı userId için duplicate fetch engelle
  const currentUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const syncSentryUser = useCallback((currentUser: AuthContextType['user'], currentProfile: Profile | null) => {
    if (!import.meta.env.VITE_SENTRY_DSN) return;
    if (currentUser) {
      Sentry.setUser({
        id: currentUser.id,
        email: currentUser.email ?? '',
        username: currentProfile?.username ?? currentProfile?.full_name ?? '',
        role: roles[0] ?? '',
      });
      Sentry.setTag('isAdmin', String(roles.includes('admin')));
    } else {
      Sentry.setUser(null);
    }
  }, [roles]);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      captureError(error, { tags: { feature: 'auth', action: 'fetch-profile' } });
    }
  }, []);

  const fetchRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      setRoles(roles);
    } catch (error) {
      captureError(error, { tags: { feature: 'auth', action: 'fetch-roles' } });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    if (currentUserIdRef.current === userId) return;
    currentUserIdRef.current = userId;
    await Promise.all([fetchProfile(userId), fetchRoles(userId)]);
  }, [fetchProfile, fetchRoles]);

  useEffect(() => {
    syncSentryUser(user, profile);
  }, [user, profile, roles, syncSentryUser]);

  useEffect(() => {
    // ADIM 1: Önce listener kur (Supabase önerisi)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Sadece getSession tamamlandıktan sonra listener üzerinden fetch yap
        if (initializedRef.current) {
          loadUserData(session.user.id);
        }
      } else {
        currentUserIdRef.current = null;
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      }
    });

    // ADIM 2: Sonra mevcut session'ı kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      initializedRef.current = true;
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const mapError = (error: Error | null): AuthError | null => {
    if (!error) return null;
    const message = translateAuthError(error.message);
    return { message, code: (error as any).code };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: mapError(error as Error | null) };
  };

  const signUp = async (email: string, password: string, metadata?: { username?: string; full_name?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
        emailRedirectTo: `${window.location.origin}/giris`,
      },
    });
    return { error: mapError(error as Error | null) };
  };

  const signInWithProvider = async (provider: SocialProvider) => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) captureError(error, { tags: { feature: 'auth', action: 'sign-out' } });
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser(null);
    }
    setProfile(null);
    setRoles([]);
  };

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      isAdmin,
      isModerator,
      isLoading,
      signIn,
      signUp,
      signOut,
      signInWithProvider,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
