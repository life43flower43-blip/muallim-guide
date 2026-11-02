"use client";

// ============================================================================
// الرئيسية: بطاقة الاستعداد وفيها الإجراء الأول وأيام الأسبوع، ثم خمسة أبواب مصوّرة
// ============================================================================

import { useMemo, useState } from "react";
import { Check, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { dayStr, dayXpOf, useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { CONCEPTS, conceptsOfCourse } from "@/lib/qbank";
import { overallReadiness } from "@/lib/practice-bank";
import { ad } from "@/lib/arabic";
import type { Tab } from "./AppShell";

type Door = { title: string; img: string; pos?: string; note: string; run: () => void; wide?: boolean };

// دخول متتابع لعناصر الرئيسية: كل عنصر يصعد بنعومة بعد الذي قبله، كما في التطبيقات
const rise = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 + i * 0.06, type: "spring" as const, stiffness: 260, damping: 24 },
});

// اهتزاز خفيف عند اللمس إن سمحت به الإعدادات
const tick = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator && useApp.getState().haptics) navigator.vibrate(8);
};

/** أيام متتالية درس فيها المستخدم، تنتهي اليوم أو أمس */
function streakOf(sessions: { ts: number; xp?: number }[]): number {
  const d = new Date();
  // إن لم يدرس اليوم بعد، لا تنقطع السلسلة: نبدأ العدّ من أمس
  if (dayXpOf(sessions as never, dayStr(d)) <= 0) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dayXpOf(sessions as never, dayStr(d)) > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const streakText = (n: number) =>
  n === 0 ? "ابدأ سلسلتك اليوم" : n === 1 ? "يوم واحد" : n === 2 ? "يومان متتاليان" : n <= 10 ? `${ad(n)} أيام متتالية` : `${ad(n)} يومًا متتاليًا`;

const DAYS = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

export default function TodayView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const ui = useUi();
  const readiness = useMemo(() => Math.round(overallReadiness(attempts) * 100), [attempts]);
  const answered = Object.keys(attempts).length;
  const conceptReads = useApp((s) => s.conceptReads);
  const labCount = useApp((s) => s.labAttempts.length);
  const simCount = useApp((s) => s.simAttempts.length);
  const planCount = useApp((s) => s.lessonPlans.length);
  const sessions = useApp((s) => s.sessions);
  const [pressed, setPressed] = useState<string | null>(null);

  const reads = useMemo(() => {
    const m5 = conceptsOfCourse("M5");
    return { all: Object.keys(conceptReads).length, m5: m5.filter((c) => conceptReads[c.id]).length, m5Total: m5.length };
  }, [conceptReads]);

  // أيام الأسبوع من السبت إلى الجمعة
  const week = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 1) % 7));
    const today = dayStr(now);
    return DAYS.map((label, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayStr(d);
      return { label, done: dayXpOf(sessions, key) > 0, today: key === today, future: key > today };
    });
  }, [sessions]);
  const streak = useMemo(() => streakOf(sessions), [sessions]);

  const started = (n: number, text: string) => (n > 0 ? text : "لم تبدأ بعد");
  const doors: Door[] = [
    { title: "المفاهيم التربوية", img: "/home/concepts-v2.jpg", pos: "60% 55%", note: started(reads.all, `قرأت ${ad(reads.all)} من ${ad(CONCEPTS.length)}`), run: ui.startLearn, wide: true },
    { title: "المواقف الصفية", img: "/home/situations-v2.jpg", pos: "55% 50%", note: started(simCount, `أنجزت ${ad(simCount)}`), run: ui.startSim, wide: true },
    { title: "مهارات التدريس", img: "/home/skills-v2.jpg", pos: "50% 22%", note: started(labCount, `أنجزت ${ad(labCount)}`), run: ui.startLab },
    { title: "طرائق التدريس", img: "/home/methods-v2.jpg", pos: "40% 55%", note: started(reads.m5, `قرأت ${ad(reads.m5)} من ${ad(reads.m5Total)}`), run: () => ui.openCourseTab("M5") },
    { title: "خطة الدرس", img: "/home/plan-v2.jpg", pos: "50% 50%", note: started(planCount, `أنشأت ${ad(planCount)}`), run: ui.startStudio },
  ];

  const open = (d: Door) => {
    if (pressed) return;
    tick();
    setPressed(d.title);
    setTimeout(() => {
      setPressed(null);
      d.run();
    }, 140);
  };

  return (
    <div className="mx-auto -mt-2 max-w-2xl space-y-5 pb-2 lg:mt-0">
      {/* البطاقة الرئيسية: مستوى الاستعداد، والإجراء الأول، وأيام الأسبوع */}
      <motion.section {...rise(0)} className="rounded-[26px] border border-[var(--t100)] bg-[var(--t050)] p-4 dark:border-border dark:bg-card">
        <button type="button" onClick={() => { tick(); onGoTab("practice"); }} className="flex w-full items-center gap-4 text-right">
          <span className="relative h-[92px] w-[92px] shrink-0 max-[359px]:h-[72px] max-[359px]:w-[72px]" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--t150)" strokeWidth="3.2" />
              {readiness > 0 && <motion.circle
                cx="18" cy="18" r="15.5" fill="none" stroke="var(--t800)" strokeWidth="3.2" strokeLinecap="round"
                initial={{ strokeDasharray: "0 97.4" }}
                animate={{ strokeDasharray: `${(readiness / 100) * 97.4} 97.4` }}
                transition={{ delay: 0.2, duration: 0.9, ease: "easeOut" }}
              />}
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[26px] font-extrabold text-[var(--t900)] max-[359px]:text-[21px] dark:text-foreground"><bdi dir="rtl">{ad(readiness)}٪</bdi></span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block whitespace-nowrap text-[17px] font-extrabold leading-7 max-[359px]:text-[16px] text-[var(--t900)] dark:text-foreground">مستوى استعدادك</span>
            <span className="block text-[13px] leading-6 text-[var(--t700)] dark:text-muted-foreground">
              {answered === 0 ? "أجب عن أسئلة قليلة ليظهر مستواك في كل محور." : "محسوب من إجاباتك في المحاور كلها، ويرتفع كلما أتقنت محورًا."}
            </span>
          </span>
        </button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => { tick(); ui.startExamsim(); }}
          className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[18px] bg-[var(--t800)] text-[17px] font-extrabold text-white"
        >
          ابدأ اختبار المحاكاة
        </motion.button>
        <button type="button" onClick={() => { tick(); onGoTab("practice"); }} className="mt-2 block w-full py-1 text-center text-[14px] font-bold text-[var(--t800)] dark:text-primary">
          أو تدرّب على أسئلة قصيرة بحسب المحور
        </button>

        {/* أيام الأسبوع: الدائرة الممتلئة يوم درست فيه */}
        <div className="mt-4 border-t border-[var(--t100)] pt-3 dark:border-border" aria-label="أيام دراستك هذا الأسبوع">
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="font-bold text-[var(--t900)] dark:text-foreground">أيامك هذا الأسبوع</span>
            <span className="flex items-center gap-1 font-bold text-[var(--t700)] dark:text-muted-foreground">
              <Flame className="h-4 w-4" fill={streak > 0 ? "#E8A317" : "none"} stroke={streak > 0 ? "#B9780A" : "currentColor"} strokeWidth={1.8} />
              {streakText(streak)}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {week.map((d) => (
              <span key={d.label} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2",
                    d.done ? "border-[var(--t800)] bg-[var(--t800)] text-white" : d.today ? "border-[var(--t800)] bg-white dark:bg-card" : d.future ? "border-dashed border-[var(--t200)]" : "border-[var(--t200)] bg-white dark:bg-card"
                  )}
                >
                  {d.done && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <span className={cn("whitespace-nowrap text-[11px] leading-4 max-[359px]:text-[9.5px]", d.today ? "font-extrabold text-[var(--t900)] dark:text-foreground" : "font-medium text-[var(--t600)] dark:text-muted-foreground")}>{d.label}</span>
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* أقسام التطبيق: صورة، ثم الاسم، ثم ما أنجزته فيه */}
      <div className="grid grid-cols-6 gap-3">
        {doors.map((d, i) => (
          <motion.button
            key={d.title}
            type="button"
            {...rise(1 + i)}
            whileTap={{ scale: 0.96 }}
            onClick={() => open(d)}
            className={cn("flex min-w-0 flex-col text-right", d.wide ? "col-span-3" : "col-span-2")}
          >
            <span className={cn("relative block w-full overflow-hidden rounded-[20px] border border-[var(--t100)] bg-[var(--t100)] dark:border-border", d.wide ? "h-[118px]" : "h-[92px]")}>
              <img src={d.img} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: d.pos }} />
            </span>
            <span className={cn("mt-1.5 block truncate px-1 font-bold leading-6 text-[var(--t900)] dark:text-foreground", d.wide ? "text-[15px]" : "text-[14px] max-[359px]:text-[12.5px]")}>{d.title}</span>
            <span className="block truncate px-1 text-[12px] leading-5 text-[var(--t700)] dark:text-muted-foreground">{d.note}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
