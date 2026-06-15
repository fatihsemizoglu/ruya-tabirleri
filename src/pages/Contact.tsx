import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import {
  Mail, MessageSquare, Send, MapPin, Clock, Phone, Globe, Sparkles,
  CheckCircle2, Heart, ShieldCheck, Navigation, Map as MapIcon,
  Compass, Copy, ExternalLink, Car, Star, Zap, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Seo } from '@/components/Seo';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/share';
import { haptic } from '@/lib/haptics';

const contactReasons = [
  { value: 'genel', label: 'Genel Bilgi', icon: MessageSquare, color: 'from-blue-500 to-cyan-500' },
  { value: 'oneri', label: 'Öneri & İstek', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
  { value: 'hata', label: 'Hata Bildirimi', icon: ShieldCheck, color: 'from-rose-500 to-pink-500' },
  { value: 'isbirligi', label: 'İş Birliği', icon: Heart, color: 'from-violet-500 to-fuchsia-500' },
];

type MapProvider = 'openstreetmap' | 'google' | 'apple' | 'yandex';

const mapProviders: Array<{
  id: MapProvider;
  name: string;
  shortName: string;
  description: string;
  color: string;
  ringColor: string;
  bg: string;
  textColor: string;
  badgeBg: string;
  initial: string;
}> = [
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    shortName: 'OSM',
    description: 'Topluluk destekli açık harita',
    color: 'from-emerald-500 to-green-600',
    ringColor: 'ring-emerald-500/40',
    bg: 'bg-emerald-500/10',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500',
    initial: 'OSM',
  },
  {
    id: 'google',
    name: 'Google Maps',
    shortName: 'Google',
    description: 'Google’ın detaylı haritaları',
    color: 'from-blue-500 via-blue-600 to-emerald-500',
    ringColor: 'ring-blue-500/40',
    bg: 'bg-blue-500/10',
    textColor: 'text-blue-700 dark:text-blue-400',
    badgeBg: 'bg-blue-500',
    initial: 'G',
  },
  {
    id: 'apple',
    name: 'Apple Maps',
    shortName: 'Apple',
    description: 'Apple’ın zarif harita deneyimi',
    color: 'from-slate-700 to-slate-900',
    ringColor: 'ring-slate-500/40',
    bg: 'bg-slate-500/10',
    textColor: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-800',
    initial: '',
  },
  {
    id: 'yandex',
    name: 'Yandex Maps',
    shortName: 'Yandex',
    description: 'Yandex’in detaylı haritaları',
    color: 'from-red-500 to-amber-500',
    ringColor: 'ring-red-500/40',
    bg: 'bg-red-500/10',
    textColor: 'text-red-700 dark:text-red-400',
    badgeBg: 'bg-red-500',
    initial: 'Я',
  },
];

