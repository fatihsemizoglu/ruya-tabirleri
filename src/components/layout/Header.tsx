import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHeaderMenus } from '@/hooks/useHeaderMenus';
import { useThemeToggle } from '@/hooks/useThemeToggle';
import { useHeaderData } from '@/hooks/useHeaderData';
import { DesktopNav } from '@/components/layout/DesktopNav';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { MobileMenu } from '@/components/layout/MobileMenu';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const {
    isMenuOpen,
    setIsMenuOpen,
    openCategoryMenu,
    setOpenCategoryMenu,
    openBlogMega,
    setOpenBlogMega,
    mobileCategoryOpen,
    setMobileCategoryOpen,
    mobileBlogOpen,
    setMobileBlogOpen,
    shouldLoadCategories,
    shouldLoadBlogMenu,
    scheduleClose,
    cancelClose,
  } = useHeaderMenus();

  const { isDark, toggleTheme } = useThemeToggle();
  const { categories, blogCategories, recentPosts } = useHeaderData(shouldLoadCategories, shouldLoadBlogMenu);

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
      <div className="container flex h-16 items-center justify-between gap-2 sm:gap-4 pt-[env(safe-area-inset-top,0px)]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
            <Moon className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-base font-bold xs:inline-block hidden sm:text-lg">
            <span className="text-foreground">Rüya</span>
            <span className="text-gradient"> Tabirleri</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <DesktopNav
          categories={categories}
          blogCategories={blogCategories}
          recentPosts={recentPosts}
          openCategoryMenu={openCategoryMenu}
          setOpenCategoryMenu={setOpenCategoryMenu}
          openBlogMega={openBlogMega}
          setOpenBlogMega={setOpenBlogMega}
          scheduleClose={scheduleClose}
          cancelClose={cancelClose}
        />

        {/* Actions */}
        <HeaderActions
          isDark={isDark}
          toggleTheme={toggleTheme}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((v) => !v)}
        />
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isMenuOpen={isMenuOpen}
        isDark={isDark}
        toggleTheme={toggleTheme}
        categories={categories}
        blogCategories={blogCategories}
        mobileCategoryOpen={mobileCategoryOpen}
        setMobileCategoryOpen={setMobileCategoryOpen}
        mobileBlogOpen={mobileBlogOpen}
        setMobileBlogOpen={setMobileBlogOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>
  );
}
