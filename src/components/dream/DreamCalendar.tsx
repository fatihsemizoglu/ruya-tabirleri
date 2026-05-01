import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { featuresApi } from '@/lib/api/features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Moon, Sun, Calendar as CalendarIcon } from 'lucide-react';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', sad: '😢', scared: '😨', confused: '😕',
  peaceful: '😌', anxious: '😰', excited: '🤩', neutral: '😐',
};

export function DreamCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: response } = useQuery({
    queryKey: ['dream-calendar', year, month],
    queryFn: () => featuresApi.getCalendar(year, month),
  });

  const entries = response?.data?.entries || [];
  const sleepData = response?.data?.sleepData || [];

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const entryMap: Record<number, any> = {};
  entries.forEach((e: any) => {
    const day = new Date(e.dream_date).getDate();
    entryMap[day] = e;
  });

  const sleepMap: Record<number, any> = {};
  sleepData.forEach((s: any) => {
    const day = new Date(s.sleep_date).getDate();
    sleepMap[day] = s;
  });

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Rüya Takvimi
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center capitalize">{monthName}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const entry = entryMap[day];
            const sleep = sleepMap[day];
            const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

            return (
              <div
                key={day}
                className={`aspect-square p-1 rounded-lg border text-center flex flex-col items-center justify-center transition-colors ${
                  isToday ? 'border-primary bg-primary/10' :
                  entry ? 'border-primary/30 bg-primary/5' :
                  'border-transparent hover:bg-muted'
                }`}
              >
                <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>{day}</span>
                {entry && (
                  <span className="text-xs" title={entry.title}>
                    {MOOD_EMOJI[entry.mood] || '💭'}
                  </span>
                )}
                {sleep && !entry && (
                  <span className="text-xs opacity-60" title={`Uyku: ${sleep.quality}/5`}>
                    {sleep.quality >= 4 ? '😊' : sleep.quality >= 3 ? '😐' : '😴'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Aylık özet */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{entries.length}</p>
              <p className="text-xs text-muted-foreground">Rüya Kaydı</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">
                {entries.filter((e: any) => e.mood).length > 0
                  ? Object.entries(
                      entries.reduce((acc: any, e: any) => {
                        if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
                        return acc;
                      }, {})
                    ).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
                    ? MOOD_EMOJI[
                        Object.entries(
                          entries.reduce((acc: any, e: any) => {
                            if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
                            return acc;
                          }, {})
                        ).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
                      ]
                    : '-'
                  : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Baskın Ruh Hali</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">
                {sleepData.length > 0
                  ? (sleepData.reduce((sum: number, s: any) => sum + (s.quality || 0), 0) / sleepData.length).toFixed(1)
                  : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Ort. Uyku Kalitesi</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
