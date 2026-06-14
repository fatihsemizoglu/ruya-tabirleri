import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, User } from 'lucide-react';
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
}

const navItems: NavItem[] = [
  { to: '/', label: 'Anasayfa', icon: Home },
  { to: '/kategoriler', label: 'Kategoriler', icon: Compass, matchPrefix: '/kategori' },
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
      <div className="mx-auto max-w-screen-sm pointer-events-auto px-3 pb-2">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/92 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/92 dark:shadow-[0_18px_50px_-22px_rgba(0,0,0,0.7)]">
          <div className="pointer-events-none absolute inset-x-8 -top-10 h-16 rounded-full bg-gradient-to-r from-primary/25 via-fuchsia-500/20 to-blue-500/20 blur-2xl" />
          <ul className="relative grid h-[4.45rem] grid-cols-4 items-stretch p-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const target = item.requiresAuth && !user ? (item.fallback ?? '/giris') : item.to;
              const active = isActiveRoute(item, location.pathname);
              return (
                <li key={item.to} className="flex items-stretch">
                  <NavLink
                    to={target}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-all duration-200 active:scale-[0.97]',
                      active
                        ? 'text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="bottomNavIndicator"
                        className="absolute inset-0 rounded-2xl border border-primary/15 bg-primary/10 dark:bg-primary/15"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                      active && 'bg-background/80 dark:bg-slate-950/55'
                    )}>
                      <Icon
                        className={cn('h-5 w-5 transition-transform', active && 'scale-110')}
                        strokeWidth={active ? 2.5 : 2}
                      />
                    </span>
                    <span className="relative leading-none tracking-[-0.01em]">{item.label}</span>
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
