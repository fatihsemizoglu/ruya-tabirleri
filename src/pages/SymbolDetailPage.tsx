import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SymbolDetail } from '@/components/dream/SymbolDictionary';
import { CulturalComparison } from '@/components/dream/CulturalComparison';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SymbolDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/sozluk">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sözlüğe Dön
          </Link>
        </Button>
        <div className="max-w-3xl mx-auto">
          <SymbolDetail slug={slug} />
          <div className="mt-12">
            <CulturalComparison symbol={slug.replace(/-/g, ' ')} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
