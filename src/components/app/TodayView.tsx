"use client";

// ============================================================================
// الرئيسية: واجهة التطبيق — بطاقة الاستعداد، ثم ستة أبواب مصوّرة لأقسامه
// ============================================================================

import { useMemo } from "react";
import { Brain, CalendarDays, ChevronLeft, ClipboardList, Network, Presentation, Star, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { overallReadiness } from "@/lib/practice-bank";
import { ad } from "@/lib/arabic";
import type { Tab } from "./AppShell";

type Door = { title: string; img: string; icon: React.ElementType; tint: string; ink: string; run: () => void };

export default function TodayView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const ui = useUi();
  const readiness = useMemo(() => Math.round(overallReadiness(attempts) * 100), [attempts]);

  const doors: Door[] = [
    { title: "المفاهيم التربوية", img: "/home/concepts.jpg", icon: Brain, tint: "#D9EFE4", ink: "#1F6F5C", run: () => onGoTab("learn") },
    { title: "مهارات التدريس", img: "/home/skills.jpg", icon: Presentation, tint: "#E2E3F4", ink: "#3B4A8C", run: ui.startLab },
    { title: "طرائق التدريس", img: "/home/methods.jpg", icon: Network, tint: "#F6E9CF", ink: "#9A6A12", run: () => { ui.openCourseTab("M5"); onGoTab("learn"); } },
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
        className="relative flex w-full items-center gap-2.5 overflow-hidden rounded-[28px] bg-gradient-to-l from-[#2C7D69] to-[#1C5E4F] p-4 text-right text-white shadow-[0_8px_24px_-12px_rgba(19,111,92,0.7)]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[17px] font-bold">
            <Star className="h-5 w-5 shrink-0" fill="#F5C451" stroke="#F5C451" /> مستوى الاستعداد
          </span>
          <span className="block text-sm text-white/80">للتدريس</span>
          <span className="mt-3 block h-2.5 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full bg-[#9BE8CF]" style={{ width: `${readiness}%` }} />
          </span>
        </span>
        <span className="relative h-16 w-16 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#9BE8CF" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(readiness / 100) * 97.4} 97.4`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold">{ad(readiness)}٪</span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/ready.png" alt="" className="h-[76px] w-[92px] shrink-0 rounded-2xl object-cover" />
      </button>

      {/* أبواب التطبيق */}
      <div className="grid grid-cols-2 gap-3.5">
        {doors.map((d) => (
          <button key={d.title} type="button" onClick={d.run} className="group overflow-hidden rounded-[28px] bg-[#FBF9F3] text-right shadow-[0_6px_18px_-10px_rgba(16,64,52,0.35)] transition active:scale-[0.98] dark:bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.img} alt="" className="h-[104px] w-full object-cover" />
            <span className="relative -mt-6 flex min-h-[78px] items-center gap-2 rounded-t-[24px] bg-[#FBF9F3] px-2.5 py-2 dark:bg-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: d.tint, color: d.ink }}>
                <d.icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 text-[17px] font-bold leading-6 text-[#174D41] dark:text-foreground">{d.title}</span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-[#174D41]/60" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
