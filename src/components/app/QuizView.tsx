"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, RefreshCcw, Timer, Layers } from "lucide-react";
import { CATEGORIES, CONCEPT_MAP } from "@/lib/content";
import type { CategoryId } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useNav } from "@/lib/nav";
import { AppCard, SectionTitle } from "./shared";
import { cn } from "@/lib/utils";

const LENGTHS = [
  { count: 5, label: "سريع", desc: "5 أسئلة", icon: Timer, color: "#f59e0b" },
  { count: 10, label: "قياسي", desc: "10 أسئلة", icon: Brain, color: "#0d9488" },
  { count: 15, label: "شامل", desc: "15 سؤالاً", icon: Layers, color: "#8b5cf6" },
] as const;

export default function QuizView() {
  const errorBox = useAppStore((s) => s.errorBox);
  const startQuiz = useNav((s) => s.startQuiz);
  const errorCount = Object.keys(errorBox).length;

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-extrabold text-stone-900">جلسة اختبار</h1>
        <p className="text-[11px] text-stone-400 mt-0.5">
          خصص جلستك — وبعد كل خطأ ستحصل على توجيه فوري يشرح فكرتك الخاطئة
        </p>
      </motion.div>

      {/* Review errors card */}
      {errorCount > 0 && (
        <AppCard
          className="p-4 border border-amber-100 bg-gradient-to-l from-amber-50 to-white"
          onClick={() =>
            startQuiz({
              category: "all",
              count: Math.min(10, errorCount),
              mode: "review",
              title: "مراجعة أخطائي",
            })
          }
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-extrabold text-stone-800">مراجعة ذكية لأخطائك</p>
              <p className="text-[10px] text-stone-500">
                {errorCount} سؤالاً في صندوق الأخطاء — التوجيه سيقودك للإتقان
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
        </AppCard>
      )}

      {/* Length */}
      <div>
        <SectionTitle title="مدة الجلسة" />
        <div className="grid grid-cols-3 gap-2.5">
          {LENGTHS.map((l) => (
            <motion.button
              key={l.count}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                startQuiz({ category: "all", count: l.count, mode: "normal", title: "اختبار عام" })
              }
              className="bg-white rounded-2xl shadow-soft py-4 flex flex-col items-center gap-1.5"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: l.color + "18" }}
              >
                <l.icon className="w-5 h-5" style={{ color: l.color }} />
              </div>
              <span className="text-[12px] font-extrabold text-stone-700">{l.label}</span>
              <span className="text-[9px] text-stone-400">{l.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <SectionTitle title="اختر مجالاً محدداً" />
        <div className="space-y-2.5">
          {CATEGORIES.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AppCard
                className="p-4 flex items-center gap-3.5"
                onClick={() =>
                  startQuiz({
                    category: c.id as CategoryId,
                    count: 10,
                    mode: "normal",
                    title: c.name,
                  })
                }
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: c.soft }}
                >
                  <Brain className="w-5 h-5" style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-extrabold text-stone-800">{c.name}</p>
                  <p className="text-[10.5px] text-stone-400 leading-relaxed line-clamp-1">
                    {c.description}
                  </p>
                </div>
              </AppCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* concept-linked hint */}
      <div className="bg-teal-50/70 rounded-3xl p-4 border border-teal-100">
        <p className="text-[12px] font-bold text-teal-800 mb-1">نصيحة احترافية</p>
        <p className="text-[11px] text-teal-700/80 leading-relaxed">
          داخل كل مفهوم في المكتبة ستجد زر «اختبرني في هذا المفهوم» — أسرع طريقة لترسيخ فكرة تعلمتها
          للتو قبل أن تتبخر من ذاكرتك.
        </p>
      </div>
    </div>
  );
}
