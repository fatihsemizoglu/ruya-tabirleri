 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import { toast } from 'sonner';
 
 interface SEOGeneratorProps {
   title: string;
   content: string;
   type: 'dream' | 'blog';
   onGenerated: (metaTitle: string, metaDescription: string) => void;
   disabled?: boolean;
 }
 
 export function SEOGenerator({ title, content, type, onGenerated, disabled }: SEOGeneratorProps) {
   const [isGenerating, setIsGenerating] = useState(false);
 
   const handleGenerate = async () => {
     if (!title.trim() || !content.trim()) {
       toast.error('Lütfen önce başlık ve içerik alanlarını doldurun');
       return;
     }
 
     setIsGenerating(true);
     try {
       const { data, error } = await supabase.functions.invoke('generate-seo', {
         body: { title, content, type },
       });
 
       if (error) {
         throw error;
       }
 
       if (data.error) {
         throw new Error(data.error);
       }
 
       onGenerated(data.meta_title, data.meta_description);
       toast.success('SEO meta verileri başarıyla oluşturuldu');
     } catch (error) {
       captureError(error, { tags: { feature: 'seo-generator' } });
       toast.error(error instanceof Error ? error.message : 'SEO oluşturulurken hata oluştu');
     } finally {
       setIsGenerating(false);
     }
   };
 
   return (
     <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={handleGenerate}
       disabled={disabled || isGenerating || !title.trim() || !content.trim()}
       className="gap-2"
     >
       {isGenerating ? (
         <>
           <Loader2 className="w-4 h-4 animate-spin" />
           Oluşturuluyor...
         </>
       ) : (
         <>
           <Sparkles className="w-4 h-4" />
           AI ile SEO Oluştur
         </>
       )}
     </Button>
   );
 }