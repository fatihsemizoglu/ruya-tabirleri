import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Parse headings from HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    const tocItems: TocItem[] = [];
    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      
      if (text.trim()) {
        tocItems.push({ id, text, level });
      }
    });
    
    setItems(tocItems);
  }, [content]);

  useEffect(() => {
    // Add IDs to actual headings in the DOM
    const articleContent = document.querySelector('.prose');
    if (!articleContent) return;

    const headings = articleContent.querySelectorAll('h2, h3');
    headings.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });

    // Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, [items]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (items.length < 2) return null;

  return (
    <nav className={cn('bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700', className)}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-slate-900 dark:text-white">
            İçindekiler
          </span>
          <span className="text-sm text-slate-500">({items.length})</span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="px-4 pb-4 space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    className={cn(
                      'w-full text-left py-1.5 px-3 rounded-lg text-sm transition-all duration-200',
                      item.level === 3 && 'ml-4',
                      activeId === item.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <span className={cn(
                      'inline-block w-1.5 h-1.5 rounded-full mr-2',
                      activeId === item.id
                        ? 'bg-indigo-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                    )} />
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
