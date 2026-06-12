/**
 * Web Share API helper with clipboard fallback.
 * Uses navigator.share on capable devices (iOS Safari, Android Chrome, etc.)
 * Falls back to navigator.clipboard.writeText on desktop.
 *
 * Returns true if the user successfully shared/copied, false if cancelled.
 */
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
