ALTER TABLE public.dream_journal
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_dream_journal_ai_analysis
  ON public.dream_journal USING GIN (ai_analysis);
