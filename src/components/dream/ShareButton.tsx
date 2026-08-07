import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nativeShare } from '@/lib/share';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

export function ShareButton({ title, description, url }: { title: string; description: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const result = await nativeShare({ title, text: description, url });
    if (result === 'copied' || result === 'shared') {
      setCopied(true);
      toast.success('Link kopyalandı');
      haptic('light');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      title="Linki kopyala"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
      <span className="hidden sm:inline ml-2">{copied ? 'Kopyalandı' : 'Paylaş'}</span>
    </Button>
  );
}
