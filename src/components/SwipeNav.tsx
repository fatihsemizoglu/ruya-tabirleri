import { ReactNode, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const TAB_ROUTES = ['/', '/kategoriler', '/ruya-gunlugum', '/favorilerim', '/profil'];

export function SwipeNav({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const startX = useRef(0);
  const startY = useRef(0);

  const availableRoutes = user ? TAB_ROUTES : TAB_ROUTES.filter(r => !['/ruya-gunlugum', '/favorilerim', '/profil'].includes(r));

  const currentIndex = availableRoutes.indexOf(location.pathname);
  if (currentIndex === -1) return <>{children}</>;

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    // Yatay kaydırılabilir alanların (carousel, yatay sekme listesi vb.) içinden
    // başlayan hareketlerde swipe-nav tetiklenmesin — kullanıcı muhtemelen o
    // alanı kaydırmaya çalışıyordur. Kullanıcı gerçekten sayfayı değiştirmek
    // istiyorsa, bu alanların dışından kaydırır.
    if (e.target instanceof Element) {
      let node: Element | null = e.target;
      while (node && node !== e.currentTarget) {
        if (node.scrollWidth > node.clientWidth + 8) return;
        node = node.parentElement;
      }
    }
    startX.current = touch.clientX;
    startY.current = touch.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < availableRoutes.length) {
      const target = availableRoutes[nextIndex];
      if (target) navigate(target);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
