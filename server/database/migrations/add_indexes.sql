-- Migration: Add indexes for frequently queried columns
-- Run this SQL to add indexes to your existing database

-- Indexes for dreams table
ALTER TABLE dreams ADD INDEX idx_dreams_is_published (is_published);
ALTER TABLE dreams ADD INDEX idx_dreams_is_featured (is_featured);
ALTER TABLE dreams ADD INDEX idx_dreams_category_id (category_id);
ALTER TABLE dreams ADD INDEX idx_dreams_slug (slug);
ALTER TABLE dreams ADD INDEX idx_dreams_created_at (created_at);
ALTER TABLE dreams ADD INDEX idx_dreams_view_count (view_count);
ALTER TABLE dreams ADD INDEX idx_dreams_like_count (like_count);
ALTER TABLE dreams ADD INDEX idx_dreams_title (title);
-- id is already primary key

-- Indexes for blog_posts table
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_is_published (is_published);
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_category_id (category_id);
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_category_id_is_published (category_id, is_published);
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_slug (slug);
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_created_at (created_at);
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_view_count (view_count);
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_like_count (like_count);
ALTER TABLE blog_posts ADD INDEX idx_blog_posts_title (title);
-- id is already primary key

-- Indexes for categories table
ALTER TABLE categories ADD INDEX idx_categories_slug (slug);
ALTER TABLE categories ADD INDEX idx_categories_name (name);
ALTER TABLE categories ADD INDEX idx_categories_order_index (order_index);
-- id is already primary key

-- Indexes for users table
ALTER TABLE users ADD INDEX idx_users_email (email);
ALTER TABLE users ADD INDEX idx_users_created_at (created_at);
-- id is already primary key

-- Indexes for profiles table
ALTER TABLE profiles ADD INDEX idx_profiles_user_id (user_id);
ALTER TABLE profiles ADD INDEX idx_profiles_email (email);
ALTER TABLE profiles ADD INDEX idx_profiles_created_at (created_at);
-- id is already primary key

-- Indexes for blog_likes table
ALTER TABLE blog_likes ADD INDEX idx_blog_likes_post_id (post_id);
ALTER TABLE blog_likes ADD INDEX idx_blog_likes_user_id (user_id);
ALTER TABLE blog_likes ADD INDEX idx_blog_likes_created_at (created_at);

-- Indexes for dream_likes table
ALTER TABLE dream_likes ADD INDEX idx_dream_likes_dream_id (dream_id);
ALTER TABLE dream_likes ADD INDEX idx_dream_likes_user_id (user_id);
ALTER TABLE dream_likes ADD INDEX idx_dream_likes_created_at (created_at);

-- Indexes for favorites table
ALTER TABLE favorites ADD INDEX idx_favorites_user_id (user_id);
ALTER TABLE favorites ADD INDEX idx_favorites_dream_id (dream_id);
ALTER TABLE favorites ADD INDEX idx_favorites_created_at (created_at);

-- Indexes for view_history table
ALTER TABLE view_history ADD INDEX idx_view_history_user_id (user_id);
ALTER TABLE view_history ADD INDEX idx_view_history_dream_id (dream_id);
ALTER TABLE view_history ADD INDEX idx_view_history_viewed_at (viewed_at);

-- Indexes for blog_comments table
ALTER TABLE blog_comments ADD INDEX idx_blog_comments_post_id (post_id);
ALTER TABLE blog_comments ADD INDEX idx_blog_comments_user_id (user_id);
ALTER TABLE blog_comments ADD INDEX idx_blog_comments_is_approved (is_approved);
ALTER TABLE blog_comments ADD INDEX idx_blog_comments_created_at (created_at);

-- Indexes for comments table
ALTER TABLE comments ADD INDEX idx_comments_dream_id (dream_id);
ALTER TABLE comments ADD INDEX idx_comments_user_id (user_id);
ALTER TABLE comments ADD INDEX idx_comments_is_approved (is_approved);
ALTER TABLE comments ADD INDEX idx_comments_created_at (created_at);

-- Indexes for blog_subscribers table
ALTER TABLE blog_subscribers ADD INDEX idx_blog_subscribers_email (email);
ALTER TABLE blog_subscribers ADD INDEX idx_blog_subscribers_is_verified (is_verified);
ALTER TABLE blog_subscribers ADD INDEX idx_blog_subscribers_subscribed_at (subscribed_at);

-- Indexes for audit_logs table
ALTER TABLE audit_logs ADD INDEX idx_audit_logs_user_id (user_id);
ALTER TABLE audit_logs ADD INDEX idx_audit_logs_entity_type (entity_type);
ALTER TABLE audit_logs ADD INDEX idx_audit_logs_entity_id (entity_id);
ALTER TABLE audit_logs ADD INDEX idx_audit_logs_created_at (created_at);
ALTER TABLE audit_logs ADD INDEX idx_audit_logs_action (action);
