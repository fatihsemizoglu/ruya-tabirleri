import { Link } from 'react-router-dom';
import { BookOpen, Layers, Eye, Heart, TrendingUp } from 'lucide-react';

export function SearchLanding({ categoryCount }: { categoryCount: number }) {
  return (
    <div className="mt-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
        <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold text-primary">1000+</div>
          <div className="text-sm text-muted-foreground">Rüya Tabiri</div>
        </div>
        <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border">
          <Layers className="h-8 w-8 mx-auto mb-2 text-accent-foreground" />
          <div className="text-2xl font-bold">{categoryCount}</div>
          <div className="text-sm text-muted-foreground">Kategori</div>
        </div>
        <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-muted to-muted/50 border">
          <Eye className="h-8 w-8 mx-auto mb-2" />
          <div className="text-2xl font-bold">10K+</div>
          <div className="text-sm text-muted-foreground">Görüntüleme</div>
        </div>
        <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-muted to-muted/50 border">
          <Heart className="h-8 w-8 mx-auto mb-2" />
          <div className="text-2xl font-bold">5K+</div>
          <div className="text-sm text-muted-foreground">Beğeni</div>
        </div>
      </div>

      {/* Browse by Letter */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-serif font-semibold mb-4">Alfabetik Arama</h2>
        <div className="flex flex-wrap justify-center gap-1">
          {'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('').map((letter) => (
            <Link
              key={letter}
              to={`/az/${letter}`}
              className="h-11 w-11 flex items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
            >
              {letter}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/populer"
          className="inline-flex items-center min-h-11 gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Popüler Rüyalar
        </Link>
        <Link
          to="/kategoriler"
          className="inline-flex items-center min-h-11 gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Layers className="h-4 w-4" />
          Tüm Kategoriler
        </Link>
      </div>
    </div>
  );
}
