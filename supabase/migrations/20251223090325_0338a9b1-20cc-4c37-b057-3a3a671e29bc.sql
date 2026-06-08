-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for mood/emotion
CREATE TYPE public.dream_mood AS ENUM ('happy', 'sad', 'scared', 'confused', 'peaceful', 'anxious', 'excited', 'neutral');

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create dreams table (main content)
CREATE TABLE public.dreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    islamic_interpretation TEXT,
    psychological_interpretation TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    keywords TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    meta_title TEXT,
    meta_description TEXT,
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create dream_journal table (personal dream diary)
CREATE TABLE public.dream_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    dream_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood dream_mood,
    tags TEXT[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, dream_id)
);

-- Create view_history table
CREATE TABLE public.view_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create comments table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create comment_likes table
CREATE TABLE public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, comment_id)
);

-- Create dream_likes table
CREATE TABLE public.dream_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, dream_id)
);

-- Create site_settings table
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_dreams_slug ON public.dreams(slug);
CREATE INDEX idx_dreams_category ON public.dreams(category_id);
CREATE INDEX idx_dreams_keywords ON public.dreams USING GIN(keywords);
CREATE INDEX idx_dreams_published ON public.dreams(is_published);
CREATE INDEX idx_dreams_featured ON public.dreams(is_featured);
CREATE INDEX idx_dreams_search ON public.dreams USING GIN(search_vector);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_dream_journal_user ON public.dream_journal(user_id);
CREATE INDEX idx_dream_journal_date ON public.dream_journal(dream_date);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_view_history_user ON public.view_history(user_id);
CREATE INDEX idx_comments_dream ON public.comments(dream_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for dreams (published readable by all, admin manages all)
CREATE POLICY "Published dreams are viewable by everyone" ON public.dreams FOR SELECT USING (is_published = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert dreams" ON public.dreams FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update dreams" ON public.dreams FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete dreams" ON public.dreams FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (only admins can manage, users can read own)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for dream_journal (private to user)
CREATE POLICY "Users can view own journal" ON public.dream_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal" ON public.dream_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal" ON public.dream_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal" ON public.dream_journal FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for view_history
CREATE POLICY "Users can view own history" ON public.view_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.view_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.view_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Approved comments are viewable by everyone" ON public.comments FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS Policies for comment_likes
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dream_likes
CREATE POLICY "Dream likes are viewable by everyone" ON public.dream_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own dream likes" ON public.dream_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dream likes" ON public.dream_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for site_settings (public read, admin write)
CREATE POLICY "Settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE USING (public.is_admin(auth.uid()));

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'full_name'
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dreams_updated_at BEFORE UPDATE ON public.dreams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dream_journal_updated_at BEFORE UPDATE ON public.dream_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update search vector
CREATE OR REPLACE FUNCTION public.update_dreams_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER update_dreams_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.dreams
    FOR EACH ROW EXECUTE FUNCTION public.update_dreams_search_vector();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(dream_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.dreams
    SET view_count = view_count + 1
    WHERE id = dream_id;
END;
$$;

-- Function to update like count on dreams
CREATE OR REPLACE FUNCTION public.update_dream_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.dreams SET like_count = like_count + 1 WHERE id = NEW.dream_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.dreams SET like_count = like_count - 1 WHERE id = OLD.dream_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER update_dream_likes_count
    AFTER INSERT OR DELETE ON public.dream_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_dream_like_count();

-- Function to update like count on comments
CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER update_comment_likes_count
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_like_count();

-- Search function for dreams
CREATE OR REPLACE FUNCTION public.search_dreams(search_query TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    category_id UUID,
    view_count INTEGER,
    like_count INTEGER,
    rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.slug,
        d.content,
        d.category_id,
        d.view_count,
        d.like_count,
        ts_rank(d.search_vector, plainto_tsquery('simple', search_query)) AS rank
    FROM public.dreams d
    WHERE d.is_published = true
    AND (
        d.search_vector @@ plainto_tsquery('simple', search_query)
        OR d.title ILIKE '%' || search_query || '%'
        OR search_query = ANY(d.keywords)
    )
    ORDER BY rank DESC, d.view_count DESC
    LIMIT limit_count;
END;
$$;