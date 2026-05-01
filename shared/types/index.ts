export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'admin' | 'moderator' | 'user';
export type DreamMood = 'happy' | 'sad' | 'scared' | 'confused' | 'peaceful' | 'anxious' | 'excited' | 'neutral';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  profile: Profile | null;
  role: AppRole;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  order_index: number | null;
  dream_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Dream {
  id: string;
  title: string;
  slug: string;
  content: string;
  category_id: string | null;
  islamic_interpretation: string | null;
  psychological_interpretation: string | null;
  keywords: string[] | null;
  is_featured: boolean | null;
  is_published: boolean | null;
  view_count: number | null;
  like_count: number | null;
  meta_title: string | null;
  meta_description: string | null;
  category_name?: string;
  category_slug?: string;
  isLiked?: boolean;
  isFavorited?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DreamJournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  dream_date: string;
  mood: DreamMood | null;
  tags: string[] | null;
  is_private: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_id: string;
  category_id: string | null;
  featured_image: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  scheduled_at: string | null;
  tags: string[] | null;
  view_count: number | null;
  like_count: number | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name?: string;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}