import { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  trigger?: React.ReactNode;
}

export function ShareModal({ url, title, description, image, trigger }: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nativeSupported, setNativeSupported] = useState(false);

  const handleNativeShare = async () => {
    if (navigator.share) {
      setNativeSupported(true);
      try {
        await navigator.share({ url, title, text: description, images: image ? [image] : undefined });
        setOpen(false);
      } catch {
        setNativeSupported(false);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paylaş</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={handleNativeShare} className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            {nativeSupported ? 'Paylaş' : 'Native Paylaşım Desteklenmiyor'}
          </Button>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 px-3 py-2 rounded-lg border bg-muted text-sm"
            />
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}