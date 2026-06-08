import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.025,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
};

export function AlphabetSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Alfabe
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-serif-dream text-foreground mb-2">
            A'dan Z'ye Rüya Tabirleri
          </h2>
          <p className="text-muted-foreground">
            Alfabetik sırayla tüm rüya tabirlerine ulaşın
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-2.5 max-w-4xl mx-auto"
        >
          {alphabet.map((letter) => (
            <motion.div key={letter} variants={itemVariants}>
              <Link
                to={`/az/${letter.toLowerCase()}`}
                className="w-full aspect-square rounded-lg bg-card border border-border/60 flex items-center justify-center text-sm md:text-base font-bold font-serif-dream text-foreground transition-colors hover:bg-muted"
              >
                {letter}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
