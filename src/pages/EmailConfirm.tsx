import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Mail, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Seo } from '@/components/Seo';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { supabase } from '@/integrations/supabase/client';

export default function EmailConfirm() {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResend = async () => {
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'E-posta gerekli', description: 'Lütfen e-posta adresinizi girin.' });
      return;
    }
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/giris` },
    });
    setIsResending(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: error.message });
    } else {
      toast({ title: 'Doğrulama e-postası gönderildi', description: 'Lütfen e-posta kutunuzu kontrol edin.' });
    }
  };

  return (
    <div className="min-h-screen flex relative bg-background text-foreground">
      <Seo title="E-posta Doğrulama" description="Hesabınızı aktifleştirmek için e-posta adresinizi doğrulayın." path="/email-dogrula" noindex />
      <PremiumBackground variant="soft" className="opacity-40" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/95 p-6 text-card-foreground shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-950/95 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-fuchsia-500/25">
            <Mail className="h-8 w-8 text-white" />
          </div>

          <PremiumBadge className="mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Son Adım
          </PremiumBadge>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] mb-2">
            E-postanızı <GradientText>Doğrulayın</GradientText>
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
            Hesabınızı aktifleştirmek için e-posta adresinize gönderdiğimiz doğrulama bağlantısına tıklayın.
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
            <p className="font-medium">E-postayı bulamadınız mı?</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Spam / gereksiz klasörünü kontrol edin</li>
              <li>E-posta adresini doğru girdiğinizden emin olun</li>
              <li>Birkaç dakika bekleyip tekrar deneyin</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                aria-label="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button onClick={handleResend} disabled={isResending} className="shrink-0">
                {isResending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/giris')}>
              Giriş Yap
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="text-primary hover:underline font-medium">
              Ana Sayfaya Dön
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
