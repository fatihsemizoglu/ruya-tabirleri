-- =============================================
-- RÜYA TABİRLERİ - TAM MİGRATION
-- PostgreSQL (Supabase) Uyumlu
-- Sıfırdan tüm tabloları oluşturur
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. TEMEL TABLOLAR
-- =============================================

-- Kullanıcılar
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Kullanıcı Profilleri
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Kullanıcı Rolleri
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- =============================================
-- 2. RÜYA TABİRLERİ
-- =============================================

-- Kategoriler
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Rüyalar
CREATE TABLE IF NOT EXISTS dreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    islamic_interpretation TEXT,
    psychological_interpretation TEXT,
    keywords JSONB DEFAULT '[]',
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    meta_title VARCHAR(500),
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dreams_slug ON dreams(slug);
CREATE INDEX IF NOT EXISTS idx_dreams_category_id ON dreams(category_id);
CREATE INDEX IF NOT EXISTS idx_dreams_is_published ON dreams(is_published);
CREATE INDEX IF NOT EXISTS idx_dreams_is_featured ON dreams(is_featured);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON dreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dreams_title_trgm ON dreams USING gin(title gin_trgm_ops);

-- Yorumlar
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_dream_id ON comments(dream_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Yorum Beğenileri
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- Rüya Beğenileri
CREATE TABLE IF NOT EXISTS dream_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(dream_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dream_likes_dream_id ON dream_likes(dream_id);
CREATE INDEX IF NOT EXISTS idx_dream_likes_user_id ON dream_likes(user_id);

-- Favoriler
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(dream_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_dream_id ON favorites(dream_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Görüntüleme Geçmişi
CREATE TABLE IF NOT EXISTS view_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_view_history_user_id ON view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_view_history_viewed_at ON view_history(viewed_at DESC);

-- Rüya Günlüğü
CREATE TABLE IF NOT EXISTS dream_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    dream_date DATE,
    mood VARCHAR(20) CHECK (mood IN ('happy', 'sad', 'scared', 'confused', 'peaceful', 'anxious', 'excited', 'neutral')),
    tags JSONB DEFAULT '[]',
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dream_journal_user_id ON dream_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_journal_dream_date ON dream_journal(dream_date DESC);

-- =============================================
-- 3. BLOG
-- =============================================

-- Blog Kategorileri
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Blog Yazıları
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    featured_image VARCHAR(500),
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    scheduled_at TIMESTAMPTZ,
    tags JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    meta_title VARCHAR(500),
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Blog Yorumları
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);

-- Blog Beğenileri
CREATE TABLE IF NOT EXISTS blog_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Blog Aboneleri
CREATE TABLE IF NOT EXISTS blog_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(100),
    subscribed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_verification_token ON blog_subscribers(verification_token);

-- =============================================
-- 4. İLETİŞİM & ARAMA
-- =============================================

-- İletişim Mesajları
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Arama Logları
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query VARCHAR(500) NOT NULL,
    results_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);

-- Denetim Günlüğü
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    entity_title VARCHAR(500),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Site Ayarları
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Admin Bildirimleri
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'comment', 'message')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    link VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    user_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_active ON admin_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- =============================================
-- 5. GÜNLÜK ANKET
-- =============================================

CREATE TABLE IF NOT EXISTS daily_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    poll_date DATE NOT NULL UNIQUE,
    options JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES daily_polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_daily_polls_date ON daily_polls(poll_date DESC);

-- =============================================
-- 6. TRENDING TEMALAR
-- =============================================

CREATE TABLE IF NOT EXISTS trending_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trending_themes_period ON trending_themes(period_start, period_end);

-- =============================================
-- 7. SEMBOL SÖZLÜĞÜ
-- =============================================

CREATE TABLE IF NOT EXISTS dream_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    islamic_meaning TEXT,
    psychological_meaning TEXT,
    cultural_meanings JSONB DEFAULT '{}',
    related_symbols TEXT[] DEFAULT '{}',
    image_url TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dream_symbols_slug ON dream_symbols(slug);
CREATE INDEX IF NOT EXISTS idx_dream_symbols_name ON dream_symbols(name);
CREATE INDEX IF NOT EXISTS idx_dream_symbols_name_trgm ON dream_symbols USING gin(name gin_trgm_ops);

-- =============================================
-- 8. KÜLTÜREL YORUMLAR
-- =============================================

CREATE TABLE IF NOT EXISTS cultural_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culture_name TEXT NOT NULL,
    culture_code TEXT NOT NULL,
    symbol_name TEXT NOT NULL,
    interpretation TEXT NOT NULL,
    source TEXT,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cultural_interp_culture ON cultural_interpretations(culture_code);
CREATE INDEX IF NOT EXISTS idx_cultural_interp_symbol ON cultural_interpretations(symbol_name);

-- Osmanlı Rüya Tabirleri
CREATE TABLE IF NOT EXISTS ottoman_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol_name TEXT NOT NULL,
    interpretation TEXT NOT NULL,
    source_book TEXT,
    source_author TEXT,
    era TEXT DEFAULT 'Osmanlı',
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ottoman_symbol ON ottoman_interpretations(symbol_name);

-- =============================================
-- 9. KULLANICI BİLDİRİMLERİ
-- =============================================

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    new_dream_notification BOOLEAN DEFAULT true,
    comment_notification BOOLEAN DEFAULT true,
    daily_reminder BOOLEAN DEFAULT false,
    reminder_time TIME DEFAULT '08:00:00',
    weekly_summary BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 10. UYKU KALİTESİ
-- =============================================

CREATE TABLE IF NOT EXISTS sleep_quality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sleep_date DATE NOT NULL,
    quality INTEGER CHECK (quality >= 1 AND quality <= 5),
    hours_slept DECIMAL(3,1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, sleep_date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_quality_user_date ON sleep_quality(user_id, sleep_date DESC);

-- =============================================
-- 11. EMOJİ REAKSİYONLARI
-- =============================================

CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

-- =============================================
-- 12. DANIŞMANLIK & RANDEVU
-- =============================================

CREATE TABLE IF NOT EXISTS consultants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    bio TEXT,
    specialties TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    avatar_url TEXT,
    is_available BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_consultant ON appointments(consultant_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id, appointment_date);

-- =============================================
-- 13. REKLAM YÖNETİMİ
-- =============================================

CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    content_html TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    impression_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position, is_active);

CREATE TABLE IF NOT EXISTS sponsored_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'dream', 'banner')),
    content_id UUID,
    sponsor_name TEXT NOT NULL,
    sponsor_logo TEXT,
    sponsor_url TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    budget DECIMAL(10,2),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 14. İÇERİK TAKVİMİ
