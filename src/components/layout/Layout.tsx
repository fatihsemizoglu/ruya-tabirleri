import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PremiumBackground } from './PremiumBackground';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
  backgroundVariant?: 'default' | 'soft' | 'strong' | 'none';
}

export function Layout({
  children,
  hideFooter = false,
  hideHeader = false,
  backgroundVariant = 'default',
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-x-hidden">
      {backgroundVariant !== 'none' && (
        <div className="fixed inset-0 z-0">
          <PremiumBackground variant={backgroundVariant} />
        </div>
      )}

      {!hideHeader && <Header />}
      <main className="flex-1 relative z-10">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
