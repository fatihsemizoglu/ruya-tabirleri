import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Sparkles, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  matchPrefix?: string;
  requiresAuth?: boolean;
  fallback?: string;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Anasayfa', icon: Home },
  { to: '/kategoriler', label: 'Kategoriler', icon: Compass, matchPrefix: '/kategori' },
  { to: '/ruya-yorumlat', label: 'Yorumlat', icon: Sparkles, isFab: true },
  { to: '/favorilerim', label: 'Favoriler', icon: Heart, requiresAuth: true, fallback: '/giris' },
  { to: '/profil', label: 'Profil', icon: User, requiresAuth: true, fallback: '/giris' },
];

function isActiveRoute(item: NavItem, pathname: string): boolean {
  if (item.to === '/') return pathname === '/';
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav
      aria-label="Alt navigasyon"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto max-w-screen-sm pointer-events-auto">
        <div className="mx-3 mb-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
          <ul className="grid grid-cols-5 items-stretch h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isFab = 'isFab' in item && item.isFab;
              if (isFab) {
                return (
                  <li key={item.to} className="flex items-center justify-center">
                    <NavLink
                      to={item.to}
                      aria-label={item.label}
                      className="group relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
                    >
                      <Icon className="h-6 w-6" strokeWidth={2.25} />
                    </NavLink>
                  </li>
                );
              }
              const target = item.requiresAuth && !user ? (item.fallback ?? '/giris') : item.to;
              const active = isActiveRoute(item, location.pathname);
              return (
                <li key={item.to} className="flex items-stretch">
                  <NavLink
                    to={target}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="bottomNavIndicator"
                        className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Icon
                      className={cn('h-5 w-5 transition-transform', active && 'scale-110')}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="leading-none">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
