import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Copy, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useContactSettings } from '@/hooks/useContactSettings';
import { useReveal } from '@/hooks/useReveal';
import { haptic } from '@/lib/haptics';
import { copyToClipboard } from '@/lib/share';

export function ContactMap() {
  const { settings, lat, lng, mapUrls } = useContactSettings();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const reveal = useReveal();

  const handleCopyCoords = async () => {
    const copied = await copyToClipboard(`${lat}, ${lng}`);
    if (copied) {
      toast({ title: 'Koordinatlar kopyalandı', description: `${lat}, ${lng}` });
      haptic('light');
      return;
    }
    toast({ title: 'Kopyalanamadı', description: 'Lütfen tekrar deneyin.', variant: 'destructive' });
  };

  return (
    <motion.section {...reveal} className="container pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-300">Konum bilgisi</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Bizi haritada bulun</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Konumumuzu Google Maps üzerinde inceleyin veya tek dokunuşla yol tarifi alın.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-4 py-2 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-violet-200">
            <MapPin className="h-3.5 w-3.5" /> Google Maps
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[2.25rem] border border-violet-200/70 bg-violet-950 shadow-[0_38px_100px_-42px_rgba(168,85,247,0.55)] dark:border-white/10">
          <motion.iframe
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
            src={mapUrls.embed}
            title={`Google Maps üzerinde ${settings.contactAddress} konumu`}
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
                      <MapPin className="h-3 w-3" /> Google Maps
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
                  <a href={mapUrls.view} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Büyük haritada aç</a>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full border-white/20 bg-white/10 px-5 text-white hover:bg-white/20 hover:text-white">
                  <a href={mapUrls.directions} target="_blank" rel="noopener noreferrer"><Compass className="mr-2 h-4 w-4" /> Yol tarifi</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
