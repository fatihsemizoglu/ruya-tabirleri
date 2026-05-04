import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuresApi } from '@/lib/api/features';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Clock, Video, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ConsultantsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: consultants, isLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => featuresApi.getConsultants(),
  });

  const { data: appointments } = useQuery({
    queryKey: ['user-appointments'],
    queryFn: () => featuresApi.getAppointments(),
    enabled: !!user,
  });

  const bookMutation = useMutation({
    mutationFn: () => featuresApi.bookAppointment(
      selectedConsultant.id,
      bookingDate,
      60,
      bookingNotes || undefined
    ),
    onSuccess: () => {
      toast.success('Randevu başarıyla oluşturuldu!');
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      setDialogOpen(false);
      setBookingDate('');
      setBookingNotes('');
    },
    onError: () => toast.error('Randevu oluşturulamadı'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => featuresApi.cancelAppointment(id),
    onSuccess: () => {
      toast.success('Randevu iptal edildi');
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
    },
  });

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            Rüya Danışmanlığı
          </h1>
          <p className="text-muted-foreground mt-2">
            Uzman rüya yorumcularıyla birebir görüşün.
          </p>
        </div>

        {/* Danışmanlar */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {(consultants?.data || []).map((consultant: any) => (
              <Card key={consultant.id} className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      {consultant.avatar_url ? (
                        <img src={consultant.avatar_url} alt={consultant.title} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{consultant.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{consultant.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-muted-foreground ml-1">({consultant.total_sessions} seans)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{consultant.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(consultant.specialties || []).map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {consultant.hourly_rate ? `₺${consultant.hourly_rate}/saat` : 'Ücretsiz'}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedConsultant(consultant);
                        setDialogOpen(true);
                      }}
                      disabled={!user}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Randevu Al
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Randevularım */}
        {user && appointments?.data && appointments.data.length > 0 && (
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">Randevularım</h2>
              <div className="space-y-3">
                {(appointments?.data || []).map((apt: any) => (
                <Card key={apt.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{apt.consultants?.title || 'Danışman'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(apt.appointment_date).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apt.status === 'confirmed' ? 'default' : apt.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {apt.status === 'pending' ? 'Beklemede' :
                         apt.status === 'confirmed' ? 'Onaylandı' :
                         apt.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                      </Badge>
                      {apt.status === 'pending' && (
                        <Button variant="destructive" size="sm" onClick={() => cancelMutation.mutate(apt.id)}>
                          İptal Et
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Randevu Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Randevu Al - {selectedConsultant?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tarih ve Saat</Label>
                <Input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <Label>Notlar (opsiyonel)</Label>
                <Input
                  placeholder="Rüyanız hakkında kısa bilgi..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => bookMutation.mutate()}
                disabled={!bookingDate || bookMutation.isPending}
              >
                {bookMutation.isPending ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
