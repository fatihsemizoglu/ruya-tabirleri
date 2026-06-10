import { getIcon } from '@/lib/icons';

interface CategoryIconProps {
  icon: string | null | undefined;
  className?: string;
  fallback?: string;
}

/**
 * Renders a category icon from the database.
 * Supports:
 * - Lucide icon names (e.g. "Moon", "cloud-rain", "Star")
 * - Emoji strings (e.g. "🌙", "📖")
 * - Falls back to a default emoji if not recognized
 */
export function CategoryIcon({ icon, className = 'text-base leading-none', fallback = '📖' }: CategoryIconProps) {
  if (!icon) {
    return <span className={className}>{fallback}</span>;
  }

  // Check if it's an emoji (non-ASCII character, likely emoji)
  const isEmoji = icon.codePointAt(0)! > 0x2000;
  if (isEmoji) {
    return <span className={className}>{icon}</span>;
  }

  // Try to resolve as Lucide icon name
  const LucideIcon = getIcon(icon);
  if (LucideIcon) {
    return <LucideIcon className={className.replace('text-base', 'h-4 w-4').replace('leading-none', '')} />;
  }

  // Fallback: render as text (might be an emoji not caught by regex)
  return <span className={className}>{icon}</span>;
}
