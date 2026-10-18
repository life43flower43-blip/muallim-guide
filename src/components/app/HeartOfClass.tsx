"use client";

// قلب الصف — سلّم المشاعر التربوي وشرارة المبدع
// طبقة ملء شاشة من دليل المعلم: تبويبان —
// «سلّم المشاعر»: ست عائلات من مشاعر الصف، ولكل شخصية بطاقة قراءة مريحة قابلة للفتح
// «شرارة المبدع»: فكرة إبداعية تقلب الدرس، وزر «شرارة أخرى» يعطي فكرة جديدة
// قواعد صارمة: صفر أرقام لاتينية ولا لاتيني، التنصيص ب«»، بنفسجي×عنبري فقط.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  Lightbulb,
  ChevronDown,
  RefreshCw,
  Eye,
  HeartHandshake,
  Footprints,
  MessageCircleHeart,
  ShieldAlert,
} from "lucide-react";
import { HEART_FAMILIES, SPARKS } from "@/lib/personas";
import { useUi } from "@/lib/ui-store";

type Tab = "ladder" | "spark";

const SIGNALS_LABEL = "علامات تلاحظها في الصف";
const INSIDE_LABEL = "ما يدور في داخله";
const NEED_LABEL = "ما يحتاجه منك";
const STEPS_LABEL = "خطوات عملية";
const PHRASE_LABEL = "عبارة تقولها له";
const AVOID_LABEL = "تجنّب";

