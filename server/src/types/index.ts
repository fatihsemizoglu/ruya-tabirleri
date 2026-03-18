// Database Types for MySQL

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'admin' | 'moderator' | 'user';
export type DreamMood = 'happy' | 'sad' | 'scared' | 'confused' | 'peaceful' | 'anxious' | 'excited' | 'neutral';

// User & Auth
export interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: Date;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  order_index: number | null;
  created_at: Date;
  updated_at: Date;
}

// Dream
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
  created_at: Date;
  updated_at: Date;
}

// Comments
export interface Comment {
  id: string;
  content: string;
  dream_id: string;
  user_id: string;
  is_approved: boolean | null;
  like_count: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: Date;
}

// Dream Likes & Favorites
export interface DreamLike {
  id: string;
  dream_id: string;
  user_id: string;
  created_at: Date;
}

export interface Favorite {
  id: string;
  dream_id: string;
  user_id: string;
  created_at: Date;
}

export interface ViewHistory {
  id: string;
  dream_id: string;
  user_id: string;
  viewed_at: Date;
}

// Dream Journal
export interface DreamJournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  dream_date: Date;
  mood: DreamMood | null;
  tags: string[] | null;
  is_private: boolean | null;
  created_at: Date;
  updated_at: Date;
}

// Blog
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number | null;
  created_at: Date;
  updated_at: Date;
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
  scheduled_at: Date | null;
  tags: string[] | null;
  view_count: number | null;
  like_count: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlogComment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  is_approved: boolean | null;
  like_count: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlogLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: Date;
}

export interface BlogCommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: Date;
}

export interface BlogSubscriber {
  id: string;
  email: string;
  name: string | null;
  is_verified: boolean | null;
  verification_token: string | null;
  subscribed_at: Date;
  unsubscribed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Contact & Messages
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean | null;
  created_at: Date;
}

// Search & Analytics
export interface SearchLog {
  id: string;
  query: string;
  results_count: number | null;
  user_id: string | null;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  details: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// Site Settings
export interface SiteSetting {
  id: string;
  key: string;
  value: Json | null;
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  role: AppRole;
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
  user: AuthUser;
  token: string;
  expiresIn: string;
}