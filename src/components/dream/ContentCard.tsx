import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface ContentCardProps {
  icon: LucideIcon;
  gradient: string;
  title: string;
  children: React.ReactNode;
}

export function ContentCard({ icon: Icon, gradient, title, children }: ContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface p-6 md:p-10 relative overflow-hidden"
    >
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${gradient}`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/60">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-serif-dream font-bold">{title}</h2>
        </div>
        {children}
      </div>
    </motion.div>
  );
}
