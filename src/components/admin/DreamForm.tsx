import { ReactNode, useEffect, useState } from 'react';
import { useForm, FormProvider, UseFormReturn, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen, Type, FileText, Eye, Star, Check, ChevronDown, Tag, Moon, Brain,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdminFormShell } from './common/AdminFormShell';
import { RichTextEditor } from './RichTextEditor';
import { generateSlug } from '@/lib/slug';
import { cn } from '@/lib/utils';

const dreamSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
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
  form?: UseFormReturn<DreamFormValues>;
  defaultValues?: DreamFormValues;
  onSubmit: (values: DreamFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  extraSections?: ReactNode;
}

function SectionLabel({ icon: Icon, label }: { icon: typeof Type; label: string }) {
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

function SwitchField({
  label, description, icon: Icon, checked, onChange,
}: {
  label: string; description?: string; icon: typeof Eye;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
        checked
          ? 'bg-gradient-to-br from-violet-500/8 via-fuchsia-500/8 to-pink-500/8 border-violet-500/30'
          : 'bg-card border-border/60 hover:border-border'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
          checked
            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {checked ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div
        className={cn(
          'w-9 h-5 rounded-full transition-colors flex-shrink-0 mt-1.5',
          checked ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-muted'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5',
            checked ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
          )}
        />
      </div>
    </button>
  );
}

function ContentCounter({ html }: { html: string }) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const chars = text.length;
  const readMinutes = Math.max(1, Math.round(words / 200));
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5 font-medium">
      <span className="tabular-nums">{words} kelime</span>
      <span className="opacity-50">·</span>
      <span className="tabular-nums">{chars} karakter</span>
      <span className="opacity-50">·</span>
      <span className="tabular-nums">~{readMinutes} dk okuma</span>
    </div>
  );
}

// Türkçe stop words (çok kullanılan, anlam taşımayan kelimeler)
const STOP_WORDS = new Set([
  've', 'ile', 'için', 'bir', 'bu', 'şu', 'da', 'de', 'ki', 'mi', 'mı', 'mu', 'mü',
  'ama', 'ancak', 'fakat', 'çünkü', 'gibi', 'kadar', 'sonra', 'önce', 'şimdi',
  'ben', 'sen', 'biz', 'siz', 'onlar', 'var', 'yok', 'olan', 'olur', 'olmuş',
  'daha', 'çok', 'az', 'fazla', 'en', 'her', 'hiç', 'bazı', 'tüm', 'bütün',
  'ise', 'iken', 'diye', 'dolayı', 'ötürü', 'rağmen',
  'ya', 'yahut', 'veya', 'hem', 'ne', 'bile',
  'üzerine', 'altında', 'üstünde', 'içinde', 'dışında', 'arasında', 'yanında',
  'bunu', 'şunu', 'onu', 'bunlar', 'şunlar', 'bunda', 'şunda',
  'artık', 'hâlâ', 'henüz', 'sadece', 'yalnız', 'yalnızca', 'hatta',
  'sanki', 'göre', 'karşı', 'doğru',
  'burada', 'orada', 'şurada', 'nerede',
  'kendi', 'kendisi', 'kendine', 'kendinden',
  'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz',
  'ilk', 'son', 'aynı', 'öteki', 'diğer', 'başka',
]);

// Otomatik anahtar kelime çıkarma
function extractKeywords(text: string, maxCount = 6): string[] {
  if (!text) return [];

  // HTML etiketlerini kaldır
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase();

  // Sadece harf ve Türkçe karakterleri tut
  const words = cleanText
    .replace(/[^a-zçğıöşüâîû\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .filter(w => !STOP_WORDS.has(w));

  // Kelime sıklığını say
  const frequency: Record<string, number> = {};
  words.forEach(w => {
    frequency[w] = (frequency[w] || 0) + 1;
  });

  // Sıklığa göre sırala
  const sorted = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  // İlk N kelimeyi al, ilk harfi büyük yap
  return sorted.slice(0, maxCount).map(w => w.charAt(0).toUpperCase() + w.slice(1));
}

// Otomatik meta title ve description oluşturma
function generateMetaTitle(title: string): string {
  if (!title) return '';
  return title.length > 58 ? title.slice(0, 57) + '…' : title;
}

function generateMetaDescription(plainContent: string): string {
  if (!plainContent) return '';
  // İlk 1-2 cümleyi al
  const sentences = plainContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let description = sentences.slice(0, 2).join('. ').trim();
  if (description && !description.endsWith('.')) description += '.';
  if (description.length > 160) description = description.slice(0, 159) + '…';
  return description;
}

function AutoTagsDisplay({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground italic">
        İçerik yazıldıkça otomatik olarak anahtar etiketler burada görünecek
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300"
        >
          <Tag className="h-3 w-3" />
          {t}
        </span>
      ))}
    </div>
  );
}

function AutoMetaPreview({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2.5">
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
          Meta Başlık
        </p>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 line-clamp-1">
          {title || <span className="text-muted-foreground italic font-normal">Başlık yazıldıkça oluşacak</span>}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
          Meta Açıklama
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
          {description || <span className="italic">İçerik yazıldıkça otomatik oluşacak</span>}
        </p>
      </div>
    </div>
  );
}

