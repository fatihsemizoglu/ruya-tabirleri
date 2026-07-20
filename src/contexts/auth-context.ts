import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AppRole } from '@/types/database';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export type SocialProvider = 'google';

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { username?: string; full_name?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: SocialProvider) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
