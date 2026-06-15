import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';

export default function CookiePolicy() {
  return (
    <Layout>
      <Seo title="Çerez Politikası" description="Rüya Tabirleri çerez kullanımı ve tercihleri hakkında bilgi." path="/cerez-politikasi" />
      <main className="container py-12 md:py-16">
        <article className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm md:p-10">
          <p className="text-sm font-semibold text-primary">Yasal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Çerez Politikası</h1>
          <p className="mt-4 text-muted-foreground">Bu politika, sitemizde kullanılan çerezlerin hangi amaçlarla kullanıldığını açıklar.</p>

          <section className="mt-8 space-y-4 text-sm leading-7 text-foreground/85">
            <h2 className="text-xl font-semibold text-foreground">Zorunlu Çerezler</h2>
            <p>Oturum, güvenlik, tercih ve temel site işlevleri için gerekli çerezler kullanılır. Bu çerezler site deneyiminin çalışması için gereklidir.</p>

            <h2 className="text-xl font-semibold text-foreground">Analitik ve Performans</h2>
            <p>Site performansını ve kullanım davranışlarını anlamak için anonimleştirilmiş ölçüm verileri kullanılabilir.</p>

            <h2 className="text-xl font-semibold text-foreground">Tercihlerin Yönetimi</h2>
            <p>Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz. Bazı çerezleri kapatmanız halinde bazı özellikler sınırlı çalışabilir.</p>
          </section>
        </article>
      </main>
    </Layout>
  );
}
