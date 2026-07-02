'use client';
import { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value?: number | null;
  duration?: number;
  decimals?: number;
  formatter?: (n: number) => string;
  className?: string;
}

// Animates from 0 -> value once, on mount / whenever `value` changes to a new
// number. Respects prefers-reduced-motion by jumping straight to the final
// value instead of animating.
export default function CountUpNumber({
  value, duration = 900, decimals = 0, formatter, className,
}: CountUpNumberProps) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>();
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const target = typeof value === 'number' && !isNaN(value) ? value : 0;

    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplay(target);
      return;
    }

    fromRef.current = display;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(fromRef.current + (target - fromRef.current) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const rounded = decimals > 0 ? Number(display.toFixed(decimals)) : Math.round(display);
  const text = formatter ? formatter(rounded) : rounded.toLocaleString('en-IN');

  return <span className={className}>{text}</span>;
}
