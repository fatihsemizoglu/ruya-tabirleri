import { Link, useNavigate } from 'react-router-dom';
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

interface HeaderActionsProps {
  isDark: boolean;
  toggleTheme: () => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

export function HeaderActions({ isDark, toggleTheme, isMenuOpen, onToggleMenu }: HeaderActionsProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="hidden md:flex rounded-lg"
        aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-lg px-2 sm:px-3 min-w-10">
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex rounded-lg"
          >
            <Link to="/giris">Giriş Yap</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="rounded-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 px-3 sm:px-4 text-xs sm:text-sm"
          >
            <Link to="/kayit">Kayıt Ol</Link>
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden rounded-lg"
        onClick={onToggleMenu}
        aria-label="Menüyü aç/kapat"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </div>
  );
}
