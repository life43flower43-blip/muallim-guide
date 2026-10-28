"use client";

// الخرائط الذهنية المتحركة — إحدى عشرة خريطة (نظريات التعلم، والمعرفة والتذكر والفهم، وخريطة لكل مقرر،
// من التقويم إلى المكتبة التربوية): فروع تُفتح وتُطوى، ومشاهد قصيرة ورسوم تشرح الفكرة خطوة بخطوة،
// وزر «تدرّب على هذه الفكرة» يفتح أسئلة المفهوم من البنك
import { useEffect, useState } from "react";
import { useUi } from "@/lib/ui-store";
import { questionsOfConcept, shuffle } from "@/lib/qbank";
import { ScreenShell } from "./ui-kit";

export default function MindMapView() {
  const clearMind = useUi((s) => s.clearMind);
  // يتبع الإطار سمة التطبيق الحالية (فاتح أو داكن)
  const [src] = useState(() => {
    const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    return `/tools/mindmap.html?embed=1&theme=${dark ? "dark" : "light"}`;
  });
  // الخريطة تطلب تدريبًا على مفهوم: نغلقها ونفتح جلسة بأسئلته
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "turbawy-practice") return;
      const qids = shuffle(questionsOfConcept(String(e.data.conceptId))).slice(0, 10).map((q) => q.id);
      if (!qids.length) return;
      const ui = useUi.getState();
      ui.clearMind();
      ui.startQuiz({ mode: "training", label: `تدريب: ${String(e.data.title ?? "")}`, qids, conceptId: String(e.data.conceptId) });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  return (
    <ScreenShell title="الخرائط الذهنية المتحركة" onClose={clearMind} wide bare>
      <iframe src={src} title="الخرائط الذهنية المتحركة" className="absolute inset-0 h-full w-full border-0 bg-background" />
    </ScreenShell>
  );
}
