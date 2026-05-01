import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface QuickPreviewProps {
  children: React.ReactNode;
  preview: React.ReactNode;
  delay?: number;
}

export function QuickPreview({ children, preview, delay = 300 }: QuickPreviewProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timeout = useRef<NodeJS.Timeout>();
  const childRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeout.current = setTimeout(() => {
      if (childRef.current) {
        const rect = childRef.current.getBoundingClientRect();
        setPos({ x: rect.left, y: rect.bottom + 8 });
        setShow(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setShow(false);
  };

  return (
    <div
      ref={childRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && createPortal(
        <div
          className="fixed z-50 w-80 p-4 rounded-xl shadow-xl bg-popover border text-popover-foreground animate-in fade-in zoom-in-95 duration-200"
          style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
        >
          {preview}
        </div>,
        document.body
      )}
    </div>
  );
}