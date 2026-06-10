import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/hooks/useAuth';

interface MaintenanceModeGuardProps {
  children: ReactNode;
}

export function MaintenanceModeGuard({ children }: MaintenanceModeGuardProps) {
  const { settings, loading } = useSiteSettings();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const isAuthRoute = location.pathname.startsWith('/giris') || location.pathname.startsWith('/kayit');

  if (loading || authLoading) {
    return <>{children}</>;
  }

  if (settings.maintenanceMode && !isAdmin && !isAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Bakım Modu</h1>
          <p className="text-muted-foreground">
            Sitemiz şu anda bakımda. Kısa süre içinde tekrar hizmetinizdeyiz.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
