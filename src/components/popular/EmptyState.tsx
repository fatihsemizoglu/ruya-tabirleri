import { EmptyState as PremiumEmptyState } from '@/components/ui/empty-state';

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-8">
      <PremiumEmptyState
        icon="search"
        title={message}
        description="Filtreleri değiştirerek veya aramayı temizleyerek yeni sonuçlar keşfedebilirsiniz."
      />
    </div>
  );
}
