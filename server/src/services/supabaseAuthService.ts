import { supabaseAuth, supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import { env } from '../config/env';
import jwt from 'jsonwebtoken';
import type { LoginRequest, RegisterRequest, AuthResponse, AppRole } from '../types/index';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const COOKIE_NAME = 'auth_token';

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function setAuthCookie(res: Response, token: string): void {
  const isProduction = env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export class SupabaseAuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, full_name, username } = data;

    try {
      // In development, skip Supabase Auth and create a mock user
      if (process.env.NODE_ENV === 'development') {
        const userId = uuidv4();
        const token = generateToken(userId, email);

        console.log('Development mode: Creating mock user', { userId, email });

        // Try to create profile and role, but don't fail if tables don't exist
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: userId,
              user_id: userId,
              email,
              full_name: full_name || null,
              username: username || null,
            });

          await supabase
            .from('user_roles')
            .upsert({ id: uuidv4(), user_id: userId, role: 'user' });
        } catch (dbError) {
          console.warn('Could not create user profile/role, continuing with basic auth');
        }

        return {
          user: {
            id: userId,
            email,
            name: full_name || username || undefined,
            profile: null,
            role: 'user',
          },
          token,
          expiresIn: env.JWT_EXPIRES_IN,
        };
      }

      // Production: Use Supabase Auth
      const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name || username || email.split('@')[0],
            username: username || email.split('@')[0],
          }
        }
      });

      if (authError || !authData.user) {
        throw new AppError(authError?.message || 'Failed to create user', 500);
      }

      const userId = authData.user.id;
      const token = generateToken(userId, email);

      // Try to create profile and role, but don't fail if tables don't exist
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            user_id: userId,
            email,
            full_name: full_name || null,
            username: username || null,
          });

        await supabase
          .from('user_roles')
          .upsert({ id: uuidv4(), user_id: userId, role: 'user' });
      } catch (dbError) {
        console.warn('Could not create user profile/role, continuing with basic auth');
      }

      return {
        user: {
          id: userId,
          email,
          name: full_name || username || undefined,
          profile: null,
          role: 'user',
        },
        token,
        expiresIn: env.JWT_EXPIRES_IN,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Registration failed', 500);
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // In development, create mock authentication for any email/password
    if (process.env.NODE_ENV === 'development') {
      // For admin login, check if it's the admin email
      let role: AppRole = 'user';
      let userId = uuidv4();

      if (email === 'admin@mysticlogbook.com' && password === 'admin123') {
        role = 'admin';
        userId = 'bf48a7a8-daee-411f-b8d0-d8ba951cd37a'; // Use the same ID from migration
      } else if (email === 'moderator@example.com' && password === 'moderator123') {
        role = 'moderator';
        userId = '660e8400-e29b-41d4-a716-446655440000'; // Use the same ID from migration
      } else if (email === 'user@example.com' && password === 'user123') {
        role = 'user';
        userId = '550e8400-e29b-41d4-a716-446655440000'; // Use the same ID from migration
      }

      const token = generateToken(userId, email);

      console.log('Development mode: Mock login successful', { email, role });

      let profile = null;
      try {
        const profileResult = await supabase.from('profiles').select('*').eq('id', userId).single();
        profile = profileResult.data;
      } catch (dbError) {
        console.warn('Could not fetch user profile, using defaults');
      }

      return {
        user: {
          id: userId,
          email,
          name: profile?.full_name || profile?.username || email.split('@')[0],
          profile: profile || null,
          role: role,
        },
        token,
        expiresIn: env.JWT_EXPIRES_IN,
      };
    }

    // Production: Use Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new AppError('Invalid email or password', 401);
    }

    const userId = authData.user.id;
    const token = generateToken(userId, email);

    let profile = null;
    let role: AppRole = 'user';

    // Try to get profile and role, but don't fail if tables don't exist
    try {
      const profileResult = await supabase.from('profiles').select('*').eq('id', userId).single();
      profile = profileResult.data;

      const roleResult = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
      role = (roleResult.data?.role as AppRole) || 'user';
    } catch (dbError) {
      console.warn('Could not fetch user profile/role, using defaults');
    }

    return {
      user: {
        id: userId,
        email,
        name: profile?.full_name || profile?.username || authData.user.user_metadata?.full_name || undefined,
        profile: profile || null,
        role: role,
      },
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async adminLogin(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // In development, allow admin/moderator login with specific credentials
    if (process.env.NODE_ENV === 'development') {
      let role: AppRole = 'admin';
      let userId = 'bf48a7a8-daee-411f-b8d0-d8ba951cd37a';

      if (email === 'admin@mysticlogbook.com' && password === 'admin123') {
        role = 'admin';
        userId = 'bf48a7a8-daee-411f-b8d0-d8ba951cd37a';
      } else if (email === 'moderator@example.com' && password === 'moderator123') {
        role = 'moderator';
        userId = '660e8400-e29b-41d4-a716-446655440000';
      } else {
        throw new AppError('Invalid admin credentials', 401);
      }

      const token = generateToken(userId, email);

      console.log('Development mode: Admin login successful');

      let profile = null;
      try {
        const profileResult = await supabase.from('profiles').select('*').eq('id', userId).single();
        profile = profileResult.data;
      } catch (dbError) {
        console.warn('Could not fetch admin profile, using defaults');
      }

      return {
        user: {
          id: userId,
          email,
          name: profile?.full_name || (role === 'admin' ? 'Admin User' : 'Moderator User'),
          profile: profile || null,
          role: role,
        },
        token,
        expiresIn: env.JWT_EXPIRES_IN,
      };
    }

    // Production: Use Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new AppError('Invalid email or password', 401);
    }

    const userId = authData.user.id;
    let role: AppRole = 'user';

    // Try to get role, but don't fail if tables don't exist
    try {
      const roleResult = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      role = (roleResult.data?.role as AppRole) || 'user';
    } catch (dbError) {
      console.warn('Could not fetch user role, using default');
    }

    if (!['admin', 'moderator'].includes(role)) {
      await supabaseAuth.auth.signOut();
      throw new AppError('Unauthorized - Admin access required', 403);
    }

    let profile = null;
    try {
      const profileResult = await supabase.from('profiles').select('*').eq('id', userId).single();
      profile = profileResult.data;
    } catch (dbError) {
      console.warn('Could not fetch user profile, using defaults');
    }

    const token = generateToken(userId, email);

    return {
      user: {
        id: userId,
        email,
        name: profile?.full_name || profile?.username || authData.user.user_metadata?.full_name || undefined,
        profile: profile || null,
        role: role,
      },
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.FRONTEND_URL}/sifre-sifirla`,
    });

    if (error) {
      throw new AppError('Failed to send reset email', 500);
    }

    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    };
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean }> {
    const { error } = await supabaseAuth.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AppError('Failed to update password', 500);
    }

    return { success: true };
  }

  async verifyOAuthToken(accessToken: string): Promise<AuthResponse> {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(accessToken);

    if (error || !user) {
      throw new AppError('Invalid OAuth token', 401);
    }

    const userId = user.id;
    const email = user.email || '';

    const [{ data: profile }, { data: roleData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);

    if (!profile) {
      await supabase.from('profiles').upsert({
        id: userId,
        user_id: userId,
        email,
        full_name: user.user_metadata?.full_name || null,
        username: user.user_metadata?.username || null,
      });

      await supabase.from('user_roles').upsert({
        id: uuidv4(),
        user_id: userId,
        role: 'user',
      });
    }

    const token = generateToken(userId, email);

    return {
      user: {
        id: userId,
        email,
        name: profile?.full_name || profile?.username || undefined,
        profile: profile || null,
        role: roleData?.role || 'user',
      },
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async signInWithOAuth(provider: 'google' | 'facebook' | 'github'): Promise<{ url: string }> {
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'https://ruya-tabirleri.vercel.app'}/auth/callback`,
        scopes: provider === 'google' ? 'email profile' : undefined,
      },
    });

    if (error) {
      throw new AppError(`Failed to sign in with ${provider}`, 500);
    }

    if (!data.url) {
      throw new AppError('No OAuth URL returned', 500);
    }

    return { url: data.url };
  }

  async signInWithPhone(phone: string, password: string): Promise<AuthResponse> {
    const { data: authData, error } = await supabaseAuth.auth.signInWithPassword({
      phone,
      password,
    });

    if (error || !authData.user) {
      throw new AppError('Invalid phone or password', 401);
    }

    const userId = authData.user.id;

    const [{ data: profile }, { data: roleData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);

    const token = generateToken(userId, phone);

    return {
      user: {
        id: userId,
        email: phone,
        name: profile?.full_name || undefined,
        profile: profile || null,
        role: roleData?.role || 'user',
      },
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }
}

export const supabaseAuthService = new SupabaseAuthService();