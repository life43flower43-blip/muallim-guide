"use client";

// ============================================================================
// الرئيسية: واجهة التطبيق — بطاقة الاستعداد، ثم ستة أبواب مصوّرة لأقسامه
// ============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { dayStr, dayXpOf, useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { useMistakes } from "@/lib/mistakes-client";
import { CONCEPTS, conceptsOfCourse } from "@/lib/qbank";
import { overallReadiness } from "@/lib/practice-bank";
import { ad } from "@/lib/arabic";
import type { Tab } from "./AppShell";
import { FitText } from "./FitText";
import { BookOpen, ClipboardCheck, Compass, Lightbulb, NotebookPen, Presentation, Shapes, Timer, Users } from "lucide-react";

type Door = { title: string; img: string; pos?: string; progress: number; run: () => void; special?: boolean };

const frac = (n: number, of: number) => (of > 0 ? Math.min(1, n / of) : 0);

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

/** خريطة نشاط مصغّرة: آخر ٨ أسابيع، كل مربع يوم، ويغمق كلما زادت الأسئلة */
function MiniActivity({ sessions }: { sessions: { ts: number; total: number }[] }) {
  const WEEKS = 8;
  const cols = useMemo(() => {
    const per = new Map<string, number>();
    for (const x of sessions) per.set(dayStr(new Date(x.ts)), (per.get(dayStr(new Date(x.ts))) ?? 0) + x.total);
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 1) % 7) - (WEEKS - 1) * 7);
    const todayKey = dayStr(today);
    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const dt = new Date(start);
        dt.setDate(start.getDate() + w * 7 + d);
        const k = dayStr(dt);
        return { n: per.get(k) ?? 0, future: k > todayKey, today: k === todayKey };
      })
    );
  }, [sessions]);
  const level = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 25 ? 2 : 3);
  const shade = ["var(--t075)", "color-mix(in srgb, var(--t800) 35%, white)", "color-mix(in srgb, var(--t800) 65%, white)", "var(--t800)"];
  return (
    <div className="flex flex-col items-center gap-1.5" aria-label="نشاطك في آخر ٨ أسابيع">
      <span className="flex h-[60px] items-center">
      <div className="flex gap-[2.5px] rounded-[10px] bg-white p-[5px] ring-1 ring-[var(--t075)] dark:bg-card" dir="ltr">
        {cols.map((col, w) => (
          <div key={w} className="flex flex-col gap-[2.5px]">
            {col.map((c, d) => (
              <span
                key={d}
                className={cn("h-[5px] w-[5px] rounded-full", c.today && "ring-[1.5px] ring-[#C9971C]")}
                style={{ background: c.future ? "transparent" : shade[level(c.n)] }}
              />
            ))}
          </div>
        ))}
      </div>
      </span>
      <span className="whitespace-nowrap text-[12px] font-bold leading-4 text-[var(--t900)] dark:text-foreground">نشاطك</span>
    </div>
  );
}

// رمز ولون لكل قسم في شبكة الرئيسية، دون تكرار
const DOOR_ICON: Record<string, React.ElementType> = {
  "اختبر نفسك": ClipboardCheck,
  "المفاهيم التربوية": Lightbulb,
  "المواقف الصفية": Users,
  "مهارات التدريس": Presentation,
  "طرائق التدريس": Shapes,
  "خطة الدرس": NotebookPen,
};
const DOOR_BG: Record<string, string> = {
  "اختبر نفسك": "linear-gradient(135deg,#FFD36B,#F2A81D)",
  "المفاهيم التربوية": "linear-gradient(135deg,#67D9F5,#1BA7D6)",
  "المواقف الصفية": "linear-gradient(135deg,#FFB27A,#F07D2E)",
  "مهارات التدريس": "linear-gradient(135deg,#6EE0B5,#22B07D)",
  "طرائق التدريس": "linear-gradient(135deg,#7BD8CF,#279488)",
  "خطة الدرس": "linear-gradient(135deg,#9CC5FF,#5A8DEE)",
};

