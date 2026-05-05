import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, Heart, Clock, Book, Settings, LogOut, Calendar, TrendingUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites, useHistory, useJournal, useLikes } from '@/hooks/useUserContent';
import { LoadingWrapper } from '@/components/ui/loading-wrapper';
import { EmptyState } from '@/components/ui/error-state';
import { toast } from 'sonner';

const moodOptions = [
  { value: 'happy', label: 'Mutlu', emoji: '😊' },
  { value: 'sad', label: 'Üzgün', emoji: '😢' },
  { value: 'scared', label: 'Korkmuş', emoji: '😨' },
  { value: 'confused', label: 'Şaşkın', emoji: '😕' },
  { value: 'peaceful', label: 'Huzurlu', emoji: '😌' },
  { value: 'anxious', label: 'Endişeli', emoji: '😰' },
  { value: 'excited', label: 'Heyecanlı', emoji: '🤩' },
  { value: 'neutral', label: 'Nötr', emoji: '😐' },
];

export default function Profile() {
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'profile';
  
  // Map Turkish tab names to internal values
  const tabMapping: Record<string, string> = {
    'profil': 'profile',
    'favoriler': 'favorites',
    'gecmis': 'history',
    'gunluk': 'journal'
  };
  
  const activeTab = tabMapping[rawTab] || rawTab;
  
  const { user, profile, signOut } = useAuth();
  
  const { data: favoritesData, isLoading: favoritesLoading, error: favoritesError } = useFavorites();
  const { data: historyData, isLoading: historyLoading, error: historyError } = useHistory();
  const { data: journalData, isLoading: journalLoading, error: journalError } = useJournal();
  const { data: likesData, isLoading: likesLoading, error: likesError } = useLikes();

  const favorites = favoritesData?.data || [];
  const history = historyData?.data || [];
  const entries = journalData?.data || [];
  const likes = likesData?.data || [];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Çıkış yapıldı');
    } catch (error) {
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  if (!user) {
    return <Layout><div className="container py-8">Lütfen giriş yapın</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="mb-8 flex flex-wrap">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              Favoriler ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              Geçmiş ({history.length})
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2">
              <Book className="w-4 h-4" />
              Rüya Günlüğü ({entries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileInfo user={user} profile={profile} onSignOut={handleSignOut} />
          </TabsContent>

          <TabsContent value="favorites">
            <LoadingWrapper
              isLoading={favoritesLoading}
              error={favoritesError}
            >
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav: any) => (
                    <Link key={fav.id} to={`/ruya/${fav.dreams?.slug}`} className="block p-4 border rounded-lg hover:shadow-md transition">
                      <h3 className="font-semibold">{fav.dreams?.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{fav.dreams?.content}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Heart}
                  title="Henüz favoriniz yok"
                  description="Beğendiğiniz rüyalar burada görünecek"
                />
              )}
            </LoadingWrapper>
          </TabsContent>

          <TabsContent value="history">
            <LoadingWrapper
              isLoading={historyLoading}
              error={historyError}
            >
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((item: any) => (
                    <Link key={item.id} to={`/ruya/${item.dreams?.slug}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <span>{item.dreams?.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.viewed_at).toLocaleDateString('tr-TR')}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="Henüz geçmişiniz yok"
                  description="Görüntülediğiniz rüyalar burada görünecek"
                />
              )}
            </LoadingWrapper>
          </TabsContent>

          <TabsContent value="journal">
            <LoadingWrapper
              isLoading={journalLoading}
              error={journalError}
            >
              {entries.length > 0 ? (
                <div className="space-y-4">
                  {entries.map((entry: any) => (
                    <div key={entry.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{entry.title}</h3>
                        <span className="text-sm text-muted-foreground">
                          {moodOptions.find(m => m.value === entry.mood)?.emoji}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(entry.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Book}
                  title="Henüz rüya günlüğünüz yok"
                  description="Rüyalarınızı kaydedin"
                />
              )}
            </LoadingWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function ProfileInfo({ user, profile, onSignOut }: { user: any; profile: any; onSignOut: () => void }) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{profile?.full_name || profile?.username || 'Kullanıcı'}</h2>
          <p className="text-muted-foreground">{profile?.email || user?.email}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}