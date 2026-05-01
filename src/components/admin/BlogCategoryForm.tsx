import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export const blogCategorySchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').max(100),
  slug: z.string().min(2, 'Slug en az 2 karakter olmalıdır').max(100).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>;

interface BlogCategoryFormProps {
  defaultValues?: Partial<BlogCategoryFormValues>;
  onSubmit: (values: BlogCategoryFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BlogCategoryForm({ defaultValues, onSubmit, onCancel, isSubmitting }: BlogCategoryFormProps) {
  const form = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategorySchema),
    defaultValues: defaultValues || {
      name: '',
      slug: '',
      description: '',
      icon: '',
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[ğüşıöç]/g, (m) => ({ 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c' }[m] || m))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İsim</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!defaultValues) {
                      form.setValue('slug', generateSlug(e.target.value));
                    }
                  }}
                  placeholder="Kategori adı"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} placeholder="kategori-slug" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Kategori açıklaması" className="min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İkon (emoji veya class)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="📁" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : defaultValues ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  );
}