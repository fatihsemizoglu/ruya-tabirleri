-- Blog kategorileri tablosu
CREATE TABLE public.blog_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog yazıları tablosu
CREATE TABLE public.blog_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    author_id UUID NOT NULL,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog yorumları tablosu
CREATE TABLE public.blog_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog beğenileri tablosu
CREATE TABLE public.blog_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Blog yorum beğenileri tablosu
CREATE TABLE public.blog_comment_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- RLS aktifleştir
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;

-- Blog kategorileri politikaları
CREATE POLICY "Blog categories are viewable by everyone" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert blog categories" ON public.blog_categories FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update blog categories" ON public.blog_categories FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete blog categories" ON public.blog_categories FOR DELETE USING (is_admin(auth.uid()));

-- Blog yazıları politikaları
CREATE POLICY "Published posts are viewable by everyone" ON public.blog_posts FOR SELECT USING ((is_published = true) OR is_admin(auth.uid()));
CREATE POLICY "Admins can insert posts" ON public.blog_posts FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update posts" ON public.blog_posts FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete posts" ON public.blog_posts FOR DELETE USING (is_admin(auth.uid()));

-- Blog yorumları politikaları
CREATE POLICY "Approved comments are viewable by everyone" ON public.blog_comments FOR SELECT USING ((is_approved = true) OR (auth.uid() = user_id) OR is_admin(auth.uid()));
CREATE POLICY "Authenticated users can create comments" ON public.blog_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.blog_comments FOR UPDATE USING ((auth.uid() = user_id) OR is_admin(auth.uid()));
CREATE POLICY "Users can delete own comments" ON public.blog_comments FOR DELETE USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

-- Blog beğenileri politikaları
CREATE POLICY "Blog likes are viewable by everyone" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own blog likes" ON public.blog_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own blog likes" ON public.blog_likes FOR DELETE USING (auth.uid() = user_id);

-- Blog yorum beğenileri politikaları
CREATE POLICY "Blog comment likes are viewable by everyone" ON public.blog_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own blog comment likes" ON public.blog_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own blog comment likes" ON public.blog_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Like count güncelleme fonksiyonları
CREATE OR REPLACE FUNCTION public.update_blog_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_blog_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- View count fonksiyonu
CREATE OR REPLACE FUNCTION public.increment_blog_view_count(post_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.blog_posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Like count triggers
CREATE TRIGGER update_blog_post_like_count_trigger AFTER INSERT OR DELETE ON public.blog_likes FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_like_count();
CREATE TRIGGER update_blog_comment_like_count_trigger AFTER INSERT OR DELETE ON public.blog_comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_blog_comment_like_count();