"use client";

// شريط رفيع أعلى الشاشة يمتلئ كلما تقدم القارئ في المقال
import { useEffect, useState } from "react";

export default function ReadProgress({ color = "#E8A317" }: { color?: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return <div className="fixed inset-x-0 top-0 z-[60] h-1 origin-right" style={{ background: color, transform: `scaleX(${p})` }} aria-hidden="true" />;
}
