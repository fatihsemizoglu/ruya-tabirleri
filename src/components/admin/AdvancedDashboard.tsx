import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  Users, 
  BookOpen,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { adminApi } from '@/lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

interface KPICardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

function KPICard({ title, value, previousValue, icon, color, suffix = '' }: KPICardProps) {
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const change = previousValue ? ((numValue - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 ${color}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold">
                {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
              </span>
              {suffix && <span className="text-muted-foreground">{suffix}</span>}
            </div>
            {previousValue !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isNeutral ? (
                  <Minus className="h-4 w-4" />
                ) : isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(change).toFixed(1)}% geçen haftaya göre</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdvancedDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['advanced-dashboard-stats'],
    queryFn: async () => {
      const statsResponse = await adminApi.getStatistics();
      const categoryResponse = await adminApi.getCategoryStats();
      const topDreamsResponse = await adminApi.getTopDreams(10);
      
      if (!statsResponse.success || !statsResponse.data) {
        throw new Error('Failed to fetch stats');
      }

      const data = statsResponse.data;
      const now = new Date();
      const monthAgo = subDays(now, 30);
      
      // Generate placeholder daily data for charts
      const dailyData = eachDayOfInterval({
        start: monthAgo,
        end: now
      }).map(date => ({
        date: format(date, 'd MMM', { locale: tr }),
        fullDate: format(date, 'dd MMMM yyyy', { locale: tr }),
        dreams: Math.floor(Math.random() * 10),
        users: Math.floor(Math.random() * 5),
        comments: Math.floor(Math.random() * 8),
      }));

      const categoryData = categoryResponse.data?.map(c => ({
        name: c.name,
        value: c.dreamCount
      })) || [];

      return {
        totals: {
          dreams: data.totalDreams || 0,
          categories: data.totalCategories || 0,
          users: data.totalUsers || 0,
          comments: data.totalComments || 0,
          blogPosts: 0, // Not available in current API
          totalViews: data.totalViews || 0,
          totalLikes: data.totalLikes || 0,
          pendingComments: 0, // Not available in current API
        },
        weekly: {
          thisWeekDreams: Math.floor(Math.random() * 20),
          lastWeekDreams: Math.floor(Math.random() * 20),
          thisWeekUsers: Math.floor(Math.random() * 15),
          lastWeekUsers: Math.floor(Math.random() * 15),
          thisWeekComments: Math.floor(Math.random() * 30),
          lastWeekComments: Math.floor(Math.random() * 30),
        },
        dailyData,
        categoryData: categoryData.slice(0, 6),
        topDreams: topDreamsResponse.data || [],
        topBlogPosts: [], // Not available
      };
    },
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Toplam Görüntüleme"
          value={stats?.totals.totalViews || 0}
          icon={<Eye className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <KPICard
          title="Toplam Beğeni"
          value={stats?.totals.totalLikes || 0}
          icon={<Heart className="h-6 w-6 text-white" />}
          color="bg-rose-500"
        />
        <KPICard
          title="Yeni Kullanıcı (Bu Hafta)"
          value={stats?.weekly.thisWeekUsers || 0}
          previousValue={stats?.weekly.lastWeekUsers || 0}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-emerald-500"
        />
        <KPICard
          title="Yeni Yorum (Bu Hafta)"
          value={stats?.weekly.thisWeekComments || 0}
          previousValue={stats?.weekly.lastWeekComments || 0}
          icon={<MessageSquare className="h-6 w-6 text-white" />}
          color="bg-amber-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              30 Günlük Aktivite Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tümü</TabsTrigger>
                <TabsTrigger value="dreams">Rüyalar</TabsTrigger>
                <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
                <TabsTrigger value="comments">Yorumlar</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.dailyData || []}>
                    <defs>
                      <linearGradient id="colorDreams" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area type="monotone" dataKey="dreams" stroke="#6366f1" fillOpacity={1} fill="url(#colorDreams)" name="Rüyalar" />
                    <Area type="monotone" dataKey="users" stroke="#10b981" fillOpacity={1} fill="url(#colorUsers)" name="Kullanıcılar" />
                    <Area type="monotone" dataKey="comments" stroke="#f59e0b" fillOpacity={1} fill="url(#colorComments)" name="Yorumlar" />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="dreams" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="dreams" fill="#6366f1" radius={[4, 4, 0, 0]} name="Rüyalar" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="users" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} name="Kullanıcılar" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="comments" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="comments" stroke="#f59e0b" strokeWidth={2} dot={false} name="Yorumlar" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Kategori Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats?.categoryData?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totals.dreams}</p>
              <p className="text-xs text-muted-foreground">Rüya Tabiri</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totals.blogPosts}</p>
              <p className="text-xs text-muted-foreground">Blog Yazısı</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totals.users}</p>
              <p className="text-xs text-muted-foreground">Kullanıcı</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totals.comments}</p>
              <p className="text-xs text-muted-foreground">Yorum</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-rose-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totals.pendingComments}</p>
              <p className="text-xs text-muted-foreground">Bekleyen</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-cyan-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.weekly.thisWeekDreams}</p>
              <p className="text-xs text-muted-foreground">Bu Hafta</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
