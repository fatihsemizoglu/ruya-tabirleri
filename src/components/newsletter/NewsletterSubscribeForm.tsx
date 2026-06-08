import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NewsletterSubscribeFormProps {
  variant?: 'default' | 'compact' | 'footer';
  className?: string;
}

export function NewsletterSubscribeForm({ variant = 'default', className = '' }: NewsletterSubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Lütfen e-posta adresinizi girin');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: { email, name: name || undefined }
      });

      if (error) throw error;

      if (data.success) {
        setIsSuccess(true);
        toast.success(data.message || 'Doğrulama e-postası gönderildi!');
        setEmail('');
        setName('');
      } else {
        throw new Error(data.error || 'Bir hata oluştu');
      }
    } catch (error: unknown) {
      console.error('Subscribe error:', error);
      toast.error(error instanceof Error ? error.message : 'Abonelik sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-300 ${className}`}>
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          Doğrulama e-postası gönderildi! Lütfen gelen kutunuzu kontrol edin.
        </p>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        </Button>
      </form>
    );
  }

  if (variant === 'footer') {
    return (
      <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
        <Input
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full bg-white text-primary hover:bg-white/90"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Abone Ol
        </Button>
      </form>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-primary/5 to-purple-500/5 border rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Bültenimize Abone Olun</h3>
          <p className="text-sm text-muted-foreground">Yeni içeriklerden haberdar olun</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="Adınız (isteğe bağlı)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
        <Input
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Abone Ol
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          E-postanızı kimseyle paylaşmayacağız. İstediğiniz zaman aboneliği iptal edebilirsiniz.
        </p>
      </form>
    </div>
  );
}
