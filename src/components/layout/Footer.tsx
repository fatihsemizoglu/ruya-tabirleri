import { Link } from 'react-router-dom';
import { Moon, Mail, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Rüya Tabirleri
              </span>
            </Link>
            <p className="text-slate-400 mb-6 leading-relaxed">
              En kapsamlı rüya tabirleri sitesi. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Mail className="h-4 w-4" />
              <a href="mailto:info@ruyatabirleri.com" className="hover:text-white transition-colors">
                info@ruyatabirleri.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-5">Hızlı Linkler</h4>
            <ul className="space-y-3">
              {[
                { to: '/ruya-tabirleri', label: 'Rüya Tabirleri' },
                { to: '/kategoriler', label: 'Kategoriler' },
                { to: '/populer', label: 'Popüler Rüyalar' },
                { to: '/az', label: 'A-Z Rüya Listesi' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-lg mb-5">Popüler Kategoriler</h4>
            <ul className="space-y-3">
              {[
                { to: '/kategori/hayvanlar', label: 'Hayvanlar' },
                { to: '/kategori/doga', label: 'Doğa & Hava' },
                { to: '/kategori/insanlar', label: 'İnsanlar & İlişkiler' },
                { to: '/kategori/nesneler', label: 'Nesneler' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-lg mb-5">Kurumsal</h4>
            <ul className="space-y-3">
              {[
                { to: '/hakkimizda', label: 'Hakkımızda' },
                { to: '/iletisim', label: 'İletişim' },
                { to: '/gizlilik', label: 'Gizlilik Politikası' },
                { to: '/kullanim-kosullari', label: 'Kullanım Koşulları' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 h-px bg-indigo-500 group-hover:w-3 transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 text-center md:text-left">
            © {currentYear} Rüya Tabirleri. Tüm hakları saklıdır.
          </p>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
            Türkiye'de yapıldı
          </p>
        </div>
      </div>
    </footer>
  );
}
