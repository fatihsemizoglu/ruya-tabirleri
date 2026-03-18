import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, Hash } from 'lucide-react';
import { blogApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TagData {
  name: string;
  count: number;
}

interface TagCloudProps {
  className?: string;
  maxTags?: number;
}

export function TagCloud({ className, maxTags = 20 }: TagCloudProps) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const response = await blogApi.getTags();

    if (!response.success || !response.data) {
      setIsLoading(false);
      return;
    }

    const sortedTags = response.data
      .sort((a, b) => b.count - a.count)
      .slice(0, maxTags);

    setTags(sortedTags);
    setIsLoading(false);
  };

  const getTagSize = (count: number) => {
    const maxCount = Math.max(...tags.map((t) => t.count), 1);
    const ratio = count / maxCount;

    if (ratio >= 0.8) return 'text-sm font-semibold';
    if (ratio >= 0.5) return 'text-sm font-medium';
    if (ratio >= 0.3) return 'text-xs font-medium';
    return 'text-xs';
  };

  if (isLoading) {
    return (
      <div className={cn('bg-card rounded-2xl border border-border p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className={cn('bg-card rounded-2xl border border-border p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Hash className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Popüler Etiketler</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <motion.div
            key={tag.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Link
              to={`/blog/etiket/${encodeURIComponent(tag.name)}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200',
                'bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary',
                'border border-transparent hover:border-primary/20',
                getTagSize(tag.count)
              )}
            >
              <Tag className="w-3 h-3" />
              {tag.name}
              <span className="text-[10px] opacity-50 tabular-nums">({tag.count})</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
