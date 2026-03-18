# Proje: Rüya Tabirleri

Bu proje iki ana parçadan oluşur: frontend (Vite + React) ve backend (Express + TypeScript).

Kullanım Amacı
- Rüya girdilerini yönetmek, kategorilere göre filtrelemek ve kullanıcı etkileşimlerini desteklemek.

Başlangıç için Adımlar
- Gereken araçlar: Node.js (>=18), npm/yarn/pnpm.
- Frontend kurulumu: `npm install` (root) ve ardından `npm run dev` ile geliştirme sunucusunu başlatın.
- Backend kurulumu: `cd server` altında `npm install` ile bağımlılıkları kurun; `npm run dev` ile geliştirme modunda başlatın.
- Veritabanı bağlantısı için `.env` dosyasını uygun değerlerle doldurun (DB host, kullanıcı, şifre, veritabanı adı).

Çalışma Ortamı
- Frontend: root klasörü, Vite ile çalışır.
- Backend: `server/` klasörü altında Express API sunar ve port olarak 3001 kullanır (varsayılan: `http://localhost:3001/api`).

Geliştirme Tavsiyeleri
- Kod kalitesi için ESLint + Prettier kurulu.
- Tip güvenliği için TypeScript strict ayarlarını açın ve paylaşılan tipleri merkezi bir konumda tutmayı düşünün.
- Docker ile lokal geliştirme için basit bir docker-compose yapılandırması ekleyin.

İleride Atılacak Adımlar
- CI/CD için GitHub Actions kurulumu.
- Backend için migration/seed stratejisi.
- Frontend için performans iyileştirmeleri ve kod-splitting stratejisi.

İletişim
- Herhangi bir sorunuz için bana yazabilirsiniz.
