import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Music2,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';
import { useContactSettings } from '@/hooks/useContactSettings';
import { useReveal } from '@/hooks/useReveal';
import { normalizeSocialUrl } from '@/lib/social';

const socialIcons = {
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  TikTok: Music2,
} as const;

export function ContactInfo() {
  const { settings, phoneHref, emailHref } = useContactSettings();
  const motionProps = useReveal();

  const dynamicSocials = useMemo(() => [
    { name: 'Instagram', url: normalizeSocialUrl(settings.socialInstagram), icon: socialIcons.Instagram },
    { name: 'Twitter / X', url: normalizeSocialUrl(settings.socialTwitter), icon: socialIcons.Twitter },
    { name: 'YouTube', url: normalizeSocialUrl(settings.socialYoutube), icon: socialIcons.Youtube },
    { name: 'Facebook', url: normalizeSocialUrl(settings.socialFacebook), icon: socialIcons.Facebook },
    { name: 'LinkedIn', url: normalizeSocialUrl(settings.socialLinkedin), icon: socialIcons.Linkedin },
    { name: 'TikTok', url: normalizeSocialUrl(settings.socialTiktok), icon: socialIcons.TikTok },
  ].filter((social) => social.url?.trim()), [settings]);

  return (
    <motion.aside {...motionProps} className="space-y-6">
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
  );
}
