import { useQuery } from '@tanstack/react-query';
import { communityApi } from '@/lib/api/features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TrendingThemes() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['trending-themes'],
    queryFn: () => communityApi.getWeeklyTrending(8),
    refetchInterval: 300000,
  });

  const themes = response?.data || [];

  if (isLoading || themes.length === 0) return null;

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Haftanın Popüler Temaları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {themes.map((theme: any, index: number) => (
            <Link
              key={theme.keyword}
              to={`/ara?q=${encodeURIComponent(theme.keyword)}`}
              className="group"
            >
              <Badge
                variant={index < 3 ? 'default' : 'secondary'}
                className={`px-3 py-1.5 text-sm cursor-pointer transition-all hover:scale-105 ${
                  index === 0 ? 'bg-orange-500 hover:bg-orange-600' :
                  index === 1 ? 'bg-amber-500 hover:bg-amber-600' :
                  index === 2 ? 'bg-yellow-500 hover:bg-yellow-600' :
                  'hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {index < 3 && <TrendingUp className="h-3 w-3 mr-1" />}
                {theme.keyword}
                <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="ml-1.5 text-xs opacity-70">
                  {theme.count} rüya
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
