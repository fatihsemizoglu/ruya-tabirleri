import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import {
  Mail,
  MessageSquare,
  Send,
  MapPin,
  Clock,
  Phone,
  Globe,
  Sparkles,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const contactReasons = [
  { value: 'genel', label: 'Genel Bilgi', icon: MessageSquare },
  { value: 'oneri', label: 'Öneri & İstek', icon: Sparkles },
  { value: 'hata', label: 'Hata Bildirimi', icon: ShieldCheck },
  { value: 'isbirligi', label: 'İş Birliği', icon: Heart },
];

const socials = [
  { name: 'Twitter', handle: '@ruyatabirleri', color: 'from-sky-400 to-blue-500' },
  { name: 'Instagram', handle: '@ruyatabirleri', color: 'from-pink-500 to-rose-500' },
  { name: 'YouTube', handle: 'Rüya Tabirleri', color: 'from-red-500 to-red-600' },
];

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    reason: 'genel',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: `[${formData.reason}] ${formData.subject}`,
          message: formData.message,
        });

      if (error) throw error;

      toast({
        title: 'Mesajınız Gönderildi ✓',
        description: 'En kısa sürede size dönüş yapacağız.',
      });

      setFormData({ name: '', email: '', subject: '', reason: 'genel', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Hata',
        description: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-12 md:py-16 relative">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="mb-6 flex justify-center">
            <PremiumBadge>
              <MessageSquare className="h-3.5 w-3.5" />
              İletişim
            </PremiumBadge>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-6 text-foreground">
            Bizimle <GradientText>İletişime</GradientText> Geçin
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşın.
            Size en kısa sürede yanıt vermek için buradayız.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 mb-14">
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/60 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold mb-1.5">E-posta</h3>
                    <a
                      href="mailto:info@ruyatabirleri.com"
                      className="text-muted-foreground hover:text-primary transition-colors text-sm break-all"
                    >
                      info@ruyatabirleri.com
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      7/24 e-posta gönderebilirsiniz
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold mb-1.5">Telefon</h3>
                    <a
                      href="tel:+902121234567"
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      +90 (212) 123 45 67
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hafta içi 09:00 - 18:00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold mb-1.5">Yanıt Süresi</h3>
                    <p className="text-muted-foreground text-sm">
                      Genellikle 24 saat içinde
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Şu anda çevrimiçiyiz
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold mb-1.5">Konum</h3>
                    <p className="text-muted-foreground text-sm">
                      İstanbul, Türkiye
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tüm dünyadan hizmet
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social */}
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Bizi Takip Edin
                </h3>
                <div className="space-y-2">
                  {socials.map((s) => (
                    <a
                      key={s.name}
                      href="#"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {s.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        {s.handle}
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="lg:col-span-3 border-border/60 shadow-xl shadow-primary/5">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Mesaj Gönderin
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Formu doldurun, en kısa sürede size dönüş yapalım.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Adınız *</Label>
                    <Input
                      id="name"
                      placeholder="Adınızı girin"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Konu *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {contactReasons.map((r) => {
                      const Icon = r.icon;
                      const active = formData.reason === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, reason: r.value })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                            active
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border/60 hover:border-primary/30 text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Başlık *</Label>
                  <Input
                    id="subject"
                    placeholder="Mesajınızın konusu"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mesajınız *</Label>
                  <Textarea
                    id="message"
                    placeholder="Mesajınızı buraya yazın..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    maxLength={1000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.message.length} / 1000 karakter
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Bilgileriniz gizli tutulur, sadece size dönüş için kullanılır.</span>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base dream-gradient shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Gönderiliyor...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Mesajı Gönder
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Map Section - En altta */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-3 flex justify-center">
              <PremiumBadge>
                <MapPin className="h-3.5 w-3.5" />
                Konum
              </PremiumBadge>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Bize <GradientText>Ulaşın</GradientText>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              İstanbul, Türkiye merkezli ofisimizden hizmet veriyoruz
            </p>
          </div>

          <Card className="overflow-hidden border-border/60 shadow-xl">
            <div className="relative">
              {/* OpenStreetMap Embed - API key gerektirmez */}
              <div className="relative w-full h-[400px] md:h-[480px] bg-muted">
                <iframe
                  title="İstanbul Konum Haritası"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=28.8%2C40.95%2C29.2%2C41.10&layer=mapnik&marker=41.0082%2C28.9784"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ filter: 'saturate(1.1) contrast(1.05)' }}
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border/40 rounded-xl" />
              </div>

              {/* Map Info Bar */}
              <div className="bg-card border-t border-border/60 p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Adres
                      </p>
                      <p className="text-sm font-medium">İstanbul, Türkiye</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Navigation className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Koordinat
                      </p>
                      <p className="text-sm font-medium">41.0082° N, 28.9784° E</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Çalışma Saatleri
                      </p>
                      <p className="text-sm font-medium">Pzt - Cum: 09:00 - 18:00</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Harita: © OpenStreetMap katkıda bulunanlar
                  </p>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                    >
                      <a
                        href="https://www.openstreetmap.org/?mlat=41.0082&mlon=28.9784#map=11/41.0082/28.9784"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        Haritada Aç
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="rounded-lg dream-gradient"
                    >
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=41.0082,28.9784"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-3.5 w-3.5 mr-1.5" />
                        Yol Tarifi Al
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
