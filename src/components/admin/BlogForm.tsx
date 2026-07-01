import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileEdit, Type, FileText, Image as ImageIcon, Tag, Eye, Star, Check, ChevronDown, Upload, Link2, Loader2, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { AdminFormShell } from './common/AdminFormShell';
import { RichTextEditor } from './RichTextEditor';
import { generateSlug } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const blogSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(50, 'İçerik en az 50 karakter olmalıdır'),
  featured_image: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  category_id: z.string().optional(),
  tags: z.string().optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  is_published: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  scheduled_at: z.date().optional().nullable(),
});

export type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogFormProps {
  categories: { id: string; name: string }[];
  form?: UseFormReturn<BlogFormValues>;
  defaultValues?: BlogFormValues;
  onSubmit: (values: BlogFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  extraSections?: React.ReactNode;
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

const STOP_WORDS_BLOG = new Set([
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
function extractKeywordsBlog(text: string, maxCount = 6): string[] {
  if (!text) return [];
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase();
  const words = cleanText
    .replace(/[^a-zçğıöşüâîû\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .filter(w => !STOP_WORDS_BLOG.has(w));
  const frequency: Record<string, number> = {};
  words.forEach(w => { frequency[w] = (frequency[w] || 0) + 1; });
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, maxCount)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));
}

// Otomatik excerpt oluşturma
function generateExcerpt(plainContent: string, maxLen = 280): string {
  if (!plainContent) return '';
  const cleaned = plainContent.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  // Kelime sınırında kes
  const truncated = cleaned.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  const result = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return result.trim() + '…';
}

// Otomatik meta title
function generateMetaTitleBlog(title: string): string {
  if (!title) return '';
  return title.length > 58 ? title.slice(0, 57) + '…' : title;
}

// Otomatik meta description
function generateMetaDescriptionBlog(plainContent: string): string {
  if (!plainContent) return '';
  const sentences = plainContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let description = sentences.slice(0, 2).join('. ').trim();
  if (description && !description.endsWith('.')) description += '.';
  if (description.length > 160) description = description.slice(0, 159) + '…';
  return description;
}

function AutoTagsDisplayBlog({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground italic">
        İçerik yazıldıkça otomatik olarak etiketler burada görünecek
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

function AutoMetaPreviewBlog({ title, description }: { title: string; description: string }) {
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

// Supabase storage bucket adı - supabase tarafında oluşturulmuş olmalı
const BLOG_IMAGE_BUCKET = 'blog-images';

export function BlogForm({
  categories, form: formProp, defaultValues, onSubmit, onCancel, isSubmitting, extraSections,
}: BlogFormProps) {
  const { user } = useAuth();
  const internalForm = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: defaultValues || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category_id: '',
      tags: '',
      meta_title: '',
      meta_description: '',
      is_published: true,
      is_featured: false,
      scheduled_at: null,
    },
  });
  const form = formProp ?? internalForm;
  const isEditing = !!defaultValues;
  const title = useWatch({ control: form.control, name: 'title' });
  const content = useWatch({ control: form.control, name: 'content' });
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [autoMeta, setAutoMeta] = useState<{ title: string; description: string }>({ title: '', description: '' });
  const [autoExcerpt, setAutoExcerpt] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-slug
  useEffect(() => {
    if (isEditing) return;
    const next = generateSlug(title || '');
    if (next && form.getValues('slug') !== next) {
      form.setValue('slug', next, { shouldValidate: false, shouldDirty: false });
    }
  }, [title, isEditing, form]);

  // Auto-extract tags, excerpt ve meta
  useEffect(() => {
    const plain = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const tags = extractKeywordsBlog(plain);
    const excerpt = generateExcerpt(plain, 280);
    const metaTitle = generateMetaTitleBlog(title || '');
    const metaDesc = generateMetaDescriptionBlog(plain);
    setAutoTags(tags);
    setAutoExcerpt(excerpt);
    setAutoMeta({ title: metaTitle, description: metaDesc });
    // Form state'e yaz
    form.setValue('tags', tags.join(', '), { shouldDirty: false });
    form.setValue('excerpt', excerpt, { shouldDirty: false });
    form.setValue('meta_title', metaTitle, { shouldDirty: false });
    form.setValue('meta_description', metaDesc, { shouldDirty: false });
  }, [title, content, form]);

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) { toast.error('Görsel yüklemek için giriş yapmalısınız'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Lütfen bir görsel dosyası seçin'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Dosya boyutu 5MB\'dan büyük olamaz'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .getPublicUrl(fileName);
      form.setValue('featured_image', publicUrl, { shouldValidate: true });
      toast.success('Görsel yüklendi');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.error('Yükleme hatası:', err);
      toast.error(`Yükleme başarısız: ${errorMessage}. Supabase'de "${BLOG_IMAGE_BUCKET}" bucket'ı oluşturulmuş olmalı.`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AdminFormShell
      title={isEditing ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
      description="Başlık ve içerik yaz; özet, etiketler, SEO ve görsel otomatik/yardımlı"
      icon={FileEdit}
      badge={isEditing ? 'Düzenleme' : 'Yeni Kayıt'}
      isEditing={isEditing}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          {/* TEMEL BİLGİLER */}
          <div>
            <SectionLabel icon={Type} label="Temel Bilgiler" />
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
                        placeholder="Örn: Rüya Tabiri Nasıl Yapılır?"
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                      /blog/{form.watch('slug') || 'otomatik-slug'}
                    </p>
                    <FormMessage />
                  </FormItem>
                </PremiumField>
              )}
            />
          </div>

          {/* İÇERİK */}
          <div>
            <SectionLabel icon={FileText} label="İçerik" />
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
                        placeholder="Blog yazısının tam metnini buraya yazın..."
                      />
                    </FormControl>
                    <ContentCounter html={field.value || ''} />
                    <FormMessage />
                  </FormItem>
                </PremiumField>
              )}
            />
          </div>

          {/* OTOMATİK ÖZET */}
          <div>
            <SectionLabel icon={FileText} label="Özet (Otomatik)" />
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <p className="text-sm text-foreground line-clamp-3 min-h-[3rem]">
                {autoExcerpt || <span className="text-muted-foreground italic text-xs">İçerik yazıldıkça otomatik oluşacak</span>}
              </p>
              {autoExcerpt && (
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                  {autoExcerpt.length}/300 karakter
                </p>
              )}
            </div>
          </div>

          {/* KAPAK GÖRSELİ: Dosya yükleme veya URL */}
          <div>
            <SectionLabel icon={ImageIcon} label="Kapak Görseli" />
            <FormField
              control={form.control}
              name="featured_image"
              render={({ field }) => {
                const url = field.value;
                return (
                  <PremiumField>
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Upload className="h-3 w-3" /> Dosya Yükle
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-500/20 cursor-pointer disabled:opacity-50"
                          />
                          {uploading && (
                            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> Yükleniyor...
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Link2 className="h-3 w-3" /> veya URL Gir
                          </p>
                          <Input
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="https://..."
                            className="h-9 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                      {url && (
                        <div className="mt-3 rounded-xl border border-border/60 overflow-hidden bg-muted/30">
                          <img
                            src={url}
                            alt="Önizleme"
                            className="w-full h-40 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  </PremiumField>
                );
              }}
            />
          </div>

          {/* KATEGORİ */}
          <div>
            <SectionLabel icon={Type} label="Kategori" />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <PremiumField>
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Kategori seçin" />
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

          {/* OTOMATİK ETİKETLER */}
          <div>
            <SectionLabel icon={Tag} label="Etiketler (Otomatik)" />
            <AutoTagsDisplayBlog tags={autoTags} />
            <p className="text-[11px] text-muted-foreground mt-2">
              İçerikten en sık geçen anlamlı kelimeler otomatik çıkarılır
            </p>
          </div>

          {/* SEO ÖNİZLEME */}
          <div>
            <SectionLabel icon={Eye} label="SEO Önizleme (Otomatik)" />
            <AutoMetaPreviewBlog title={autoMeta.title} description={autoMeta.description} />
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
                      description="Blog sayfasında herkes tarafından görülebilir"
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
                      description="Anasayfada öne çıkan yazılar bölümünde gösterilir"
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
      </Form>
    </AdminFormShell>
  );
}

