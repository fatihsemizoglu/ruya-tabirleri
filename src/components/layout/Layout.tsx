import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { CursorGlow } from '@/components/ui/cursor-glow';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgress />
      <CursorGlow />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
