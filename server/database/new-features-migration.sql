-- =============================================
-- Yeni Özellikler Migration Dosyası
-- PostgreSQL (Supabase) Uyumlu
-- =============================================

-- 1. Günlük Rüya Anketi
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

-- 2. Trending Rüya Temaları
CREATE TABLE IF NOT EXISTS trending_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trending_themes_period ON trending_themes(period_start, period_end);

-- 3. Rüya Sembolü Sözlüğü
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

-- 4. Kültürel Rüya Yorumları
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

-- 5. Osmanlı Rüya Tabirleri
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

-- 6. Kullanıcı Bildirimleri
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

-- 7. Push Notification Abonelikleri
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

-- 8. Kullanıcı Bildirim Tercihleri
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

-- 9. Uyku Kalitesi Kaydı
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

-- 10. Rüya Emoji Reaksiyonları
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

-- 11. Rüya Danışmanlığı (Randevu Sistemi)
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

-- 12. Reklam Yönetimi
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

-- 13. Sponsorlu İçerik
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

-- 14. İçerik Takvimi (Admin)
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

-- 15. Haftalık Özet Verileri
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

-- 16. A/B Test
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

-- 17. Konum Bazlı Rüya Trendleri
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
