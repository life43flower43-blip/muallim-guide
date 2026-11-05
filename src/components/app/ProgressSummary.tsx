"use client";
// أرقامك وإنجازاتك في صف مضغوط: يظهر في شاشة التدريب
import { useMemo } from "react";
import { BookOpen, CheckCircle2, Flame, Gem, Target, Trophy } from "lucide-react";
import { useApp } from "@/lib/store";
import { COURSES, chaptersOfCourse } from "@/lib/qbank";
import { chapterStats } from "@/lib/practice-bank";
import { useMistakes } from "@/lib/mistakes-client";
import { useWallet } from "@/lib/account-client";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { pct } from "./ui-kit";

export default function ProgressSummary() {
  const attempts = useApp((s) => s.attempts);
  const best = useApp((s) => s.best);
  const wallet = useWallet();
  const { data: mistakes } = useMistakes();
  const stats = useMemo(() => {
    const all = Object.values(attempts);
    const correct = all.filter((a) => a.correct).length;
    let chaptersMastered = 0;
    for (const c of COURSES) for (const ch of chaptersOfCourse(c.id)) if (chapterStats(c.id, ch, attempts).level >= 2) chaptersMastered++;
    const examsPassed = Object.entries(best).filter(([k, v]) => k.endsWith("::exam") && v >= 60).length;
    return { answered: all.length, accuracy: all.length ? (correct / all.length) * 100 : 0, chaptersMastered, examsPassed };
  }, [attempts, best]);
  const fixed = mistakes?.stats.mastered ?? 0;

  const numbers = [
    { icon: Flame, label: "أيام متتالية", value: ad(wallet.streak) },
    { icon: Target, label: "سؤالًا", value: ad(stats.answered) },
    { icon: CheckCircle2, label: "الدقة", value: pct(stats.accuracy) },
    { icon: Gem, label: "جوهرة", value: ad(wallet.gems) },
  ];
  const achievements = [
    { id: "streak", name: "المواظبة", icon: Flame, value: wallet.streak, tiers: [3, 7, 14, 30, 100] },
    { id: "answered", name: "التدريب", icon: Target, value: stats.answered, tiers: [25, 100, 250, 500, 1000] },
    { id: "chapters", name: "الإتقان", icon: BookOpen, value: stats.chaptersMastered, tiers: [1, 5, 10, 25, 50] },
    { id: "fixed", name: "الأخطاء", icon: CheckCircle2, value: fixed, tiers: [1, 10, 25, 50, 100] },
    { id: "exams", name: "الاختبارات", icon: Trophy, value: stats.examsPassed, tiers: [1, 2, 3, 5, 8] },
  ];

  return (
    <section className="rounded-[20px] border border-[var(--t075)] bg-white px-3 py-3 dark:border-border dark:bg-card">
      <div className="grid grid-cols-4 gap-1 text-center">
        {numbers.map((n) => (
          <div key={n.label} className="flex min-w-0 flex-col items-center">
            <n.icon className="h-4 w-4 text-[#C9971C]" />
            <span className="mt-0.5 font-display text-[16px] font-extrabold leading-6">{n.value}</span>
            <span className="text-[11px] text-muted-foreground">{n.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1 border-t border-[var(--t075)] pt-3 dark:border-border">
        {achievements.map((a) => {
          const level = a.tiers.filter((t) => a.value >= t).length;
          const maxed = level === a.tiers.length;
          const prev = level === 0 ? 0 : a.tiers[level - 1];
          const target = maxed ? a.tiers[a.tiers.length - 1] : a.tiers[level];
          const frac = maxed ? 1 : Math.max(0, Math.min(1, (a.value - prev) / (target - prev)));
          const C = 2 * Math.PI * 15;
          return (
            <div key={a.id} className="flex min-w-0 flex-col items-center gap-0.5 text-center">
              <span className="relative flex h-9 w-9 items-center justify-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--t100)" strokeWidth="2.5" />
                  {frac > 0 && <circle cx="18" cy="18" r="15" fill="none" stroke="#C9971C" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} />}
                </svg>
                <a.icon className={cn("h-4 w-4", level === 0 ? "text-muted-foreground" : "text-foreground")} />
              </span>
              <span className="w-full truncate text-[11px] font-bold">{a.name}</span>
              <span className="text-[10px] text-muted-foreground">{ad(level)}/٥</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
