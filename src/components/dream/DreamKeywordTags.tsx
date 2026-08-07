import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

export function DreamKeywordTags({ keywords }: { keywords: string[] }) {
  return (
    <section className="container pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-3xl mx-auto surface p-6 md:p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">İlgili Anahtar Kelimeler</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <Link
              key={keyword}
              to={`/ara?q=${encodeURIComponent(keyword)}`}
              className="group inline-flex items-center min-h-11 px-3.5 py-1.5 text-sm rounded-full bg-muted/60 hover:bg-gradient-to-r hover:from-violet-500 hover:to-fuchsia-500 hover:text-white transition-all duration-200 border border-border/60 hover:border-transparent"
            >
              <span className="mr-1.5 opacity-60 group-hover:opacity-100">#</span>
              {keyword}
            </Link>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
