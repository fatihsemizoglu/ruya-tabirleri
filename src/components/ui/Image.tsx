import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export function Image({ className, alt, src, fallback, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <img
      className={cn(
        'transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
        error && 'hidden',
        className
      )}
      alt={alt}
      src={error || !src ? fallback : src}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  );
}