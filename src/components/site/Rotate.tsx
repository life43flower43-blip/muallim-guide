"use client";
// يعرض عنصرًا مختلفًا في كل زيارة: الخادم يرسم المرشحين، والمتصفح يختار أحدهم
// (لا يتكرر المقال الذي ظهر في الزيارة السابقة)
import { Children, useEffect, useState, type ReactNode } from "react";

function seen(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function remember(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(-30)));
  } catch {}
}

/** يختار عنصرًا واحدًا لم يظهر مؤخرًا */
export function RotateOne({ ids, children, storeKey = "turbawy-feat" }: { ids: string[]; children: ReactNode; storeKey?: string }) {
  const items = Children.toArray(children);
  const [i, setI] = useState(0);
  useEffect(() => {
    const old = seen(storeKey);
    const fresh = ids.map((id, n) => [id, n] as const).filter(([id]) => !old.includes(id));
    const pool = fresh.length ? fresh : ids.map((id, n) => [id, n] as const);
    const [id, n] = pool[Math.floor(Math.random() * pool.length)];
    setI(n);
    remember(storeKey, fresh.length ? [...old, id] : [id]);
  }, [ids, storeKey]);
  return <>{items[i]}</>;
}

/** يخلط ترتيب العناصر ويعرض عددًا منها */
export function Shuffle({ children, show }: { children: ReactNode; show: number }) {
  const items = Children.toArray(children);
  const [order, setOrder] = useState<number[]>(() => items.map((_, n) => n));
  useEffect(() => {
    const o = items.map((_, n) => n);
    for (let k = o.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [o[k], o[j]] = [o[j], o[k]];
    }
    setOrder(o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  return <>{order.slice(0, show).map((n) => items[n])}</>;
}
