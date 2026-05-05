import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır').regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi kullanılabilir'),
});

interface AuthProps {
  mode: 'login' | 'register';
}

export default function Auth({ mode }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, refreshUser, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'admin' || userRole === 'moderator') {
        navigate('/admin');
      } else {
        navigate('/profil?tab=profil');
      }
    }
  }, [user, userRole, navigate]);

  if (user) {
    return null;
  }

  const validateForm = () => {
    try {
      if (mode === 'login') {
        loginSchema.parse({ email, password });
      } else {
        registerSchema.parse({ email, password, fullName, username });
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
          toast({
            variant: 'destructive',
            title: 'Giriş başarısız',
            description: error.message === 'Invalid login credentials' 
              ? 'E-posta veya şifre hatalı'
              : error.message,
          });
        } else {
          toast({
            title: 'Hoş geldiniz!',
            description: 'Başarıyla giriş yaptınız.',
          });
          
          // Re-fetch user to ensure we have the role for useEffect to trigger navigation
          await refreshUser();
        }
      } else {
        const { error } = await signUp(email, password, { username, full_name: fullName });
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Kayıt başarısız',
            description: error.message === 'User already registered'
              ? 'Bu e-posta adresi zaten kayıtlı'
              : error.message,
          });
        } else {
          toast({
            title: 'Kayıt başarılı!',
            description: 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
          });
          navigate('/giris');
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Bir hata oluştu',
        description: 'Lütfen tekrar deneyin.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl dream-gradient flex items-center justify-center">
              <Moon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-serif font-bold">
              Rüya <span className="text-gradient">Tabirleri</span>
            </span>
          </Link>

          {/* Title */}
          <h1 className="text-3xl font-serif font-bold mb-2">
            {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === 'login' 
              ? 'Hesabınıza giriş yapın ve rüya dünyanıza devam edin.'
              : 'Ücretsiz hesap oluşturun ve rüya günlüğünüzü tutmaya başlayın.'
            }
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="username"
                      type="text"
                      placeholder="kullanici_adi"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>
              </>
            )}

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
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                {mode === 'login' && (
                  <Link to="/sifre-sifirla" className="text-sm text-primary hover:underline">
                    Şifremi Unuttum
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full dream-gradient" disabled={isLoading}>
              {isLoading ? 'Lütfen bekleyin...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </Button>
          </form>

          {/* Switch Mode */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' ? (
              <>
                Hesabınız yok mu?{' '}
                <Link to="/kayit" className="text-primary hover:underline font-medium">
                  Kayıt Olun
                </Link>
              </>
            ) : (
              <>
                Zaten hesabınız var mı?{' '}
                <Link to="/giris" className="text-primary hover:underline font-medium">
                  Giriş Yapın
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 dream-gradient items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white/10 blur-xl animate-float" />
        <div className="absolute bottom-32 right-20 w-24 h-24 rounded-full bg-white/10 blur-xl animate-float animation-delay-300" />
        
        <div className="relative text-center text-primary-foreground max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-8">
            <Moon className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4">
            Rüyalarınızın Gizli Anlamlarını Keşfedin
          </h2>
          <p className="text-lg opacity-90">
            Binlerce rüya tabiri, kişisel günlük ve İslami & psikolojik yorumlarla rüyalarınızı anlayın.
          </p>
        </div>
      </div>
    </div>
  );
}
