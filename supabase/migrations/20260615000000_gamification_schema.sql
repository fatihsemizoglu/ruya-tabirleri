-- =====================================================================
-- Gamification Schema
-- Tables: badges, user_xp, user_badges, drip_campaigns, drip_enrollments,
--         drip_steps, drip_step_events
-- =====================================================================

-- ---------- BADGES ----------
CREATE TABLE IF NOT EXISTS public.badges (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT NOT NULL DEFAULT 'Award',
  color       TEXT NOT NULL DEFAULT 'from-blue-500 to-cyan-500',
  category    TEXT NOT NULL DEFAULT 'engagement'
              CHECK (category IN ('engagement','achievement','special','loyalty')),
  rarity      TEXT NOT NULL DEFAULT 'common'
              CHECK (rarity IN ('common','rare','epic','legendary')),
  condition   TEXT,                  -- JS expression, e.g. "comment_count >= 10"
  auto        BOOLEAN NOT NULL DEFAULT true,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- USER XP ----------
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp           INTEGER NOT NULL DEFAULT 0,
  level        INTEGER NOT NULL DEFAULT 1,
  last_login   TIMESTAMPTZ,
  login_streak INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- USER BADGES ----------
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges (user_id);

-- ---------- DRIP CAMPAIGNS ----------
CREATE TABLE IF NOT EXISTS public.drip_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  segment         TEXT NOT NULL DEFAULT 'all'
                  CHECK (segment IN ('all','new','active','inactive','vip')),
  trigger         TEXT NOT NULL DEFAULT 'manual'
                  CHECK (trigger IN ('signup','inactive_7d','inactive_30d','manual')),
  active          BOOLEAN NOT NULL DEFAULT true,
  enrolled_count  INTEGER NOT NULL DEFAULT 0,
  open_rate       NUMERIC(5,2) NOT NULL DEFAULT 0,
  click_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- DRIP STEPS ----------
CREATE TABLE IF NOT EXISTS public.drip_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.drip_campaigns(id) ON DELETE CASCADE,
  step_index  INTEGER NOT NULL,
  day_offset  INTEGER NOT NULL DEFAULT 0,
  subject     TEXT NOT NULL,
  body        TEXT,
  UNIQUE (campaign_id, step_index)
);

