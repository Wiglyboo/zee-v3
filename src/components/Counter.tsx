import { useEffect, useRef, useState } from "react";

export const Counter = ({ value, suffix = "", duration = 900 }: { value: number; suffix?: string; duration?: number }) => {
  const [n, setN] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const p = Math.min(1, (t - start.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="font-mono-num">{n}{suffix}</span>;
};
