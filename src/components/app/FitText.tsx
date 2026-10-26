"use client";

// نص في سطر واحد دائمًا: يصغر خطه تلقائيًّا حتى يتسع لمكانه، مهما كبّر المستخدم خط هاتفه
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function FitText({ children, max = 18, min = 11, className }: { children: string; max?: number; min?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (el.scrollWidth > el.clientWidth + 1 && size > min) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    // الخط العربي يُحمَّل بعد أول رسم، فيُعاد القياس بعد اكتماله
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, max, min]);
  return (
    <span ref={ref} className={cn("block min-w-0 overflow-hidden whitespace-nowrap", className)}>
      {children}
    </span>
  );
}
