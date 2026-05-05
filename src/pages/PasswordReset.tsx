import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { toast } = useToast();
  const { refreshUser } = useAuth(); // We might need a reset password function in useAuth

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // For now, we simulate or call the API if exists
      // const { error } = await authApi.resetPassword(email);
      
      setIsSubmitted(true);
      toast({
        title: "E-posta gönderildi",
        description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şifre sıfırlama isteği gönderilirken bir hata oluştu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <Link to="/giris" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Giriş ekranına dön
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl dream-gradient flex items-center justify-center">
            <Moon className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-bold">Şifre Sıfırla</h1>
        </div>

        {!isSubmitted ? (
          <>
            <p className="text-muted-foreground mb-8">
              E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full dream-gradient" disabled={isLoading}>
                {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Kontrol Edin!</h2>
            <p className="text-muted-foreground mb-6">
              <strong>{email}</strong> adresine şifre sıfırlama talimatlarını içeren bir e-posta gönderdik.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
              Farklı bir e-posta dene
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
