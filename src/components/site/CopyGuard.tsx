"use client";

// حماية المحتوى: يمنع تحديد النص في صفحات المحتوى، وإن نُسخ شيء يُضاف إليه رابط المصدر ويُقتصر على مقطع قصير
import { useEffect } from "react";

export default function CopyGuard() {
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea")) return;
      const sel = String(document.getSelection() ?? "");
      if (!sel.trim()) return;
      const short = sel.length > 160 ? sel.slice(0, 160) + "…" : sel;
      e.clipboardData?.setData("text/plain", `${short}\n\nالمصدر: ${location.origin}${location.pathname}`);
      e.preventDefault();
    };
    const onMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest("article img, main img")) e.preventDefault();
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onMenu);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onMenu);
    };
  }, []);
  return null;
}
