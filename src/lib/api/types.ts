/**
 * API Types for Mystic Logbook
 */

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

export interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
    pagination?: ApiResponse['pagination'];
}

export interface ErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: ValidationErrorDetail[];
}

export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;

export interface User {
    id: string;
    email: string;
    profile: Profile | null;
    role: 'admin' | 'moderator' | 'user';
    created_at?: string;
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

export interface Comment {
    id: string;
    content: string;
    dream_id: string;
    user_id: string;
    is_approved: boolean | null;
    like_count: number | null;
    author_name?: string;
    author_avatar?: string | null;
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
    meta_title: string | null;
    meta_description: string | null;
    tags: string[] | null;
    view_count: number | null;
    like_count: number | null;
    author_name?: string;
    author_avatar?: string | null;
    category_name?: string;
    category_slug?: string;
    created_at: string;
    updated_at: string;
}

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    order_index: number | null;
    post_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Subscriber {
    id: string;
    email: string;
    is_active: boolean | null;
    created_at: string;
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

export interface SearchLog {
    id: string;
    query: string;
    user_id: string | null;
    result_count: number | null;
    created_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: any | null;
    ip_address: string | null;
    created_at: string;
}

export interface SiteSettings {
    id: string;
    site_name: string;
    site_description: string | null;
    contact_email: string | null;
    social_links: any | null;
    maintenance_mode: boolean | null;
    allow_registration: boolean | null;
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

export interface Favorite {
    id: string;
    user_id: string;
    dream_id: string;
    created_at: string;
    dreams?: Dream;
}

export interface ViewHistory {
    id: string;
    user_id: string;
    dream_id: string;
    viewed_at: string;
    dreams?: Dream;
}

export type DreamMood = 'happy' | 'sad' | 'scared' | 'confused' | 'peaceful' | 'anxious' | 'excited' | 'neutral';

export type AppRole = 'admin' | 'moderator' | 'user';

export interface AuthResponse {
    user: User;
    token: string;
    expiresIn: string;
}

export interface ApiError {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, string[]>;
}

export interface ValidationErrorDetail {
    field: string;
    message: string;
    code?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface BatchResponse<T> {
    successful: T[];
    failed: { id: string; error: string }[];
}
