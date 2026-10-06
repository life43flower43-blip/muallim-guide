"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Lightbulb,
  RotateCw,
  Dumbbell,
  Layers,
  GraduationCap,
} from "lucide-react";
import { COURSES, CONCEPTS, COURSE_COLOR, COURSE_SHORT, examplesOf, shuffle, questionsOfConcept } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Button } from "@/components/ui/button";

// ---------- وضع البطاقات: بطاقة تنقلب باللمس لعرض الشرح والمثال ----------
export default function FlashcardsView() {
  const { conceptReads, readConcept } = useApp();
  const startQuiz = useUi((s) => s.startQuiz);

  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = useMemo(
    () => (courseFilter === "all" ? CONCEPTS : CONCEPTS.filter((c) => c.courseId === courseFilter)),
    [courseFilter]
  );

  // إعادة ضبط المؤشر عند تغيير المساق
  const safeIndex = Math.min(index, deck.length - 1);
  const card = deck[safeIndex];
  const course = COURSES.find((c) => c.id === card?.courseId);
  const color = COURSE_COLOR[card?.courseId] ?? "#1B4332";
  const isRead = card ? !!conceptReads[card.id] : false;

  const go = (dir: 1 | -1) => {
    setFlipped(false);
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return deck.length - 1;
      if (next >= deck.length) return 0;
      return next;
    });
  };

  const flip = () => {
    if (!flipped && card) readConcept(card.id);
    setFlipped((f) => !f);
  };

  if (!card) return null;

  return (
    <div className="space-y-3 px-4 pb-6">
      {/* مرشح المساقات */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          onClick={() => {
            setCourseFilter("all");
            setIndex(0);
            setFlipped(false);
          }}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-colors ${
            courseFilter === "all" ? "bg-primary text-primary-foreground" : "bg-white text-foreground/70 border border-border"
          }`}
        >
          الكل
        </button>
        {COURSES.map((c) => {
          const active = courseFilter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCourseFilter(c.id);
                setIndex(0);
                setFlipped(false);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-colors ${
                active ? "text-white" : "bg-white text-foreground/70 border border-border"
              }`}
              style={active ? { background: COURSE_COLOR[c.id] ?? "#1B4332" } : undefined}
            >
              {COURSE_SHORT[c.id] ?? c.name}
            </button>
          );
        })}
      </div>

      {/* شريط التقدم في المجموعة */}
      <div>
        <div className="progress-track h-2">
          <div
            className="progress-fill h-full"
            style={{ width: `${((safeIndex + 1) / deck.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-[11px] font-bold text-foreground/60">
          البطاقة {ad(safeIndex + 1)} من {ad(deck.length)}
        </p>
      </div>

      {/* البطاقة القابلة للقلب */}
      <div className="[perspective:1400px]">
        <motion.div
          className="relative h-[430px] cursor-pointer select-none [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0.0, 0.2, 1] }}
          onClick={flip}
        >
          {/* الوجه الأمامي: اسم المفهوم */}
          <div className="absolute inset-0 flex flex-col rounded-3xl border border-border bg-white p-5 shadow-lg [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl px-2 text-center text-[10px] font-black leading-tight text-white"
                style={{ background: color }}
              >
                {COURSE_SHORT[card.courseId] ?? ""}
              </span>
              {isRead && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
                  قُرئت سابقاً
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <GraduationCap className="h-6 w-6" style={{ color }} />
              </span>
              <h2 className="text-2xl font-black leading-10 text-foreground">{card.title}</h2>
              <p className="mt-3 text-[11px] font-bold text-foreground/50">{card.chapter}</p>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-black" style={{ color }}>
              <RotateCw className="h-3.5 w-3.5" /> اضغط البطاقة لقلبها وعرض الشرح
            </p>
          </div>

          {/* الوجه الخلفي: الشرح والمثال */}
          <div className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="px-4 py-3 text-white" style={{ background: color }}>
              <p className="text-sm font-black leading-6">{card.title}</p>
              <p className="text-[10px] opacity-80">{course?.name}</p>
            </div>
            <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-black" style={{ color }}>
                  <BookOpen className="h-3.5 w-3.5" /> الشرح
                </p>
                <p className="text-[13px] leading-7 text-foreground">{card.explanation}</p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                  <Lightbulb className="h-3.5 w-3.5" /> أمثلة واقعية من الميدان
                </p>
                {examplesOf(card).map((ex, i) => (
                  <div key={i} className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-[12px] leading-6 text-amber-950/90">{ex}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* التنقل */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => go(-1)}
          className="card-soft flex h-12 flex-1 items-center justify-center gap-1 rounded-2xl border border-border bg-white text-sm font-black"
        >
          <ChevronRight className="h-5 w-5" /> السابقة
        </button>
        <Button
          className="h-12 flex-1 rounded-2xl bg-primary text-sm font-black"
          onClick={() => {
            readConcept(card.id);
            startQuiz({
              mode: "training",
              label: `تدريب: ${card.title}`,
              qids: shuffle(questionsOfConcept(card.id)).map((q) => q.id),
              conceptId: card.id,
            });
          }}
        >
          <Dumbbell className="ml-1 h-4 w-4" /> تدريب على هذه البطاقة
        </Button>
        <button
          onClick={() => go(1)}
          className="card-soft flex h-12 flex-1 items-center justify-center gap-1 rounded-2xl border border-border bg-white text-sm font-black"
        >
          التالية <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[10px] text-muted-foreground">
        <Layers className="h-3.5 w-3.5" /> قلب البطاقة يعلمها كمقروءة تلقائياً
      </p>
    </div>
  );
}
