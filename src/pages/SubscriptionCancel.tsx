import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Status = 'loading' | 'success' | 'error' | 'need-email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SubscriptionCancel() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [emailInput, setEmailInput] = useState(searchParams.get('email') ?? '');

  useEffect(() => {
    const email = searchParams.get('email');
    if (!email) {
      // Bülten linklerinde kişiselleştirilmemiş iptal bağlantısı olabilir;
      // kullanıcıdan e-posta adresini iste.
      setStatus('need-email');
      return;
    }
    cancelSubscription(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelSubscription = async (rawEmail: string) => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setStatus('error');
      setMessage('Geçerli bir e-posta adresi girin.');
      return;
    }

    setStatus('loading');
    try {
      const { data, error } = await supabase.rpc('unsubscribe_by_email', {
        p_email: email,
      });

      if (error || !data) {
        setStatus('error');
        setMessage('Abonelik iptali başarısız. E-posta adresi bulunamadı veya zaten iptal edilmiş.');
      } else {
        setStatus('success');
        setMessage('Aboneliğiniz başarıyla iptal edildi. Artık e-posta bildirimleri almayacaksınız.');
      }
    } catch {
      setStatus('error');
      setMessage('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5 p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <h1 className="text-xl font-semibold mb-2">İşleniyor...</h1>
            <p className="text-muted-foreground mb-6">Lütfen bekleyin</p>
          </>
        )}

        {status === 'need-email' && (
          <>
            <h1 className="text-xl font-semibold mb-2">Abonelik İptali</h1>
            <p className="text-muted-foreground mb-6">
              Aboneliğinizi iptal etmek istediğiniz e-posta adresini girin.
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void cancelSubscription(emailInput);
              }}
            >
              <div className="space-y-2 text-left">
                <Label htmlFor="cancel-email">E-posta Adresi</Label>
                <Input
                  id="cancel-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ornek@eposta.com"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Aboneliği İptal Et
              </Button>
            </form>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Abonelik İptal Edildi</h1>
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
