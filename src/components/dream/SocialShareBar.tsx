import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Send, Linkedin, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { nativeShare } from '@/lib/share';
import { haptic } from '@/lib/haptics';

interface SocialShareBarProps {
  title: string;
  url?: string;
  description?: string;
  variant?: 'floating' | 'inline' | 'compact';
  showLabels?: boolean;
}

export function SocialShareBar({ 
  title, 
  url = window.location.href,
  description = '',
  variant = 'inline',
  showLabels = false 
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(variant !== 'floating');

  // Show floating bar after scrolling
  useEffect(() => {
    if (variant !== 'floating') return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  const handleCopyLink = async () => {
    const ok = await nativeShare({ title, text: description || title, url });
    if (ok === 'copied') {
      setCopied(true);
      toast.success('Link kopyalandı');
      haptic('light');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    const result = await nativeShare({ title, text: description || title, url });
    if (result === 'copied') {
      setCopied(true);
      toast.success('Link kopyalandı');
      haptic('light');
      setTimeout(() => setCopied(false), 2000);
    } else if (result === 'unsupported') {
      toast.error('Paylaşım desteklenmiyor');
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: Send,
      color: 'hover:bg-green-500/10 hover:text-green-600',
      url: `https://wa.me/?text=${encodedTitle}%0A${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'hover:bg-blue-500/10 hover:text-blue-500',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:bg-blue-600/10 hover:text-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'hover:bg-sky-500/10 hover:text-sky-500',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:bg-blue-700/10 hover:text-blue-700',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'E-posta',
      icon: Mail,
      color: 'hover:bg-orange-500/10 hover:text-orange-500',
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    },
  ];

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (variant === 'floating') {
    return (
      <div
        className={cn(
          'fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300',
          'hidden lg:flex flex-col gap-2 p-2 rounded-xl bg-background/80 backdrop-blur-sm border shadow-lg',
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          aria-label="Linki kopyala"
          title="Linki Kopyala"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>

        {shareLinks.slice(0, 4).map((link) => (
          <Button
            key={link.name}
            variant="ghost"
            size="icon"
            onClick={() => handleShare(link.url)}
            className={link.color}
            aria-label={`${link.name} ile paylaş`}
            title={link.name}
          >
            <link.icon className="h-4 w-4" />
          </Button>
        ))}

        {'share' in navigator && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNativeShare}
            aria-label="Cihazla paylaş"
            title="Paylaş"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          aria-label="Linki kopyala"
          title="Linki Kopyala"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>

        {shareLinks.slice(0, 3).map((link) => (
          <Button
            key={link.name}
            variant="ghost"
            size="icon"
            onClick={() => handleShare(link.url)}
            className={link.color}
            aria-label={`${link.name} ile paylaş`}
            title={link.name}
          >
            <link.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Bu rüya tabirini paylaş</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex-1 min-w-[100px] sm:flex-none"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              Kopyalandı
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              {showLabels ? 'Linki Kopyala' : 'Kopyala'}
            </>
          )}
        </Button>
        
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="outline"
            size="sm"
            onClick={() => handleShare(link.url)}
            className={cn('flex-1 min-w-[80px] sm:flex-none', link.color)}
          >
            <link.icon className="h-4 w-4" />
            {showLabels && <span className="ml-2 hidden sm:inline">{link.name}</span>}
          </Button>
        ))}

        {'share' in navigator && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            className="flex-1 min-w-[80px] sm:flex-none"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Diğer
          </Button>
        )}
      </div>
    </div>
  );
}
