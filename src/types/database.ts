// Custom database types for the dream interpretation app

export type AppRole = 'admin' | 'moderator' | 'user';
export type DreamMood = 'happy' | 'sad' | 'scared' | 'confused' | 'peaceful' | 'anxious' | 'excited' | 'neutral';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Dream {
  id: string;
  title: string;
  slug: string;
  content: string;
  islamic_interpretation: string | null;
  psychological_interpretation: string | null;
  category_id: string | null;
  keywords: string[];
  view_count: number;
  like_count: number;
  is_featured: boolean;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface DreamJournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  dream_date: string;
  mood: DreamMood | null;
  tags: string[];
  is_private: boolean;
  ai_analysis: Record<string, unknown> | null;
  audio_url: string | null;
  series_id: string | null;
  symbols: string[];
  emotion: string | null;
  created_at: string;
  updated_at: string;
}

export interface DreamAnalysis {
  id: string;
  dream_id: string;
  user_id: string;
  symbols: string[];
  emotion: string | null;
  psychological_interpretation: string | null;
  keywords: string[];
  confidence_score: number;
  model_version: string;
  created_at: string;
}

export interface PublicDreamPool {
  id: string;
  original_dream_id: string | null;
  content_hash: string | null;
  short_content: string | null;
  symbols: string[];
  emotion: string | null;
  category: string | null;
  created_date: string;
  created_at: string;
}

export interface DreamMatch {
  id: string;
  user_id: string;
  dream_id: string;
  matched_dream_id: string;
  similarity_score: number;
  match_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UserReminderPrefs {
  user_id: string;
  is_enabled: boolean;
  preferred_time: string;
  preferred_days: string[];
  avg_dreams_per_week: number;
  most_active_day: string | null;
  streak_count: number;
  last_reminder_sent: string | null;
  updated_at: string;
}

export interface GlobalDreamStats {
  total_dreams: number;
  active_users: number;
  unique_symbols: number;
  top_symbols: string[] | null;
  emotion_distribution: Record<string, number> | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  dream_id: string;
  created_at: string;
  dream?: Dream;
}

export interface ViewHistory {
  id: string;
  user_id: string;
  dream_id: string;
  viewed_at: string;
  dream?: Dream;
}

export interface Comment {
  id: string;
  user_id: string | null;
  dream_id: string;
  content: string;
  is_approved: boolean;
  like_count: number;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: 'engagement' | 'achievement' | 'special' | 'loyalty';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: string | null;
  auto: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserXp {
  user_id: string;
  xp: number;
  level: number;
  last_login: string | null;
  login_streak: number;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  assigned_at: string;
  assigned_by: string | null;
  badge?: Badge;
}

export interface DreamSearchResult {
  id: string;
  title: string;
  slug: string;
  content: string;
  category_id: string | null;
  keywords?: string[] | null;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  created_at: string;
  rank: number;
  total_count?: number;
}
