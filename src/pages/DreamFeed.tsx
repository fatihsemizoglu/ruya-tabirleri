import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Eye, Heart, TrendingUp, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { fetchDreamFeed } from "@/lib/api/dreams";
import { queryKeys } from "@/lib/query/client";
import type { Dream, Category } from "@/types/database";

const DreamFeed = () => {
  const { data: dreams, isLoading } = useQuery({
    queryKey: queryKeys.dreams.feed(30),
    queryFn: () => fetchDreamFeed(30),
    staleTime: 1000 * 60 * 2,
  });

  return (
    <Layout>
      <Seo
        title="Rüya Akışı - En Popüler Rüya Tabirleri"
        description="En çok okunan rüya tabirlerini keşfedin. Diğer kullanıcıların merak ettiği rüyaların anlamlarını öğrenin."
        path="/akis"
      />

      <div className="container px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Compass className="h-5 w-5 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Rüya Akışı</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            En popüler rüya tabirleri. Her gün binlerce kişi rüyasının anlamını öğreniyor.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dreams?.map((dream, i) => (
              <DreamFeedCard key={dream.id} dream={dream as Dream & { category?: Category }} index={i} />
            ))}
          </div>
        )}

        {dreams?.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Henüz rüya bulunmuyor</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

function DreamFeedCard({ dream, index }: { dream: Dream & { category?: Category }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link
        to={`/ruya/${dream.slug}`}
        className="group block p-5 rounded-2xl border border-border/50 bg-card/80 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
            {dream.title}
          </h3>
          <span className="text-2xl shrink-0 opacity-60">#{(index + 1).toLocaleString("tr-TR")}</span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
          {dream.content}
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {dream.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {dream.like_count || 0}
            </span>
          </div>

          {dream.category && (
            <span className="text-[11px] font-medium text-primary bg-primary/5 px-2.5 py-1 rounded-full truncate max-w-[140px]">
              {dream.category.name}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default DreamFeed;
