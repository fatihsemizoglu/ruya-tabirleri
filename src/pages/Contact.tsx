import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Mail, MessageSquare, Send, MapPin, Phone, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { contactApi } from '@/lib/api';
import { motion } from 'framer-motion';

const contactInfo = [
  {
    icon: Mail,
    title: 'E-posta',
    description: '7/24 bize e-posta gönderebilirsiniz',
    value: 'info@ruyatabirleri.com',
    href: 'mailto:info@ruyatabirleri.com'
  },
  {
    icon: Clock,
    title: 'Çalışma Saatleri',
    description: 'Pazartesi - Cumartesi',
    value: '09:00 - 18:00'
  },
  {
    icon: Phone,
    title: 'Telefon',
    description: 'İsterseniz bizi arayabilirsiniz',
    value: '+90 (212) 123 45 67'
  }
];

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await contactApi.send(
        formData.name,
        formData.email,
        formData.subject,
        formData.message
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }

      toast({
        title: "Mesajınız Gönderildi! ✓",
        description: "En kısa sürede size dönüş yapacağız.",
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Hata Oluştu",
        description: error.message || "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        {/* Hero Header */}
        <div className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-indigo-900/20 dark:to-purple-900/20" />
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl" />
          </div>
          
          <div className="relative container max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              <span>İletişim</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              <span className="text-slate-900 dark:text-white">Sizinle</span>{' '}
              <span className="text-gradient-animated">İletişime</span>{' '}
              <span className="text-slate-900 dark:text-white">Geçmek</span>
              <br />
              <span className="text-slate-900 dark:text-white">İstiyoruz</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
            >
              Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşın. 
              Her mesaja kişisel olarak yanıt veriyoruz.
            </motion.p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-6xl mx-auto px-4 pb-16 -mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Contact Info Cards */}
            <div className="lg:col-span-4 space-y-4">
              {contactInfo.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index + 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-indigo-500">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                          {item.href ? (
                            <a 
                              href={item.href} 
                              className="text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-300">{item.value}</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Map Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="overflow-hidden border-0 shadow-xl">
                  <CardContent className="p-0">
                    <div className="w-full h-64 md:h-80 bg-slate-100 dark:bg-slate-800 relative">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d192871.326!2d28.8025!3d41.0054!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cabc2587e709b3%3A0x22a334c2587e709b3!2zSHTDp2Nva2Fsw7Z5LCDQtNGD0YDQsdCwINGA0LDRgNCw!5e0!3m2!1str!2str!4v1700000000000"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="absolute inset-0 w-full h-full"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex items-center gap-2 text-white">
                          <MapPin className="h-5 w-5" />
                          <div>
                            <p className="font-semibold">İstanbul, Türkiye</p>
                            <p className="text-sm text-white/80">Buradan hizmet veriyoruz</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-8"
            >
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <MessageSquare className="h-6 w-6 text-indigo-500" />
                    Mesaj Gönderin
                  </CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Aşağıdaki formu doldurarak bize mesaj gönderebilirsiniz. En kısa sürede yanıtlayacağız.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Adınız *</Label>
                        <Input
                          id="name"
                          placeholder="Adınızı girin"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta Adresiniz *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="ornek@mail.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Konu *</Label>
                      <Input
                        id="subject"
                        placeholder="Mesajınızın konusu"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mesajınız *</Label>
                      <Textarea
                        id="message"
                        placeholder="Mesajınızı detaylı bir şekilde yazın..."
                        rows={8}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        className="resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-medium dream-gradient hover:opacity-90 transition-opacity"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Gönderiliyor...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Mesaj Gönder
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}