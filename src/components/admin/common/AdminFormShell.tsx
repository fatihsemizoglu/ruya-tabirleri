import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { cn } from '@/lib/utils';

interface AdminFormShellProps {
  title: string;
  description?: string | undefined;
  icon: LucideIcon;
  badge?: string | undefined;
  isEditing?: boolean | undefined;
  isSubmitting?: boolean | undefined;
  onSubmit?: (() => void) | undefined;
  onCancel: () => void;
  submitLabel?: string | undefined;
  cancelLabel?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}

export function AdminFormShell({
  title,
  description,
  icon: Icon,
  badge,
  isEditing = false,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel = 'İptal',
  children,
  className,
}: AdminFormShellProps) {
  const finalSubmitLabel =
    submitLabel ?? (isSubmitting ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur');

  return (
    <div
      className={cn(
        'relative bg-card border border-border/50 rounded-2xl shadow-xl shadow-violet-950/5 overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Decorative mesh + grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-72 h-72 bg-fuchsia-500/8 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* STICKY TOP — Title bar */}
      <div className="sticky top-0 z-20 relative z-10 bg-card/85 backdrop-blur-xl border-b border-border/60">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/25 flex-shrink-0">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              {badge && (
                <div className="mb-1">
                  <PremiumBadge className="text-[10px] py-0.5 px-2.5">
                    {badge}
                  </PremiumBadge>
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                <GradientText>{title}</GradientText>
              </h2>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Kapat"
            className="flex-shrink-0 w-9 h-9 rounded-lg border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="relative z-10 flex-1 overflow-y-auto max-h-[calc(100vh-360px)]">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-6 py-6"
        >
          {children}
        </motion.div>
      </div>

      {/* STICKY BOTTOM — Action bar */}
      <div className="sticky bottom-0 z-20 relative z-10 bg-card/90 backdrop-blur-xl border-t border-border/60">
        <div className="px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tüm değişiklikler otomatik kaydedilir
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-10 rounded-xl border-border/60 hover:bg-muted font-semibold"
            >
              <X className="h-4 w-4 mr-1.5" />
              {cancelLabel}
            </Button>
            {onSubmit && (
              <Button
                type="submit"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="relative h-10 px-6 rounded-xl text-sm font-semibold text-white border-0 shadow-lg shadow-fuchsia-500/25 group overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isSubmitting ? (
                  <Loader2 className="relative h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="relative h-4 w-4 mr-1.5" />
                )}
                <span className="relative">{finalSubmitLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
