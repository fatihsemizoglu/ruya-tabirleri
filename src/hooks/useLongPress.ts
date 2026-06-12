import { useEffect, useRef, useCallback, useState } from 'react';

interface UseLongPressOptions {
  /** Callback fired after the user holds the element for the threshold duration. */
  onLongPress: (e: TouchEvent | MouseEvent) => void;
  /** Hold duration in ms before triggering (default 500). */
  threshold?: number;
  /** Max movement in px before the gesture is cancelled (default 10). */
  moveTolerance?: number;
  /** Optional onClick handler — fires only if the gesture was not a long press. */
  onClick?: (e: TouchEvent | MouseEvent) => void;
}

interface UseLongPressResult<T extends HTMLElement> {
  /** Ref to attach to the target element. */
  ref: React.RefObject<T>;
  /** Whether the user is currently holding (between touchstart and release). */
  isLongPressing: boolean;
}

/**
 * Detects long-press gestures on touch and mouse devices.
 *
 * - Starts a timer on press
 * - Cancels if the pointer moves more than `moveTolerance` px
 * - Cancels if the pointer is released before the timer fires
 * - Calls onLongPress() once when the threshold is reached
 * - Calls onClick() on a quick tap (released before the threshold)
 */
export function useLongPress<T extends HTMLElement = HTMLElement>({
  onLongPress,
  threshold = 500,
  moveTolerance = 10,
  onClick,
}: UseLongPressOptions): UseLongPressResult<T> {
  const ref = useRef<T>(null);
  const timer = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const triggered = useRef(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    startPos.current = null;
    setIsLongPressing(false);
  }, []);

  const start = useCallback(
    (clientX: number, clientY: number, e: TouchEvent | MouseEvent) => {
      triggered.current = false;
      startPos.current = { x: clientX, y: clientY };
      setIsLongPressing(true);
      timer.current = window.setTimeout(() => {
        triggered.current = true;
        setIsLongPressing(false);
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const move = useCallback(
    (clientX: number, clientY: number) => {
      const start = startPos.current;
      if (!start) return;
      const dx = Math.abs(clientX - start.x);
      const dy = Math.abs(clientY - start.y);
      if (dx > moveTolerance || dy > moveTolerance) {
        clear();
      }
    },
    [clear, moveTolerance]
  );

  const end = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      if (!triggered.current && onClick) {
        onClick(e);
      }
      triggered.current = false;
      startPos.current = null;
      setIsLongPressing(false);
    },
    [onClick]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start(t.clientX, t.clientY, e);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => end(e);
    const onMouseDown = (e: MouseEvent) => start(e.clientX, e.clientY, e);
    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => end(e);
    const onMouseLeave = (e: MouseEvent) => {
      if (startPos.current) end(e);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      clear();
    };
  }, [start, move, end, clear]);

  return { ref, isLongPressing };
}
