import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PremiumBackground } from './PremiumBackground';
import { MobileBottomNav } from './MobileBottomNav';
import { BackToTop } from './BackToTop';
import { SwipeNav } from '@/components/SwipeNav';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
  hideBackToTop?: boolean;
  backgroundVariant?: 'default' | 'soft' | 'strong' | 'none';
}

export function Layout({
  children,
  hideFooter = false,
  hideHeader = false,
  hideBottomNav = false,
  hideBackToTop = false,
  backgroundVariant = 'default',
}: LayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background text-foreground relative overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-primary"
      >
        İçeriğe geç
      </a>
      {backgroundVariant !== 'none' && (
        <div className="fixed inset-0 z-0 hidden md:block">
          <PremiumBackground variant={backgroundVariant} />
        </div>
      )}

      {!hideHeader && <Header />}
      <main id="main-content" className={`flex-1 relative z-10 min-w-0 ${!hideBottomNav ? 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0' : ''}`}>
        <SwipeNav>{children}</SwipeNav>
      </main>
      {!hideFooter && <Footer />}
      {!hideBottomNav && <MobileBottomNav />}
      {!hideBackToTop && <BackToTop />}
    </div>
  );
}
