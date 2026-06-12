/**
 * Haptic feedback utility using the Vibration API.
 * Silently no-ops on devices/browsers that don't support it.
 *
 * Usage:
 *   haptic('light');  // 10ms - subtle tap
 *   haptic('medium'); // 20ms - standard button press
 *   haptic('heavy');  // 40ms - important action
 *   haptic('success');// [10, 30, 10] - double tap pattern
 *   haptic('error');  // [50, 50, 50] - error pattern
 */
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 10],
  error: [50, 50, 50],
  warning: [30, 30, 30],
};

export function haptic(pattern: HapticPattern = 'light'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    // Some browsers throw if user hasn't interacted yet — ignore
  }
}
