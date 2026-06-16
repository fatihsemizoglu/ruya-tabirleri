import { motion } from 'framer-motion';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Rüyamı nasıl yorumlayabilirsiniz?',
    answer: 'Sitemizdeki rüya tabirleri sözlüğünden rüyanızda gördüğünüz sembolleri aratabilir veya iletişim formundan detaylı rüyanızı paylaşabilirsiniz. Uzman tabircilerimiz en kısa sürede yorumunuzu hazırlar.',
  },
  {
    question: 'Rüya tabirleri güvenilir mi?',
    answer: 'Evet, tüm tabirlerimiz İslami ve kültürel kaynaklardan derlenmiş, alanında uzman tabirciler tarafından hazırlanmıştır. Ancak kesin yorum için bir din âlimine danışmanızı tavsiye ederiz.',
  },
  {
    question: 'Yorumlar ücretsiz mi?',
    answer: 'Sözlükteki temel tabirler tamamen ücretsizdir. Detaylı kişisel yorum talepleri için premium paketlerimizi inceleyebilirsiniz.',
  },
  {
    question: 'Mobil uyumlu mu?',
    answer: 'Evet, sitemiz ve tüm içeriklerimiz tamamen mobil uyumludur. Telefon, tablet veya masaüstünden rahatça erişebilirsiniz. Ayrıca PWA olarak cihazınıza yükleyebilirsiniz.',
  },
  {
    question: 'Rüya tabiri hakkında nasıl destek alabilirim?',
    answer: 'İletişim formundan gönderdiğiniz sorulara genellikle 24-48 saat içinde yanıt veriyoruz. Acil durumlar için telefon ile ulaşabilirsiniz.',
  },
  {
    question: 'Kişisel verilerim korunuyor mu?',
    answer: 'Kesinlikle. Tüm kişisel verileriniz KVKK kapsamında korunur, üçüncü taraflarla paylaşılmaz. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.',
  },
];

export function ContactFAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      viewport={{ once: true }}
    >
      <Card className="bg-white/90 backdrop-blur-xl shadow-2xl border-0 h-full">
        <div className="h-2 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
        <div className="p-6 sm:p-8 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/20">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Sık Sorulan Sorular</h3>
              <p className="text-slate-500 text-sm">Hızlıca cevapları bulun</p>
            </div>
          </div>
        </div>
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, idx) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.05 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${idx}`}
                  className="bg-slate-50 rounded-xl border border-transparent hover:border-purple-200 px-4 transition-all data-[state=open]:bg-white data-[state=open]:border-purple-200 data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </Card>
    </motion.div>
  );
}