-- =============================================

CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'dream', 'social_media', 'newsletter')),
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'review', 'published')),
    scheduled_date DATE NOT NULL,
    assigned_to UUID REFERENCES users(id),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(scheduled_date);

-- =============================================
-- 15. HAFTALIK ÖZET
-- =============================================

CREATE TABLE IF NOT EXISTS weekly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_dreams INTEGER DEFAULT 0,
    top_mood TEXT,
    top_keywords TEXT[] DEFAULT '{}',
    summary_text TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, week_start)
);

-- =============================================
-- 16. A/B TEST
-- =============================================

CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    target_page TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ab_test_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id UUID,
    variant TEXT NOT NULL CHECK (variant IN ('a', 'b')),
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_test_events_test ON ab_test_events(test_id, variant);

-- =============================================
-- 17. KONUM BAZLI RÜYA TRENDLERI
-- =============================================

CREATE TABLE IF NOT EXISTS dream_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
    country_code TEXT,
    country_name TEXT,
    region TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dream_locations_country ON dream_locations(country_code);

-- =============================================
-- 18. VARSAYILAN VERİLER
-- =============================================

-- Site ayarları
INSERT INTO site_settings (key, value) VALUES
    ('site_name', '"Rüya Tabirleri"'),
    ('site_description', '"Binlerce rüya tabiri arasında arama yapın"'),
    ('contact_email', '"info@ruyatabirleri.com"')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 19. RLS (Row Level Security) POLİTİKALARI
-- =============================================

-- Tüm tablolar için RLS aktif et
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ottoman_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_locations ENABLE ROW LEVEL SECURITY;

-- Service role için full access politikaları
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'users', 'profiles', 'user_roles', 'categories', 'dreams',
            'comments', 'comment_likes', 'dream_likes', 'favorites',
            'view_history', 'dream_journal', 'blog_categories', 'blog_posts',
            'blog_comments', 'blog_likes', 'blog_subscribers', 'contact_messages',
            'search_logs', 'audit_logs', 'site_settings', 'admin_notifications',
            'daily_polls', 'poll_votes', 'trending_themes', 'dream_symbols',
            'cultural_interpretations', 'ottoman_interpretations', 'user_notifications',
            'push_subscriptions', 'notification_preferences', 'sleep_quality',
            'comment_reactions', 'consultants', 'appointments', 'ads',
            'sponsored_content', 'content_calendar', 'weekly_summaries',
            'ab_tests', 'ab_test_events', 'dream_locations'
        ])
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS service_role_all ON %I;
            CREATE POLICY service_role_all ON %I
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        ', t, t);
    END LOOP;
END $$;

-- Anon kullanıcılar için okuma politikaları (public tablolar)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'categories', 'dreams', 'blog_categories', 'blog_posts',
            'dream_symbols', 'cultural_interpretations', 'ottoman_interpretations',
            'daily_polls', 'trending_themes', 'site_settings', 'ads'
        ])
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS anon_read ON %I;
            CREATE POLICY anon_read ON %I
            FOR SELECT
            TO anon
            USING (true);
        ', t, t);
    END LOOP;
END $$;

-- =============================================
-- 20. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'users', 'profiles', 'categories', 'dreams', 'comments',
            'dream_journal', 'blog_categories', 'blog_posts', 'blog_comments',
            'blog_subscribers', 'site_settings', 'admin_notifications',
            'dream_symbols', 'notification_preferences', 'consultants',
            'appointments', 'ads', 'content_calendar', 'weekly_summaries'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %I;
            CREATE TRIGGER update_%s_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- =============================================
-- TAMAMLANDI
-- =============================================
