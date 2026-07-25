export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export async function nativeShare(data: ShareData): Promise<'shared' | 'copied' | 'cancelled' | 'unsupported'> {
  const canShareData = !data.files || (typeof navigator !== 'undefined' && navigator.canShare?.(data));

  if (typeof navigator !== 'undefined' && 'share' in navigator && canShareData) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (data.url) {
    const ok = await copyToClipboard(data.url);
    return ok ? 'copied' : 'unsupported';
  }

  return 'unsupported';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function getMoodEmoji(mood: string | null | undefined): string {
  const map: Record<string, string> = {
    happy: '😊', sad: '😢', scared: '😨', confused: '😕',
    peaceful: '😌', anxious: '😰', excited: '🤩', neutral: '😐',
  };
  return mood ? map[mood] || '' : '';
}

export interface DreamCardData {
  title: string;
  content: string;
  date: string;
  mood: string | null;
  tags: string[];
  sentiment?: string;
  interpretation?: string;
}

export async function shareDreamCard(dream: DreamCardData): Promise<'shared' | 'copied' | 'cancelled' | 'unsupported'> {
  const moodEmoji = getMoodEmoji(dream.mood);
  const dateStr = new Date(dream.date).toLocaleDateString('tr-TR');
  const tagStr = dream.tags.length > 0 ? `\n🏷️ ${dream.tags.slice(0, 3).join(', ')}` : '';
  const sentimentEmoji = dream.sentiment === 'positive' ? '🌟' : dream.sentiment === 'negative' ? '🌧️' : '☁️';
  const analysisStr = dream.interpretation ? `\n\n${sentimentEmoji} ${dream.interpretation}` : '';

  const text = `${moodEmoji} Rüyam: ${dream.title}\n📅 ${dateStr}\n\n${dream.content}${tagStr}${analysisStr}\n\n#RüyaTabirleri`;

  return nativeShare({ title: `Rüyam: ${dream.title}`, text });
}

export async function copyDreamCard(dream: DreamCardData): Promise<boolean> {
  const moodEmoji = getMoodEmoji(dream.mood);
  const dateStr = new Date(dream.date).toLocaleDateString('tr-TR');
  const tagStr = dream.tags.length > 0 ? `\n🏷️ ${dream.tags.slice(0, 3).join(', ')}` : '';
  const sentimentEmoji = dream.sentiment === 'positive' ? '🌟' : dream.sentiment === 'negative' ? '🌧️' : '☁️';
  const analysisStr = dream.interpretation ? `\n\n${sentimentEmoji} ${dream.interpretation}` : '';

  const text = `${moodEmoji} Rüyam: ${dream.title}\n📅 ${dateStr}\n\n${dream.content}${tagStr}${analysisStr}\n\n#RüyaTabirleri`;

  return copyToClipboard(text);
}
