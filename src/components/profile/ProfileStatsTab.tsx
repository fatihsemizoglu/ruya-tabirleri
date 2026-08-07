import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, MessageCircle, Book, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { t } from '@/constants/translations';
import { moodColors, moodOptions } from '@/lib/profile-constants';
import type { Dream, Comment } from '@/types/database';

export type UserComment = Comment & { dreams?: Dream };

export interface ProfileStats {
  totalFavorites: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  journalEntries: number;
  memberSince: string;
  moodDistribution: Record<string, number>;
  recentActivity: { type: string; title: string; date: string; link?: string }[];
}

interface ProfileStatsTabProps {
  stats: ProfileStats;
  isLoading: boolean;
  userComments: UserComment[];
  locale?: string;
}

export function ProfileStatsTab({ stats, isLoading, userComments, locale = 'tr-TR' }: ProfileStatsTabProps) {
  const getMoodLabel = (moodValue: string) => {
    const opt = moodOptions.find(m => m.value === moodValue);
    return opt ? t(`profile.${opt.key}`) : moodValue;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 surface rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
            <TrendingUp className="h-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-serif-dream font-bold">{t('profile.activitySummary')}</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: t('profile.statFavoritesLabel'), value: stats.totalFavorites, max: 100 },
            { label: t('profile.statViewsLabel'), value: stats.totalViews, max: 50 },
            { label: t('profile.statCommentsLabel'), value: stats.totalComments, max: 100 },
            { label: t('profile.statLikesLabel'), value: stats.totalLikes, max: 20 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
              <Progress value={Math.min(item.value * item.max / 100 * 100, 100)} className="h-2 rounded-full" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Mood Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
            <Award className="h-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-serif-dream font-bold">{t('profile.moodDistribution')}</h3>
        </div>
        {Object.keys(stats.moodDistribution).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stats.moodDistribution).map(([mood, count]) => {
              const moodOption = moodOptions.find(m => m.value === mood);
              const percentage = Math.round((count / stats.journalEntries) * 100);
              const radius = 24;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (percentage / 100) * circumference;
              const colors = moodColors[mood] ?? moodColors.neutral ?? { ring: 'stroke-slate-400', text: 'text-slate-500', bg: 'bg-slate-500/10' };

              return (
                <div key={mood} className="flex flex-col items-center p-3 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/30 transition-all text-center">
                  <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        className="text-muted/40"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="32"
                        cy="32"
                      />
                      <circle
                        className={`${colors.ring} transition-all duration-700`}
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="32"
                        cy="32"
                      />
                    </svg>
                    <span className="absolute text-2xl">{moodOption?.emoji}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground line-clamp-1">
                    {getMoodLabel(mood)}
                  </span>
                  <span className={`text-[10px] font-bold ${colors.text} mt-0.5`}>
                    {percentage}% · {count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Book className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t('profile.noMood')}</p>
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="surface p-6 md:col-span-2"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
            <Clock className="h-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-serif-dream font-bold">{t('profile.recentActivities')}</h3>
        </div>
        {stats.recentActivity.length > 0 ? (
          <div className="relative pl-8 border-l-2 border-border/60 space-y-4">
            {stats.recentActivity.map((activity, index) => {
              const isComment = activity.type === 'comment';
              return (
                <div key={index} className="relative">
                  <div className={`absolute -left-[37px] top-3 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center ${
                    isComment
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-br from-violet-500 to-purple-500'
                  }`}>
                    {isComment ? (
                      <MessageCircle className="h-2 w-2 text-white" />
                    ) : (
                      <Book className="h-2 w-2 text-white" />
                    )}
                  </div>

                  <Link
                    to={activity.link || '#'}
                    className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/30 hover:bg-muted/50 transition-all block"
                  >
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                      isComment
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-violet-500/10 text-violet-600'
                    }`}>
                      {isComment ? <MessageCircle className="h-5 w-5" /> : <Book className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.date).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t('profile.noActivity')}</p>
          </div>
        )}
      </motion.div>

      {/* User Comments */}
      {userComments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="surface p-6 md:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                <MessageCircle className="h-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-serif-dream font-bold">{t('profile.myComments')}</h3>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {t('profile.totalBadge', { count: stats.totalComments })}
            </Badge>
          </div>
          <div className="space-y-3">
            {userComments.slice(0, 5).map((comment) => (
              <div key={comment.id} className="p-4 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  {comment.dreams?.slug ? (
                    <Link
                      to={`/ruya/${comment.dreams.slug}`}
                      className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1 flex-1"
                    >
                      {comment.dreams?.title || t('profile.dreamFallback')}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold">{comment.dreams?.title || t('profile.dreamFallback')}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Heart className="h-3 w-3" />
                    {comment.like_count || 0}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(comment.created_at).toLocaleDateString(locale)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
