-- ============================================================
-- AI ÖZELLİKLERİ - VERİTABANI MİGRASYONU
-- dream_journal tablosuna uyarlanmıştır
-- ============================================================

-- 1. dream_journal'a yeni sütunlar ekle
ALTER TABLE public.dream_journal
ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT NULL;

ALTER TABLE public.dream_journal
ADD COLUMN IF NOT EXISTS series_id UUID DEFAULT NULL;

ALTER TABLE public.dream_journal
ADD COLUMN IF NOT EXISTS symbols TEXT[] DEFAULT '{}';

ALTER TABLE public.dream_journal
ADD COLUMN IF NOT EXISTS emotion VARCHAR(50) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_dream_journal_symbols ON public.dream_journal USING GIN (symbols);
CREATE INDEX IF NOT EXISTS idx_dream_journal_emotion ON public.dream_journal(emotion);
CREATE INDEX IF NOT EXISTS idx_dream_journal_series_id ON public.dream_journal(series_id);

-- 2. YENİ TABLOLAR

CREATE TABLE IF NOT EXISTS public.dream_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dream_id UUID REFERENCES public.dream_journal(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbols TEXT[] DEFAULT '{}',
    emotion VARCHAR(50),
    psychological_interpretation TEXT,
    keywords TEXT[] DEFAULT '{}',
    confidence_score FLOAT DEFAULT 0.0,
    model_version VARCHAR(50) DEFAULT 'hf-v1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_dream_analysis UNIQUE(dream_id)
);

CREATE TABLE IF NOT EXISTS public.public_dream_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_dream_id UUID REFERENCES public.dream_journal(id) ON DELETE SET NULL,
    content_hash VARCHAR(64) UNIQUE,
    short_content TEXT,
    symbols TEXT[] DEFAULT '{}',
    emotion VARCHAR(50),
    category VARCHAR(50),
    created_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dream_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    dream_id UUID REFERENCES public.dream_journal(id) ON DELETE CASCADE,
    matched_dream_id UUID REFERENCES public.dream_journal(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    match_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_reminder_prefs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    preferred_time TIME DEFAULT '08:00:00',
    preferred_days VARCHAR(7)[] DEFAULT '{"Mon","Wed","Fri"}',
    avg_dreams_per_week FLOAT DEFAULT 0.0,
    most_active_day VARCHAR(10),
    streak_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GÖRÜNÜMLER

DROP VIEW IF EXISTS public.global_dream_stats;
CREATE OR REPLACE VIEW public.global_dream_stats AS
SELECT
    COUNT(*) as total_dreams,
    COUNT(DISTINCT user_id) as active_users,
    (SELECT COUNT(DISTINCT s) FROM (SELECT UNNEST(symbols) as s FROM public.dream_journal WHERE symbols IS NOT NULL) sub) as unique_symbols,
    (SELECT array_agg(symbol) FROM (
        SELECT UNNEST(symbols) as symbol, COUNT(*) as cnt
        FROM public.dream_journal
        WHERE symbols IS NOT NULL
        GROUP BY symbol
        ORDER BY cnt DESC
        LIMIT 5
    )) as top_symbols,
    (SELECT json_object_agg(emotion, cnt) FROM (
        SELECT COALESCE(emotion, 'unknown') as emotion, COUNT(*) as cnt
        FROM public.dream_journal
        WHERE emotion IS NOT NULL
        GROUP BY emotion
    )) as emotion_distribution
FROM public.dream_journal;

DROP VIEW IF EXISTS public.daily_dream_trends;
CREATE OR REPLACE VIEW public.daily_dream_trends AS
SELECT
    created_date,
    COUNT(*) as dream_count,
    COUNT(DISTINCT emotion) as emotion_variety,
    AVG(array_length(symbols, 1)) as avg_symbol_count
FROM public.public_dream_pool
GROUP BY created_date
ORDER BY created_date DESC
LIMIT 30;

-- 4. RLS POLICIES

ALTER TABLE public.dream_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own analyses" ON public.dream_analyses;
CREATE POLICY "Users view own analyses" ON public.dream_analyses
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service insert analyses" ON public.dream_analyses;
CREATE POLICY "Service insert analyses" ON public.dream_analyses
    FOR INSERT WITH CHECK (true);

ALTER TABLE public.public_dream_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read pool" ON public.public_dream_pool;
CREATE POLICY "Anyone read pool" ON public.public_dream_pool
    FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Service insert pool" ON public.public_dream_pool;
CREATE POLICY "Service insert pool" ON public.public_dream_pool
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.dream_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own matches" ON public.dream_matches;
CREATE POLICY "Users view own matches" ON public.dream_matches
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service insert matches" ON public.dream_matches;
CREATE POLICY "Service insert matches" ON public.dream_matches
    FOR INSERT WITH CHECK (true);

ALTER TABLE public.user_reminder_prefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage prefs" ON public.user_reminder_prefs;
CREATE POLICY "Users manage prefs" ON public.user_reminder_prefs
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. FONKSİYONLAR VE TRIGGER'LAR

CREATE OR REPLACE FUNCTION public.add_to_public_pool()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.public_dream_pool (
        original_dream_id,
        content_hash,
        short_content,
        symbols,
        emotion,
        category
    ) VALUES (
        NEW.id,
        md5(COALESCE(NEW.content, '')),
        LEFT(COALESCE(NEW.content, ''), 200),
        COALESCE(NEW.symbols, '{}'),
        NEW.emotion,
        'general'
    )
    ON CONFLICT (content_hash) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_add_to_public_pool ON public.dream_journal;
CREATE TRIGGER trg_add_to_public_pool
    AFTER INSERT OR UPDATE ON public.dream_journal
    FOR EACH ROW
    WHEN (NEW.content IS NOT NULL AND NEW.content != '')
    EXECUTE FUNCTION public.add_to_public_pool();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dream_journal_updated_at ON public.dream_journal;
CREATE TRIGGER update_dream_journal_updated_at
    BEFORE UPDATE ON public.dream_journal
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
