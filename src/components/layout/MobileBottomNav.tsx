import { NavLink, useLocation } from 'react-router-dom';
import { Fragment } from 'react';
import { Home, Compass, Heart, User, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';

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
  const showJournalFab = !!user;
  const journalActive = location.pathname === '/ruya-gunlugum' || location.pathname.startsWith('/ruya-gunlugum/');

  const handleTap = () => haptic('light');

  return (
    <nav
      aria-label="Alt navigasyon"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto max-w-screen-sm pointer-events-auto px-2 pb-2 xs:px-3">
        <div className="relative overflow-visible rounded-[1.5rem] border border-border/60 bg-background/92 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur-2xl xs:rounded-[1.75rem] dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_18px_50px_-22px_rgba(0,0,0,0.7)]">
          <div className="pointer-events-none absolute inset-x-8 -top-10 h-16 rounded-full bg-gradient-to-r from-primary/25 via-fuchsia-500/20 to-blue-500/20 blur-2xl" />
          <ul className={cn(
             'relative grid h-[4.15rem] items-stretch p-1 xs:h-[4.45rem] xs:p-1.5',
            showJournalFab ? 'grid-cols-5' : 'grid-cols-4'
          )}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const target = item.requiresAuth && !user ? (item.fallback ?? '/giris') : item.to;
              const active = isActiveRoute(item, location.pathname);
              const shouldRenderJournalFab = showJournalFab && item.to === '/favorilerim';
              return (
                <Fragment key={item.to}>
                  {shouldRenderJournalFab && (
                    <li key="journal-fab" className="flex items-center justify-center">
                      <NavLink
                        to="/ruya-gunlugum"
                        aria-label="Rüya Günlüğü"
                        aria-current={journalActive ? 'page' : undefined}
                        onClick={() => { if (!journalActive) handleTap(); }}
                        className="group relative -mt-6 flex flex-col items-center gap-1 text-[9px] font-bold text-primary active:scale-95 xs:-mt-7 xs:text-[10px]"
                      >
                        <span className={cn(
                           'relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-xl shadow-fuchsia-500/30 ring-4 ring-background transition-transform group-hover:scale-105 xs:h-14 xs:w-14 dark:ring-slate-950',
                          journalActive && 'shadow-primary/45'
                        )}>
                          <BookOpen className="h-5 w-5 xs:h-6 xs:w-6" strokeWidth={2.35} />
                        </span>
                        <span className="leading-none text-[10px] text-foreground/80 dark:text-white/80">Günlük</span>
                      </NavLink>
                    </li>
                  )}
                  <li className="flex items-stretch">
                    <NavLink
                      to={target}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => { if (!active) handleTap(); }}
                      className={cn(
                        'relative flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-all duration-200 active:scale-[0.97] xs:text-[11px]',
                        active
                          ? 'text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-0 animate-in fade-in zoom-in-95 rounded-2xl border border-primary/15 bg-primary/10 duration-200 dark:bg-primary/15"
                        />
                      )}
                      <span className={cn(
                         'relative flex h-7 w-7 items-center justify-center rounded-xl transition-colors xs:h-8 xs:w-8',
                        active && 'bg-background/80 dark:bg-slate-950/55'
                      )}>
                        <Icon
                           className={cn('h-4.5 w-4.5 transition-transform xs:h-5 xs:w-5', active && 'scale-110')}
                          strokeWidth={active ? 2.5 : 2}
                        />
                      </span>
                      <span className="relative leading-none tracking-[-0.01em]">{item.label}</span>
                    </NavLink>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
