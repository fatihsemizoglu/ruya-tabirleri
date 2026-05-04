export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  category_id: string | null;
  author_id: string;
  is_published: boolean | null;
  is_featured: boolean | null;
  view_count: number | null;
  like_count: number | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  category?: BlogCategory;
  author?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_approved: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  replies?: BlogComment[];
}
