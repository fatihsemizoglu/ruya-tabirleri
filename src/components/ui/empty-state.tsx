import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  SearchX,
  FileQuestion,
  Inbox,
  Frown,
  AlertTriangle,
  Sparkles,
  Moon,
  BookOpen,
  Users,
  FolderOpen,
  Mail,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PresetIcon = 'search' | 'file' | 'inbox' | 'frown' | 'warning' | 'sparkles' | 'moon' | 'book' | 'users' | 'folder' | 'mail' | 'bell';

interface EmptyStateProps {
  icon?: PresetIcon | LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  variant?: 'default' | 'compact' | 'hero';
  children?: ReactNode;
  className?: string;
}

const presetIcons: Record<PresetIcon, LucideIcon> = {
  search: SearchX,
  file: FileQuestion,
  inbox: Inbox,
  frown: Frown,
  warning: AlertTriangle,
  sparkles: Sparkles,
  moon: Moon,
  book: BookOpen,
  users: Users,
  folder: FolderOpen,
  mail: Mail,
  bell: Bell,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  children,
  className,
}: EmptyStateProps) {
  const Icon = typeof icon === 'string' ? presetIcons[icon] : icon;

  const sizeMap = {
    default: { wrap: 'w-16 h-16', icon: 'h-8 w-8', padding: 'py-16 px-4' },
    compact: { wrap: 'w-12 h-12', icon: 'h-6 w-6', padding: 'py-10 px-4' },
    hero: { wrap: 'w-24 h-24', icon: 'h-12 w-12', padding: 'py-20 px-4' },
  };

  const sizes = sizeMap[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden flex flex-col items-center justify-center text-center',
        sizes.padding,
        className
      )}
    >
      {/* Decorative mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-fuchsia-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative">
        <div
          className={cn(
            'rounded-2xl flex items-center justify-center mx-auto mb-5 relative',
            'bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10',
            'border border-violet-500/15',
            sizes.wrap
          )}
        >
          <Icon
            className={cn(
              'text-violet-600 dark:text-violet-400',
              sizes.icon
            )}
            strokeWidth={1.75}
          />
        </div>
      </div>

      <h3
        className={cn(
          'font-bold tracking-tight text-foreground mb-2 relative',
          variant === 'hero' ? 'text-2xl' : variant === 'compact' ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-muted-foreground max-w-md mb-6 relative',
            variant === 'compact' ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </p>
      )}

      {children && <div className="relative mb-4">{children}</div>}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 relative">
          {action && (
            <Button
              onClick={action.onClick}
              className="relative rounded-xl h-10 px-5 text-sm font-semibold text-white border-0 shadow-lg shadow-fuchsia-500/25 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">{action.label}</span>
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick} className="rounded-xl h-10 px-5">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
