import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Clock3,
  Compass,
  Copy,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  MessageSquare,
  Music2,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Twitter,
  Youtube,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/haptics';
import { copyToClipboard } from '@/lib/share';
import { cn } from '@/lib/utils';
import { contactMessageSchema, getFirstValidationMessage } from '@/lib/validation/forms';

const contactReasons = [
  { value: 'genel', label: 'Genel bilgi', icon: MessageCircle },
  { value: 'oneri', label: 'Öneri & istek', icon: Sparkles },
  { value: 'hata', label: 'Hata bildirimi', icon: ShieldCheck },
  { value: 'isbirligi', label: 'İş birliği', icon: MessageSquare },
];

type MapProvider = 'openstreetmap' | 'google' | 'yandex';

const mapProviders: Array<{ id: MapProvider; name: string; shortName: string }> = [
  { id: 'openstreetmap', name: 'OpenStreetMap', shortName: 'OSM' },
  { id: 'google', name: 'Google Maps', shortName: 'Google' },
  { id: 'yandex', name: 'Yandex Maps', shortName: 'Yandex' },
];

const fieldClassName =
  'h-12 rounded-2xl border-violet-200/70 bg-white/70 px-4 shadow-none transition-all duration-200 placeholder:text-slate-400 hover:border-violet-300 focus-visible:border-violet-500 focus-visible:ring-4 focus-visible:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-violet-400/40';

function ProviderMark({ provider }: { provider: MapProvider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.1 5.1 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84A6.54 6.54 0 0 1 12 5.38Z" />
      </svg>
    );
  }

  if (provider === 'yandex') {
    return <span className="text-sm font-black text-red-500" aria-hidden="true">Я</span>;
  }

  return <MapIcon className="h-4 w-4" aria-hidden="true" />;
}

