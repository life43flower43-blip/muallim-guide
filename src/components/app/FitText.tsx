"use client";

// نص في سطر واحد دائمًا: يصغر خطه تلقائيًّا حتى يتسع لمكانه، مهما كبّر المستخدم خط هاتفه
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// مجموعات النصوص التي يجب أن تتساوى أحجامها: كل نص يُقاس وحده، ثم تأخذ المجموعة كلها أصغر حجم
const groups = new Map<string, Map<HTMLElement, number>>();

function applyGroup(key: string) {
  const g = groups.get(key);
  if (!g || g.size === 0) return;
  const size = Math.min(...g.values());
  for (const el of g.keys()) el.style.fontSize = `${size}px`;
}

export function FitText({ children, max = 18, min = 11, className, group }: { children: string; max?: number; min?: number; className?: string; group?: string }) {
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
      if (group) {
        if (!groups.has(group)) groups.set(group, new Map());
        groups.get(group)!.set(el, size);
        applyGroup(group);
      }
    };
    fit();
    // الخط العربي يُحمَّل بعد أول رسم، فيُعاد القياس بعد اكتماله
    document.fonts?.ready.then(fit);
    // يُعاد القياس عند تغيّر العرض فقط، فتغيّر الارتفاع بتغيّر الخط لا يعيد القياس بلا نهاية
    let lastW = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === lastW) return;
      lastW = el.clientWidth;
      fit();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (group) groups.get(group)?.delete(el);
    };
  }, [children, max, min, group]);
  return (
    <span ref={ref} className={cn("block min-w-0 overflow-hidden whitespace-nowrap", className)}>
      {children}
    </span>
  );
}