-- ---------- DRIP ENROLLMENTS ----------
CREATE TABLE IF NOT EXISTS public.drip_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.drip_campaigns(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_step   INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','completed','paused','unsubscribed')),
  UNIQUE (campaign_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_user ON public.drip_enrollments (user_id);

-- ---------- DRIP STEP EVENTS (audit) ----------
CREATE TABLE IF NOT EXISTS public.drip_step_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.drip_enrollments(id) ON DELETE CASCADE,
  step_id     UUID NOT NULL REFERENCES public.drip_steps(id) ON DELETE CASCADE,
  event       TEXT NOT NULL CHECK (event IN ('sent','open','click','bounce')),
  ts          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_drip_step_events_enrollment
  ON public.drip_step_events (enrollment_id);

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE public.badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_steps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_step_events ENABLE ROW LEVEL SECURITY;

-- badges: public read active, admin write
DROP POLICY IF EXISTS "Public reads active badges" ON public.badges;
CREATE POLICY "Public reads active badges"
  ON public.badges FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage badges" ON public.badges;
CREATE POLICY "Admins manage badges"
  ON public.badges FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- user_xp: own row read+write via function; admin read all
DROP POLICY IF EXISTS "Users read own xp" ON public.user_xp;
CREATE POLICY "Users read own xp"
  ON public.user_xp FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all xp" ON public.user_xp;
CREATE POLICY "Admins read all xp"
  ON public.user_xp FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "System writes xp" ON public.user_xp;
CREATE POLICY "System writes xp"
  ON public.user_xp FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_badges: own read; admin manage
DROP POLICY IF EXISTS "Users read own badges" ON public.user_badges;
CREATE POLICY "Users read own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage user_badges" ON public.user_badges;
CREATE POLICY "Admins manage user_badges"
  ON public.user_badges FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- drip_campaigns + drip_steps: admin manage, public read active
DROP POLICY IF EXISTS "Public reads active campaigns" ON public.drip_campaigns;
CREATE POLICY "Public reads active campaigns"
  ON public.drip_campaigns FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins manage campaigns" ON public.drip_campaigns;
CREATE POLICY "Admins manage campaigns"
  ON public.drip_campaigns FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage steps" ON public.drip_steps;
CREATE POLICY "Admins manage steps"
  ON public.drip_steps FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- drip_enrollments: own read; service role manage
DROP POLICY IF EXISTS "Users read own enrollments" ON public.drip_enrollments;
CREATE POLICY "Users read own enrollments"
  ON public.drip_enrollments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.drip_enrollments;
CREATE POLICY "Admins manage enrollments"
  ON public.drip_enrollments FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read step events" ON public.drip_step_events;
CREATE POLICY "Admins read step events"
  ON public.drip_step_events FOR SELECT
  USING (is_admin(auth.uid()));

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- updated_at on badges / campaigns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_badges_updated_at ON public.badges;
CREATE TRIGGER trg_badges_updated_at
  BEFORE UPDATE ON public.badges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.drip_campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.drip_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_xp_updated_at ON public.user_xp;
CREATE TRIGGER trg_user_xp_updated_at
  BEFORE UPDATE ON public.user_xp
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Recompute level when xp changes
CREATE OR REPLACE FUNCTION public.compute_level(p_xp INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(1, FLOOR(SQRT(p_xp::numeric / 50.0))::int + 1);
$$;

CREATE OR REPLACE FUNCTION public.sync_user_level()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.level := public.compute_level(NEW.xp);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_level ON public.user_xp;
CREATE TRIGGER trg_sync_user_level
  BEFORE INSERT OR UPDATE OF xp ON public.user_xp
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_level();

-- Increment campaign enrolled_count helper
CREATE OR REPLACE FUNCTION public.bump_drip_enrolled_count(p_campaign UUID, p_delta INT)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE public.drip_campaigns
     SET enrolled_count = GREATEST(0, enrolled_count + p_delta)
   WHERE id = p_campaign;
$$;

-- =====================================================================
-- SEED DEFAULT BADGES
-- =====================================================================
INSERT INTO public.badges (id, name, description, icon, color, category, rarity, condition, auto)
VALUES
  ('b-first-comment', 'İlk Yorum',  'İlk yorumunu yaptı',          'Award', 'from-blue-500 to-cyan-500',     'engagement',  'common',    'comment_count >= 1',   true),
  ('b-night-owl',     'Gece Kuşu',  '00:00 - 06:00 arası 5 giriş', 'Moon',  'from-indigo-500 to-purple-500', 'special',     'rare',      'night_logins >= 5',    true),
  ('b-dream-expert',  'Rüya Uzmanı','100+ yorum yaptı',           'Trophy','from-amber-500 to-orange-500',  'achievement', 'epic',      'comment_count >= 100', true),
  ('b-social',        'Sosyal Paylaşımcı','10+ kez paylaşım',     'Share2','from-pink-500 to-rose-500',    'engagement',  'rare',      'share_count >= 10',   true),
  ('b-loyal-30',      'Sadık Üye',  '30 gün üst üste giriş',      'Star',  'from-emerald-500 to-teal-500',  'loyalty',     'epic',      'login_streak >= 30',  true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- HELPER VIEWS
-- =====================================================================

-- Leaderboard view (admin + own)
CREATE OR REPLACE VIEW public.v_user_leaderboard AS
SELECT
  p.user_id,
  COALESCE(p.username, p.full_name, 'Kullanıcı') AS display_name,
  p.avatar_url,
  COALESCE(x.xp, 0)         AS xp,
  COALESCE(x.level, 1)      AS level,
  COALESCE(x.login_streak, 0) AS login_streak
FROM public.profiles p
LEFT JOIN public.user_xp x ON x.user_id = p.user_id
ORDER BY xp DESC NULLS LAST;

GRANT SELECT ON public.v_user_leaderboard TO authenticated;
