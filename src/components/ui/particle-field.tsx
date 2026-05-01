import { useEffect, useRef, useMemo } from 'react';

interface ParticleFieldProps {
  count?: number;
  className?: string;
  color?: string;
  maxSize?: number;
  speed?: number;
}

export function ParticleField({
  count = 30,
  className = '',
  color = 'rgba(99, 102, 241, 0.15)',
  maxSize = 4,
  speed = 0.5,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * maxSize + 1,
      speedX: (Math.random() - 0.5) * speed,
      speedY: (Math.random() - 0.5) * speed - 0.2,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, [count, maxSize, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((p) => {
        p.x += p.speedX * 0.05;
        p.y += p.speedY * 0.05;

        if (p.y < -5) { p.y = 105; p.x = Math.random() * 100; }
        if (p.x < -5) p.x = 105;
        if (p.x > 105) p.x = -5;

        const px = (p.x / 100) * canvas.offsetWidth;
        const py = (p.y / 100) * canvas.offsetHeight;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(/[\d.]+\)$/, `${p.opacity})`);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particles, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
