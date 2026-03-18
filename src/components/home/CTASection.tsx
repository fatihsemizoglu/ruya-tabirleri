import { Link } from 'react-router-dom';
import { Book, Sparkles, Bell, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const features = [
  'Kişisel rüya günlüğü',
  'Favori tabirleri kaydetme',
  'Rüya hatırlatıcıları',
  'Kişiselleştirilmiş öneriler',
];

export function CTASection() {
  const { user } = useAuth();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold mb-8">
            <Sparkles className="h-4 w-4" />
            <span>{user ? 'Premium Özellikler' : 'Ücretsiz Başlayın'}</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            {user ? 'Rüya Günlüğünüzü' : 'Ücretsiz Üye Olun,'}
            <br />
            <span className="text-white/90">{user ? 'Tutmaya Başlayın' : 'Ayrıcalıkları Keşfedin'}</span>
          </h2>

          {/* Description */}
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            {user 
              ? 'Gördüğünüz rüyaları kaydedin, zaman içinde kalıplarınızı keşfedin ve kişisel yorumlarınızı ekleyin.'
              : 'Rüya günlüğü tutun, favorilerinizi kaydedin ve kişiselleştirilmiş öneriler alın.'
            }
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-left text-sm bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
              >
                <Check className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          {user ? (
            <Button size="lg" asChild className="bg-white text-indigo-600 hover:bg-white/90 rounded-xl px-8 h-14 text-base font-semibold shadow-2xl shadow-black/20">
              <Link to="/profil?tab=gunluk">
                <Book className="mr-2 h-5 w-5" />
                Günlüğe Git
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-indigo-600 hover:bg-white/90 rounded-xl px-8 h-14 text-base font-semibold shadow-2xl shadow-black/20 group">
                <Link to="/kayit">
                  Ücretsiz Kayıt Ol
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-xl px-8 h-14 text-base font-semibold backdrop-blur-sm">
                <Link to="/giris">
                  Giriş Yap
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
