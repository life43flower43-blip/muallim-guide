"use client";

// ============================================================================
// الرئيسية: واجهة التطبيق — بطاقة الاستعداد، ثم ستة أبواب مصوّرة لأقسامه
// ============================================================================

import { useMemo } from "react";
import { Brain, CalendarDays, ClipboardList, Network, Presentation, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { overallReadiness } from "@/lib/practice-bank";
import { ad } from "@/lib/arabic";
import type { Tab } from "./AppShell";
import { FitText } from "./FitText";

type Door = { title: string; img: string; icon: React.ElementType; tint: string; ink: string; run: () => void };

export default function TodayView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const ui = useUi();
  const readiness = useMemo(() => Math.round(overallReadiness(attempts) * 100), [attempts]);

  const doors: Door[] = [
    { title: "المفاهيم التربوية", img: "/home/concepts.jpg", icon: Brain, tint: "#D9EFE4", ink: "#1F6F5C", run: ui.startLearn },
    { title: "مهارات التدريس", img: "/home/skills.jpg", icon: Presentation, tint: "#E2E3F4", ink: "#3B4A8C", run: ui.startLab },
    { title: "طرائق التدريس", img: "/home/methods.jpg", icon: Network, tint: "#F6E9CF", ink: "#9A6A12", run: () => ui.openCourseTab("M5") },
    { title: "المواقف الصفية", img: "/home/situations.jpg", icon: Users, tint: "#D9EFE4", ink: "#1F6F5C", run: ui.startSim },
    { title: "اختبر نفسك", img: "/home/test.jpg", icon: ClipboardList, tint: "#E2E3F4", ink: "#3B4A8C", run: () => onGoTab("practice") },
    { title: "خطة الدرس", img: "/home/plan.jpg", icon: CalendarDays, tint: "#D9EFE4", ink: "#1F6F5C", run: ui.startStudio },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* مستوى الاستعداد */}
      <button
        type="button"
        onClick={() => onGoTab("practice")}
        className="relative block w-full overflow-hidden rounded-[24px] bg-gradient-to-l from-[#2C7D69] to-[#1C5E4F] px-4 py-3 text-right text-white shadow-[0_8px_24px_-12px_rgba(19,111,92,0.7)]"
      >
        <span className="flex items-center gap-4">
          {/* العنوان وتحته الشريط مباشرة، والحلقة بجانبهما في الوسط */}
          <span className="min-w-0 flex-1">
            <FitText max={17} className="font-bold leading-6">مستوى الاستعداد للتدريس</FitText>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/20">
              <span className="block h-full rounded-full bg-[#9BE8CF]" style={{ width: `${readiness}%` }} />
            </span>
          </span>
          <span className="relative h-12 w-12 shrink-0" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#9BE8CF" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(readiness / 100) * 97.4} 97.4`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold">{ad(readiness)}٪</span>
          </span>
        </span>
      </button>

      {/* أبواب التطبيق */}
      <div className="-mx-1 grid grid-cols-2 gap-2.5">
        {doors.map((d) => (
          <button key={d.title} type="button" onClick={d.run} className="overflow-hidden rounded-[26px] bg-white pb-1.5 text-right shadow-[0_8px_22px_-14px_rgba(16,64,52,0.5)] transition active:scale-[0.97] dark:bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.img} alt="" className="h-[130px] w-full object-cover" />
            {/* لوحة العنوان طافية فوق الصورة، والأيقونة على حافتها، فيأخذ العنوان العرض كله */}
            <span className="relative mx-1 -mt-7 flex min-h-[50px] items-center rounded-[20px] bg-white py-2 pl-[46px] pr-3 shadow-[0_2px_10px_-4px_rgba(16,64,52,0.35)] dark:bg-card">
              <span className="absolute left-1.5 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white shadow-sm dark:border-card" style={{ background: d.tint, color: d.ink }}>
                <d.icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <FitText max={15} min={8} className="flex-1 font-extrabold text-[#174D41] dark:text-foreground">{d.title}</FitText>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
