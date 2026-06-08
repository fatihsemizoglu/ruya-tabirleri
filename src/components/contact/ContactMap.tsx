import { motion } from 'framer-motion';
import { MapPin, Navigation, ExternalLink, Apple } from 'lucide-react';

const address = 'İstanbul, Türkiye';
const encoded = encodeURIComponent(address);
const osmEmbed = 'https://www.openstreetmap.org/export/embed.html?bbox=28.80%2C40.90%2C29.20%2C41.10&layer=mapnik&marker=41.0082%2C28.9784';

export function ContactMap() {
  return (
    <section id="map" className="relative pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Konumumuz</h3>
                  <p className="text-white/80 text-sm">{address}</p>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] bg-slate-100">
              <iframe
                src={osmEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Konum Haritası"
                className="grayscale hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encoded}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium text-slate-900 hover:gap-3"
                >
                  <Navigation className="h-4 w-4 text-violet-600" />
                  Yol Tarifi Al
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encoded}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium text-slate-900 hover:gap-3"
                >
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Haritada Göster
                </a>
                <a
                  href={`https://maps.apple.com/?q=${encoded}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium text-slate-900 hover:gap-3"
                >
                  <Apple className="h-4 w-4 text-slate-900" />
                  Apple Maps
                </a>
                <a
                  href={osmEmbed.replace('/export/embed.html', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium text-slate-900 hover:gap-3"
                >
                  <ExternalLink className="h-4 w-4 text-emerald-600" />
                  OpenStreetMap
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