export default function TodayView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const ui = useUi();
  const readiness = useMemo(() => Math.round(overallReadiness(attempts) * 100), [attempts]);
  const conceptReads = useApp((s) => s.conceptReads);
  const labCount = useApp((s) => s.labAttempts.length);
  const simCount = useApp((s) => s.simAttempts.length);
  const planCount = useApp((s) => s.lessonPlans.length);
  // الهدف يحدد الزر الكبير وترتيب البطاقات: التوظيف (المحاكاة)، الكلية (المفاهيم)، المعلم (المواقف الصفية)
  const goal = useApp((s) => s.goal) ?? "job";
  const [pressed, setPressed] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState<number | null>(null);
  const [tileH, setTileH] = useState<number | null>(null);

  // تمتد البطاقات لتملأ الشاشة حتى تستقر فوق الشريط السفلي مباشرة
  useEffect(() => {
    const fit = () => {
      const g = gridRef.current;
      const nav = document.getElementById("bottom-nav");
      if (!g || !nav || window.innerWidth >= 1024) {
        setTileH(null);
        return setCardH(null);
      }
      const avail = nav.getBoundingClientRect().top - g.getBoundingClientRect().top - (statsRef.current?.offsetHeight ?? 0) - 24;
      setCardH(Math.max(48, Math.min(210, (avail - 2 * 10) / 3)));
      // ثلاثة صفوف بعناوينها: تقدير أول، ثم ضبط دقيق بعد الرسم حتى تستقر الأوراق فوق الشريط مباشرة
      setTileH(Math.max(56, Math.min(190, (avail - 2 * 14 - 3 * 30 - 30) / 3)));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const st = statsRef.current;
          if (!st) return;
          const gap = nav.getBoundingClientRect().top - st.getBoundingClientRect().bottom - 6;
          if (Math.abs(gap) > 2) setTileH((h) => (h === null ? h : Math.max(56, Math.min(190, h + gap / 3))));
        })
      );
    };
    fit();
    // يُعاد الضبط بعد انتهاء حركة الدخول، لأن الحركة تزيح العناصر مؤقتًا فتخدع القياس
    const t = setTimeout(fit, 350);
    const t2 = setTimeout(fit, 1300);
    const ro = new ResizeObserver(fit);
    const main = document.getElementById("main-scroll");
    if (main) ro.observe(main);
    document.fonts?.ready.then(fit);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      ro.disconnect();
    };
  }, []);

  // تقدّم كل باب: نسبة ما أُنجز فيه، تظهر خطًّا ذهبيًّا رفيعًا أسفل عنوانه
  const prog = useMemo(() => {
    const m5 = conceptsOfCourse("M5");
    return {
      concepts: frac(Object.keys(conceptReads).length, CONCEPTS.length),
      methods: frac(m5.filter((c) => conceptReads[c.id]).length, m5.length),
    };
  }, [conceptReads]);

  // أيام الأسبوع من السبت إلى الجمعة: يمتلئ بالذهبي كل يوم درست فيه الطالبة
  const sessions = useApp((s) => s.sessions);
  const { data: mistakes } = useMistakes();
  const due = mistakes?.stats.due ?? 0;
  const homeStyle = useApp((s) => s.homeStyle ?? "icons");
  const week = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 1) % 7));
    const today = dayStr(now);
    return ["س", "ح", "ن", "ث", "ر", "خ", "ج"].map((label, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayStr(d);
      return { label, done: dayXpOf(sessions, key) > 0, today: key === today, future: key > today };
    });
  }, [sessions]);

  const doors: Door[] = [
    { title: "المفاهيم التربوية", pos: "60% 55%", img: "/home/concepts-v2.jpg", progress: prog.concepts, run: ui.startLearn },
    { title: "مهارات التدريس", pos: "50% 22%", img: "/home/skills-v2.jpg", progress: frac(labCount, 20), run: ui.startLab },
    { title: "طرائق التدريس", pos: "40% 55%", img: "/home/methods-v2.jpg", progress: prog.methods, run: () => ui.openCourseTab("M5") },
    { title: "المواقف الصفية", pos: "55% 50%", img: "/home/situations-v2.jpg", progress: frac(simCount, 20), run: ui.startSim },
    { title: "اختبر نفسك", pos: "50% 50%", img: "", progress: readiness / 100, run: () => onGoTab("practice"), special: true },
    { title: "خطة الدرس", pos: "50% 50%", img: "/home/plan-v2.jpg", progress: frac(planCount, 5), run: ui.startStudio },
  ];
  // ترتيب شبكة الرئيسية: «اختبر نفسك» بجانب المحاكاة، والعناوين الطويلة في البطاقات العريضة
  const byTitle = (t: string) => doors.find((d) => d.title === t)!;
  const ORDER: Record<string, string[]> = {
    job: ["اختبر نفسك", "المفاهيم التربوية", "المواقف الصفية", "مهارات التدريس", "طرائق التدريس", "خطة الدرس"],
    university: ["اختبر نفسك", "المفاهيم التربوية", "طرائق التدريس", "مهارات التدريس", "المواقف الصفية", "خطة الدرس"],
    teacher: ["اختبر نفسك", "المواقف الصفية", "خطة الدرس", "مهارات التدريس", "طرائق التدريس", "المفاهيم التربوية"],
  };
  const gridDoors = (ORDER[goal] ?? ORDER.job).map(byTitle);

  return (
    <div className="mx-auto -mt-1 max-w-2xl space-y-3 lg:mt-0">
      {/* أبواب التطبيق */}
      {homeStyle === "icons" ? (
        // شبكة رموز دائرية ملونة: أربعة في كل صف، والاسم تحت كل رمز
        <div ref={gridRef} className="grid grid-cols-4 gap-x-2 gap-y-5 pt-2">
          {[
            { title: goal === "university" ? "تابع المحاور" : goal === "teacher" ? "موقف اليوم" : "المحاكاة", icon: Timer, bg: "linear-gradient(135deg,#FF8A7A,#F2584A)", run: () => (goal === "university" ? ui.startLearn() : goal === "teacher" ? ui.startSim() : ui.startExamsim()) },
            ...gridDoors.map((d) => ({ title: d.title, icon: DOOR_ICON[d.title] ?? BookOpen, bg: DOOR_BG[d.title] ?? "linear-gradient(135deg,#5ED3C4,#279488)", run: d.run })),
            { title: "البوصلة", icon: Compass, bg: "linear-gradient(135deg,#7FB6FF,#3B7BEA)", run: () => onGoTab("notebook") },
          ].map((d, i) => (
            <motion.button
              key={d.title}
              type="button"
              {...rise(1 + i)}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                tick();
                d.run();
              }}
              className="flex min-w-0 flex-col items-center gap-1.5"
            >
              <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full text-white shadow-[0_6px_14px_rgba(0,0,0,0.12)]" style={{ background: d.bg }}>
                <d.icon className="h-7 w-7" strokeWidth={2} />
              </span>
              <FitText max={12.5} min={9} group="home-ico" className="w-full whitespace-nowrap text-center font-bold text-[var(--t900)] dark:text-foreground">{d.title}</FitText>
            </motion.button>
          ))}
        </div>
      ) : (
      <div ref={gridRef} className="grid grid-cols-2 gap-x-3 gap-y-4">
        {(ORDER[goal] ?? ORDER.job).map(byTitle).map((d, i) => (
          <motion.button
            key={d.title}
            type="button"
            {...rise(2 + i)}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (pressed) return;
              tick();
              setPressed(d.title);
              // انكماش قصير ثم يفتح القسم
              setTimeout(() => {
                setPressed(null);
                d.run();
              }, 160);
            }}
            className="flex min-w-0 flex-col gap-1.5 text-right"
          >
            {/* بطاقة صغيرة: صورة قصيرة، ثم العنوان تحتها، ثم خط التقدم */}
            <span className="relative block h-[84px] w-full overflow-hidden rounded-[18px] bg-[var(--t100)] ring-1 ring-[var(--t075)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d.special ? <TestArt /> : <img src={d.img} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: d.pos }} />}
            </span>
            <span className="flex items-center justify-between gap-2 px-1">
              <span className="min-w-0 truncate text-[14.5px] font-extrabold text-[var(--t900)] dark:text-foreground">{d.title}</span>
              <span className="text-[11.5px] font-bold text-[var(--t450)]">{Math.round(d.progress * 100)}٪</span>
            </span>
            <span className="mx-1 block h-[3px] overflow-hidden rounded-full bg-[var(--t075)]" aria-hidden="true">
              <span className="block h-full rounded-full bg-[#D4A017] transition-[width] duration-700" style={{ width: `${Math.round(d.progress * 100)}%` }} />
            </span>
          </motion.button>
        ))}
      </div>
      )}

      {/* مستوى الاستعداد فوق غصن الأيام، على اليسار */}
      <motion.div ref={statsRef} {...rise(9)} className="flex flex-col-reverse gap-2">
        {/* شريط الأسبوع: غصن بسبع أوراق، تصير الورقة ذهبية في كل يوم درست فيه الطالبة */}
        <div className="relative min-w-0 px-2" aria-label="أيام دراستك هذا الأسبوع">
          <svg className="absolute inset-x-6 top-[13px] h-[6px] w-[calc(100%-48px)]" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 3C12 0 20 6 33 3S54 0 66 3 88 6 100 3" stroke="var(--t300)" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="relative flex items-start justify-between">
            {week.map((d, i) => (
              <span key={d.label} className="flex w-9 flex-col items-center gap-1">
                <svg
                  viewBox="0 0 24 24"
                  className={cn("h-[30px] w-[30px] transition-transform", d.today && "scale-110")}
                  style={{ transform: `rotate(${i % 2 ? 28 : -28}deg)` }}
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={`leafGold${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#F3DC8E" />
                      <stop offset="1" stopColor="#D4A017" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2C6.5 6 4.5 11.5 6 17c1.2 3.2 4 5 6 5s4.8-1.8 6-5c1.5-5.5-.5-11-6-15Z"
                    fill={d.done ? `url(#leafGold${i})` : d.today ? "var(--t100)" : d.future ? "none" : "var(--t050)"}
                    stroke={d.done ? "#C9971C" : d.today ? "var(--t800)" : "var(--t300)"}
                    strokeWidth={d.today ? 1.8 : 1.3}
                    strokeDasharray={d.future ? "2.5 2" : undefined}
                  />
                  <path d="M12 6v14M12 11l-3-2.5M12 15l3-2.5" stroke={d.done ? "#FFFFFF" : d.today ? "var(--t800)" : "var(--t300)"} strokeWidth="1.1" strokeLinecap="round" fill="none" />
                </svg>
                <span className={cn("text-[12px] leading-none", d.today ? "font-extrabold text-[var(--t800)]" : d.done ? "font-bold text-[#B8860B]" : "font-bold text-[var(--t450)]")}>{d.label}</span>
              </span>
            ))}
          </div>
        </div>
        {/* مستوى الاستعداد وبجانبه خريطة النشاط المصغّرة، يسارًا فوق غصن الأيام */}
        <div className="flex items-start justify-around px-2">
          <MiniActivity sessions={sessions} />
          {/* مستوى الاستعداد: الحلقة وتحتها جملة قصيرة، على اليسار بجانب غصن الأيام */}
          <motion.button
            type="button"
            onClick={() => {
              tick();
              onGoTab("practice");
            }}
            className="flex shrink-0 flex-col items-center gap-1.5 text-[var(--t900)] dark:text-foreground"
          >
            <span className="flex h-[60px] items-center">
            <span className="relative h-[44px] w-[44px] shrink-0" aria-hidden="true">
              {/* هالة متموّجة تدور حول الحلقة */}
              <svg viewBox="0 0 50 50" className="energy-aura pointer-events-none absolute -inset-[8px] h-[60px] w-[60px]">
                <path d="M46.00 25.00 L46.79 26.52 L47.22 28.12 L47.10 29.70 L46.40 31.14 L45.25 32.37 L43.88 33.41 L42.56 34.34 L41.49 35.31 L40.76 36.45 L40.30 37.84 L39.95 39.43 L39.49 41.09 L38.75 42.59 L37.64 43.74 L36.19 44.39 L34.54 44.55 L32.82 44.37 L31.20 44.08 L29.72 43.94 L28.37 44.13 L27.07 44.70 L25.72 45.55 L24.25 46.43 L22.68 47.07 L21.08 47.23 L19.56 46.82 L18.22 45.87 L17.09 44.57 L16.12 43.20 L15.19 41.99 L14.15 41.08 L12.89 40.50 L11.38 40.12 L9.73 39.74 L8.13 39.16 L6.78 38.24 L5.87 36.95 L5.48 35.38 L5.51 33.68 L5.78 32.00 L6.03 30.44 L6.02 29.04 L5.63 27.72 L4.90 26.41 L4.00 25.00 L3.21 23.48 L2.78 21.88 L2.90 20.30 L3.60 18.86 L4.75 17.63 L6.12 16.59 L7.44 15.66 L8.51 14.69 L9.24 13.55 L9.70 12.16 L10.05 10.57 L10.51 8.91 L11.25 7.41 L12.36 6.26 L13.81 5.61 L15.46 5.45 L17.18 5.63 L18.80 5.92 L20.28 6.06 L21.63 5.87 L22.93 5.30 L24.28 4.45 L25.75 3.57 L27.32 2.93 L28.92 2.77 L30.44 3.18 L31.78 4.13 L32.91 5.43 L33.88 6.80 L34.81 8.01 L35.85 8.92 L37.11 9.50 L38.62 9.88 L40.27 10.26 L41.87 10.84 L43.22 11.76 L44.13 13.05 L44.52 14.62 L44.49 16.32 L44.22 18.00 L43.97 19.56 L43.98 20.96 L44.37 22.28 L45.10 23.59 L46.00 25.00Z" fill="none" stroke="var(--t600)" strokeOpacity="0.45" strokeWidth="1.2" />
              </svg>
              <svg viewBox="0 0 36 36" className="relative h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--t150)" strokeWidth="3.5" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="var(--t800)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 97.4" }}
                  animate={{ strokeDasharray: `${(readiness / 100) * 97.4} 97.4` }}
                  transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                />
              </svg>
              <span className="absolute inset-[5px] flex items-center justify-center rounded-full bg-white/80 text-xs font-extrabold dark:bg-card/70">{ad(readiness)}٪</span>
            </span>
            </span>
            <span className="whitespace-nowrap text-[12px] font-bold leading-4 text-[var(--t900)] dark:text-foreground">مستوى استعدادك</span>
          </motion.button>
          {/* أخطاء للمراجعة: عدد ما ينتظر الطالبة، ويفتح «أخطائي» */}
          <button
            type="button"
            onClick={() => {
              tick();
              onGoTab("mistakes");
            }}
            className="flex shrink-0 flex-col items-center gap-1.5 text-[var(--t900)] dark:text-foreground"
          >
            {/* بطاقتان مكدّستان كبطاقات المراجعة، والعليا تحمل العدد، وسهما مراجعة يدوران حولهما ببطء */}
            <span className="flex h-[60px] items-center">
            <span className="relative flex h-[44px] w-[44px] items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 48 48" className="review-spin absolute -inset-[6px] h-[56px] w-[56px]">
                <path d="M24 4a20 20 0 0 1 18.3 12" fill="none" stroke={due > 0 ? "#C9971C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M43.6 10.5l-1.3 5.6-5.5-1.6" fill="none" stroke={due > 0 ? "#C9971C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M24 44A20 20 0 0 1 5.7 32" fill="none" stroke={due > 0 ? "#C9971C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M4.4 37.5l1.3-5.6 5.5 1.6" fill="none" stroke={due > 0 ? "#C9971C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute h-[30px] w-[24px] translate-x-[3px] rotate-[10deg] rounded-[7px] bg-[var(--t150)]" />
              <span className={cn("relative flex h-[30px] w-[24px] -rotate-[6deg] items-center justify-center rounded-[7px] text-[13px] font-extrabold text-white", due > 0 ? "bg-gradient-to-b from-[#E05A4C] to-[#B42318]" : "bg-gradient-to-b from-[var(--t600)] to-[var(--t850)]")}>
                {ad(due)}
              </span>
            </span>
            </span>
            <span className="whitespace-nowrap text-[12px] font-bold leading-4 text-[var(--t900)] dark:text-foreground">راجع أخطاءك</span>
          </button>
        </div>
      </motion.div>

    </div>
  );
}


/** بطاقة «اختبر نفسك» مرسومة لا مصورة: ورقة إجابة تمتلئ دوائرها واحدة بعد أخرى، ثم يُختم عليها بالذهب */
function TestArt() {
  const rows = [0, 1, 2, 3, 4];
  const pick = [2, 0, 3, 1, 2]; // الخيار المظلل في كل سطر
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="test-art absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="ta-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F4634" />
          <stop offset="1" stopColor="#0B2236" />
        </linearGradient>
        <radialGradient id="ta-glow" cx="0.78" cy="0.22" r="0.6">
          <stop offset="0" stopColor="#2E9E7E" stopOpacity="0.3" />
          <stop offset="1" stopColor="#2E9E7E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ta-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A7F3D0" />
          <stop offset="0.55" stopColor="#2E9E7E" />
          <stop offset="1" stopColor="#136F5C" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#ta-bg)" />
      <rect width="200" height="200" fill="url(#ta-glow)" />
      {/* ورقة الإجابة */}
      <g transform="rotate(-7 96 104)">
        <rect x="42" y="30" width="108" height="142" rx="11" fill="#FBF8EF" />
        <rect x="56" y="44" width="56" height="7" rx="3.5" fill="#D9CFB4" />
        <rect x="56" y="55" width="34" height="5" rx="2.5" fill="#E5E1F2" />
        {rows.map((r) => (
          <g key={r}>
            <text x="58" y={80 + r * 19} fontSize="8" fontWeight="700" fill="#A89A78" textAnchor="middle" dominantBaseline="central">{r + 1}</text>
            {[0, 1, 2, 3].map((c) => (
              <circle key={c} cx={74 + c * 18} cy={80 + r * 19} r="6.2" fill="none" stroke="#CFC4A6" strokeWidth="1.6" />
            ))}
            <circle className="ta-fill" style={{ animationDelay: `${0.35 + r * 0.42}s` }} cx={74 + pick[r] * 18} cy={80 + r * 19} r="5.4" fill="url(#ta-gold)" />
          </g>
        ))}
      </g>
      {/* الختم الذهبي */}
      <g className="ta-seal">
        <circle cx="152" cy="150" r="31" fill="url(#ta-gold)" />
        <circle cx="152" cy="150" r="25" fill="none" stroke="#FFF4D6" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="2 3" />
        <path className="ta-check" d="M139 151 l9 9 l18 -20" fill="none" stroke="#173322" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      </g>
      <path d="M170 34 l2.2 5.6 5.6 2.2 -5.6 2.2 -2.2 5.6 -2.2 -5.6 -5.6 -2.2 5.6 -2.2z" fill="#A7F3D0" className="ta-spark" />
    </svg>
  );
}
