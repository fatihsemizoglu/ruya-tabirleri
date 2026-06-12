import { Link } from 'react-router-dom';
import { Moon, Mail, Heart, MapPin, Phone, Instagram, Twitter, Youtube, Linkedin, Facebook, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const exploreLinks = [
  { to: '/ruya-tabirleri', label: 'Rüya Tabirleri' },
  { to: '/kategoriler', label: 'Kategoriler' },
  { to: '/populer', label: 'Popüler Rüyalar' },
  { to: '/az', label: 'A-Z Rüya Listesi' },
  { to: '/blog', label: 'Rüya Günlüğü' },
];

const categoryLinks = [
  { to: '/kategori/hayvanlar', label: 'Hayvanlar' },
  { to: '/kategori/doga', label: 'Doğa & Hava' },
  { to: '/kategori/insanlar', label: 'İnsanlar & İlişkiler' },
  { to: '/kategori/nesneler', label: 'Nesneler' },
  { to: '/kategori/yiyecekler', label: 'Yiyecek & İçecek' },
];

const legalLinks = [
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
  { to: '/gizlilik', label: 'Gizlilik Politikası' },
  { to: '/kullanim-kosullari', label: 'Kullanım Koşulları' },
];

const socialIconMap = [
  { key: 'socialInstagram', icon: Instagram, label: 'Instagram' },
  { key: 'socialTwitter',   icon: Twitter,   label: 'Twitter' },
  { key: 'socialYoutube',   icon: Youtube,   label: 'YouTube' },
  { key: 'socialFacebook',  icon: Facebook,  label: 'Facebook' },
  { key: 'socialLinkedin',  icon: Linkedin,  label: 'LinkedIn' },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();

  // Dinamik sosyal medya listesi (sadece URL girilmiş olanlar)
  const dynamicSocials = socialIconMap
    .map((s) => ({ ...s, href: (settings as unknown as Record<string, string>)[s.key] || '' }))
    .filter((s) => s.href.trim() !== '');

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300 cv-auto">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 w-[520px] h-[520px] rounded-full bg-blue-600/15 blur-[140px]" />
        <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

        <div className="container py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10">
            {/* Brand block */}
            <div className="lg:col-span-5">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Moon className="h-4.5 w-4.5 text-white" />
                  <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Rüya Tabirleri
                </span>
              </Link>

              <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
                Rüyalarınızın{' '}
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  gizli anlamlarını
                </span>{' '}
                keşfedin.
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm max-w-md mb-7">
                İslami ve psikolojik kaynaklardan derlenen binlerce rüya tabiri ile
                bilinçaltınızın sesine kulak verin. Her gece, yeni bir keşif.
              </p>

              {/* Contact pills (dinamik) */}
              <div className="flex flex-wrap gap-2.5">
                {settings.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 hover:border-violet-400/40 hover:bg-white/10 transition-colors text-sm"
                  >
                    <Mail className="h-3.5 w-3.5 text-violet-300" />
                    {settings.contactEmail}
                  </a>
                )}
                {settings.contactPhone && (
                  <a
                    href={`tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 hover:border-emerald-400/40 hover:bg-white/10 transition-colors text-sm"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-300" />
                    {settings.contactPhone}
                  </a>
                )}
                {settings.contactAddress && (
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-blue-300" />
                    {settings.contactAddress}
                  </span>
                )}
              </div>
            </div>

            {/* Link columns */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div>
                <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-5 flex items-center gap-2">
                  <span className="h-px w-5 bg-gradient-to-r from-violet-400 to-transparent" />
                  Keşfet
                </h4>
                <ul className="space-y-3">
                  {exploreLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-violet-400/40 group-hover:bg-violet-400 group-hover:w-3 transition-all duration-200" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-5 flex items-center gap-2">
                  <span className="h-px w-5 bg-gradient-to-r from-fuchsia-400 to-transparent" />
                  Kategoriler
                </h4>
                <ul className="space-y-3">
                  {categoryLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-fuchsia-400/40 group-hover:bg-fuchsia-400 group-hover:w-3 transition-all duration-200" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-5 flex items-center gap-2">
                  <span className="h-px w-5 bg-gradient-to-r from-pink-400 to-transparent" />
                  Yasal
                </h4>
                <ul className="space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-pink-400/40 group-hover:bg-pink-400 group-hover:w-3 transition-all duration-200" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Socials + bottom */}
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            {dynamicSocials.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Takip Et</span>
                <div className="flex items-center gap-2">
                  {dynamicSocials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="group w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-violet-400/50 hover:bg-gradient-to-br hover:from-violet-500/20 hover:to-fuchsia-500/20 flex items-center justify-center transition-all"
                    >
                      <s.icon className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <p className="text-xs text-slate-500">
                © {currentYear} Rüya Tabirleri · Tüm hakları saklıdır.
              </p>
              <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                <Heart className="h-3 w-3 text-rose-400/80 fill-rose-400/80" />
                Türkiye'de sevgiyle yapıldı
              </p>
            </div>
          </div>

          {/* Premium badge bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-10 flex items-center justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-white/10 text-xs text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              5.000+ rüya tabiri · 1M+ aylık okuyucu · 4.9★ kullanıcı puanı
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
