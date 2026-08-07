import type { Dispatch, SetStateAction } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowRight, Sparkles, Newspaper, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { supabaseResized } from '@/lib/supabaseImage';
import type { BlogCategory } from '@/types/blog';
import type { HeaderCategory, HeaderBlogPostPreview } from '@/lib/header-types';

interface DesktopNavProps {
  categories: HeaderCategory[];
  blogCategories: BlogCategory[];
  recentPosts: HeaderBlogPostPreview[];
  openCategoryMenu: boolean;
  setOpenCategoryMenu: Dispatch<SetStateAction<boolean>>;
  openBlogMega: boolean;
  setOpenBlogMega: Dispatch<SetStateAction<boolean>>;
  scheduleClose: () => void;
  cancelClose: () => void;
}

export function DesktopNav({
  categories,
  blogCategories,
  recentPosts,
  openCategoryMenu,
  setOpenCategoryMenu,
  openBlogMega,
  setOpenBlogMega,
  scheduleClose,
  cancelClose,
}: DesktopNavProps) {
  const location = useLocation();
  const isActiveLink = (path: string) => location.pathname === path;
  const isBlogActive = location.pathname.startsWith('/blog');

  return (
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
          'inline-flex h-11 items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
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
            'inline-flex h-11 items-center gap-1 px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
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
                        className="flex min-h-11 items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors"
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

      {/* Sembol Sözlüğü */}
      <Link
        to="/semboller"
        onMouseEnter={cancelClose}
        aria-current={isActiveLink('/semboller') ? 'page' : undefined}
        className={cn(
          'inline-flex h-11 items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
          isActiveLink('/semboller')
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        Semboller
      </Link>

      {/* Popüler Rüyalar */}
      <Link
        to="/populer"
        onMouseEnter={cancelClose}
        aria-current={isActiveLink('/populer') ? 'page' : undefined}
        className={cn(
          'inline-flex h-11 items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
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
          'inline-flex h-11 items-center gap-1 px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
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
            'inline-flex h-11 items-center gap-1 px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
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
                            className="group flex min-h-11 items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
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
                          className="group flex min-h-11 gap-2.5 p-2 rounded-xl hover:bg-primary/5 transition-colors"
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
          'inline-flex h-11 items-center px-3 text-sm font-medium rounded-lg transition-all duration-200 shrink-0',
          isActiveLink('/iletisim')
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        İletişim
      </Link>
    </nav>
  );
}