export function DreamForm({
  categories, form: formProp, defaultValues, onSubmit, onCancel, isSubmitting, extraSections,
}: DreamFormProps) {
  const internalForm = useForm<DreamFormValues>({
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
  const form = formProp ?? internalForm;
  const isEditing = !!defaultValues;
  const title = useWatch({ control: form.control, name: 'title' });
  const content = useWatch({ control: form.control, name: 'content' });
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [autoMeta, setAutoMeta] = useState<{ title: string; description: string }>({ title: '', description: '' });

  // Auto-slug when creating (never overwrite while editing).
  useEffect(() => {
    if (isEditing) return;
    const next = generateSlug(title || '');
    if (next && form.getValues('slug') !== next) {
      form.setValue('slug', next, { shouldValidate: false, shouldDirty: false });
    }
  }, [title, isEditing, form]);

  // Auto-extract keywords and meta from content (form state'e yaz)
  useEffect(() => {
    const plain = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const tags = extractKeywords(plain);
    const metaTitle = generateMetaTitle(title || '');
    const metaDesc = generateMetaDescription(plain);
    setAutoTags(tags);
    setAutoMeta({ title: metaTitle, description: metaDesc });
    // Form state'e yaz ki kayıt edilsin
    form.setValue('keywords', tags.join(', '), { shouldDirty: false });
    form.setValue('meta_title', metaTitle, { shouldDirty: false });
    form.setValue('meta_description', metaDesc, { shouldDirty: false });
  }, [title, content, form]);

  return (
    <AdminFormShell
      title={isEditing ? 'Rüyayı Düzenle' : 'Yeni Rüya Tabiri'}
      description="Başlık ve içerik yaz; etiketler, meta başlık ve açıklama otomatik üretilir"
      icon={BookOpen}
      badge={isEditing ? 'Düzenleme' : 'Yeni Kayıt'}
      isEditing={isEditing}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          {/* TEMEL BİLGİLER */}
          <div>
            <SectionLabel icon={Type} label="Temel Bilgiler" />
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <PremiumField>
                    <FormItem>
                      <FormLabel>Başlık</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Örn: Yılan Görmek"
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
                name="category_id"
                render={({ field }) => (
                  <PremiumField>
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  </PremiumField>
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-mono">
              /ruya/{form.watch('slug') || 'otomatik-slug'}
            </p>
          </div>

          {/* İÇERİK */}
          <div>
            <SectionLabel icon={FileText} label="Genel Yorum" />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <PremiumField>
                  <FormItem>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Rüya tabirinin genel açıklamasını yazın..."
                      />
                    </FormControl>
                    <ContentCounter html={field.value || ''} />
                    <FormMessage />
                  </FormItem>
                </PremiumField>
              )}
            />
          </div>

          {/* İSLAMİ RÜYA TABİRİ */}
          <div>
            <SectionLabel icon={Moon} label="İslami Rüya Tabiri (Opsiyonel)" />
            <FormField
              control={form.control}
              name="islamic_interpretation"
              render={({ field }) => (
                <PremiumField>
                  <FormItem>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="İslami kaynaklara göre rüya tabiri (İbn-i Sirin, İmam Nablusi vb.)..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </PremiumField>
              )}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              İslami rüya alimlerinin yorumlarını ayrı bir başlık altında gösterir
            </p>
          </div>

          {/* PSİKOLOJİK RÜYA YORUMU */}
          <div>
            <SectionLabel icon={Brain} label="Psikolojik Rüya Yorumu (Opsiyonel)" />
            <FormField
              control={form.control}
              name="psychological_interpretation"
              render={({ field }) => (
                <PremiumField>
                  <FormItem>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Psikolojik açıdan rüya analizi (Freud, Jung vb.)..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </PremiumField>
              )}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Modern psikoloji perspektifinden rüya yorumunu ayrı bir başlık altında gösterir
            </p>
          </div>

          {/* OTOMATİK ETİKETLER */}
          <div>
            <SectionLabel icon={Tag} label="Anahtar Etiketler (Otomatik)" />
            <AutoTagsDisplay tags={autoTags} />
            <p className="text-[11px] text-muted-foreground mt-2">
              İçerikten en sık geçen anlamlı kelimeler otomatik çıkarılır
            </p>
          </div>

          {/* OTOMATİK SEO ÖNİZLEME */}
          <div>
            <SectionLabel icon={Eye} label="SEO Önizleme (Otomatik)" />
            <AutoMetaPreview title={autoMeta.title} description={autoMeta.description} />
            <p className="text-[11px] text-muted-foreground mt-2">
              Meta başlık ve açıklama, başlığınız ve içeriğinizden otomatik oluşturulur
            </p>
          </div>

          {/* DAHA FAZLA SEÇENEK */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
              Daha Fazla Seçenek
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <SwitchField
                      label="Yayında"
                      description="Sitede herkes tarafından görülebilir"
                      icon={Eye}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <SwitchField
                      label="Öne Çıkan"
                      description="Anasayfada ve popüler listelerde gösterilir"
                      icon={Star}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              {extraSections}
            </CollapsibleContent>
          </Collapsible>
        </form>
      </FormProvider>
    </AdminFormShell>
  );
}
