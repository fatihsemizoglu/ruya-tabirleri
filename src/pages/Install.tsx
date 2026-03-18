import { Layout } from '@/components/layout/Layout';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  Zap, 
  WifiOff, 
  Bell, 
  CheckCircle2,
  Share,
  PlusSquare,
  MoreVertical
} from 'lucide-react';

export default function Install() {
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleInstall = async () => {
    await installApp();
  };

  const features = [
    {
      icon: Zap,
      title: 'Anında Açılış',
      description: 'Uygulama gibi hızlı açılır, tarayıcı bekleme yok'
    },
    {
      icon: WifiOff,
      title: 'Çevrimdışı Erişim',
      description: 'İnternet olmadan da rüya tabirlerine ulaşın'
    },
    {
      icon: Bell,
      title: 'Bildirimler',
      description: 'Yeni içeriklerden haberdar olun'
    },
    {
      icon: Smartphone,
      title: 'Tam Ekran',
      description: 'Tarayıcı çubuğu olmadan tam ekran deneyim'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen py-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Smartphone className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold mb-4">
              Rüya Tabirleri Uygulaması
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uygulamayı telefonunuza yükleyin, daha hızlı erişim ve çevrimdışı kullanım imkanından yararlanın.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-2 gap-4 mb-12"
          >
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <feature.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Install Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 border border-indigo-500/20"
          >
            {isInstalled ? (
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Uygulama Yüklü!</h2>
                <p className="text-muted-foreground">
                  Rüya Tabirleri uygulaması zaten telefonunuzda yüklü.
                </p>
              </div>
            ) : isInstallable ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Hemen Yükle</h2>
                <p className="text-muted-foreground mb-6">
                  Tek tıkla uygulamayı ana ekranınıza ekleyin.
                </p>
                <Button
                  onClick={handleInstall}
                  size="lg"
                  className="gap-2 text-lg px-8"
                >
                  <Download className="w-5 h-5" />
                  Uygulamayı Yükle
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Nasıl Yüklenir?</h2>
                  <p className="text-muted-foreground">
                    Tarayıcınıza göre aşağıdaki adımları takip edin
                  </p>
                </div>

                {/* iOS Instructions */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">🍎</span>
                    iPhone / iPad (Safari)
                  </h3>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                      <div className="flex items-center gap-2">
                        <span>Alt menüdeki</span>
                        <Share className="w-5 h-5 text-blue-500" />
                        <span>paylaş butonuna tıklayın</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                      <div className="flex items-center gap-2">
                        <span>Aşağı kaydırın ve</span>
                        <PlusSquare className="w-5 h-5" />
                        <span>"Ana Ekrana Ekle" seçin</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                      <span>"Ekle" butonuna tıklayın</span>
                    </li>
                  </ol>
                </div>

                {/* Android Instructions */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    Android (Chrome)
                  </h3>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                      <div className="flex items-center gap-2">
                        <span>Sağ üstteki</span>
                        <MoreVertical className="w-5 h-5" />
                        <span>menü butonuna tıklayın</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                      <span>"Uygulamayı yükle" veya "Ana ekrana ekle" seçin</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                      <span>"Yükle" butonuna tıklayın</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
