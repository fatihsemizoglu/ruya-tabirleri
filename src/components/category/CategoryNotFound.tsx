import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Folder, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';

export function CategoryNotFound() {
  return (
    <Layout>
      <Seo title="Kategori Bulunamadı" path="/kategoriler" noindex />
      <div className="min-h-screen">
        <div className="container py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-8">
              <Folder className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-serif-dream font-bold mb-4">Kategori Bulunamadı</h1>
            <p className="text-muted-foreground mb-8">
              Aradığınız kategori mevcut değil veya kaldırılmış olabilir.
            </p>
            <Button asChild size="lg" className="rounded-xl dream-gradient">
              <Link to="/kategoriler">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kategorilere Dön
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
