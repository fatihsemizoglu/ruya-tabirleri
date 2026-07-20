import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Oturum açılıyor...');

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        navigate('/giris', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        navigate('/', { replace: true });
      }
    });

    const timeout = setTimeout(() => {
      setStatus('Yönlendiriliyor...');
      navigate('/', { replace: true });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
