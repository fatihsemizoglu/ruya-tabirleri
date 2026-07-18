import { useMemo } from "react";
import { motion } from "framer-motion";
import { Award, Trophy, Star, Zap, Lock, ChevronRight, Sparkles, Moon, Share2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useUserXp, useUserBadges, useAvailableBadges, levelProgress } from "@/hooks/useGamification";
import type { Badge } from "@/types/database";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Award, Trophy, Star, Moon, Share2, Sparkles, Zap, Lock,
};

const rarityColors: Record<string, string> = {
  common: "from-slate-400 to-slate-300 border-slate-300",
  rare: "from-blue-500 to-cyan-400 border-blue-400",
  epic: "from-purple-500 to-pink-500 border-purple-400",
  legendary: "from-amber-400 to-orange-500 border-amber-400",
};

const rarityLabels: Record<string, string> = {
  common: "Yaygın",
  rare: "Nadir",
  epic: "Epik",
  legendary: "Efsanevi",
};

interface GamificationPanelProps {
  userId: string;
}

export function GamificationPanel({ userId }: GamificationPanelProps) {
  const { data: xpData, isLoading: xpLoading } = useUserXp(userId);
  const { data: userBadges, isLoading: badgesLoading } = useUserBadges(userId);
  const { data: allBadges, isLoading: allLoading } = useAvailableBadges();

  const isLoading = xpLoading || badgesLoading || allLoading;
  const earnedBadgeIds = useMemo(
    () => new Set(userBadges?.map((ub) => ub.badge_id) ?? []),
    [userBadges]
  );

  const xp = xpData?.xp ?? 0;
  const level = xpData?.level ?? 1;
  const streak = xpData?.login_streak ?? 0;
  const progress = levelProgress(xp, level);

  const groupedBadges = useMemo(() => {
    const groups: Record<string, { earned: Badge[]; locked: Badge[] }> = {};
    for (const badge of allBadges ?? []) {
      const cat = badge.category;
      if (!groups[cat]) groups[cat] = { earned: [], locked: [] };
      if (earnedBadgeIds.has(badge.id)) {
        groups[cat].earned.push(badge);
      } else {
        groups[cat].locked.push(badge);
      }
    }
    return groups;
  }, [allBadges, earnedBadgeIds]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-muted" />
        <div className="h-48 rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface p-6 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seviye {level}</p>
            <h3 className="text-2xl font-bold">{xp.toLocaleString("tr-TR")} XP</h3>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">İlerleme</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 rounded-full" />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-amber-500" />
            <span><strong className="text-foreground">{streak}</strong> gün seri</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4 text-purple-500" />
            <span><strong className="text-foreground">{earnedBadgeIds.size}</strong> rozet</span>
          </div>
        </div>
      </motion.div>

      {Object.entries(groupedBadges).map(([category, { earned, locked }]) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-6"
        >
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {category === "engagement" && "Etkileşim"}
            {category === "achievement" && "Başarımlar"}
            {category === "special" && "Özel"}
            {category === "loyalty" && "Sadakat"}
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {earned.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned />
            ))}
            {locked.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned={false} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  const Icon = iconMap[badge.icon] ?? Award;

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center p-3 rounded-xl border transition-all",
        earned
          ? "bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20"
          : "bg-muted/20 border-border/40 opacity-60"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-sm bg-gradient-to-br border",
          earned ? rarityColors[badge.rarity] : "from-muted to-muted/50 border-border/30"
        )}
      >
        {earned ? (
          <Icon className="h-6 w-6 text-white" />
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <p className={cn("text-xs font-semibold line-clamp-1", earned ? "text-foreground" : "text-muted-foreground")}>
        {badge.name}
      </p>
      <div className="flex items-center gap-1 mt-1">
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            earned
              ? "bg-amber-500/10 text-amber-600"
              : "bg-muted/50 text-muted-foreground"
          )}
        >
          {rarityLabels[badge.rarity] ?? badge.rarity}
        </span>
      </div>
      {badge.description && (
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
          {badge.description}
        </p>
      )}
    </div>
  );
}
