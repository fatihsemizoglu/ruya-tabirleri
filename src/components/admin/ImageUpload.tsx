import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { captureError } from '@/lib/logger';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  bucket = 'blog-images',
  folder = 'posts'
}: ImageUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!user) {
      toast.error('Görsel yüklemek için giriş yapmalısınız');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece görsel dosyaları yükleyebilirsiniz');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success('Görsel yüklendi');
    } catch (error: unknown) {
      captureError(error, { tags: { feature: 'image-upload' }, extra: { context: 'upload' } });
      toast.error(error instanceof Error ? error.message : 'Görsel yüklenirken bir hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleRemove = async () => {
    if (value) {
      // Extract file path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        try {
          await supabase.storage.from(bucket).remove([filePath]);
        } catch (error) {
          captureError(error, { tags: { feature: 'image-upload' }, extra: { context: 'delete' } });
        }
      }
    }
    onChange('');
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Değiştir'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              aria-label="Görseli kaldır"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isUploading) inputRef.current?.click();
            }
          }}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
            ${dragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-500">Yükleniyor...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  Görsel yüklemek için tıklayın
                </span>
                <span className="text-slate-500"> veya sürükleyip bırakın</span>
              </div>
              <span className="text-xs text-slate-400">PNG, JPG, GIF (max. 5MB)</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
