"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Target,
  CheckCheck,
  BookMarked,
  RefreshCcw,
  Lock,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import {
  CONCEPTS,
  CATEGORIES,
  QUESTION_MAP,
  CONCEPT_MAP,
  QUESTIONS,
} from "@/lib/content";
import { useAppStore, levelInfo, conceptMastery, BADGE_MAP } from "@/lib/store";
import { useNav } from "@/lib/nav";
import { RingProgress, AppCard, SectionTitle, StatCard } from "./shared";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ProgressView() {
  const store = useAppStore();
  const { startQuiz, openConcept } = useNav();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { level, next, progress } = levelInfo(store.xp);
  const accuracy = store.answered > 0 ? Math.round((store.correct / store.answered) * 100) : 0;
  const errorEntries = Object.entries(store.errorBox);
  const exploredCount = store.exploredConcepts.length;

  // mastery per category
  const catMastery = CATEGORIES.map((c) => {
    const conceptIds = CONCEPTS.filter((x) => x.category === c.id).map((x) => x.id);
    const stats = conceptIds
      .map((id) => store.conceptStats[id])
      .filter(Boolean) as { asked: number; wrong: number }[];
    if (stats.length === 0) return { ...c, mastery: 0, started: false };
    const askedSum = stats.reduce((a, s) => a + s.asked, 0);
    const wrongSum = stats.reduce((a, s) => a + s.wrong, 0);
    return {
      ...c,
      mastery: Math.round((1 - wrongSum / Math.max(1, askedSum)) * 100),
      started: true,
    };
  });

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-extrabold text-stone-900">تقدمي</h1>
        <p className="text-[11px] text-stone-400 mt-0.5">لوحة إنجازك — أرقامك الحقيقية لا وعودك</p>
      </motion.div>

      {/* Level card */}
      <AppCard className="p-5 flex items-center gap-4">
        <RingProgress value={progress} size={84} stroke={9}>
          <div className="flex flex-col items-center">
            <span className="text-2xl">{level.icon}</span>
            <span className="text-[9px] font-extrabold text-teal-700">
              م{levelInfo(store.xp).levelIndex + 1}
            </span>
          </div>
        </RingProgress>
        <div className="flex-1">
          <p className="text-[15px] font-extrabold text-stone-900">{level.title}</p>
          <p className="text-[11px] text-stone-400 mb-2">
            {next ? `${next.xp - store.xp} نقطة حتى «${next.title}»` : "وصلت للقمة — استمر بالصيانة"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-teal-700">{store.xp} XP</span>
            {next && <span className="text-[10px] text-stone-300">/ {next.xp}</span>}
          </div>
        </div>
      </AppCard>

      {/* Stats grid */}
      <div className="flex gap-2.5">
        <StatCard icon="🔥" value={store.streakDays} label="سلسلة أيام" color="#f97316" />
        <StatCard icon="🧠" value={store.answered} label="سؤال مجاب" color="#0d9488" />
        <StatCard icon="🎯" value={`${accuracy}%`} label="الدقة" color="#f59e0b" />
        <StatCard icon="📚" value={`${exploredCount}/${CONCEPTS.length}`} label="مفاهيم" color="#8b5cf6" />
      </div>

      {/* Error box */}
      <div>
        <SectionTitle
          title="صندوق الأخطاء"
          action={
            errorEntries.length > 0 ? (
              <button
                onClick={() =>
                  startQuiz({
                    category: "all",
                    count: Math.min(10, errorEntries.length),
                    mode: "review",
                    title: "مراجعة أخطائي",
                  })
                }
                className="text-[11px] font-bold text-teal-700 flex items-center gap-0.5"
              >
                ابدأ مراجعة
                <ChevronLeft className="w-3 h-3" />
              </button>
            ) : undefined
          }
        />
        {errorEntries.length === 0 ? (
          <AppCard className="p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-stone-800">صندوقك نظيف!</p>
              <p className="text-[10.5px] text-stone-400">
                كل خطأ يظهر هنا حتى تحوله إلى إجابة صحيحة في المراجعة
              </p>
            </div>
          </AppCard>
        ) : (
          <div className="space-y-2.5">
            {errorEntries.slice(0, 6).map(([qid, count]) => {
              const q = QUESTION_MAP[qid];
              if (!q) return null;
              const c = CONCEPT_MAP[q.conceptId];
              return (
                <AppCard key={qid} className="p-3.5 flex items-center gap-3" onClick={() => c && openConcept(c.id)}>
                  <span className="text-xl shrink-0">{c?.icon ?? "📕"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-stone-700 truncate">{q.question}</p>
                    <p className="text-[10px] text-stone-400">{c?.title}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-extrabold bg-rose-50 text-rose-500 rounded-full px-2 py-1">
                    ×{count}
                  </span>
                </AppCard>
              );
            })}
            {errorEntries.length > 6 && (
              <p className="text-center text-[10px] text-stone-400">
                + {errorEntries.length - 6} أسئلة أخرى في الصندوق
              </p>
            )}
          </div>
        )}
      </div>

      {/* Category mastery */}
      <div>
        <SectionTitle title="إتقان المجالات" />
        <AppCard className="p-4 space-y-3.5">
          {catMastery.map((c) => (
            <div key={c.id}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11.5px] font-bold text-stone-600">{c.name}</span>
                <span
                  className="text-[11px] font-extrabold"
                  style={{ color: c.started ? c.color : "#a8a29e" }}
                >
                  {c.started ? `${c.mastery}%` : "لم تبدأ"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: c.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.started ? c.mastery : 0}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ))}
        </AppCard>
      </div>

      {/* Badges */}
      <div>
        <SectionTitle title="الشارات" />
        <div className="grid grid-cols-3 gap-2.5">
          {Object.values(BADGE_MAP).map((b, i) => {
            const earned = store.badges.includes(b.id);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 border",
                  earned ? "bg-white border-amber-200 shadow-soft" : "bg-stone-100/60 border-transparent"
                )}
              >
                <span className={cn("text-2xl", !earned && "grayscale opacity-40")}>
                  {earned ? b.icon : <Lock className="w-5 h-5 text-stone-300 mt-1.5 mb-1.5" />}
                </span>
                <p className={cn("text-[10px] font-extrabold leading-tight", earned ? "text-stone-700" : "text-stone-400")}>
                  {b.title}
                </p>
                <p className={cn("text-[8.5px] leading-tight", earned ? "text-stone-400" : "text-stone-300")}>
                  {b.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quiz history */}
      {store.quizHistory.length > 0 && (
        <div>
          <SectionTitle title="آخر الجلسات" />
          <AppCard className="divide-y divide-stone-50">
            {store.quizHistory.slice(0, 5).map((h) => {
              const pct = h.total ? Math.round((h.score / h.total) * 100) : 0;
              return (
                <div key={h.id} className="flex items-center gap-3 p-3.5">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-extrabold shrink-0",
                      pct >= 80
                        ? "bg-emerald-50 text-emerald-600"
                        : pct >= 50
                          ? "bg-amber-50 text-amber-600"
                          : "bg-rose-50 text-rose-500"
                    )}
                  >
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-stone-700 truncate">{h.category}</p>
                    <p className="text-[10px] text-stone-400">
                      {h.score}/{h.total} — {new Date(h.at).toLocaleDateString("ar", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <RefreshCcw className="w-3.5 h-3.5 text-stone-200" />
                </div>
              );
            })}
          </AppCard>
        </div>
      )}

      {/* reset */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <button className="w-full h-11 rounded-2xl bg-white border border-stone-200 text-stone-400 text-[12px] font-bold flex items-center justify-center gap-2">
            <Trash2 className="w-3.5 h-3.5" />
            إعادة تعيين كل التقدم
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-[300px] rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إعادة تعيين التقدم؟</DialogTitle>
            <DialogDescription className="text-right">
              سيُحذف كل شيء: النقاط، المستوى، السلسلة، وصندوق الأخطاء. لا يمكن التراجع.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-start">
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => {
                store.resetAll();
                setConfirmOpen(false);
              }}
            >
              نعم، احذف
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
