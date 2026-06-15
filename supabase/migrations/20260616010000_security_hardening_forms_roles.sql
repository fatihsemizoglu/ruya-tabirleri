-- Security hardening for public forms and admin role changes.

-- Contact form: enforce sane lengths and email shape at the database boundary.
ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_name_length,
  DROP CONSTRAINT IF EXISTS contact_messages_email_format,
  DROP CONSTRAINT IF EXISTS contact_messages_subject_length,
  DROP CONSTRAINT IF EXISTS contact_messages_message_length;

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_name_length CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  ADD CONSTRAINT contact_messages_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND char_length(email) <= 200),
  ADD CONSTRAINT contact_messages_subject_length CHECK (char_length(trim(subject)) BETWEEN 3 AND 170),
  ADD CONSTRAINT contact_messages_message_length CHECK (char_length(trim(message)) BETWEEN 10 AND 1000);

-- Comments: enforce content/name lengths in addition to existing author/email checks.
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_content_length,
  DROP CONSTRAINT IF EXISTS comments_guest_name_length;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_content_length CHECK (char_length(trim(content)) BETWEEN 10 AND 1000);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_guest_name_length CHECK (guest_name IS NULL OR char_length(trim(guest_name)) BETWEEN 2 AND 100);
  END IF;
END $$;

ALTER TABLE public.blog_comments
  DROP CONSTRAINT IF EXISTS blog_comments_content_length,
  DROP CONSTRAINT IF EXISTS blog_comments_guest_name_length;

ALTER TABLE public.blog_comments
  ADD CONSTRAINT blog_comments_content_length CHECK (char_length(trim(content)) BETWEEN 10 AND 1000);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_comments' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE public.blog_comments
      ADD CONSTRAINT blog_comments_guest_name_length CHECK (guest_name IS NULL OR char_length(trim(guest_name)) BETWEEN 2 AND 100);
  END IF;
END $$;

-- Anonymous comments must always enter moderation, regardless of client input.
CREATE OR REPLACE FUNCTION public.force_guest_comments_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.is_approved := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_force_guest_comments_pending ON public.comments;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'guest_name'
  ) THEN
    CREATE TRIGGER trg_force_guest_comments_pending
    BEFORE INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.force_guest_comments_pending();
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_force_guest_blog_comments_pending ON public.blog_comments;
CREATE TRIGGER trg_force_guest_blog_comments_pending
BEFORE INSERT ON public.blog_comments
FOR EACH ROW EXECUTE FUNCTION public.force_guest_comments_pending();

-- Prevent operational lockouts and self-demotion at the database boundary.
CREATE OR REPLACE FUNCTION public.guard_admin_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin' THEN
    IF auth.uid() = OLD.user_id THEN
      RAISE EXCEPTION 'Admins cannot demote their own admin role';
    END IF;

    SELECT count(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin role';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
    IF auth.uid() = OLD.user_id THEN
      RAISE EXCEPTION 'Admins cannot delete their own admin role';
    END IF;

    SELECT count(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot delete the last admin role';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_admin_role_changes ON public.user_roles;
CREATE TRIGGER trg_guard_admin_role_changes
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_admin_role_changes();
