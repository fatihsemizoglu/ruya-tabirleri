import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeClassMap: Record<Size, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
  '2xl': 'h-8 w-8',
};

interface CategoryIconProps {
  icon: string | null | undefined;
  className?: string;
  fallback?: string;
  size?: Size;
}

function isEmojiString(value: string): boolean {
  const cp = value.codePointAt(0);
  if (cp === undefined) return false;
  return cp > 0x2000;
}

/**
 * Renders a category icon from the database.
 * Supports:
 * - Lucide icon names (e.g. "Moon", "cloud-rain", "Star", "Su", "Yagmur")
 * - Emoji strings (e.g. "🌙", "📖")
 * - Falls back to a default emoji if not recognized
 */
export function CategoryIcon({
  icon,
  className,
  fallback = '📖',
  size = 'md',
}: CategoryIconProps) {
  if (!icon) {
    return <span className={className ?? 'text-base leading-none'}>{fallback}</span>;
  }

  if (isEmojiString(icon)) {
    return <span className={className ?? 'text-base leading-none'}>{icon}</span>;
  }

  const LucideIcon = getIcon(icon);
  if (LucideIcon) {
    const hasSize = !!className && /\b(h-\d+(?:\.\d+)?|w-\d+(?:\.\d+)?)\b/.test(className);
    const finalClass = hasSize ? className : cn(sizeClassMap[size], className);
    return <LucideIcon className={finalClass} />;
  }

  return <span className={className ?? 'text-base leading-none'}>{icon}</span>;
}
