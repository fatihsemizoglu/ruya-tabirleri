import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  QrCode,
  Printer,
  Mail,
  Link as LinkIcon,
  Check,
  Send,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { nativeShare } from '@/lib/share';
import { haptic } from '@/lib/haptics';

interface ShareCardProps {
  title: string;
  description?: string;
  onFeedback?: () => void;
  className?: string;
  children?: React.ReactNode;
}

interface SocialItem {
  key: 'whatsapp' | 'telegram' | 'x' | 'facebook' | 'linkedin';
  icon: LucideIcon;
  color: string;
  hoverShadow: string;
  getUrl: (title: string, url: string, description: string) => string;
}

interface QuickActionItem {
  key: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

export function ShareCard({ title, description, onFeedback, className = '', children }: ShareCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const handleNativeShare = async () => {
    const result = await nativeShare({ title, text: description || title, url });
    if (result === 'shared') {
      toast({ title: 'Paylaşıldı', description: 'İçerik başarıyla paylaşıldı.' });
      haptic('success');
    } else if (result === 'copied') {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const result = await nativeShare({ title, text: description || title, url });
    if (result === 'copied') {
      setCopied(true);
      toast({ title: 'Link Kopyalandı', description: 'Link panoya kopyalandı.' });
      haptic('light');
      setTimeout(() => setCopied(false), 3000);
    } else if (result === 'unsupported') {
      toast({ title: 'Hata', description: 'Link kopyalanırken hata oluştu.', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${title}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const socials: SocialItem[] = [
    {
      key: 'whatsapp',
      icon: MessageCircle,
      color: 'from-green-400 to-green-500',
      hoverShadow: 'hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)]',
      getUrl: (t, u) => `https://wa.me/?text=${encodeURIComponent(`${t} - ${u}`)}`,
    },
    {
      key: 'telegram',
      icon: Send,
      color: 'from-blue-400 to-blue-500',
      hoverShadow: 'hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]',
      getUrl: (t, u, d) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(d || t)}`,
    },
    {
      key: 'x',
      icon: Twitter,
      color: 'from-gray-800 to-black',
      hoverShadow: 'hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)]',
      getUrl: (t, u) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
    },
    {
      key: 'facebook',
      icon: Facebook,
      color: 'from-blue-500 to-blue-600',
      hoverShadow: 'hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]',
      getUrl: (_t, u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    },
    {
      key: 'linkedin',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-700',
      hoverShadow: 'hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)]',
      getUrl: (_t, u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
    },
  ];

  const quickActions: QuickActionItem[] = [
    {
      key: 'share',
      icon: Share2,
      color: 'from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)]',
      onClick: handleNativeShare,
    },
    {
      key: copied ? 'copied' : 'copy',
      icon: copied ? Check : LinkIcon,
      color: copied
        ? 'from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)]'
        : 'from-violet-400 to-violet-500 hover:from-violet-500 hover:to-violet-600 hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)]',
      onClick: handleCopy,
    },
    {
      key: 'qrCode',
      icon: QrCode,
      color: 'from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)]',
      onClick: () => setShowQr((v) => !v),
    },
    {
      key: 'print',
      icon: Printer,
      color: 'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]',
      onClick: handlePrint,
    },
    {
      key: 'email',
      icon: Mail,
      color: 'from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)]',
      onClick: handleEmail,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Card
        className={`bg-card/95 dark:bg-card/80 backdrop-blur-xl shadow-2xl border border-border/60 overflow-hidden relative ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5 dark:from-violet-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
        <div className="absolute inset-0 opacity-30 dark:opacity-40 pointer-events-none">
          <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-violet-500/30 to-pink-500/30 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-gradient-to-br from-purple-500/30 to-violet-500/30 rounded-full blur-3xl" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-50" />

        <CardHeader className="relative pt-6 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="p-3 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30 relative overflow-hidden shrink-0"
              >
                <div className="absolute inset-0 bg-white/20 rounded-2xl" />
                <Share2 className="h-6 w-6 text-white relative z-10" />
              </motion.div>
              <div className="flex flex-col">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Paylaş
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                  Bu içeriği sosyal medyada paylaş
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-violet-500/15 to-pink-500/15 text-violet-700 dark:text-violet-300 border-0 shadow-sm">
              <Sparkles className="h-3 w-3 mr-1 text-amber-400 fill-amber-400" />
              Ücretsiz
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-5 px-6 pb-6">
          {children ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              {children}
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-lg">
                    <Share2 className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Sosyal Medya</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-violet-200 via-violet-300/50 to-transparent dark:from-violet-700/60 dark:via-violet-600/40 dark:to-transparent ml-2" />
                </div>
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {socials.map((social, idx) => {
                      const platformNames: Record<string, string> = {
                        whatsapp: 'WhatsApp',
                        telegram: 'Telegram',
                        x: 'X',
                        facebook: 'Facebook',
                        linkedin: 'LinkedIn',
                      };
                      const platformName = platformNames[social.key] || social.key;
                      return (
                        <Tooltip key={social.key}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              whileInView={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                              viewport={{ once: true }}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-shrink-0"
                            >
                              <Button
                                size="sm"
                                onClick={() => window.open(social.getUrl(title, url, description || title), '_blank', 'width=600,height=400')}
                                className={`bg-gradient-to-br ${social.color} ${social.hoverShadow} text-white h-10 flex items-center gap-2 px-3 rounded-lg shadow-lg border border-white/20 transition-all duration-300 relative overflow-hidden group`}
                              >
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                                <social.icon className="h-5 w-5 relative z-10 shrink-0" />
                                <span className="relative z-10 font-medium text-xs whitespace-nowrap hidden sm:inline">
                                  {platformName}
                                </span>
                              </Button>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{platformName} ile Paylaş</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </motion.div>

              <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent dark:via-violet-700/50" />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Hızlı İşlemler</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-pink-200 via-pink-300/50 to-transparent dark:from-pink-700/60 dark:via-pink-600/40 dark:to-transparent ml-2" />
                </div>
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {quickActions.map((action) => {
                      const actionLabels: Record<string, string> = {
                        share: 'Paylaş',
                        copy: 'Kopyala',
                        copied: 'Kopyalandı',
                        qrCode: 'QR Kod',
                        print: 'Yazdır',
                        email: 'E-posta',
                      };
                      const actionLabel = actionLabels[action.key] || action.key;
                      const tooltipLabels: Record<string, string> = {
                        share: 'Cihazınızla paylaş',
                        copy: 'Bağlantıyı kopyala',
                        copied: 'Bağlantı kopyalandı',
                        qrCode: 'QR kodu göster/gizle',
                        print: 'Bu sayfayı yazdır',
                        email: 'E-posta ile gönder',
                      };
                      const tooltipText = tooltipLabels[action.key] || '';
                      return (
                        <Tooltip key={action.key}>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                size="sm"
                                onClick={action.onClick}
                                className={`bg-gradient-to-br ${action.color} text-white h-10 flex items-center gap-2 px-3 rounded-lg shadow-lg border border-white/20 transition-all duration-300 relative overflow-hidden group`}
                              >
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                                <action.icon className="h-5 w-5 relative z-10 shrink-0" />
                                <span className="relative z-10 font-medium text-xs whitespace-nowrap">
                                  {actionLabel}
                                </span>
                              </Button>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{tooltipText}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {onFeedback && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              onClick={onFeedback}
                              className="bg-gradient-to-br from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] text-white flex items-center gap-2 px-3 rounded-lg shadow-lg border border-white/20 transition-all duration-300 relative overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                              <MessageCircle className="h-5 w-5 relative z-10 shrink-0" />
                              <span className="relative z-10 font-medium text-xs whitespace-nowrap">Bildir</span>
                            </Button>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Uygunsuz içeriği bildir</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              </motion.div>

              <AnimatePresence>
                {showQr && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="py-6 px-4 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-pink-950/40 rounded-2xl border border-violet-200/50 dark:border-violet-700/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/30 to-pink-200/30 dark:from-violet-700/20 dark:to-pink-700/20 rounded-full blur-2xl" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-violet-200/30 dark:from-purple-700/20 dark:to-violet-700/20 rounded-full blur-2xl" />
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/30 via-purple-400/30 to-pink-400/30 rounded-2xl blur-xl" />
                          <div className="relative bg-white p-4 rounded-2xl shadow-xl border border-violet-100 dark:border-violet-700/60 dark:shadow-violet-900/30">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
                              alt="QR Code"
                              className="w-48 h-48 rounded-lg"
                              loading="lazy"
                            />
                          </div>
                        </motion.div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-center gap-2">
                            <QrCode className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                            QR Kodu Tarayın
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Mobil cihazınızda bu QR kodunu tarayın</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
