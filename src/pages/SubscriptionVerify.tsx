import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscriptionVerify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const verifySubscription = async () => {
      if (!token || !email) {
        setStatus('error');
        setMessage('Geçersiz doğrulama bağlantısı');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('verify_subscription', {
          p_email: email,
          p_token: token,
        });

        if (error || !data) {
          setStatus('error');
          setMessage('Doğrulama başarısız. Bağlantı geçersiz veya süresi dolmuş olabilir.');
        } else {
          setStatus('success');
          setMessage('E-posta adresiniz başarıyla doğrulandı! Artık yeni içeriklerimizden haberdar olacaksınız.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    };

    verifySubscription();
  }, [token, email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5 p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <h1 className="text-xl font-semibold mb-2">Doğrulanıyor...</h1>
            <p className="text-muted-foreground">Lütfen bekleyin</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-emerald-700 dark:text-emerald-400">Başarılı!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">Hata</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
