import { useForm, UseFormReturn, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderTree, Type, Hash, FileText, Smile, Sparkles, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AdminFormShell } from './common/AdminFormShell';
import { generateSlug } from '@/lib/slug';
import { cn } from '@/lib/utils';

const categorySchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır').max(60),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(200).optional(),
  icon: z.string().max(8).optional(),
  order_index: z.number().int().min(0).default(0),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  form?: UseFormReturn<CategoryFormValues> | undefined;
  defaultValues?: CategoryFormValues | undefined;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean | undefined;
}

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function PremiumField({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-1.5', className)}>{children}</div>;
}

const SUGGESTED_ICONS = ['🌙', '⭐', '💫', '🔮', '✨', '🌟', '💭', '🌸', '🌊', '🔥', '🕊️', '🪐', '🎭', '🌿', '☁️', '🦋'];

export function CategoryForm({ form: formProp, defaultValues, onSubmit, onCancel, isSubmitting }: CategoryFormProps) {
  const internalForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues || {
      name: '',
      slug: '',
      description: '',
      icon: '🌙',
      order_index: 0,
    },
  });
  const form = formProp ?? internalForm;

  const selectedIcon = form.watch('icon');

  return (
    <AdminFormShell
      title={defaultValues ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
      description="Rüya kategorisinin bilgilerini buradan yönetin"
      icon={FolderTree}
      badge={defaultValues ? 'Düzenleme' : 'Yeni Kayıt'}
      isEditing={!!defaultValues}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          {/* TEMEL BİLGİLER */}
          <div>
            <SectionLabel icon={Type} label="Temel Bilgiler" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <PremiumField>
                    <FormItem>
                      <FormLabel>Kategori Adı</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!defaultValues) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                          placeholder="Örn: Hayvanlar"
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </PremiumField>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <PremiumField>
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="hayvanlar" className="h-11 rounded-xl font-mono text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </PremiumField>
                )}
              />
            </div>

            <div className="mt-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <PremiumField>
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Bu kategori hakkında kısa açıklama..." className="min-h-[90px] rounded-xl" />
                      </FormControl>
                      <FormDescription>{(field.value?.length || 0)}/200 karakter</FormDescription>
                      <FormMessage />
                    </FormItem>
                  </PremiumField>
                )}
              />
            </div>
          </div>

          {/* GÖRSEL & SIRALAMA */}
          <div>
            <SectionLabel icon={Sparkles} label="Görsel & Sıralama" />
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <PremiumField>
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Smile className="h-3.5 w-3.5" />
                        Emoji İkon
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="🌙" className="h-11 rounded-xl text-2xl text-center" maxLength={4} />
                      </FormControl>
                      <FormDescription>Tek bir emoji girin veya aşağıdan seçin</FormDescription>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {SUGGESTED_ICONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => form.setValue('icon', emoji)}
                            className={cn(
                              'w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition-all',
                              selectedIcon === emoji
                                ? 'bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border-violet-500/40 scale-105'
                                : 'bg-card border-border/60 hover:border-border hover:bg-muted'
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  </PremiumField>
                )}
              />
              <FormField
                control={form.control}
                name="order_index"
                render={({ field }) => (
                  <PremiumField>
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        Sıra No
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormDescription>Küçük olan önce gösterilir</FormDescription>
                      <FormMessage />
                    </FormItem>
                  </PremiumField>
                )}
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </AdminFormShell>
  );
}
