"use client";

// ============================================================================
// الرئيسية: واجهة التطبيق — بطاقة الاستعداد، ثم ستة أبواب مصوّرة لأقسامه
// ============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { CONCEPTS, conceptsOfCourse } from "@/lib/qbank";
import { overallReadiness } from "@/lib/practice-bank";
import { ad } from "@/lib/arabic";
import type { Tab } from "./AppShell";
import { FitText } from "./FitText";

type Door = { title: string; img: string; progress: number; run: () => void };

const frac = (n: number, of: number) => (of > 0 ? Math.min(1, n / of) : 0);

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
  const [cardH, setCardH] = useState<number | null>(null);

  // تمتد البطاقات لتملأ الشاشة حتى تستقر فوق الشريط السفلي مباشرة
  useEffect(() => {
    const fit = () => {
      const g = gridRef.current;
      const nav = document.getElementById("bottom-nav");
      if (!g || !nav || window.innerWidth >= 1024) return setCardH(null);
      const avail = nav.getBoundingClientRect().top - g.getBoundingClientRect().top - 10;
      setCardH(Math.max(96, Math.min(210, (avail - 2 * 10) / 3)));
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
      {/* مستوى الاستعداد */}
      <button
        type="button"
        onClick={() => onGoTab("practice")}
        className="relative block w-full overflow-hidden gold-frame !rounded-[20px] px-4 py-[6px] text-right text-[#174D41] dark:text-foreground"
      >
        <span className="flex items-center gap-4">
          {/* العنوان في منتصف الحلقة رأسيًّا، والنسبة داخل الحلقة */}
          <FitText max={16} className="flex-1 font-bold leading-6">مستوى استعدادك للتدريس</FitText>
          <span className="relative h-[40px] w-[40px] shrink-0" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#DCEFE5" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#136F5C" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(readiness / 100) * 97.4} 97.4`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold">{ad(readiness)}٪</span>
          </span>
        </span>
      </button>

      {/* أبواب التطبيق */}
      <div ref={gridRef} className="-mx-1 grid grid-cols-2 gap-2.5">
        {doors.map((d) => (
          <motion.button
            key={d.title}
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={() => {
              if (pressed) return;
              setPressed(d.title);
              // انكماش قصير ثم يفتح القسم
              setTimeout(() => {
                setPressed(null);
                d.run();
              }, 160);
            }}
            className="relative block overflow-hidden rounded-[26px] bg-[#DCEFE5] text-right"
          >
            {/* الصورة تملأ البطاقة، ولوحة العنوان نصف شفافة تطفو فوق أسفلها */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.img} alt="" className="block h-[calc(clamp(64px,calc((100dvh-440px)/3),130px)+34px)] w-full object-cover" style={cardH ? { height: cardH } : undefined} />
            <span className="absolute inset-x-1.5 bottom-1.5 flex min-h-[48px] flex-col justify-center overflow-hidden rounded-[20px] bg-white/80 px-3 py-2 backdrop-blur-md dark:bg-card/80">
              <FitText max={16} min={8} className="text-center font-extrabold text-[#174D41] dark:text-foreground">{d.title}</FitText>
              {/* خط التقدّم الذهبي */}
              <span className="absolute inset-x-3 bottom-[5px] h-[3px] overflow-hidden rounded-full bg-[#F3E7CB]/70" aria-hidden="true">
                <span className="block h-full rounded-full bg-gradient-to-l from-[#F4C430] to-[#FFE27A] transition-[width] duration-700" style={{ width: `${Math.round(d.progress * 100)}%` }} />
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
