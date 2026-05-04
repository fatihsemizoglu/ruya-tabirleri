import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, User, LogOut, Book, Heart, Clock, Settings, ChevronDown, Sparkles, Bell, icons } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { SearchWithDropdown } from '@/components/search/SearchWithDropdown';
import { categoriesApi } from '@/lib/api';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

const navLinks = [
  { to: '/ruya-tabirleri', label: 'Rüya Tabirleri' },
  { to: '/kategoriler', label: 'Kategoriler' },
  { to: '/blog', label: 'Blog' },
  { to: '/iletisim', label: 'İletişim' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await categoriesApi.getAll();
      
      if (response.success && response.data) {
        // Sort by order_index and limit to 12
        const sortedCategories = response.data
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .slice(0, 12);
        setCategories(sortedCategories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon
        })));
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActiveLink = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        isScrolled 
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl shadow-lg shadow-slate-200/20 dark:shadow-slate-950/20 border-b border-slate-200/30 dark:border-slate-800/30" 
          : "bg-transparent"
      )}
    >
        <div className="container flex h-14 md:h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
            <Moon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold hidden sm:inline-block">
            <span className="text-slate-900 dark:text-white">Rüya</span>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Tabirleri</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Rüya Tabirleri Link */}
          <Link 
            to="/ruya-tabirleri" 
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isActiveLink('/ruya-tabirleri')
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Rüya Tabirleri
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800",
                    location.pathname.startsWith('/kategori')
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  Kategoriler
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-1 p-3 md:w-[500px] md:grid-cols-2 lg:w-[600px] lg:grid-cols-3">
                    {categories.map((category) => (
                      <NavigationMenuLink key={category.id} asChild>
                        <Link
                          to={`/kategori/${category.slug}`}
                          className="flex items-center gap-2 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {category.icon && (() => {
                            const iconName = category.icon.charAt(0).toUpperCase() + category.icon.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
                            const IconComponent = icons[iconName as keyof typeof icons];
                            return IconComponent ? <IconComponent className="w-4 h-4 text-primary" /> : <span className="text-lg">{category.icon}</span>;
                          })()}
                          <span>{category.name}</span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    <NavigationMenuLink asChild>
                      <Link
                        to="/kategoriler"
                        className="flex items-center gap-2 rounded-lg p-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors col-span-full border-t border-slate-200 dark:border-slate-700 mt-2 pt-3"
                      >
                        Tüm Kategorileri Gör →
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Popüler Link */}
          <Link 
            to="/populer" 
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isActiveLink('/populer')
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Popüler
          </Link>

          {/* Blog Link */}
          <Link 
            to="/blog" 
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              location.pathname.startsWith('/blog')
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            Blog
          </Link>

          {/* İletişim Link */}
          <Link 
            to="/iletisim" 
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              location.pathname === '/iletisim'
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            İletişim
          </Link>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search */}
          <div className="hidden sm:block">
            <SearchWithDropdown variant="header" />
          </div>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:flex rounded-lg">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-lg px-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <div className="px-3 py-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{profile?.full_name || profile?.username || 'Kullanıcı'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
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
                <DropdownMenuItem asChild>
                  <Link to="/bildirimler" className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    Bildirimler
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ruya-gunlugum" className="cursor-pointer">
                    <Book className="mr-2 h-4 w-4" />
                    Rüya Günlüğü & Takvim
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer text-indigo-600 dark:text-indigo-400">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex rounded-lg">
                <Link to="/giris">Giriş Yap</Link>
              </Button>
              <Button size="sm" asChild className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                <Link to="/kayit">Kayıt Ol</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden rounded-lg" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800",
        isMenuOpen ? "max-h-[500px]" : "max-h-0"
      )}>
        <div className="container py-4 space-y-4">
          {/* Mobile Search */}
          <SearchWithDropdown 
            variant="mobile" 
            onSearchSubmit={() => setIsMenuOpen(false)} 
          />

          {/* Mobile Navigation */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className={cn(
                  "px-4 py-3 rounded-lg font-medium transition-colors",
                  isActiveLink(link.to)
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Theme Toggle */}
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-300">Tema</span>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-lg">
              {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {isDark ? 'Açık' : 'Koyu'}
            </Button>
          </div>

          {/* Mobile Auth */}
          {!user && (
            <div className="flex gap-2 px-4">
              <Button variant="outline" size="sm" asChild className="flex-1 rounded-lg">
                <Link to="/giris">Giriş Yap</Link>
              </Button>
              <Button size="sm" asChild className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <Link to="/kayit">Kayıt Ol</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