export default function Contact() {
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const reduceMotion = useReducedMotion();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('openstreetmap');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    reason: 'genel',
    message: '',
  });

  const dynamicSocials = useMemo(() => [
    { name: 'Instagram', url: settings.socialInstagram, icon: Instagram },
    { name: 'Twitter / X', url: settings.socialTwitter, icon: Twitter },
    { name: 'YouTube', url: settings.socialYoutube, icon: Youtube },
    { name: 'Facebook', url: settings.socialFacebook, icon: Facebook },
    { name: 'LinkedIn', url: settings.socialLinkedin, icon: Linkedin },
    { name: 'TikTok', url: settings.socialTiktok, icon: Music2 },
  ].filter((social) => social.url?.trim()), [settings]);

  const lat = parseFloat(settings.mapLatitude) || 41.0082;
  const lng = parseFloat(settings.mapLongitude) || 28.9784;
  const phoneHref = settings.contactPhone
    ? `tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`
    : undefined;
  const emailHref = `mailto:${settings.contactEmail}`;

  const mapLinks: Record<MapProvider, { view: string; directions: string }> = {
    openstreetmap: {
      view: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`,
      directions: `https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}`,
    },
    google: {
      view: `https://www.google.com/maps?q=${lat},${lng}&z=12`,
      directions: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    },
    yandex: {
      view: `https://yandex.com.tr/maps/?ll=${lng},${lat}&z=12&pt=${lng},${lat},pm2rdl`,
      directions: `https://yandex.com.tr/maps/?rtext=~${lat},${lng}&rtt=auto`,
    },
  };

  const mapEmbedLinks: Record<MapProvider, string> = {
    openstreetmap: `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.035}%2C${lat - 0.022}%2C${lng + 0.035}%2C${lat + 0.022}&layer=mapnik&marker=${lat}%2C${lng}`,
    google: `https://www.google.com/maps?q=${lat},${lng}&z=14&output=embed`,
    yandex: `https://yandex.com.tr/map-widget/v1/?ll=${lng}%2C${lat}&z=14&pt=${lng}%2C${lat}%2Cpm2rdl`,
  };

  const currentProvider = mapProviders.find((provider) => provider.id === mapProvider)!;
  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: reduceMotion ? 0 : 0.5, ease: 'easeOut' as const },
  };

  const handleCopyCoords = async () => {
    const copied = await copyToClipboard(`${lat}, ${lng}`);
    if (copied) {
      toast({ title: 'Koordinatlar kopyalandı', description: `${lat}, ${lng}` });
      haptic('light');
      return;
    }
    toast({ title: 'Kopyalanamadı', description: 'Lütfen tekrar deneyin.', variant: 'destructive' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = contactMessageSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: 'Formu kontrol edin',
        description: getFirstValidationMessage(validation.error),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: validation.data.name,
        email: validation.data.email,
        subject: `[${validation.data.reason}] ${validation.data.subject}`,
        message: validation.data.message,
      });
      if (error) throw error;
      toast({ title: 'Mesajınız ulaştı', description: 'En kısa sürede size dönüş yapacağız.' });
      setFormData({ name: '', email: '', subject: '', reason: 'genel', message: '' });
    } catch {
      toast({ title: 'Mesaj gönderilemedi', description: 'Lütfen daha sonra tekrar deneyin.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Seo
        title="İletişim"
        description="Rüya Tabirleri ile iletişime geçin. Sorularınız, önerileriniz ve geri bildirimleriniz için bize ulaşın."
        path="/iletisim"
      />

      <main className="relative isolate overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_18%_12%,rgba(139,92,246,0.17),transparent_31%),radial-gradient(circle_at_82%_18%,rgba(217,70,239,0.14),transparent_28%),radial-gradient(circle_at_52%_45%,rgba(236,72,153,0.09),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[linear-gradient(to_right,rgba(139,92,246,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <section className="container pb-14 pt-14 sm:pt-20 lg:pb-20 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> İletişim merkezi
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              Aklınızdakileri birlikte{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                anlamlandıralım.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
              Bir sorunuz, fikriniz ya da paylaşmak istediğiniz bir deneyim mi var? Mesajınızı bırakın; özenle okuyup en kısa sürede yanıtlayalım.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-6 text-white shadow-lg shadow-fuchsia-500/20 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-fuchsia-500/25">
                <a href="#contact-form"><Send className="mr-2 h-4 w-4" /> Mesaj gönder</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-violet-200/80 bg-white/70 px-6 backdrop-blur-xl transition-all duration-200 hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-violet-500/10">
                <a href={phoneHref ?? emailHref}>
                  {phoneHref ? <Phone className="mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
                  Hızlı ulaşın <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="container pb-20">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
            <motion.aside {...reveal} className="space-y-6">
              <div className="rounded-[2rem] border border-violet-200/70 bg-white/75 p-6 shadow-[0_24px_70px_-38px_rgba(126,34,206,0.35)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-white/[0.045]">
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-300">Doğrudan iletişim</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Size uygun kanalı seçin</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Sorunuz ne olursa olsun doğru kişiye ulaşmasını sağlayacağız.</p>

                <div className="mt-7 divide-y divide-violet-100 dark:divide-white/10">
                  <a href={emailHref} className="group flex items-center gap-4 py-5 first:pt-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 transition-colors duration-200 group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-500/15 dark:text-violet-300">
                      <Mail className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-posta</span>
                      <span className="mt-1 block truncate text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-300">{settings.contactEmail}</span>
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-violet-600" />
                  </a>

                  {settings.contactPhone && (
                    <a href={phoneHref} className="group flex items-center gap-4 py-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700 transition-colors duration-200 group-hover:bg-fuchsia-600 group-hover:text-white dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
                        <Phone className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefon</span>
                        <span className="mt-1 block text-sm font-semibold group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-300">{settings.contactPhone}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-fuchsia-600" />
                    </a>
                  )}

                  {settings.contactAddress && (
                    <div className="flex items-center gap-4 py-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Konum</span>
                        <span className="mt-1 block whitespace-pre-line text-sm font-semibold">{settings.contactAddress}</span>
                      </span>
                    </div>
                  )}

                  {settings.contactWorkingHours && (
                    <div className="flex items-center gap-4 pt-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                        <Clock3 className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Çalışma saatleri</span>
                        <span className="mt-1 block whitespace-pre-line text-sm font-semibold">{settings.contactWorkingHours}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-violet-200/70 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 p-6 sm:p-7 dark:border-white/10 dark:from-violet-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">Bizi takip edin</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Yeni tabirler ve ilham veren içerikler.</p>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-white/10 dark:text-violet-200">{dynamicSocials.length} kanal</span>
                </div>
                {dynamicSocials.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {dynamicSocials.map((social) => {
                      const Icon = social.icon;
                      return (
                        <a
                          key={social.name}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${social.name} hesabımızı aç`}
                          title={social.name}
                          className="flex h-12 w-12 items-center justify-center rounded-full border border-violet-200/80 bg-white/80 text-violet-700 shadow-sm transition-all duration-200 hover:border-fuchsia-300 hover:bg-gradient-to-br hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 hover:text-white hover:shadow-lg hover:shadow-fuchsia-500/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-violet-200"
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">Sosyal medya hesaplarımız yakında burada.</p>
                )}
              </div>
            </motion.aside>

            <motion.div
              {...reveal}
              transition={{ ...reveal.transition, delay: reduceMotion ? 0 : 0.08 }}
              id="contact-form"
              className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-violet-200/70 bg-white/80 shadow-[0_32px_90px_-42px_rgba(126,34,206,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]"
            >
              <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/90 via-fuchsia-50/70 to-pink-50/90 px-6 py-7 sm:px-8 dark:border-white/10 dark:from-violet-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/30">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/20">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bize bir mesaj bırakın</h2>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Formu doldurmanız yalnızca birkaç dakika sürer.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <fieldset className="mb-7">
                  <legend className="mb-3 text-sm font-semibold">Size nasıl yardımcı olabiliriz?</legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="İletişim nedeni">
                    {contactReasons.map((reason) => {
                      const Icon = reason.icon;
                      const active = formData.reason === reason.value;
                      return (
                        <button
                          key={reason.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setFormData({ ...formData, reason: reason.value })}
                          className={cn(
                            'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20',
                            active
                              ? 'border-violet-600 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/15'
                              : 'border-violet-200/80 bg-white/70 text-muted-foreground hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-violet-500/10 dark:hover:text-violet-200',
                          )}
                        >
                          <Icon className="h-4 w-4" /> {reason.label}
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Adınız <span className="text-fuchsia-600">*</span></Label>
                    <Input id="name" autoComplete="name" placeholder="Adınız ve soyadınız" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required className={fieldClassName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">E-posta <span className="text-fuchsia-600">*</span></Label>
                    <Input id="email" type="email" autoComplete="email" placeholder="ornek@email.com" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required className={fieldClassName} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="subject" className="text-sm font-semibold">Konu <span className="text-fuchsia-600">*</span></Label>
                    <Input id="subject" placeholder="Kısaca mesajınızın konusu" value={formData.subject} onChange={(event) => setFormData({ ...formData, subject: event.target.value })} required className={fieldClassName} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="message" className="text-sm font-semibold">Mesajınız <span className="text-fuchsia-600">*</span></Label>
                      <span className="text-xs tabular-nums text-muted-foreground">{formData.message.length}/1000</span>
                    </div>
                    <Textarea id="message" placeholder="Düşüncelerinizi bizimle paylaşın..." rows={7} maxLength={1000} value={formData.message} onChange={(event) => setFormData({ ...formData, message: event.target.value })} required className={cn(fieldClassName, 'h-auto min-h-40 resize-none py-3.5')} />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-violet-100 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                  <p className="flex max-w-sm items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                    Bilgileriniz yalnızca size dönüş yapmak amacıyla güvenle saklanır.
                  </p>
                  <Button type="submit" disabled={isSubmitting} className="h-12 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-7 text-white shadow-lg shadow-fuchsia-500/20 transition-all duration-200 hover:brightness-110 hover:shadow-xl disabled:opacity-60">
                    {isSubmitting ? 'Gönderiliyor…' : <><Send className="mr-2 h-4 w-4" /> Mesajı gönder</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>

        <motion.section {...reveal} className="container pb-20 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-300">Konum bilgisi</p>
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Bizi haritada bulun</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Tercih ettiğiniz harita sağlayıcısını seçin ve konumu tek dokunuşla açın.</p>
              </div>

              <div className="inline-flex w-full items-center gap-1 rounded-full border border-violet-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur-xl sm:w-auto dark:border-white/10 dark:bg-white/[0.05]" aria-label="Harita sağlayıcısı">
                {mapProviders.map((provider) => {
                  const active = provider.id === mapProvider;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setMapProvider(provider.id)}
                      className={cn(
                        'relative flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20 sm:flex-none sm:px-4',
                        active ? 'text-white' : 'text-muted-foreground hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:text-violet-200',
                      )}
                    >
                      {active && <motion.span layoutId="active-map-provider" className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 shadow-md shadow-fuchsia-500/20" transition={{ duration: reduceMotion ? 0 : 0.25 }} />}
                      <span className="relative flex items-center gap-1.5"><ProviderMark provider={provider.id} /><span>{provider.shortName}</span></span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.25rem] border border-violet-200/70 bg-violet-950 shadow-[0_38px_100px_-42px_rgba(168,85,247,0.55)] dark:border-white/10">
              <motion.iframe
                key={mapProvider}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.35 }}
                src={mapEmbedLinks[mapProvider]}
                title={`${currentProvider.name} üzerinde ${settings.contactAddress} konumu`}
                className="h-[440px] w-full border-0 sm:h-[520px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-violet-950/90 via-violet-950/45 to-transparent" />

              <div className="absolute inset-x-3 bottom-3 z-10 rounded-[1.6rem] border border-white/20 bg-violet-950/85 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-950/30">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold tracking-tight">{settings.contactAddress}</h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-violet-100">
                          <ProviderMark provider={mapProvider} /> {currentProvider.shortName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCoords}
                        className="mt-1.5 inline-flex items-center gap-1.5 rounded-md text-left font-mono text-xs text-violet-100/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        <Copy className="h-3.5 w-3.5" /> {lat}, {lng}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="h-11 rounded-full bg-white px-5 text-violet-950 shadow-lg transition-colors hover:bg-violet-50">
                      <a href={mapLinks[mapProvider].view} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Büyük haritada aç</a>
                    </Button>
                    <Button asChild variant="outline" className="h-11 rounded-full border-white/20 bg-white/10 px-5 text-white hover:bg-white/20 hover:text-white">
                      <a href={mapLinks[mapProvider].directions} target="_blank" rel="noopener noreferrer"><Compass className="mr-2 h-4 w-4" /> Yol tarifi</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </Layout>
  );
}