import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  MessageCircle,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useReveal } from '@/hooks/useReveal';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { contactMessageSchema, getFirstValidationMessage } from '@/lib/validation/forms';

const contactReasons = [
  { value: 'genel', label: 'Genel bilgi', icon: MessageCircle },
  { value: 'oneri', label: 'Öneri & istek', icon: Sparkles },
  { value: 'hata', label: 'Hata bildirimi', icon: ShieldCheck },
  { value: 'isbirligi', label: 'İş birliği', icon: MessageSquare },
];

const fieldClassName =
  'h-12 rounded-2xl border-violet-200/70 bg-white/70 px-4 shadow-none transition-all duration-200 placeholder:text-slate-400 hover:border-violet-300 focus-visible:border-violet-500 focus-visible:ring-4 focus-visible:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-violet-400/40';

const initialForm = {
  name: '',
  email: '',
  subject: '',
  reason: 'genel',
  message: '',
};

export function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const reveal = useReveal(0.08);

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
      setFormData(initialForm);
    } catch {
      toast({ title: 'Mesaj gönderilemedi', description: 'Lütfen daha sonra tekrar deneyin.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      {...reveal}
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
            <Label htmlFor="contact-email" className="text-sm font-semibold">E-posta <span className="text-fuchsia-600">*</span></Label>
            <Input id="contact-email" type="email" autoComplete="email" placeholder="ornek@email.com" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required className={fieldClassName} />
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
  );
}
