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

  const availableRoutes = user ? TAB_ROUTES : TAB_ROUTES.filter(r => r !== '/ruya-gunlugum');

  const currentIndex = availableRoutes.indexOf(location.pathname);
  if (currentIndex === -1) return <>{children}</>;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < availableRoutes.length) {
      navigate(availableRoutes[nextIndex]);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
