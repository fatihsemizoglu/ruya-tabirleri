import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Hash, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/constants/translations';
import { moodColors, moodOptions, type MoodValue } from '@/lib/profile-constants';
import type { DreamJournalEntry } from '@/types/database';

interface JournalFormState {
  title: string;
  content: string;
  dream_date: string;
  mood: MoodValue;
  tags: string;
}

const today = () => new Date().toISOString().split('T')[0] ?? '';

const emptyForm = (): JournalFormState => ({
  title: '',
  content: '',
  dream_date: today(),
  mood: '',
  tags: '',
});

interface ProfileJournalTabProps {
  entries: DreamJournalEntry[];
  isLoading: boolean;
  onSubmit: (form: JournalFormState, selectedEntry: DreamJournalEntry | null) => void;
  onDelete: (id: string) => void;
  locale?: string;
}

export function ProfileJournalTab({ entries, isLoading, onSubmit, onDelete, locale = 'tr-TR' }: ProfileJournalTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DreamJournalEntry | null>(null);
  const [form, setForm] = useState<JournalFormState>(emptyForm());

  const openNew = () => {
    setSelectedEntry(null);
    setForm(emptyForm());
    setIsDialogOpen(true);
  };

  const openEdit = (entry: DreamJournalEntry) => {
    setSelectedEntry(entry);
    setForm({
      title: entry.title,
      content: entry.content,
      dream_date: entry.dream_date || today(),
      mood: (entry.mood || '') as MoodValue,
      tags: entry.tags?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, selectedEntry);
    setIsDialogOpen(false);
    setSelectedEntry(null);
    setForm(emptyForm());
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif-dream font-bold">{t('profile.journalTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('profile.journalDesc')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedEntry(null);
            setForm(emptyForm());
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25">
              <Plus className="mr-2 h-4 w-4" />
              {t('profile.newJournalBtn')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl border-border/45 bg-card text-card-foreground shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif-dream">
                {selectedEntry ? t('profile.editJournalTitle') : t('profile.newJournalTitle')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 text-foreground">
              <div className="space-y-2">
                <Label>{t('profile.titleLabel')}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t('profile.titlePlaceholder')}
                  aria-label={t('profile.titleLabel')}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('profile.dateLabel')}</Label>
                  <Input
                    type="date"
                    value={form.dream_date}
                    onChange={(e) => setForm({ ...form, dream_date: e.target.value })}
                    aria-label={t('profile.dateLabel')}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.moodLabel')}</Label>
                  <Select
                    value={form.mood}
                    onValueChange={(value) => setForm({ ...form, mood: value as MoodValue })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder={t('profile.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map((mood) => (
                        <SelectItem key={mood.value} value={mood.value}>
                          {mood.emoji} {t(`profile.${mood.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('profile.contentLabel')}</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={t('profile.contentPlaceholder')}
                  aria-label={t('profile.contentLabel')}
                  rows={5}
                  required
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('profile.tagsLabel')}</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder={t('profile.tagsPlaceholder')}
                  aria-label={t('profile.tagsLabel')}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  İptal
                </Button>
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                  {selectedEntry ? t('profile.update') : t('profile.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 surface rounded-2xl animate-pulse" />)}
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {entries.map((entry) => {
            const mood = moodOptions.find(m => m.value === entry.mood);
            const moodColor = entry.mood ? moodColors[entry.mood] : null;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative surface p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${moodColor ? moodColor.bg.replace('bg-', 'from-').replace('/10', '-500') : 'from-violet-500 to-fuchsia-500'} ${moodColor ? 'to-' + moodColor.bg.split('-')[1] + '-500' : ''}`} />

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                    <Calendar className="h-3 w-3" />
                    {new Date(entry.dream_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {mood && moodColor && (
                    <div className={`flex items-center gap-1 ${moodColor.bg} px-2.5 py-1 rounded-full text-xs font-semibold ${moodColor.text}`}>
                      <span>{mood.emoji}</span>
                      <span>{t(`profile.${mood.key}`)}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-serif-dream font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {entry.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-4 mb-4 leading-relaxed whitespace-pre-line">
                  {entry.content}
                </p>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {entry.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 border border-border/60">
                        <Hash className="w-2.5 h-2.5 inline mr-0.5 opacity-60" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(entry)}
                    className="rounded-lg flex-1 hover:bg-violet-500/10 hover:text-violet-600"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />{t('profile.editBtn')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(entry.id)}
                    className="rounded-lg flex-1 hover:bg-rose-500/10 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />{t('profile.deleteBtn')}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 surface rounded-3xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-9 h-9 text-violet-500" />
          </div>
          <h3 className="text-lg font-serif-dream font-bold mb-2">{t('profile.noJournals')}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('profile.noJournalsDesc')}</p>
          <Button
            onClick={openNew}
            className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('profile.newJournalBtn')}
          </Button>
        </motion.div>
      )}
    </>
  );
}
