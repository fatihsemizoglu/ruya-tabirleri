import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Folder, Eye, Heart, Calendar, Clock } from 'lucide-react';
import type { Dream, Category } from '@/types/database';

interface DreamHeroProps {
  dream: Dream;
  category: Category | null | undefined;
  heroGradient: string;
  formattedDate: string;
  readTime: number;
}

/** H1 altına yerleşen tanım bloğu: ilk 1-2 cümle, GEO için self-contained özet. */
function buildDefinition(dream: Dream): string {
  const source = dream.islamic_interpretation || dream.psychological_interpretation || dream.content || '';
  const plain = source.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = plain.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(' ');
  return sentences.length > 20 ? sentences.slice(0, 320) : '';
}

export function DreamHero({ dream, category, heroGradient, formattedDate, readTime }: DreamHeroProps) {
  const definition = buildDefinition(dream);

  return (
    <section className="relative overflow-hidden">
      <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 bg-gradient-to-br ${heroGradient}`} />
      <div className={`absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-3xl opacity-15 bg-gradient-to-br ${heroGradient}`} />

      <div className="container relative pt-8 pb-10 md:pt-12 md:pb-16">
        <motion.nav
          aria-label="breadcrumb"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary transition-colors">
            Ana Sayfa
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <Link to="/populer" className="hover:text-primary transition-colors">
            Rüya Tabirleri
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span aria-current="page" className="text-foreground font-medium truncate max-w-[50vw] md:max-w-md">
            {dream.title}
          </span>
        </motion.nav>

        <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br ${heroGradient} flex items-center justify-center shadow-2xl shadow-primary/20 shrink-0`}
          >
            <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-white" />
          </motion.div>

          <div className="flex-1 min-w-0">
            {category && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link
                  to={`/kategori/${category.slug}`}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors border border-primary/20 mb-4"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {category.name}
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </Link>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-3xl md:text-4xl lg:text-5xl font-serif-dream font-bold leading-tight tracking-tight mb-5"
            >
              <span className={`bg-gradient-to-br ${heroGradient} bg-clip-text text-transparent`}>
                {dream.title}
              </span>
            </motion.h1>

            {definition && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mb-6"
              >
                <strong className="text-foreground font-semibold">{dream.title}</strong> rüyasının özeti:{' '}
                {definition}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span className="font-semibold text-foreground">{(dream.view_count || 0).toLocaleString('tr-TR')}</span> görüntülenme
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span className="font-semibold text-foreground">{(dream.like_count || 0).toLocaleString('tr-TR')}</span> beğeni
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readTime} dakika okuma
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