export default function HeartOfClass() {
  const clearHeart = useUi((s) => s.clearHeart);
  const [tab, setTab] = useState<Tab>("ladder");
  const [openPersona, setOpenPersona] = useState<string | null>(null);

  // شرارة المبدع — فكرة عشوائية تتغير بكل ضغطة
  const [sparkIdx, setSparkIdx] = useState(() => Math.floor(Math.random() * SPARKS.length));
  const spark = SPARKS[sparkIdx % SPARKS.length];
  const nextSpark = () => {
    setSparkIdx((i) => {
      let n = i;
      while (n === i) n = Math.floor(Math.random() * SPARKS.length);
      return n;
    });
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* رأس الطبقة */}
      <div className="safe-top bg-gradient-to-bl from-[#0A5A62] via-[#0B6870] to-[#0E7C86] px-4 pb-4 pt-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-white/85">
              <Heart className="h-3.5 w-3.5" /> من دليل المعلم
            </p>
            <h2 className="mt-1 text-xl font-black leading-8">قلب الصف</h2>
          </div>
          <button onClick={clearHeart} className="rounded-full bg-white/20 p-2" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* التبويبان */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-white/10 p-1">
          {(
            [
              { id: "ladder", label: "سلّم المشاعر التربوي" },
              { id: "spark", label: "شرارة المبدع" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl py-2 text-[12px] font-black transition-colors ${
                tab === t.id ? "bg-white text-primary" : "text-white/85"
              }`}
              aria-current={tab === t.id ? "true" : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* المحتوى */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {tab === "ladder" ? (
            <motion.div
              key="ladder"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="space-y-3"
            >
              <p className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3.5 text-[12px] font-bold leading-6 text-cyan-900">
                صفك قلب ينبض بمشاعر لا تراها على الدفاتر. ست عائلات من المشاعر تشرح أكثر
                تصرفات الطلاب — اقرأ العائلة، تعرّف على الشخصية، وسِر على السلّم خطوة خطوة.
              </p>

              {HEART_FAMILIES.map((f) => (
                <div key={f.id} className="rounded-3xl border border-border bg-white p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">{f.name}</h3>
                      <p className="mt-0.5 text-[11px] font-bold leading-5 text-gray-500">{f.hint}</p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white">
                      <Heart className="h-4.5 w-4.5" />
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {f.personas.map((p) => {
                      const isOpen = openPersona === p.id;
                      return (
                        <div key={p.id} className="overflow-hidden rounded-2xl border border-cyan-100 bg-cyan-50/60">
                          <button
                            onClick={() => setOpenPersona(isOpen ? null : p.id)}
                            className="flex w-full items-center gap-2.5 px-3.5 py-3 text-right"
                            aria-expanded={isOpen}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-black text-cyan-950">{p.name}</span>
                              <span className="mt-0.5 block truncate text-[11px] font-bold text-cyan-800/80">
                                {p.tag}
                              </span>
                            </span>
                            <ChevronDown
                              className={`h-4.5 w-4.5 shrink-0 text-cyan-700 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-3 border-t border-cyan-100 px-3.5 pb-4 pt-3">
                                  {/* العلامات */}
                                  <div>
                                    <p className="flex items-center gap-1.5 text-[11px] font-black text-cyan-900">
                                      <Eye className="h-3.5 w-3.5" /> {SIGNALS_LABEL}
                                    </p>
                                    <ul className="mt-1.5 space-y-1">
                                      {p.signals.map((s, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-[12px] font-bold leading-6 text-cyan-950/90">
                                          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* ما بداخله */}
                                  <div>
                                    <p className="flex items-center gap-1.5 text-[11px] font-black text-cyan-900">
                                      <HeartHandshake className="h-3.5 w-3.5" /> {INSIDE_LABEL}
                                    </p>
                                    <p className="mt-1 text-[12px] font-bold leading-6 text-cyan-950/90">{p.inside}</p>
                                  </div>

                                  {/* ما يحتاجه */}
                                  <div>
                                    <p className="flex items-center gap-1.5 text-[11px] font-black text-amber-700">
                                      <Heart className="h-3.5 w-3.5" /> {NEED_LABEL}
                                    </p>
                                    <p className="mt-1 text-[12px] font-bold leading-6 text-amber-900">{p.need}</p>
                                  </div>

                                  {/* الخطوات */}
                                  <div>
                                    <p className="flex items-center gap-1.5 text-[11px] font-black text-cyan-900">
                                      <Footprints className="h-3.5 w-3.5" /> {STEPS_LABEL}
                                    </p>
                                    <ol className="mt-1.5 space-y-1.5">
                                      {p.steps.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[12px] font-bold leading-6 text-cyan-950/90">
                                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-black text-white">
                                            {["١", "٢", "٣"][i] ?? "•"}
                                          </span>
                                          {s}
                                        </li>
                                      ))}
                                    </ol>
                                  </div>

                                  {/* العبارة */}
                                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-[11px] font-black text-amber-800">{PHRASE_LABEL}</p>
                                    <p className="mt-1 text-[12px] font-bold leading-6 text-amber-950">{p.phrase}</p>
                                  </div>

                                  {/* تجنّب */}
                                  <div>
                                    <p className="flex items-center gap-1.5 text-[11px] font-black text-rose-700">
                                      <ShieldAlert className="h-3.5 w-3.5" /> {AVOID_LABEL}
                                    </p>
                                    <ul className="mt-1.5 space-y-1">
                                      {p.avoid.map((s, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-[12px] font-bold leading-6 text-rose-900/90">
                                          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="spark"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="flex min-h-full flex-col"
            >
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-[12px] font-bold leading-6 text-amber-900">
                فكرة واحدة تكفي لقلب حصة كاملة. اضغط «شرارة أخرى» كلما احتجت نبضة إبداع
                جديدة في تخطيط درسك أو إدارة صفك.
              </p>

              <div className="mt-4 flex flex-1 items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={sparkIdx}
                    initial={{ opacity: 0, scale: 0.94, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-6 text-center shadow-soft"
                  >
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#14919B] to-[#0E7C86] text-white shadow-md shadow-amber-500/30">
                      <Lightbulb className="h-7 w-7" />
                    </span>
                    <h3 className="mt-4 text-lg font-black text-gray-900">{spark.title}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-[13px] font-bold leading-7 text-gray-600">
                      {spark.body}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                onClick={nextSpark}
                className="mx-auto mt-5 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-md transition-transform active:scale-95"
              >
                <RefreshCw className="h-4.5 w-4.5" /> شرارة أخرى
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
