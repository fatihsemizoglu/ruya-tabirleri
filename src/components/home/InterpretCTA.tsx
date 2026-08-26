import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoonStar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Ana sayfa AI yorumlatma vitrin şeridi (lazy bölüm). */
export function InterpretCTA() {
  return (
    <section className="container py-14">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-600/15 via-fuchsia-500/10 to-pink-500/10 p-8 md:p-12 text-center"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-xl mx-auto">
          <MoonStar className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-2xl md:text-3xl font-serif-dream font-bold tracking-tight mb-3">
            Rüyanı yaz, anlamını{' '}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              saniyeler içinde
            </span>{' '}
            öğren
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sembollerin İbn-i Sirin geleneği ve psikoloji literatürüyle eşleştirilir; ücretsiz ve
            günde 3 kez.
          </p>
          <Button asChild size="lg" className="h-12 px-8 rounded-xl dream-gradient text-white font-semibold">
            <Link to="/ruyami-yorumlat">
              Ücretsiz Rüya Yorumlat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
