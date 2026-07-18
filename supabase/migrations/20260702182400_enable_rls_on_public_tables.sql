-- Re-enable RLS on public tables that were found disabled in the linked project.
-- Policies below preserve intended public reads while preventing unrestricted writes.

ALTER TABLE IF EXISTS public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dream_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.view_history ENABLE ROW LEVEL SECURITY;

-- ads: public can read active ads; admins and service role manage them.
DROP POLICY IF EXISTS "Public can read active ads" ON public.ads;
CREATE POLICY "Public can read active ads"
  ON public.ads FOR SELECT
  USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;
CREATE POLICY "Admins can manage ads"
  ON public.ads FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- audit_logs: admin read/insert only; service-role policy remains in place on remote.
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- public content tables: anonymous reads are allowed, writes are admin-only.
DROP POLICY IF EXISTS "Blog categories are viewable by everyone" ON public.blog_categories;
CREATE POLICY "Blog categories are viewable by everyone"
  ON public.blog_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage blog categories" ON public.blog_categories;
CREATE POLICY "Admins can manage blog categories"
  ON public.blog_categories FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts are viewable by everyone"
  ON public.blog_posts FOR SELECT
  USING (is_published = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Published dreams are viewable by everyone" ON public.dreams;
CREATE POLICY "Published dreams are viewable by everyone"
  ON public.dreams FOR SELECT
  USING (is_published = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage dreams" ON public.dreams;
CREATE POLICY "Admins can manage dreams"
  ON public.dreams FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings are viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- comments: approved comments are public; authors/admins can manage their own rows.
DROP POLICY IF EXISTS "Approved comments are viewable by everyone" ON public.comments;
CREATE POLICY "Approved comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Approved blog comments are viewable by everyone" ON public.blog_comments;
CREATE POLICY "Approved blog comments are viewable by everyone"
  ON public.blog_comments FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create blog comments" ON public.blog_comments;
CREATE POLICY "Authenticated users can create blog comments"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own blog comments" ON public.blog_comments;
CREATE POLICY "Users can update own blog comments"
  ON public.blog_comments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own blog comments" ON public.blog_comments;
CREATE POLICY "Users can delete own blog comments"
  ON public.blog_comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- likes: public counts/read access, authenticated users manage their own likes.
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.comment_likes;
CREATE POLICY "Comment likes are viewable by everyone"
  ON public.comment_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own comment likes" ON public.comment_likes;
CREATE POLICY "Users can insert own comment likes"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment likes" ON public.comment_likes;
CREATE POLICY "Users can delete own comment likes"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Dream likes are viewable by everyone" ON public.dream_likes;
CREATE POLICY "Dream likes are viewable by everyone"
  ON public.dream_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own dream likes" ON public.dream_likes;
CREATE POLICY "Users can insert own dream likes"
  ON public.dream_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own dream likes" ON public.dream_likes;
CREATE POLICY "Users can delete own dream likes"
  ON public.dream_likes FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Blog likes are viewable by everyone" ON public.blog_likes;
CREATE POLICY "Blog likes are viewable by everyone"
  ON public.blog_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own blog likes" ON public.blog_likes;
CREATE POLICY "Users can insert own blog likes"
  ON public.blog_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own blog likes" ON public.blog_likes;
CREATE POLICY "Users can delete own blog likes"
  ON public.blog_likes FOR DELETE
  USING (auth.uid() = user_id);

-- private user tables.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own journal" ON public.dream_journal;
CREATE POLICY "Users can view own journal"
  ON public.dream_journal FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journal" ON public.dream_journal;
CREATE POLICY "Users can insert own journal"
  ON public.dream_journal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journal" ON public.dream_journal;
CREATE POLICY "Users can update own journal"
  ON public.dream_journal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journal" ON public.dream_journal;
CREATE POLICY "Users can delete own journal"
  ON public.dream_journal FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own history" ON public.view_history;
CREATE POLICY "Users can view own history"
  ON public.view_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own history" ON public.view_history;
CREATE POLICY "Users can insert own history"
  ON public.view_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own history" ON public.view_history;
CREATE POLICY "Users can delete own history"
  ON public.view_history FOR DELETE
  USING (auth.uid() = user_id);

-- form/admin tables.
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all messages" ON public.contact_messages;
CREATE POLICY "Admins can view all messages"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage messages" ON public.contact_messages;
CREATE POLICY "Admins can manage messages"
  ON public.contact_messages FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage content calendar" ON public.content_calendar;
CREATE POLICY "Admins can manage content calendar"
  ON public.content_calendar FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
