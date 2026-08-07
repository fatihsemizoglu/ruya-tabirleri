import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { ContactHero } from '@/components/contact/ContactHero';
import { ContactInfo } from '@/components/contact/ContactInfo';
import { ContactForm } from '@/components/contact/ContactForm';
import { ContactMap } from '@/components/contact/ContactMap';

export default function Contact() {
  return (
    <Layout>
      <Seo
        title="İletişim"
        description="Rüya Tabirleri ile iletişime geçin. Sorularınız, önerileriniz ve geri bildirimleriniz için bize ulaşın."
        path="/iletisim"
      />

      <main className="relative isolate overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_18%_12%,rgba(139,92,246,0.17),transparent_31%),radial-gradient(circle_at_82%_18%,rgba(217,70,239,0.14),transparent_28%),radial-gradient(circle_at_52%_45%,rgba(236,72,153,0.09),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[linear-gradient(to_right,rgba(139,92,246,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <ContactHero />

        <section className="container pb-20">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
            <ContactInfo />

            <ContactForm />
          </div>
        </section>

        <ContactMap />
      </main>
    </Layout>
  );
}