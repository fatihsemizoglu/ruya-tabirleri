import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Moon, Eye, EyeOff, Mail, Lock, User, Sparkles, KeyRound, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Seo } from '@/components/Seo';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const authInputClass = 'bg-white text-slate-950 placeholder:text-slate-500 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:border-white/15';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır').regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi kullanılabilir'),
});

const forgotSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
});

const resetSchema = z.object({
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

interface AuthProps {
  mode: 'login' | 'register' | 'forgot' | 'reset';
}

export default function Auth({ mode }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'' | 'google'>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, signInWithProvider } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user && mode !== 'reset') {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    }
  }, [user, navigate, mode, searchParams]);

  const validateForm = () => {
    try {
      if (mode === 'login') {
        loginSchema.parse({ email, password });
      } else if (mode === 'register') {
        registerSchema.parse({ email, password, fullName, username });
      } else if (mode === 'forgot') {
        forgotSchema.parse({ email });
      } else {
        resetSchema.parse({ password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ variant: 'destructive', title: 'Giriş başarısız', description: error.message });
        } else {
          toast({ title: 'Hoş geldiniz!', description: 'Başarıyla giriş yaptınız.' });
          const redirectTo = searchParams.get('redirect') || '/';
          navigate(redirectTo);
        }
      } else if (mode === 'register') {
        const { error } = await signUp(email, password, { username, full_name: fullName });
        if (error) {
          toast({ variant: 'destructive', title: 'Kayıt başarısız', description: error.message });
        } else {
          toast({ title: 'Hesabınız oluşturuldu!', description: 'E-posta adresinize doğrulama bağlantısı gönderildi.' });
          navigate('/email-dogrula');
        }
      } else if (mode === 'forgot') {
        const redirectTo = `${window.location.origin}/sifre-sifirla`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
          toast({ variant: 'destructive', title: 'Hata', description: error.message });
        } else {
          toast({ title: 'Sıfırlama bağlantısı gönderildi', description: 'E-postanızı kontrol edin.' });
        }
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast({ variant: 'destructive', title: 'Hata', description: error.message });
        } else {
          toast({ title: 'Şifreniz güncellendi', description: 'Yeni şifrenizle giriş yapabilirsiniz.' });
          navigate('/giris');
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Bir hata oluştu', description: 'Lütfen tekrar deneyin.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setSocialLoading(provider);
    try {
      await signInWithProvider(provider);
    } catch {
      toast({ variant: 'destructive', title: 'Giriş başarısız', description: 'Sosyal giriş sırasında bir hata oluştu.' });
    } finally {
      setSocialLoading('');
    }
  };

  const title = mode === 'login' ? 'Giriş Yap'
    : mode === 'register' ? 'Kayıt Ol'
    : mode === 'forgot' ? 'Şifremi Unuttum'
    : 'Yeni Şifre Belirle';

  const description = mode === 'forgot'
    ? 'E-posta adresinizi girin, şifre sıfırlama bağlantısını gönderelim.'
    : mode === 'reset'
    ? 'Hesabınız için yeni bir şifre belirleyin.'
    : 'Rüya Tabirleri hesabınıza giriş yapın veya yeni hesap oluşturun.';

  const showSocialLogin = mode === 'login' || mode === 'register';

  return (
    <div className="min-h-screen flex relative bg-background text-foreground">
      <Seo
        title={title}
        description={description}
        path={mode === 'login' ? '/giris' : mode === 'register' ? '/kayit' : mode === 'forgot' ? '/sifremi-unuttum' : '/sifre-sifirla'}
        noindex
      />
      <PremiumBackground variant="soft" className="hidden sm:block lg:hidden opacity-40" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/95 p-6 text-card-foreground shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-950/95">
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/25 group-hover:scale-105 transition-transform">
              <Moon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Rüya <GradientText>Tabirleri</GradientText>
            </span>
          </Link>

          <div className="mb-4">
            <PremiumBadge>
              <Sparkles className="h-3.5 w-3.5" />
              {mode === 'login' ? 'Hoş geldiniz' : mode === 'register' ? 'Aramıza katılın' : 'Güvenli hesap erişimi'}
            </PremiumBadge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.025em] mb-2 text-foreground">
            {mode === 'login' ? (
              <>Tekrar <GradientText>Hoş Geldiniz</GradientText></>
            ) : mode === 'register' ? (
              <>Hesap <GradientText>Oluşturun</GradientText></>
            ) : mode === 'forgot' ? (
              <>Şifrenizi <GradientText>Sıfırlayın</GradientText></>
            ) : (
              <>Yeni <GradientText>Şifre Belirleyin</GradientText></>
            )}
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {mode === 'login'
              ? 'Hesabınıza giriş yapın ve rüya dünyanıza devam edin.'
              : mode === 'register'
              ? 'Ücretsiz hesap oluşturun ve rüya günlüğünüzü tutmaya başlayın.'
              : mode === 'forgot'
              ? 'Kayıtlı e-posta adresinizi girin, sıfırlama bağlantısını gönderelim.'
              : 'Yeni şifrenizi belirleyerek hesabınıza tekrar erişin.'
            }
          </p>

          {showSocialLogin && (
            <>
              <div className="flex flex-col gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 gap-2"
                  onClick={() => handleSocialLogin('google')}
                  disabled={socialLoading === 'google'}
                >
                  <Chrome className="h-5 w-5" />
                  {socialLoading === 'google' ? 'Google ile bağlanıyor...' : 'Google ile Devam Et'}
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">veya e-posta ile</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="auth-fullName" className="text-foreground">Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="auth-fullName"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`pl-10 ${authInputClass}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-username" className="text-foreground">Kullanıcı Adı</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="auth-username"
                      type="text"
                      placeholder="kullanici_adi"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`pl-10 ${authInputClass}`}
                    />
                  </div>
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>
              </>
            )}

            {mode !== 'reset' && <div className="space-y-2">
              <Label htmlFor="auth-email" className="text-foreground">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${authInputClass}`}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>}

            {mode !== 'forgot' && <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">{mode === 'reset' ? 'Yeni Şifre' : 'Şifre'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 ${authInputClass}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm cursor-pointer">Beni hatırla</Label>
                </div>
                <Link to="/sifremi-unuttum" className="text-sm font-medium text-primary hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full dream-gradient" disabled={isLoading}>
              {isLoading
                ? 'Lütfen bekleyin...'
                : mode === 'login'
                ? 'Giriş Yap'
                : mode === 'register'
                ? 'Kayıt Ol'
                : mode === 'forgot'
                ? <><KeyRound className="mr-2 h-4 w-4" /> Sıfırlama Bağlantısı Gönder</>
                : 'Şifreyi Güncelle'}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <Link to="/sifremi-unuttum" className="text-sm font-medium text-primary hover:underline">
                Şifremi unuttum
              </Link>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' ? (
              <>
                Hesabınız yok mu?{' '}
                <Link to="/kayit" className="text-primary hover:underline font-medium">
                  Kayıt Olun
                </Link>
              </>
            ) : mode === 'register' ? (
              <>
                Zaten hesabınız var mı?{' '}
                <Link to="/giris" className="text-primary hover:underline font-medium">
                  Giriş Yapın
                </Link>
              </>
            ) : (
              <>
                Şifrenizi hatırladınız mı?{' '}
                <Link to="/giris" className="text-primary hover:underline font-medium">
                  Giriş Yapın
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-white/10 blur-2xl animate-pulse" />
        <div className="absolute bottom-32 right-20 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative text-center text-white max-w-md m-auto p-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Deneyim
          </div>
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-8 border border-white/20">
            <Moon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.025em] mb-5 leading-[1.1]">
            Rüyalarınızın{' '}
            <span className="bg-gradient-to-r from-amber-200 via-pink-200 to-fuchsia-200 bg-clip-text text-transparent">
              gizli anlamlarını
            </span>{' '}
            keşfedin
          </h2>
          <p className="text-base sm:text-lg text-white/85 leading-relaxed">
            Binlerce rüya tabiri, kişisel günlük ve İslami & psikolojik yorumlarla rüyalarınızı anlayın.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 text-white/90">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-3">
              <div className="text-xl font-bold">5K+</div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">Rüya</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-3">
              <div className="text-xl font-bold">1M+</div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">Okuyucu</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-3">
              <div className="text-xl font-bold">4.9★</div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">Puan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
