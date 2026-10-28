"use client";

// الخرائط الذهنية المتحركة — نظريات التعلم، والمعرفة والتذكر والفهم: فروع تُفتح وتُطوى،
// ورسوم متحركة تشرح كل فكرة خطوة بخطوة مع مثال من الصف، وجولة تلقائية
import { useState } from "react";
import { useUi } from "@/lib/ui-store";
import { ScreenShell } from "./ui-kit";

export default function MindMapView() {
  const clearMind = useUi((s) => s.clearMind);
  // يتبع الإطار سمة التطبيق الحالية (فاتح أو داكن)
  const [src] = useState(() => {
    const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    return `/tools/mindmap.html?embed=1&theme=${dark ? "dark" : "light"}`;
  });
  return (
    <ScreenShell title="الخرائط الذهنية المتحركة" onClose={clearMind} wide bare>
      <iframe src={src} title="الخرائط الذهنية المتحركة" className="absolute inset-0 h-full w-full border-0 bg-background" />
    </ScreenShell>
  );
}