export default function Contact() {
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('openstreetmap');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', reason: 'genel', message: '',
  });

  // Dinamik sosyal medya (sadece URL girilmiş olanlar)
  const dynamicSocials = useMemo(() => {
    const list = [
      { name: 'Instagram', url: settings.socialInstagram, color: 'from-pink-500 via-rose-500 to-fuchsia-500', icon: 'IG' },
      { name: 'Twitter / X', url: settings.socialTwitter, color: 'from-sky-400 to-slate-900', icon: 'X' },
      { name: 'YouTube', url: settings.socialYoutube, color: 'from-red-500 to-red-700', icon: 'YT' },
      { name: 'Facebook', url: settings.socialFacebook, color: 'from-blue-500 to-blue-700', icon: 'FB' },
      { name: 'LinkedIn', url: settings.socialLinkedin, color: 'from-sky-600 to-indigo-700', icon: 'IN' },
      { name: 'TikTok', url: settings.socialTiktok, color: 'from-slate-800 via-pink-500 to-cyan-400', icon: 'TT' },
    ];
    return list.filter((s) => s.url && s.url.trim() !== '');
  }, [settings]);

  // Harita URL'leri koordinatlardan
  const lat = parseFloat(settings.mapLatitude) || 41.0082;
  const lng = parseFloat(settings.mapLongitude) || 28.9784;
  const zoom = 12;

  const getMapEmbedUrl = (provider: MapProvider) => {
    switch (provider) {
      case 'openstreetmap':
        return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.035}%2C${lng + 0.05}%2C${lat + 0.035}&layer=mapnik&marker=${lat},${lng}`;
      case 'google':
        return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
      case 'apple':
        return `https://maps.apple.com/embed?v=2&ll=${lat},${lng}&z=${zoom}`;
      case 'yandex':
        return `https://yandex.com.tr/map-widget/v1/?ll=${lng},${lat}&z=${zoom}&pt=${lng},${lat},pm2rdl`;
      default:
        return '';
    }
  };

  const getMapExternalLinks = (provider: MapProvider) => {
    const links: Record<MapProvider, { view: string; directions: string }> = {
      openstreetmap: {
        view: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`,
        directions: `https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}`,
      },
      google: {
        view: `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}`,
        directions: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      },
      apple: {
        view: `https://maps.apple.com/?ll=${lat},${lng}&z=${zoom}&q=Konum`,
        directions: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      },
      yandex: {
        view: `https://yandex.com.tr/maps/?ll=${lng},${lat}&z=${zoom}&pt=${lng},${lat},pm2rdl`,
        directions: `https://yandex.com.tr/maps/?rtext=~${lat},${lng}&rtt=auto`,
      },
    };
    return links[provider];
  };

  const handleCopyCoords = async () => {
    const ok = await copyToClipboard(`${lat}, ${lng}`);
    if (ok) {
      toast({ title: 'Kopyalandı ✓', description: 'Koordinatlar panoya kopyalandı.' });
      haptic('light');
    } else {
      toast({ title: 'Hata', description: 'Kopyalanamadı.', variant: 'destructive' });
    }
  };

  const handleProviderChange = (provider: MapProvider) => {
    setMapProvider(provider);
    setMapLoaded(false);
    setMapFailed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name, email: formData.email,
        subject: `[${formData.reason}] ${formData.subject}`, message: formData.message,
      });
      if (error) throw error;
      toast({ title: 'Mesajınız Gönderildi ✓', description: 'En kısa sürede size dönüş yapacağız.' });
      setFormData({ name: '', email: '', subject: '', reason: 'genel', message: '' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Mesaj gönderilirken bir hata oluştu.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProvider = mapProviders.find((p) => p.id === mapProvider)!;
  const externalLinks = getMapExternalLinks(mapProvider);

  // MapProvider logo rendering helper
  const ProviderLogo = ({ provider }: { provider: typeof mapProviders[number] }) => {
    if (provider.id === 'apple') {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      );
    }
    if (provider.id === 'google') {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    }
    if (provider.id === 'yandex') {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#FF0000" aria-hidden>
          <path d="M2 12c0-.31.02-.62.06-.92C2.6 5.97 6.97 2 12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10c-5.03 0-9.4-3.97-9.94-9.08C2.02 12.62 2 12.31 2 12zm6.5-3.5h1.8v3.6L13.9 8.5h2.3l-3.7 4.1 4.1 4.9h-2.5l-3.8-4.6v4.6H8.5v-9z" />
        </svg>
      );
    }
    // OpenStreetMap
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.553 2.276A1 1 0 0022 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    );
  };

  return (
    <Layout>
      <Seo
        title="İletişim"
        description="Rüya Tabirleri ile iletişime geçin. Sorularınız, önerileriniz ve geri bildirimleriniz için bize ulaşın."
        path="/iletisim"
      />
      <div className="relative overflow-hidden bg-mesh">
        <div className="absolute -top-44 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-[520px] -left-40 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <PremiumBackground variant="soft" className="h-[460px]" />
        <div className="container py-12 md:py-20 relative">
          {/* Hero */}
          <div className="max-w-3xl mx-auto text-center mb-16 relative">
            <div className="mb-6 flex justify-center">
              <PremiumBadge><MessageSquare className="h-3.5 w-3.5" /> İletişim</PremiumBadge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.025em] mb-6 text-foreground">
              Bizimle <GradientText>İletişime</GradientText> Geçin
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşın. Mesajlarınızı dikkatle okuyor, en kısa sürede dönüş yapıyoruz.
            </p>

            {/* Hızlı istatistikler */}
            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {[
                { icon: Zap, label: 'Hızlı Yanıt', value: '< 24 saat', color: 'text-amber-500' },
                { icon: Users, label: 'Mutlu Kullanıcı', value: '10K+', color: 'text-violet-500' },
                { icon: Star, label: 'Memnuniyet', value: '%98', color: 'text-rose-500' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-card/60 backdrop-blur border border-border/60 shadow-sm hover:shadow-md transition-shadow"
                >
                  <stat.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', stat.color)} />
                  <div className="text-base sm:text-lg font-bold">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mb-14 items-start">
            {/* İletişim bilgi kartları (dinamik) */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/60 hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/10 group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold mb-1.5">E-posta</h3>
                      <a href={`mailto:${settings.contactEmail}`} className="text-muted-foreground hover:text-primary transition-colors text-sm break-all inline-flex items-center gap-1.5 group/email">
                        {settings.contactEmail}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/email:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">7/24 e-posta gönderebilirsiniz</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {settings.contactPhone && (
                <Card className="border-border/60 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/10 group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all">
                        <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold mb-1.5">Telefon</h3>
                        <a href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`} className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm inline-flex items-center gap-1.5 group/phone">
                          {settings.contactPhone}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">Hafta içi 09:00 - 18:00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {settings.contactWorkingHours && (
                <Card className="border-border/60 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10 group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold mb-1.5">Çalışma Saatleri</h3>
                        <p className="text-muted-foreground text-sm whitespace-pre-line">{settings.contactWorkingHours}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
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
              )}

              {settings.contactAddress && (
                <Card className="border-border/60 hover:border-rose-500/40 transition-all hover:shadow-xl hover:shadow-rose-500/10 group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all">
                        <MapPin className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold mb-1.5">Konum</h3>
                        <p className="text-muted-foreground text-sm whitespace-pre-line">{settings.contactAddress}</p>
                        <p className="text-xs text-muted-foreground mt-1">Tüm dünyadan hizmet</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sosyal Medya */}
              <Card className="border-border/60 overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      Bizi Takip Edin
                    </h3>
                    <span className="text-[11px] font-medium text-muted-foreground">{dynamicSocials.length} kanal</span>
                  </div>
                  {dynamicSocials.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-2">
                      {dynamicSocials.map((s) => (
                        <a
                          key={s.name}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${s.name} hesabını aç`}
                          title={s.name}
                          className="group flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-muted/35 px-2 py-2.5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-sm"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-transform group-hover:scale-105`}>
                            {s.icon}
                          </div>
                          <span className="max-w-full truncate text-[11px] font-medium leading-none">{s.name}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">Sosyal medya hesapları yakında eklenecek.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mesaj Formu */}
            <Card className="lg:col-span-3 self-start border-border/60 shadow-xl shadow-primary/5 overflow-hidden">
              <div className="h-1 dream-gradient" />
              <CardHeader className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  Mesaj Gönderin
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1.5">Formu doldurun, en kısa sürede size dönüş yapalım.</p>
              </CardHeader>
              <CardContent className="pt-5 sm:pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Adınız *</Label>
                      <Input id="name" placeholder="Adınızı girin" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input id="email" type="email" placeholder="ornek@email.com" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Konu *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {contactReasons.map((r) => {
                        const Icon = r.icon;
                        const active = formData.reason === r.value;
                        return (
                          <button key={r.value} type="button"
                            onClick={() => setFormData({ ...formData, reason: r.value })}
                            className={cn(
                              'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium relative overflow-hidden',
                              active
                                ? 'border-primary bg-primary/5 text-primary shadow-md shadow-primary/10'
                                : 'border-border/60 hover:border-primary/30 text-muted-foreground hover:bg-muted/30'
                            )}>
                            {active && <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10', r.color)} />}
                            <Icon className="h-4 w-4 relative" />
                            <span className="relative">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Başlık *</Label>
                    <Input id="subject" placeholder="Mesajınızın konusu" value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Mesajınız *</Label>
                    <Textarea id="message" placeholder="Mesajınızı buraya yazın..." rows={6}
                      value={formData.message} maxLength={1000}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })} required className="resize-none" />
                    <p className="text-xs text-muted-foreground text-right">{formData.message.length} / 1000 karakter</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Bilgileriniz gizli tutulur, sadece size dönüş için kullanılır.</span>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base dream-gradient shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" disabled={isSubmitting}>
                    {isSubmitting ? 'Gönderiliyor...' : <><Send className="h-4 w-4 mr-2" />Mesajı Gönder</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Harita Bölümü */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="mb-3 flex justify-center">
                <PremiumBadge><MapPin className="h-3.5 w-3.5" /> Konum</PremiumBadge>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Bize <GradientText>Ulaşın</GradientText></h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{settings.contactAddress} merkezli hizmet veriyoruz. Aşağıdan tercih ettiğiniz harita servisini seçebilirsiniz.</p>
            </div>

            <Card className="overflow-hidden border-border/60 shadow-xl shadow-primary/5">
              {/* Harita Sağlayıcı Seçici */}
              <div className="border-b border-border/60 bg-gradient-to-r from-muted/30 via-muted/10 to-muted/30 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <MapIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Harita Sağlayıcısı</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {mapProviders.map((provider) => {
                    const active = mapProvider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => handleProviderChange(provider.id)}
                        className={cn(
                          'group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 transition-all text-left',
                          active
                            ? `border-primary ${provider.bg} shadow-md ring-2 ${provider.ringColor}`
                            : 'border-border/60 hover:border-primary/30 bg-card/50 hover:bg-card'
                        )}
                        aria-pressed={active}
                      >
                        <div className={cn(
                          'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                          provider.bg, provider.textColor
                        )}>
                          <ProviderLogo provider={provider} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={cn('text-xs sm:text-sm font-semibold truncate', active && provider.textColor)}>
                            {provider.name}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                            {provider.description}
                          </div>
                        </div>
                        {active && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                            <CheckCircle2 className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Harita Alanı */}
              <div className="relative">
                <div className="relative w-full h-[380px] sm:h-[440px] md:h-[500px] bg-muted">
                  {(!mapLoaded || mapFailed) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/30 z-10 pointer-events-none">
                      <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse', currentProvider.bg, currentProvider.textColor)}>
                          <ProviderLogo provider={currentProvider} />
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {mapFailed ? `${currentProvider.name} haritası gömülü olarak açılamadı.` : `${currentProvider.name} yükleniyor...`}
                        </div>
                        {mapFailed && (
                          <Button asChild size="sm" variant="outline" className="pointer-events-auto rounded-lg">
                            <a href={externalLinks.view} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Haritada Aç
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <iframe
                    key={mapProvider}
                    title={`${currentProvider.name} - Konum Haritası`}
                    src={getMapEmbedUrl(mapProvider)}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setMapLoaded(true)}
                    onError={() => setMapFailed(true)}
                    style={{ filter: 'saturate(1.1) contrast(1.05)' }}
                    allowFullScreen
                  />
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border/40 rounded-none" />
                  {/* Sağ üst köşede aktif sağlayıcı rozeti */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border/60 rounded-full px-2.5 py-1 shadow-sm">
                    <div className={cn('w-4 h-4 rounded flex items-center justify-center', currentProvider.bg, currentProvider.textColor)}>
                      <ProviderLogo provider={currentProvider} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold">{currentProvider.shortName}</span>
                  </div>
                </div>

                {/* Harita Alt Bilgi Kartı */}
                <div className="bg-card border-t border-border/60 p-5 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Adres</p>
                        <p className="text-sm font-medium whitespace-pre-line">{settings.contactAddress}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCoords}
                      className="flex items-start gap-3 text-left hover:bg-muted/40 -m-2 p-2 rounded-lg transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Compass className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                          Koordinat
                          <Copy className="h-2.5 w-2.5 opacity-50" />
                        </p>
                        <p className="text-sm font-medium font-mono">{lat}° N, {lng}° E</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Kopyalamak için tıkla</p>
                      </div>
                    </button>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Çalışma Saatleri</p>
                        <p className="text-sm font-medium whitespace-pre-line">{settings.contactWorkingHours}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3 w-3" />
                      Harita: {currentProvider.name} üzerinden görüntüleniyor
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline" className="rounded-lg">
                        <a href={externalLinks.view} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> {currentProvider.shortName}'da Aç
                        </a>
                      </Button>
                      <Button asChild size="sm" className="rounded-lg dream-gradient shadow-md shadow-primary/20">
                        <a href={externalLinks.directions} target="_blank" rel="noopener noreferrer">
                          <Car className="h-3.5 w-3.5 mr-1.5" /> Yol Tarifi Al
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
