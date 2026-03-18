import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageSquare, 
  Users,
  BookOpen,
  FolderOpen,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

interface StatsData {
  totalDreams: number;
  totalCategories: number;
  totalUsers: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  featuredDreams: number;
  avgViewsPerDream: number;
}

interface CategoryStats {
  name: string;
  dreamCount: number;
}

interface TopDream {
  id: string;
  title: string;
  view_count: number;
  like_count: number;
}

export function StatisticsDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [topDreams, setTopDreams] = useState<TopDream[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAllStats();
  }, [timeRange]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverviewStats(),
        fetchCategoryStats(),
        fetchTopDreams(),
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewStats = async () => {
    const response = await adminApi.getStatistics();
    
    if (response.success && response.data) {
      const data = response.data;
      setStats({
        totalDreams: data.totalDreams,
        totalCategories: data.totalCategories,
        totalUsers: data.totalUsers,
        totalViews: data.totalViews,
        totalLikes: data.totalLikes,
        totalComments: data.totalComments,
        featuredDreams: data.featuredDreams,
        avgViewsPerDream: data.avgViewsPerDream,
      });
    }
  };

  const fetchCategoryStats = async () => {
    const response = await adminApi.getCategoryStats();
    
    if (response.success && response.data) {
      setCategoryStats(response.data.sort((a, b) => b.dreamCount - a.dreamCount));
    }
  };

  const fetchTopDreams = async () => {
    const response = await adminApi.getTopDreams(10);
    
    if (response.success && response.data) {
      setTopDreams(response.data);
    }
  };

  // Generate mock trend data based on time range
  const generateTrendData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, timeRange === '7d' ? 'EEE' : 'dd MMM', { locale: tr }),
        görüntülenme: Math.floor(Math.random() * 1000) + 500,
        beğeni: Math.floor(Math.random() * 100) + 20,
      });
    }
    
    return data;
  };

  const trendData = generateTrendData();

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">İstatistikler yükleniyor...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Site İstatistikleri</h2>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Gün
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Gün
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Gün
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAllStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Eye className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              12%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalViews.toLocaleString('tr-TR')}
          </p>
          <p className="text-sm text-slate-500">Toplam Görüntülenme</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Heart className="h-5 w-5 text-rose-600" />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              8%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalLikes.toLocaleString('tr-TR')}
          </p>
          <p className="text-sm text-slate-500">Toplam Beğeni</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-amber-600" />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              5%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalComments.toLocaleString('tr-TR')}
          </p>
          <p className="text-sm text-slate-500">Toplam Yorum</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="flex items-center text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              15%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalUsers.toLocaleString('tr-TR')}
          </p>
          <p className="text-sm text-slate-500">Toplam Kullanıcı</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Trend Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Trafik Trendi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="görüntülenme" 
                stroke="#6366f1" 
                fillOpacity={1} 
                fill="url(#colorViews)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="beğeni" 
                stroke="#ec4899" 
                fillOpacity={1} 
                fill="url(#colorLikes)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Kategori Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="dreamCount"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {categoryStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Dreams by Views */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">En Çok Görüntülenen Rüyalar</h3>
          <div className="space-y-3">
            {topDreams.slice(0, 5).map((dream, index) => (
              <div key={dream.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-slate-200 text-slate-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{dream.title}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {dream.view_count.toLocaleString('tr-TR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {dream.like_count.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Performance Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Kategori Performansı</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="dreamCount" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Özet Bilgiler</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalDreams}</p>
            <p className="text-sm text-slate-500">Rüya Tabiri</p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalCategories}</p>
            <p className="text-sm text-slate-500">Kategori</p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.avgViewsPerDream.toLocaleString('tr-TR')}</p>
            <p className="text-sm text-slate-500">Ort. Görüntülenme</p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.featuredDreams}</p>
            <p className="text-sm text-slate-500">Öne Çıkan</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
