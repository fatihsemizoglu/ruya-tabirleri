import type { Dispatch, SetStateAction } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Newspaper, ChevronDown, ArrowRight, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SearchWithDropdown } from '@/components/search/SearchWithDropdown';
import { useAuth } from '@/hooks/useAuth';
import type { BlogCategory } from '@/types/blog';
import type { HeaderCategory } from '@/lib/header-types';

interface MobileMenuProps {
  isMenuOpen: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  categories: HeaderCategory[];
  blogCategories: BlogCategory[];
  mobileCategoryOpen: boolean;
  setMobileCategoryOpen: Dispatch<SetStateAction<boolean>>;
  mobileBlogOpen: boolean;
  setMobileBlogOpen: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}

export function MobileMenu({
  isMenuOpen,
  isDark,
  toggleTheme,
  categories,
  blogCategories,
  mobileCategoryOpen,
  setMobileCategoryOpen,
  mobileBlogOpen,
  setMobileBlogOpen,
  onClose,
}: MobileMenuProps) {
  const { user } = useAuth();

  return (
    <div
      className={cn(
        'lg:hidden overflow-hidden transition-all duration-300',
        'bg-white/85 dark:bg-slate-950/85',
        'md:bg-white/70 md:dark:bg-slate-950/70 md:backdrop-blur-2xl md:backdrop-saturate-150',
        'border-t border-white/30 dark:border-white/10',
        isMenuOpen ? 'max-h-[calc(100dvh-4rem)]' : 'max-h-0'
      )}
    >
      <div className="container py-3 space-y-2 max-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* Hızlı arama: mobil kullanıcılar menüden doğrudan arayabilir */}
        <div className="px-1">
          <SearchWithDropdown variant="mobile" onSearchSubmit={onClose} />
        </div>

        <nav className="flex flex-col gap-1">
          {/* Anasayfa */}
          <MobileNavLink to="/" label="Anasayfa" onClose={onClose} />

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
              <div className="mt-1 ml-1 max-h-[42dvh] overflow-y-auto overscroll-contain border-l border-border pl-3 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200 sm:ml-3">
                {categories.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Yükleniyor...</div>
                ) : (
                  categories.map((cat) => {
                    return (
                      <Link
                        key={cat.id}
                        to={`/kategori/${cat.slug}`}
                        onClick={onClose}
                        className="flex min-h-11 items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted transition-colors"
                      >
                        <CategoryIcon icon={cat.icon} className="text-base leading-none shrink-0" />
                        <span className="truncate">{cat.name}</span>
                      </Link>
                    );
                  })
                )}
                <Link
                  to="/kategoriler"
                  onClick={onClose}
                  className="flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/5"
                >
                  Tüm Kategoriler
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Popüler Rüyalar */}
          <MobileNavLink to="/populer" label="Popüler Rüyalar" onClose={onClose} />

          {/* Akış */}
          <MobileNavLink to="/akis" label="Akış" onClose={onClose} />

          {/* Semboller */}
          <MobileNavLink to="/semboller" label="Semboller" onClose={onClose} />

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
              <div className="mt-1 ml-1 max-h-[42dvh] overflow-y-auto overscroll-contain border-l border-border pl-3 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200 sm:ml-3">
                {blogCategories.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Yükleniyor...</div>
                ) : (
                  blogCategories.map((bc) => {
                    return (
                      <Link
                        key={bc.id}
                        to={`/blog?kategori=${bc.slug}`}
                        onClick={onClose}
                        className="flex min-h-11 items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted transition-colors"
                      >
                        <CategoryIcon icon={bc.icon} className="text-base leading-none shrink-0" />
                        <span className="truncate">{bc.name}</span>
                      </Link>
                    );
                  })
                )}
                <Link
                  to="/blog"
                  onClick={onClose}
                  className="flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/5"
                >
                  Tüm Yazılar
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* İletişim */}
          <MobileNavLink to="/iletisim" label="İletişim" onClose={onClose} />
        </nav>

        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted">
          <span className="font-medium text-sm text-foreground">Tema</span>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-lg">
            {isDark ? <Sun className="h-3.5 w-3.5 mr-2" /> : <Moon className="h-3.5 w-3.5 mr-2" />}
            {isDark ? 'Açık' : 'Koyu'}
          </Button>
        </div>

        {!user && (
          <div className="grid grid-cols-2 gap-2 px-4">
            <Button variant="outline" size="sm" asChild className="rounded-lg h-11">
              <Link to="/giris">Giriş Yap</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white h-11"
            >
              <Link to="/kayit">Kayıt Ol</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
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
        'px-4 py-3.5 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 min-h-12',
        isActive ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {label}
    </Link>
  );
}
