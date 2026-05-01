import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import { env } from '../config/env';
import type { LoginRequest, RegisterRequest, AuthResponse, UserPublic } from '../types/index';
import type { Response } from 'express';

const COOKIE_NAME = 'auth_token';

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function setAuthCookie(res: Response, token: string): void {
  const isProduction = env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

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

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, full_name, username } = data;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const userId = uuidv4();
    const profileId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error: userError } = await supabase
      .from('users')
      .insert({ id: userId, email, password: hashedPassword });

    if (userError) throw new AppError('Failed to create user', 500);

    await supabase
      .from('profiles')
      .insert({
        id: profileId,
        user_id: userId,
        email,
        full_name: full_name || null,
        username: username || null
      });

    await supabase
      .from('user_roles')
      .insert({ id: uuidv4(), user_id: userId, role: 'user' });

    const token = generateToken(userId, email);

    return {
      user: {
        id: userId,
        email,
        name: full_name || username || undefined,
        profile: {
          id: profileId,
          user_id: userId,
          email,
          full_name: full_name || null,
          username: username || null,
          avatar_url: null,
          bio: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        role: 'user',
      },
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) throw new AppError('Invalid email or password', 401);

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new AppError('Invalid email or password', 401);

    const [{ data: profile }, { data: roleData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', user.id).single(),
      supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', user.id),
    ]);

    const token = generateToken(user.id, user.email);
    const role = (roleData?.role as 'admin' | 'moderator' | 'user') || 'user';

    return {
      user: {
        id: user.id,
        email: user.email,
        name: profile?.full_name || profile?.username || undefined,
        profile: profile || undefined,
        role,
      },
      token,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async getProfile(userId: string): Promise<{ user: UserPublic }> {
    const [{ data: profile }, { data: roleData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);

    if (!profile) throw new AppError('Profile not found', 404);

    const role = (roleData?.role as 'admin' | 'moderator' | 'user') || 'user';

    return {
      user: {
        id: profile.user_id,
        email: profile.email,
        name: profile.full_name || profile.username || undefined,
        profile,
        role,
      }
    };
  }

  async updateProfile(
    userId: string,
    data: { full_name?: string; username?: string; bio?: string; avatar_url?: string }
  ): Promise<{ user: UserPublic }> {
    const { full_name, username, bio, avatar_url } = data;

    await supabase
      .from('profiles')
      .update({
        full_name: full_name || null,
        username: username || null,
        bio: bio || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return this.getProfile(userId);
  }

  async changePassword(
    userId: string,
    data: { current_password: string; new_password: string }
  ): Promise<{ message: string }> {
    const { current_password, new_password } = data;

    if (new_password.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (!user) throw new AppError('User not found', 404);

    const isPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isPasswordValid) throw new AppError('Current password is incorrect', 401);

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { message: 'Password updated successfully' };
  }
}

export const authService = new AuthService();
