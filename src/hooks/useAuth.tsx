import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi } from '@/lib/api';
import { User, Profile, AppRole } from '@/lib/api/types';
import { queryKeys } from '@/lib/query/client';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRole: AppRole;
  loading: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; username?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        queryClient.setQueryData(queryKeys.auth.me, response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        queryClient.setQueryData(queryKeys.auth.me, response.data.user);
        return { error: null };
      }
      return { error: new Error(response.error || 'Login failed') };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Login failed') };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; username?: string }
  ) => {
    try {
      const response = await authApi.register(email, password, metadata?.full_name, metadata?.username);
      if (response.success && response.data) {
        setUser(response.data.user);
        queryClient.setQueryData(queryKeys.auth.me, response.data.user);
        return { error: null };
      }
      return { error: new Error(response.error || 'Registration failed') };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Registration failed') };
    }
  };

  const signOut = async () => {
    await authApi.logout();
    setUser(null);
    queryClient.setQueryData(queryKeys.auth.me, null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.success && response.data) {
        setUser(response.data);
        queryClient.setQueryData(queryKeys.auth.me, response.data);
        return { error: null };
      }
      return { error: new Error(response.error || 'Update failed') };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Update failed') };
    }
  };

  const profile = user?.profile || null;
  const userRole = user?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'admin' || userRole === 'moderator';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userRole,
        loading,
        isLoading: loading,
        isAdmin,
        isModerator,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User, Profile, AppRole };