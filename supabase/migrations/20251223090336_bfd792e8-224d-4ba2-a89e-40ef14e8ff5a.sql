-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_dreams_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', 
        coalesce(NEW.title, '') || ' ' || 
        coalesce(NEW.content, '') || ' ' || 
        coalesce(array_to_string(NEW.keywords, ' '), '')
    );
    RETURN NEW;
END;
$$;