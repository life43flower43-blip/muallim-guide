"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  MinusCircle,
  Lightbulb,
  BookOpen,
  ClipboardList,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { SCENARIOS, PLAN_STEPS, CONCEPT_MAP, CAT_MAP } from "@/lib/content";
import type { Scenario } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useNav } from "@/lib/nav";
import { AppCard, EmptyState } from "./shared";
import { cn } from "@/lib/utils";

type SubTab = "scenarios" | "plan";

export default function PracticeView() {
  const [sub, setSub] = useState<SubTab>("scenarios");
  const { openScenario, openPlan } = useNav();
  const { scenariosDone, scenariosBest, planDone } = useAppStore();

  return (
    <div className="px-5 pt-6 pb-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-extrabold text-stone-900">التطبيق العملي</h1>
        <p className="text-[11px] text-stone-400 mt-0.5">
          من النظرية إلى القرار: مواقف صفية حقيقية ودليل خطوة بخطوة
        </p>
      </motion.div>

      {/* sub tabs */}
      <div className="flex gap-2 mt-4 p-1 bg-stone-200/60 rounded-2xl">
        <button
          onClick={() => setSub("scenarios")}
          className={cn(
            "flex-1 h-10 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5",
            sub === "scenarios" ? "bg-white text-teal-800 shadow" : "text-stone-500"
          )}
        >
          <GraduationCap className="w-4 h-4" />
          سيناريوهات الصف
        </button>
        <button
          onClick={() => setSub("plan")}
          className={cn(
            "flex-1 h-10 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5",
            sub === "plan" ? "bg-white text-emerald-700 shadow" : "text-stone-500"
          )}
        >
          <ClipboardList className="w-4 h-4" />
          دليل الخطة السلوكية
        </button>
      </div>

      <AnimatePresence mode="wait">
        {sub === "scenarios" ? (
          <motion.div
            key="scen"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 14 }}
            className="mt-4 space-y-3"
          >
            {SCENARIOS.map((s, i) => {
              const done = scenariosDone.includes(s.id);
              const best = scenariosBest.includes(s.id);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <AppCard
                    className="p-4 flex items-center gap-3.5"
                    onClick={() => openScenario(s.id)}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                      <span className="text-xl">🏫</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-extrabold text-stone-800">{s.title}</p>
                      <p className="text-[10px] text-stone-400">{s.stage}</p>
                    </div>
                    {done ? (
                      <span
                        className={cn(
                          "text-[9px] font-extrabold px-2 py-1 rounded-full shrink-0",
                          best ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}
                      >
                        {best ? "إجابة مثالية" : "تم"}
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold px-2 py-1 rounded-full bg-stone-100 text-stone-500 shrink-0">
                        جديد
                      </span>
                    )}
                  </AppCard>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="plan"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            className="mt-4"
          >
            <div className="bg-gradient-to-l from-emerald-700 to-emerald-500 rounded-3xl p-5 shadow-lift relative overflow-hidden mb-4">
              <div className="absolute -left-8 -top-10 w-32 h-32 rounded-full bg-white/10" />
              <ClipboardList className="w-7 h-7 text-white/90 mb-2" />
              <p className="text-white font-extrabold text-[15px] leading-relaxed">
                دليل بناء خطة تعديل سلوك
              </p>
              <p className="text-emerald-50/90 text-[11px] leading-6 mt-1">
                ست خطوات مهنية من تحديد السلوك حتى التعميم — مع قوائم تحقق تفاعلية تُنجزها خطوة
                بخطوة.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-300 rounded-full"
                    animate={{ width: `${(planDone.length / 6) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-white">
                  {planDone.length}/6
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {PLAN_STEPS.map((step, i) => {
                const done = planDone.includes(step.id);
                return (
                  <AppCard
                    key={step.id}
                    className="p-4 flex items-center gap-3.5"
                    onClick={openPlan}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-extrabold shrink-0",
                        done ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-extrabold text-stone-800">{step.title}</p>
                      <p className="text-[10px] text-stone-400 line-clamp-1">{step.goal}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-stone-300 -rotate-90" />
                  </AppCard>
                );
              })}
            </div>

            <button
              onClick={openPlan}
              className="w-full h-12 mt-4 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-lift flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ClipboardList className="w-4 h-4" />
              افتح الدليل التفصيلي
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** ===== طبقة السيناريو التفاعلي ===== */
export function ScenarioDetail() {
  const scenarioId = useNav((s) => s.scenarioId);
  const close = useNav((s) => s.closeScenario);
  const openConcept = useNav((s) => s.openConcept);
  const recordScenario = useAppStore((s) => s.recordScenario);
  const [chosen, setChosen] = useState<number | null>(null);

  if (!scenarioId) return null;
  const sc: Scenario | undefined = SCENARIOS.find((s) => s.id === scenarioId);
  if (!sc) return null;
  const option = chosen !== null ? sc.options[chosen] : null;

  const pick = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    recordScenario(sc.id, sc.options[i].verdict === "best");
  };

  const verdictStyle = {
    best: {
      bg: "bg-emerald-50 border-emerald-300",
      chip: "bg-emerald-500",
      chipText: "إجراء مثالي",
      icon: <Check className="w-4 h-4 text-white" />,
      textColor: "text-emerald-900",
    },
    ok: {
      bg: "bg-amber-50 border-amber-300",
      chip: "bg-amber-400",
      chipText: "جيد مع تحسين",
      icon: <MinusCircle className="w-4 h-4 text-white" />,
      textColor: "text-amber-800",
    },
    bad: {
      bg: "bg-rose-50 border-rose-300",
      chip: "bg-rose-500",
      chipText: "غير مناسب",
      icon: <X className="w-4 h-4 text-white" />,
      textColor: "text-rose-800",
    },
  } as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={close}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="absolute inset-x-0 bottom-0 top-8 bg-background rounded-t-[2rem] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 px-5 pt-4 pb-4 bg-gradient-to-l from-violet-600 to-violet-500 relative">
            <button
              onClick={close}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <span className="text-[10px] font-bold text-violet-100 bg-white/15 rounded-full px-2.5 py-1 inline-block mb-2">
              {sc.stage}
            </span>
            <h2 className="text-lg font-extrabold text-white pr-10">{sc.title}</h2>
          </div>

          <div className="flex-1 overflow-y-auto nice-scroll px-5 py-4 space-y-4">
            {/* context */}
            <div className="bg-white rounded-3xl shadow-soft p-4 border-r-4 border-violet-400">
              <p className="text-[12.5px] text-stone-600 leading-7">{sc.context}</p>
            </div>

            <p className="text-[14px] font-extrabold text-stone-800">{sc.question}</p>

            {/* options */}
            <div className="space-y-2.5">
              {sc.options.map((o, i) => {
                const isChosen = chosen === i;
                const reveal = chosen !== null;
                const v = verdictStyle[o.verdict];
                return (
                  <motion.button
                    key={i}
                    onClick={() => pick(i)}
                    whileTap={reveal ? undefined : { scale: 0.98 }}
                    className={cn(
                      "w-full text-right rounded-2xl p-4 border-2 transition-colors flex items-start gap-3",
                      !reveal && "bg-white border-stone-100 shadow-soft hover:border-violet-200",
                      reveal && isChosen && v.bg,
                      reveal && !isChosen && "bg-white border-stone-100 opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-[12px] font-extrabold",
                        !reveal && "bg-stone-100 text-stone-500",
                        reveal && isChosen && v.chip + " text-white"
                      )}
                    >
                      {reveal && isChosen ? v.icon : ["أ", "ب", "ج", "د"][i]}
                    </span>
                    <span className="text-[13px] leading-6 text-stone-700 font-medium">{o.text}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* feedback */}
            <AnimatePresence>
              {option && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className={cn("rounded-3xl p-4 border", verdictStyle[option.verdict].bg)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        verdictStyle[option.verdict].chip
                      )}
                    >
                      {verdictStyle[option.verdict].icon}
                    </div>
                    <p
                      className={cn(
                        "text-[13px] font-extrabold",
                        verdictStyle[option.verdict].textColor
                      )}
                    >
                      {verdictStyle[option.verdict].chipText}
                    </p>
                  </div>
                  <p className="text-[12.5px] text-stone-700 leading-7 mb-3">{option.feedback}</p>

                  {option.conceptId && CONCEPT_MAP[option.conceptId] && (
                    <button
                      onClick={() => openConcept(option.conceptId!)}
                      className="w-full h-11 rounded-2xl bg-white/80 border border-stone-200 text-stone-700 text-[12px] font-bold flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4 text-teal-700" />
                      المفهوم المعني: {CONCEPT_MAP[option.conceptId].title}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** ===== طبقة دليل الخطة ===== */
export function PlanGuide() {
  const open = useNav((s) => s.planOpen);
  const close = useNav((s) => s.closePlan);
  const planDone = useAppStore((s) => s.planDone);
  const togglePlanStep = useAppStore((s) => s.togglePlanStep);
  const [openStep, setOpenStep] = useState<string | null>("p1");

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={close}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="absolute inset-x-0 bottom-0 top-6 bg-background rounded-t-[2rem] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 px-5 pt-4 pb-4 bg-white border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900">بناء خطة تعديل سلوك</h2>
              <p className="text-[10px] text-stone-400">
                {planDone.length} من 6 خطوات مُنجزة — أنجز قوائم التحقق تسلسلياً
              </p>
            </div>
            <button
              onClick={close}
              className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-stone-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto nice-scroll px-5 py-4 space-y-3">
            {PLAN_STEPS.map((step, i) => {
              const isOpen = openStep === step.id;
              const done = planDone.includes(step.id);
              return (
                <div key={step.id} className="bg-white rounded-3xl shadow-soft overflow-hidden">
                  <button
                    onClick={() => setOpenStep(isOpen ? null : step.id)}
                    className="w-full p-4 flex items-center gap-3.5 text-right"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-extrabold shrink-0 transition-colors",
                        done ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-extrabold text-stone-800">{step.title}</p>
                      <p className="text-[10.5px] text-stone-400 line-clamp-1">{step.goal}</p>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3.5 border-t border-stone-50 pt-3.5">
                          <p className="text-[12.5px] text-stone-600 leading-7">{step.content}</p>

                          <div className="bg-emerald-50/60 rounded-2xl p-3.5">
                            <p className="text-[11px] font-extrabold text-emerald-700 mb-2">
                              عناصر أساسية
                            </p>
                            <ul className="space-y-1.5">
                              {step.bullets.map((b, j) => (
                                <li
                                  key={j}
                                  className="flex gap-2 text-[11.5px] text-emerald-900/80 leading-6"
                                >
                                  <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {step.example && (
                            <div className="bg-violet-50/70 rounded-2xl p-3.5 flex gap-2.5">
                              <Lightbulb className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                              <p className="text-[11.5px] text-violet-900/80 leading-6">
                                {step.example}
                              </p>
                            </div>
                          )}

                          {/* checklist */}
                          <div className="border border-stone-100 rounded-2xl p-3.5">
                            <p className="text-[11px] font-extrabold text-stone-600 mb-2.5">
                              قائمة التحقق — عند إكمال كل البنود تُحتسب الخطوة
                            </p>
                            <div className="space-y-2">
                              {step.checklist.map((item, j) => (
                                <ChecklistItem key={j} label={item} checked={done} />
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => togglePlanStep(step.id)}
                            className={cn(
                              "w-full h-11 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]",
                              done
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-emerald-600 text-white shadow"
                            )}
                          >
                            {done ? (
                              <>
                                <Check className="w-4 h-4" />
                                الخطوة مُنجزة — إلغاء
                              </>
                            ) : (
                              "تحديد الخطوة كمُنجزة (+10 XP)"
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="w-full flex items-start gap-2.5 text-right">
      <span
        className={cn(
          "shrink-0 mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors",
          checked ? "bg-emerald-500 border-emerald-500" : "border-stone-300 bg-white"
        )}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className={cn("text-[11.5px] leading-6", checked ? "text-stone-400" : "text-stone-600")}>
        {label}
      </span>
    </div>
  );
}
