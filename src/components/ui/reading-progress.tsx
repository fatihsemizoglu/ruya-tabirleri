import { useState, useEffect } from 'react';

interface ReadingProgressProps {
  targetRef: React.RefObject<HTMLElement>;
}

export function ReadingProgress({ targetRef }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!targetRef.current) return;
      
      const element = targetRef.current;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - windowHeight;
      
      if (docHeight <= 0) {
        setProgress(100);
        return;
      }
      
      const scrolled = -rect.top;
      const percent = Math.min(100, Math.max(0, (scrolled / docHeight) * 100));
      setProgress(percent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}