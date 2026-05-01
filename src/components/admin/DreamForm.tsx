import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const dreamSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200),
  slug: z.string().min(3, 'Slug en az 3 karakter olmalıdır').max(200).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  content: z.string().min(50, 'İçerik en az 50 karakter olmalıdır'),
  islamic_interpretation: z.string().optional(),
  psychological_interpretation: z.string().optional(),
  category_id: z.string().optional(),
  keywords: z.string().optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  is_published: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

export type DreamFormValues = z.infer<typeof dreamSchema>;

interface DreamFormProps {
  categories: { id: string; name: string }[];
  defaultValues?: DreamFormValues;
  onSubmit: (values: DreamFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function DreamForm({ categories, defaultValues, onSubmit, onCancel, isSubmitting }: DreamFormProps) {
  const form = useForm<DreamFormValues>({
    resolver: zodResolver(dreamSchema),
    defaultValues: defaultValues || {
      title: '',
      slug: '',
      content: '',
      islamic_interpretation: '',
      psychological_interpretation: '',
      category_id: '',
      keywords: '',
      meta_title: '',
      meta_description: '',
      is_published: true,
      is_featured: false,
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[ğüşıöç]/g, (m) => ({ 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c' }[m] || m))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Başlık</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!defaultValues) {
                        form.setValue('slug', generateSlug(e.target.value));
                      }
                    }}
                    placeholder="Örn: Yılan Görmek"
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
                <FormLabel>Slug (URL)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Örn: yilan-gormek" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İçerik</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Rüya tabirinin açıklamasını yazın..." className="min-h-[150px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="islamic_interpretation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İslami Yorum</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="İslami açıdan yorumu..." className="min-h-[100px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="psychological_interpretation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Psikolojik Yorum</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Psikolojik açıdan yorumu..." className="min-h-[100px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anahtar Kelimeler (virgülle ayırın)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Örn: yılan, köpek, uçuş" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="meta_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Başlık</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="SEO başlığı (max 60)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="meta_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Açıklama</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="SEO açıklaması (max 160)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4"
                  />
                </FormControl>
                <FormLabel className="font-normal">Yayınlansın mı?</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4"
                  />
                </FormControl>
                <FormLabel className="font-normal">Öne Çıkan</FormLabel>
              </FormItem>
            )}
          />
        </div>

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