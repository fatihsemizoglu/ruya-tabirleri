import { motion } from 'framer-motion';
import { Clock, Phone, Mail, MapPin } from 'lucide-react';

const contactItems = [
  {
    icon: Clock,
    title: 'Yanıt Süresi',
    description: 'Mesajlarınıza genellikle bu sürede dönüş yapıyoruz',
    value: 'Pazartesi - Cuma: 09:00 - 18:00\nCumartesi: 10:00 - 14:00',
    href: '#',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-100',
    hoverColor: 'hover:border-amber-300',
    isWorkingHours: true,
  },
  {
    icon: Phone,
    title: 'Telefon',
    description: 'Hızlı destek için arayın',
    value: '+90 545 123 45 67',
    href: 'tel:+905451234567',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-100',
    hoverColor: 'hover:border-emerald-300',
  },
  {
    icon: Mail,
    title: 'E-posta',
    description: 'Detaylı sorularınız için',
    value: 'info@ruyatabirleri.com',
    href: 'mailto:info@ruyatabirleri.com',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100',
    hoverColor: 'hover:border-blue-300',
  },
  {
    icon: MapPin,
    title: 'Konum',
    description: 'Ziyaret edin',
    value: 'İstanbul, Türkiye',
    href: '#map',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-100',
    hoverColor: 'hover:border-purple-300',
  },
];

export function ContactInfo() {
  const featured = contactItems[0];
  const rest = contactItems.slice(1);
  if (!featured) return null;
  const FeaturedIcon = featured.icon;

  return (
    <section className="relative py-10">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-6 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border-2 border-amber-200/50 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className={`w-16 h-16 ${featured.bgColor} rounded-2xl flex items-center justify-center shrink-0`}>
                <div className={`bg-gradient-to-br ${featured.color} p-4 rounded-xl shadow-lg`}>
                  <FeaturedIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{featured.title}</h3>
                <p className="text-slate-500 text-base mb-4">{featured.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featured.value.split('\n').map((line, idx) => {
                    const [day, hours] = line.split(': ');
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-500">{day}</p>
                          <p className="text-slate-800 font-semibold">{hours}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {rest.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.title}
                href={item.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-transparent ${item.hoverColor} shadow-lg hover:shadow-xl transition-all cursor-pointer block`}
              >
                <div className={`w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                  <div className={`bg-gradient-to-br ${item.color} p-3 rounded-xl shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm mb-3">{item.description}</p>
                <p className="text-slate-700 font-medium break-words">{item.value}</p>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
