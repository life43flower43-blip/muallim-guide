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

type Door = { title: string; img: string; progress: number; run: () => void };

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
      <div className="flex gap-[3px] rounded-[10px] bg-white p-1.5 ring-1 ring-[var(--t075)] dark:bg-card" dir="ltr">
        {cols.map((col, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {col.map((c, d) => (
              <span
                key={d}
                className={cn("h-[5px] w-[5px] rounded-full", c.today && "ring-[1.5px] ring-[#E3B23C]")}
                style={{ background: c.future ? "transparent" : shade[level(c.n)] }}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="whitespace-nowrap text-[11px] font-bold leading-none text-[var(--t900)] min-[380px]:text-[12px] dark:text-foreground">نشاطك</span>
    </div>
  );
}

export default function TodayView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const ui = useUi();
  const readiness = useMemo(() => Math.round(overallReadiness(attempts) * 100), [attempts]);
  const conceptReads = useApp((s) => s.conceptReads);
  const labCount = useApp((s) => s.labAttempts.length);
  const simCount = useApp((s) => s.simAttempts.length);
  const planCount = useApp((s) => s.lessonPlans.length);
  const [pressed, setPressed] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const weekRef = useRef<HTMLDivElement>(null);
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
      const weekH = (weekRef.current?.offsetHeight ?? 0) + 12;
      const avail = nav.getBoundingClientRect().top - g.getBoundingClientRect().top - weekH - 10;
      setCardH(Math.max(48, Math.min(210, (avail - 2 * 10) / 3)));
      // مربعات الرموز: صفّان، كلٌّ بعنوان تحته، فتصغر حتى تتسع الشاشة
      setTileH(Math.max(64, (avail - 16 - 2 * 32) / 2));
    };
    fit();
    const t = setTimeout(fit, 350);
    const ro = new ResizeObserver(fit);
    const main = document.getElementById("main-scroll");
    if (main) ro.observe(main);
    document.fonts?.ready.then(fit);
    return () => {
      clearTimeout(t);
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
    { title: "المفاهيم التربوية", img: "/home/concepts-v2.jpg", progress: prog.concepts, run: ui.startLearn },
    { title: "مهارات التدريس", img: "/home/skills-v2.jpg", progress: frac(labCount, 20), run: ui.startLab },
    { title: "طرائق التدريس", img: "/home/methods-v2.jpg", progress: prog.methods, run: () => ui.openCourseTab("M5") },
    { title: "المواقف الصفية", img: "/home/situations-v2.jpg", progress: frac(simCount, 20), run: ui.startSim },
    { title: "اختبر نفسك", img: "/home/test-v2.jpg", progress: readiness / 100, run: () => onGoTab("practice") },
    { title: "خطة الدرس", img: "/home/plan-v2.jpg", progress: frac(planCount, 5), run: ui.startStudio },
  ];

  return (
    <div className="mx-auto -mt-1 max-w-2xl space-y-3 lg:mt-0">
      {/* اختبار المحاكاة: دائرة ذهبية بساعة تدق، تتدفق منها موجات ذهبية للخارج */}
      <motion.button
        {...rise(0)}
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          tick();
          ui.startExamsim();
        }}
        className="flex items-center gap-4 py-3 pr-3 text-[var(--t900)] dark:text-foreground"
      >
        <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center" aria-hidden="true">
          <span className="gold-wave" />
          <span className="gold-wave" style={{ animationDelay: "1.1s" }} />
          <span className="gold-wave" style={{ animationDelay: "2.2s" }} />
          <span className="exam-pulse relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#FFE27A] via-[#F4C430] to-[#C99A06] ring-2 ring-white">
                <span className="text-[15px] font-extrabold text-[var(--t900)]">ابدأ</span>
              </span>
        </span>
        <span className="relative whitespace-nowrap text-lg font-extrabold leading-none">اختبار محاكاة</span>
      </motion.button>

      {/* أبواب التطبيق */}
      {homeStyle === "icons" ? (
        // نمط الرموز: ثلاثة أعمدة، مربع ناعم ملوّن برمز خطّي، والعنوان تحته
        <div ref={gridRef} className="grid grid-cols-3 gap-x-3 gap-y-4 pt-1">
          {doors.map((d, i) => (
            <motion.button
              key={d.title}
              type="button"
              {...rise(2 + i)}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                if (pressed) return;
                tick();
                setPressed(d.title);
                setTimeout(() => {
                  setPressed(null);
                  d.run();
                }, 160);
              }}
              className="flex min-w-0 flex-col items-center gap-2"
            >
              {/* المربع بصورة القسم بدل الرمز، بإطار ذهبي رفيع */}
              <span className="relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-[26px] bg-[var(--t100)] ring-1 ring-[#E3D3A0]" style={tileH ? { maxWidth: tileH } : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                {/* خط التقدّم الذهبي أسفل المربع */}
                <span className="absolute inset-x-4 bottom-2.5 h-[3px] overflow-hidden rounded-full bg-white/80" aria-hidden="true">
                  <span className="block h-full rounded-full bg-gradient-to-l from-[#F4C430] to-[#E3B23C]" style={{ width: `${Math.round(d.progress * 100)}%` }} />
                </span>
              </span>
              <FitText max={15} min={10} group="door-icons" className="w-full text-center font-bold text-[var(--t900)] dark:text-foreground">{d.title}</FitText>
            </motion.button>
          ))}
        </div>
      ) : (
      <div ref={gridRef} className="-mx-1 grid grid-cols-2 gap-2.5">
        {doors.map((d, i) => (
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
            className="relative block overflow-hidden rounded-[26px] bg-[var(--t100)] text-right"
          >
            {/* الصورة تملأ البطاقة، ولوحة العنوان نصف شفافة تطفو فوق أسفلها */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.img} alt="" className="block h-[calc(clamp(64px,calc((100dvh-440px)/3),130px)+34px)] w-full object-cover" style={cardH ? { height: cardH } : undefined} />
            <span className="absolute inset-x-1.5 bottom-1.5 flex min-h-[48px] flex-col justify-center overflow-hidden rounded-[20px] bg-white/80 px-3 py-2 backdrop-blur-md dark:bg-card/80">
              <FitText max={16} min={8} group="doors" className="text-center font-extrabold text-[var(--t900)] dark:text-foreground">{d.title}</FitText>
              {/* خط التقدّم الذهبي */}
              <span className="absolute inset-x-3 bottom-[5px] h-[3px] overflow-hidden rounded-full bg-[#F3E7CB]/70" aria-hidden="true">
                <span className="block h-full rounded-full bg-gradient-to-l from-[#F4C430] to-[#FFE27A] transition-[width] duration-700" style={{ width: `${Math.round(d.progress * 100)}%` }} />
              </span>
            </span>
          </motion.button>
        ))}
      </div>
      )}

      {/* مستوى الاستعداد فوق غصن الأيام، على اليسار */}
      <motion.div ref={weekRef} {...rise(8)} className="flex flex-col-reverse gap-2">
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
                      <stop offset="0" stopColor="#FFE27A" />
                      <stop offset="1" stopColor="#C99A06" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2C6.5 6 4.5 11.5 6 17c1.2 3.2 4 5 6 5s4.8-1.8 6-5c1.5-5.5-.5-11-6-15Z"
                    fill={d.done ? `url(#leafGold${i})` : d.today ? "var(--t100)" : d.future ? "none" : "var(--t050)"}
                    stroke={d.done ? "#C99A06" : d.today ? "var(--t800)" : "var(--t300)"}
                    strokeWidth={d.today ? 1.8 : 1.3}
                    strokeDasharray={d.future ? "2.5 2" : undefined}
                  />
                  <path d="M12 6v14M12 11l-3-2.5M12 15l3-2.5" stroke={d.done ? "#FFF6D5" : d.today ? "var(--t800)" : "var(--t300)"} strokeWidth="1.1" strokeLinecap="round" fill="none" />
                </svg>
                <span className={cn("text-[12px] leading-none", d.today ? "font-extrabold text-[var(--t800)]" : d.done ? "font-bold text-[#B8860B]" : "font-bold text-[var(--t450)]")}>{d.label}</span>
              </span>
            ))}
          </div>
        </div>
        {/* مستوى الاستعداد وبجانبه خريطة النشاط المصغّرة، يسارًا فوق غصن الأيام */}
        <div className="flex items-end justify-end gap-4 px-3">
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
            <span className="relative flex h-[44px] w-[44px] items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 48 48" className="review-spin absolute -inset-[6px] h-[56px] w-[56px]">
                <path d="M24 4a20 20 0 0 1 18.3 12" fill="none" stroke={due > 0 ? "#E3B23C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M43.6 10.5l-1.3 5.6-5.5-1.6" fill="none" stroke={due > 0 ? "#E3B23C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M24 44A20 20 0 0 1 5.7 32" fill="none" stroke={due > 0 ? "#E3B23C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M4.4 37.5l1.3-5.6 5.5 1.6" fill="none" stroke={due > 0 ? "#E3B23C" : "var(--t300)"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute h-[30px] w-[24px] translate-x-[3px] rotate-[10deg] rounded-[7px] bg-[var(--t150)]" />
              <span className={cn("relative flex h-[30px] w-[24px] -rotate-[6deg] items-center justify-center rounded-[7px] text-[13px] font-extrabold text-white", due > 0 ? "bg-gradient-to-b from-[#E05A4C] to-[#B42318]" : "bg-gradient-to-b from-[var(--t600)] to-[var(--t850)]")}>
                {ad(due)}
              </span>
            </span>
            <span className="whitespace-nowrap text-[11px] font-bold leading-none min-[380px]:text-[12px]">للمراجعة</span>
          </button>
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
            <span className="whitespace-nowrap text-[11px] font-bold leading-none min-[380px]:text-[12px]">مستوى استعدادك</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
