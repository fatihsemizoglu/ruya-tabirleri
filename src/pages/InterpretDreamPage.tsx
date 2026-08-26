import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, MoonStar, Loader2, BookOpen, Landmark, Brain, ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  interpretDreamText,
  getRemainingFreeUses,
  FREE_DAILY_LIMIT,
  type InterpretationResult,
} from '@/lib/interpret-dream';
import { SourceTrustBadge } from '@/components/dream/SourceTrustBadge';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Rüyamı yorumlatmak ücretsiz mi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet. Günde 3 kez ücretsiz rüya yorumu alabilirsiniz. Rüyanızı yazın, sistem İslami ve psikolojik kaynakları temel alarak size özel bir yorum oluşturur.',
      },
    },
    {
      '@type': 'Question',
      name: 'AI rüya yorumu nasıl hazırlanıyor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Rüyanızdaki semboller, klasik İslami rüya tabiri kaynakları (İbn-i Sirin, Nablusi geleneği) ve modern psikoloji literatürüyle eşleştirilir. Sonuç, yorum geleneği çerçevesinde bir rehberdir; kesin hüküm içermez.',
      },
    },
    {
      '@type': 'Question',
      name: 'Rüyam kimseyle paylaşılır mı?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hayır. Yorumlatma için gönderdiğiniz metin yalnızca yorum üretmek üzere işlenir; adınızla ilişkilendirilmez ve herkese açık alanlarda paylaşılmaz.',
      },
    },
  ],
};

export default function InterpretDreamPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState(() => getRemainingFreeUses());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setResult(null);
    try {
      const data = await interpretDreamText(text);
      setResult(data);
      setRemaining(getRemainingFreeUses());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(message === 'FREE_LIMIT_REACHED'
        ? `Günlük ${FREE_DAILY_LIMIT} ücretsiz yorum hakkınızı doldurdunuz. Yarın tekrar deneyebilirsiniz.`
        : message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setText('');
  };

  return (
    <Layout>
      <Seo
        title="Ücretsiz Rüya Yorumlatma — AI Destekli"
        description="Rüyanızı yazın, anında İslami ve psikolojik yorumunuzu alın. İbn-i Sirin geleneği ve psikoloji literatürüyle desteklenen ücretsiz AI rüya yorumlatma servisi."
        path="/ruyami-yorumlat"
        jsonLd={faqJsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="container relative pt-12 pb-10 md:pt-16 md:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Ücretsiz · Günde {FREE_DAILY_LIMIT} yorum
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif-dream font-bold tracking-tight mb-4">
              Rüyanızı{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                Yorumlatalım
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Gördüğünüz rüyayı kendi cümlelerinizle anlatın; sembolleriniz klasik tabir
              kaynakları ve psikoloji literatürüyle eşleştirilerek size özel bir yorum hazırlansın.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + Result */}
      <section className="container pb-16">
        <div className="max-w-2xl mx-auto">
          {!result && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur p-5 md:p-7 shadow-sm space-y-4"
            >
              <label htmlFor="dream-text" className="block text-sm font-semibold text-foreground">
                Rüyanızı anlatın
              </label>
              <Textarea
                id="dream-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Örn: Denizin üzerinde uçtuğumu ve kıyıda beyaz bir yılanın beni izlediğini gördüm..."
                rows={6}
                required
                minLength={10}
                maxLength={4000}
                className="min-h-36 rounded-xl resize-y"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{remaining > 0 ? `${remaining}/${FREE_DAILY_LIMIT} ücretsiz yorum kaldı` : 'Günlük hakınız doldu'}</span>
                <span>{text.trim().length}/4000</span>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {error.includes('hakınızı doldurdunuz') && <Lock className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <p>{error}</p>
                    {error.includes('hakınızı doldurdunuz') && (
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link to="/kayit">Ücretsiz hesap oluştur</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isLoading || remaining <= 0 || text.trim().length < 10}
                className="w-full h-12 rounded-xl dream-gradient text-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Rüyanız yorumlanıyor...
                  </>
                ) : (
                  <>
                    <MoonStar className="h-5 w-5 mr-2" />
                    Rüyamı Yorumla
                  </>
                )}
              </Button>
            </motion.form>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {result.general_meaning && (
                <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-6">
                  <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                    <Sparkles className="h-4 w-4" />
                    Rüyanızın Özeti
                  </div>
                  <p className="text-foreground leading-relaxed">{result.general_meaning}</p>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-500/20 bg-card p-6">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                    <Landmark className="h-4 w-4" />
                    İslami Yorum
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.islamic_interpretation || 'Bu rüya için İslami gelenekte kayıtlı bir tabir bulunamadı.'}
                  </p>
                </div>
                <div className="rounded-3xl border border-sky-500/20 bg-card p-6">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold mb-3">
                    <Brain className="h-4 w-4" />
                    Psikolojik Yorum
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.psychological_interpretation || 'Bu rüya için psikolojik bir değerlendirme oluşturulamadı.'}
                  </p>
                </div>
              </div>

              {result.similarDreams && result.similarDreams.length > 0 && (
                <div className="rounded-3xl border border-border/50 bg-card p-6">
                  <div className="font-semibold text-foreground mb-3">Benzer Rüya Tabirleri</div>
                  <ul className="space-y-2">
                    {result.similarDreams.map((d) => (
                      <li key={d.id}>
                        <Link
                          to={`/ruya/${d.slug}`}
                          className="group inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          {d.title}
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <SourceTrustBadge className="!from-transparent !via-transparent" />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleReset} variant="outline" className="rounded-xl">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Başka Rüya Yorumlat
                </Button>
                <Button asChild variant="ghost" className="rounded-xl">
                  <Link to="/ara">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tabirlerde Ara
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Nasıl çalışır */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { n: '1', t: 'Anlat', d: 'Rüyanızı kendi kelimelerinizle yazın; ne kadar detaylı olursa o kadar iyi.' },
              { n: '2', t: 'Eşleştir', d: 'Sembolleriniz İbn-i Sirin geleneği ve psikoloji literatürüyle eşleştirilir.' },
              { n: '3', t: 'Oku', d: 'İslami ve psikolojik yorumlarınız saniyeler içinde hazır olur.' },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border/40 bg-card/60 p-4">
                <div className="h-8 w-8 rounded-full dream-gradient text-white font-bold flex items-center justify-center text-sm mb-2">
                  {s.n}
                </div>
                <div className="font-semibold text-foreground text-sm">{s.t}</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
