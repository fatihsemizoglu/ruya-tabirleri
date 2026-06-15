import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';

export default function Kvkk() {
  return (
    <Layout>
      <Seo title="KVKK Aydınlatma Metni" description="Kişisel verilerin korunması ve işlenmesine ilişkin aydınlatma metni." path="/kvkk" />
      <main className="container py-12 md:py-16">
        <article className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm md:p-10">
          <p className="text-sm font-semibold text-primary">Yasal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">KVKK Aydınlatma Metni</h1>
          <p className="mt-4 text-muted-foreground">Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin hangi amaçlarla işlendiğini açıklar.</p>

          <section className="mt-8 space-y-4 text-sm leading-7 text-foreground/85">
            <h2 className="text-xl font-semibold text-foreground">İşlenen Veriler</h2>
            <p>İletişim formları, üyelik işlemleri ve kullanıcı deneyimi kapsamında ad, e-posta, mesaj içeriği, hesap bilgileri ve teknik kullanım verileri işlenebilir.</p>

            <h2 className="text-xl font-semibold text-foreground">İşleme Amaçları</h2>
            <p>Verileriniz; hesabınızı yönetmek, taleplerinize yanıt vermek, güvenliği sağlamak, hizmet kalitesini artırmak ve yasal yükümlülükleri yerine getirmek için kullanılır.</p>

            <h2 className="text-xl font-semibold text-foreground">Haklarınız</h2>
            <p>KVKK kapsamındaki başvuru, düzeltme, silme, itiraz ve bilgi alma haklarınızı iletişim sayfasındaki kanallar üzerinden bize ulaşarak kullanabilirsiniz.</p>
          </section>
        </article>
      </main>
    </Layout>
  );
}
