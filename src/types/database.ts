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
  order_index: number | null;
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
  keywords: string[] | null;
  view_count: number | null;
  like_count: number | null;
  is_featured: boolean | null;
  is_published: boolean | null;
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
  tags: string[] | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
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
  user_id: string;
  dream_id: string;
  content: string;
  is_approved: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface DreamSearchResult {
  id: string;
  title: string;
  slug: string;
  content: string;
  category_id: string | null;
  view_count: number;
  like_count: number;
  rank: number;
}
