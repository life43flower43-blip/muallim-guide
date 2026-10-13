"use client";

// قائمة اليوم الأول في المدرسة — من ميزة «ط» في بحث مشاكل الطلبة:
// قلق أول دخول للمدرسة موثق في دراسات عربية عدة. خمسة أقسام تُشطّط بندًا بندًا
// وتُشارك كنص جاهز. تعرض داخل تبويب في سجل التدريب الميداني.
// قواعد صارمة: صفر أرقام لاتينية ولا إيموجي، والتنصيص بعلامات «».

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sunrise, Share2, ClipboardCheck, MessageSquareQuote } from "lucide-react";
import {
  FIRST_DAY_SECTIONS,
  firstDayReadinessWord,
  composeFirstDayText,
} from "@/lib/firstday";
import { useApp } from "@/lib/store";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";

export default function FirstDayList() {
  const firstdayChecked = useApp((s) => s.firstdayChecked);
  const toggleFirstday = useApp((s) => s.toggleFirstday);

  const progress = useMemo(() => firstdayChecked.length, [firstdayChecked]);
  const total = useMemo(
    () => FIRST_DAY_SECTIONS.reduce((a, s) => a + s.items.length, 0),
    []
  );

  const shareList = async () => {
    const res = await shareText("قائمة اليوم الأول في المدرسة", composeFirstDayText(firstdayChecked));
    if (res === "failed") toast({ title: "المشاركة غير متاحة — انسخ القائمة يدويًا" });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-l from-amber-500/10 to-transparent p-4">
        <p className="flex items-center gap-2 text-sm font-black text-amber-900">
          <Sunrise className="h-4 w-4" /> يومك الأول في المدرسة
        </p>
        <p className="mt-1 text-xs font-bold leading-6 text-muted-foreground">
          أول دخول للمدرسة يقلق كل معلم متدرب — وهذه القائمة تحوّل التوتر إلى خطوات: شطّط كل بند
          تنجزه وستدخل البوابة وأنت مطمئن.
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="progress-track h-2.5 flex-1">
            <div
              className="progress-fill h-full"
              style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
            />
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-900">
            {firstDayReadinessWord(firstdayChecked)}
          </span>
        </div>
      </div>

      {FIRST_DAY_SECTIONS.map((section, si) => {
        const doneInSection = section.items.filter((i) => firstdayChecked.includes(i.id)).length;
        const allDone = doneInSection === section.items.length;
        return (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.04 }}
            className="rounded-2xl border-2 border-border bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="flex items-center gap-1.5 text-sm font-black">
                  <ClipboardCheck
                    className={`h-4 w-4 shrink-0 ${allDone ? "text-indigo-600" : "text-primary"}`}
                  />
                  {section.title}
                </h3>
                <p className="mt-0.5 text-[11px] font-bold leading-5 text-muted-foreground">
                  {section.guide}
                </p>
              </div>
              {allDone && (
                <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black text-indigo-700">
                  اكتمل القسم
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1.5">
              {section.items.map((item) => {
                const on = firstdayChecked.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleFirstday(item.id)}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-2.5 rounded-xl border-2 p-2.5 text-right transition ${
                      on ? "border-indigo-300 bg-indigo-50" : "border-border bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                        on ? "border-indigo-600 bg-indigo-600 text-white" : "border-border bg-white"
                      }`}
                    >
                      {on && <span className="text-[10px] font-black">✓</span>}
                    </span>
                    <span className={`text-xs font-bold leading-6 ${on ? "text-indigo-900" : "text-foreground"}`}>
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {section.scripts && (
              <div className="mt-3 rounded-xl border-2 border-sky-200 bg-sky-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-black text-sky-900">
                  <MessageSquareQuote className="h-3.5 w-3.5" /> جمل جاهزة احفظها كما هي
                </p>
                <div className="mt-2 space-y-1.5">
                  {section.scripts.map((s, i) => (
                    <p key={i} className="rounded-lg border border-sky-100 bg-white p-2.5 text-xs font-bold leading-6 text-sky-950">
                      «{s}»
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        );
      })}

      <button
        onClick={shareList}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-accent py-3.5 text-sm font-black text-primary"
      >
        <Share2 className="h-4.5 w-4.5" />
        انسخ قائمتي أو شاركها
      </button>
    </div>
  );
}
