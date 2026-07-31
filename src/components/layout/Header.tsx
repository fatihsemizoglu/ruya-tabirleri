import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Moon,
  Sun,
  Menu,
  X,
  User,
  LogOut,
  Book,
  Heart,
  Clock,
  Settings,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Newspaper,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { BlogCategory } from '@/types/blog';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useQuery } from '@tanstack/react-query';
import { supabaseResized } from '@/lib/supabaseImage';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface BlogPostPreview {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  category: BlogCategory | null;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isScrolled, setIsScrolled] = useState(false);
  const [openCategoryMenu, setOpenCategoryMenu] = useState(false);
  const [openBlogMega, setOpenBlogMega] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileBlogOpen, setMobileBlogOpen] = useState(false);

  const PUBLIC_MENU_STALE_TIME = 30 * 60 * 1000;
  const PUBLIC_MENU_GC_TIME = 2 * 60 * 60 * 1000;
  const location = useLocation();
  const shouldLoadCategories = openCategoryMenu || mobileCategoryOpen || isMenuOpen || location.pathname === '/kategoriler' || location.pathname.startsWith('/kategori/');
  const shouldLoadBlogMenu = openBlogMega || mobileBlogOpen || location.pathname.startsWith('/blog');

  const { data: categories = [] } = useQuery({
    queryKey: ['header-dream-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, icon')
        .limit(50);
      if (error) throw error;
      return [...(data || [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
      );
    },
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_MENU_GC_TIME,
    enabled: shouldLoadCategories,
  });

  const { data: blogCategories = [] } = useQuery({
    queryKey: ['header-blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug, description, icon, order_index, created_at, updated_at')
        .order('order_index', { ascending: true })
        .order('name', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []) as BlogCategory[];
    },
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_MENU_GC_TIME,
    enabled: shouldLoadBlogMenu,
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['header-recent-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, featured_image, category:blog_categories(id, name, slug, description, icon, order_index, created_at, updated_at)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data || []) as BlogPostPreview[];
    },
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_MENU_GC_TIME,
    enabled: shouldLoadBlogMenu,
  });

  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Hover kapatma için zamanlayıcı
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  // Sayfa değiştiğinde menüleri kapat
  useEffect(() => {
    setOpenCategoryMenu(false);
    setOpenBlogMega(false);
    setIsMenuOpen(false);
    setMobileCategoryOpen(false);
    setMobileBlogOpen(false);
  }, [location.pathname, location.search]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActiveLink = (path: string) => location.pathname === path;
  const isBlogActive = location.pathname.startsWith('/blog');

  // Hover ile mega menü açma/kapama
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpenCategoryMenu(false);
      setOpenBlogMega(false);
    }, 150);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  // Timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // ESC ile kapatma
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenCategoryMenu(false);
        setOpenBlogMega(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll throttle for isScrolled
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        'bg-white/80 dark:bg-slate-950/80',
        'md:bg-white/55 md:dark:bg-slate-950/55',
        'md:backdrop-blur-2xl md:backdrop-saturate-150',
        'border-b border-white/30 dark:border-white/10',
        'shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_-1px_0_0_rgba(0,0,0,0.04)_inset,0_2px_20px_-10px_rgba(0,0,0,0.08)]',
        isScrolled &&
          'bg-white/85 dark:bg-slate-950/85 md:bg-white/70 md:dark:bg-slate-950/70 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_-1px_0_0_rgba(0,0,0,0.04)_inset,0_4px_24px_-12px_rgba(0,0,0,0.12)]'
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
            <Moon className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold hidden sm:inline-block">
            <span className="text-foreground">Rüya</span>
            <span className="text-gradient"> Tabirleri</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0"
          onMouseLeave={scheduleClose}
        >
          {/* Anasayfa */}
          <Link
            to="/"
            onMouseEnter={cancelClose}
            aria-current={isActiveLink('/') ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
              isActiveLink('/')
                ? 'text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            Anasayfa
          </Link>

          {/* Kategoriler (Dropdown) */}
          <div
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setOpenCategoryMenu(true);
              setOpenBlogMega(false);
            }}
          >
            <button
              type="button"
              onClick={() => {
                setOpenCategoryMenu((v) => !v);
                setOpenBlogMega(false);
              }}
              className={cn(
                'inline-flex h-9 items-center gap-1 px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
                openCategoryMenu ||
                  isActiveLink('/kategoriler') ||
                  location.pathname.startsWith('/kategori/')
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-expanded={openCategoryMenu}
            >
              Kategoriler
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  openCategoryMenu && 'rotate-180'
                )}
              />
            </button>

            {openCategoryMenu && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <div className="w-[420px] max-w-[90vw] rounded-2xl border border-white/40 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 md:backdrop-blur-2xl shadow-2xl shadow-black/10 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Rüya Kategorileri
                    </p>
                    <Link
                      to="/kategoriler"
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      onClick={() => setOpenCategoryMenu(false)}
                    >
                      Tümünü Gör
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto pr-1 grid grid-cols-2 gap-1">
                    {categories.length === 0 ? (
                      <div className="col-span-2 px-3 py-6 text-center text-sm text-muted-foreground">
                        Yükleniyor...
                      </div>
                    ) : (
                      categories.map((cat) => {
                        return (
                          <Link
                            key={cat.id}
                            to={`/kategori/${cat.slug}`}
                            onClick={() => setOpenCategoryMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <CategoryIcon icon={cat.icon} className="text-base leading-none shrink-0" />
                            <span className="truncate">{cat.name}</span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Popüler Rüyalar */}
          <Link
            to="/populer"
            onMouseEnter={cancelClose}
            aria-current={isActiveLink('/populer') ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
              isActiveLink('/populer')
                ? 'text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            Popüler Rüyalar
          </Link>

          {/* Akış */}
          <Link
            to="/akis"
            onMouseEnter={cancelClose}
            aria-current={isActiveLink('/akis') ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 items-center gap-1 px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
              isActiveLink('/akis')
                ? 'text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Radio className="h-3.5 w-3.5" />
            Akış
          </Link>

          {/* Blog (Mega Menu) */}
          <div
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setOpenBlogMega(true);
              setOpenCategoryMenu(false);
            }}
          >
            <button
              type="button"
              onClick={() => {
                setOpenBlogMega((v) => !v);
                setOpenCategoryMenu(false);
              }}
              className={cn(
                'inline-flex h-9 items-center gap-1 px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
                openBlogMega || isBlogActive
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-expanded={openBlogMega}
            >
              Blog
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  openBlogMega && 'rotate-180'
                )}
              />
            </button>

            {openBlogMega && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <div className="w-[760px] max-w-[95vw] rounded-2xl border border-white/40 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 md:backdrop-blur-2xl shadow-2xl shadow-black/10 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-12 gap-5">
                    {/* Blog Kategorileri */}
                    <div className="col-span-12 md:col-span-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Newspaper className="h-3.5 w-3.5" />
                          Blog Kategorileri
                        </p>
                        <Link
                          to="/blog"
                          onClick={() => setOpenBlogMega(false)}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          Tümü
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 gap-0.5 max-h-[340px] overflow-y-auto pr-1">
                        {blogCategories.length === 0 ? (
                          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            Yükleniyor...
                          </div>
                        ) : (
                          blogCategories.map((bc) => {
                            return (
                              <Link
                                key={bc.id}
                                to={`/blog?kategori=${bc.slug}`}
                                onClick={() => setOpenBlogMega(false)}
                                className="group flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0">
                                  <CategoryIcon icon={bc.icon} className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                    {bc.name}
                                  </p>
                                  {bc.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {bc.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Son Yazılar */}
                    <div className="col-span-12 md:col-span-7 md:border-l md:border-border md:pl-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Son Yazılar
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {recentPosts.length === 0 ? (
                          <div className="col-span-2 px-3 py-6 text-center text-sm text-muted-foreground">
                            Yükleniyor...
                          </div>
                        ) : (
                          recentPosts.map((p) => (
                            <Link
                              key={p.id}
                              to={`/blog/${p.slug}`}
                              onClick={() => setOpenBlogMega(false)}
                              className="group flex gap-2.5 p-2 rounded-xl hover:bg-primary/5 transition-colors"
                            >
                              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/15 overflow-hidden shrink-0 flex items-center justify-center">
                                {p.featured_image ? (
                                  <img
                                    src={supabaseResized(p.featured_image, 112, 70)}
                                    alt={p.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Newspaper className="h-5 w-5 text-primary/60" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                  {p.title}
                                </p>
                                {p.category && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {p.category.name}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border">
                        <Link
                          to="/blog"
                          onClick={() => setOpenBlogMega(false)}
                          className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline py-1.5"
                        >
                          Tüm Yazıları Gör
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* İletişim */}
          <Link
            to="/iletisim"
            onMouseEnter={cancelClose}
            aria-current={isActiveLink('/iletisim') ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
              isActiveLink('/iletisim')
                ? 'text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            İletişim
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden md:flex rounded-lg h-9 w-9"
            aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-lg px-3 h-9">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <div className="px-3 py-2">
                  <p className="font-semibold text-foreground text-sm">
                    {profile?.full_name || profile?.username || 'Kullanıcı'}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profil?tab=profil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profilim
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profil?tab=gunluk" className="cursor-pointer">
                    <Book className="mr-2 h-4 w-4" />
                    Rüya Günlüğüm
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profil?tab=favoriler" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    Favorilerim
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profil?tab=gecmis" className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4" />
                    Geçmiş
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer text-primary">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex rounded-lg h-9"
              >
                <Link to="/giris">Giriş Yap</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="rounded-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 h-9"
              >
                <Link to="/kayit">Kayıt Ol</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-lg h-9 w-9"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menüyü aç/kapat"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300',
          'bg-white/85 dark:bg-slate-950/85',
          'md:bg-white/70 md:dark:bg-slate-950/70 md:backdrop-blur-2xl md:backdrop-saturate-150',
          'border-t border-white/30 dark:border-white/10',
          isMenuOpen ? 'max-h-[80vh]' : 'max-h-0'
        )}
      >
        <div className="container py-4 space-y-2 max-h-[80vh] overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {/* Anasayfa */}
            <MobileNavLink to="/" label="Anasayfa" onClose={() => setIsMenuOpen(false)} />

            {/* Kategoriler (Accordion) */}
            <div>
              <button
                type="button"
                onClick={() => setMobileCategoryOpen((v) => !v)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors text-sm',
                  mobileCategoryOpen
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-expanded={mobileCategoryOpen}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Kategoriler
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    mobileCategoryOpen && 'rotate-180'
                  )}
                />
              </button>
              {mobileCategoryOpen && (
                <div className="mt-1 ml-3 pl-3 border-l border-border space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Yükleniyor...</div>
                  ) : (
                    categories.map((cat) => {
                      return (
                        <Link
                          key={cat.id}
                          to={`/kategori/${cat.slug}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted transition-colors"
                        >
                          <CategoryIcon icon={cat.icon} className="text-base leading-none shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </Link>
                      );
                    })
                  )}
                  <Link
                    to="/kategoriler"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/5"
                  >
                    Tüm Kategoriler
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Popüler Rüyalar */}
            <MobileNavLink to="/populer" label="Popüler Rüyalar" onClose={() => setIsMenuOpen(false)} />

            {/* Akış */}
            <MobileNavLink to="/akis" label="Akış" onClose={() => setIsMenuOpen(false)} />

            {/* Blog (Accordion) */}
            <div>
              <button
                type="button"
                onClick={() => setMobileBlogOpen((v) => !v)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors text-sm',
                  mobileBlogOpen
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-expanded={mobileBlogOpen}
              >
                <span className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  Blog
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    mobileBlogOpen && 'rotate-180'
                  )}
                />
              </button>
              {mobileBlogOpen && (
                <div className="mt-1 ml-3 pl-3 border-l border-border space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  {blogCategories.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Yükleniyor...</div>
                  ) : (
                    blogCategories.map((bc) => {
                      return (
                        <Link
                          key={bc.id}
                          to={`/blog?kategori=${bc.slug}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted transition-colors"
                        >
                          <CategoryIcon icon={bc.icon} className="text-base leading-none shrink-0" />
                          <span className="truncate">{bc.name}</span>
                        </Link>
                      );
                    })
                  )}
                  <Link
                    to="/blog"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/5"
                  >
                    Tüm Yazılar
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* İletişim */}
            <MobileNavLink to="/iletisim" label="İletişim" onClose={() => setIsMenuOpen(false)} />
          </nav>

          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted">
            <span className="font-medium text-sm text-foreground">Tema</span>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-lg h-8">
              {isDark ? <Sun className="h-3.5 w-3.5 mr-2" /> : <Moon className="h-3.5 w-3.5 mr-2" />}
              {isDark ? 'Açık' : 'Koyu'}
            </Button>
          </div>

          {!user && (
            <div className="flex gap-2 px-4">
              <Button variant="outline" size="sm" asChild className="flex-1 rounded-lg h-9">
                <Link to="/giris">Giriş Yap</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="flex-1 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white h-9"
              >
                <Link to="/kayit">Kayıt Ol</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileNavLink({
  to,
  label,
  onClose,
}: {
  to: string;
  label: string;
  onClose: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClose}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'px-4 py-3 rounded-lg font-medium transition-colors text-sm flex items-center gap-2',
        isActive ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {label}
    </Link>
  );
}
