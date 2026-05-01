import { Layout } from '@/components/layout/Layout';
import { SymbolDictionary } from '@/components/dream/SymbolDictionary';
import { BookOpen } from 'lucide-react';

export default function SymbolDictionaryPage() {
  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Rüya Sembolü Sözlüğü
          </h1>
          <p className="text-muted-foreground mt-2">
            Rüyalarınızda gördüğünüz sembollerin İslami, psikolojik ve kültürel anlamlarını keşfedin.
          </p>
        </div>
        <SymbolDictionary />
      </div>
    </Layout>
  );
}
