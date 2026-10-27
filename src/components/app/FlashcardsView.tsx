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
} from "lucide-react";
import { COURSES, CONCEPTS, COURSE_COLOR, COURSE_SHORT, examplesOf, shuffle, questionsOfConcept } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Chip, PrimaryButton, ProgressBar, ScreenShell, SecondaryButton } from "./ui-kit";

// ---------- وضع البطاقات: بطاقة تنقلب باللمس لعرض الشرح والمثال ----------
export default function FlashcardsView() {
  const { conceptReads, readConcept } = useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const clearFlash = useUi((s) => s.clearFlash);

  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = useMemo(
    () => (courseFilter === "all" ? CONCEPTS : CONCEPTS.filter((c) => c.courseId === courseFilter)),
    [courseFilter]
  );

  // إعادة ضبط المؤشر عند تغيير المحور
  const safeIndex = Math.min(index, deck.length - 1);
  const card = deck[safeIndex];
  const course = COURSES.find((c) => c.id === card?.courseId);
  const color = COURSE_COLOR[card?.courseId] ?? "var(--t800)";
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
  const chip = (id: string, label: string) => {
    const active = courseFilter === id;
    return (
      <button
        key={id}
        type="button"
        aria-pressed={active}
        onClick={() => {
          setCourseFilter(id);
          setIndex(0);
          setFlipped(false);
        }}
        className={`min-h-[36px] shrink-0 rounded-full border px-4 text-sm transition-colors ${
          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-secondary-foreground hover:bg-muted"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <ScreenShell
      title="بطاقات المفاهيم"
      sub={`البطاقة ${ad(safeIndex + 1)} من ${ad(deck.length)}`}
      onClose={clearFlash}
      footer={
        <>
          <SecondaryButton onClick={() => go(-1)} aria-label="البطاقة السابقة" className="px-3">
            <ChevronRight className="h-5 w-5" />
          </SecondaryButton>
          <PrimaryButton
            className="flex-1"
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
            <Dumbbell className="h-4 w-4" /> تدرّب على هذا المفهوم
          </PrimaryButton>
          <SecondaryButton onClick={() => go(1)} aria-label="البطاقة التالية" className="px-3">
            <ChevronLeft className="h-5 w-5" />
          </SecondaryButton>
        </>
      }
    >
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {chip("all", "الكل")}
        {COURSES.map((c) => chip(c.id, COURSE_SHORT[c.id] ?? c.name))}
      </div>
      <ProgressBar value={((safeIndex + 1) / deck.length) * 100} className="mb-5" />

      <div className="[perspective:1400px]">
        <motion.div
          className="relative h-[440px] cursor-pointer select-none [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0.0, 0.2, 1] }}
          onClick={flip}
          role="button"
          aria-label={flipped ? "اقلب لترى عنوان المفهوم" : "اقلب لترى الشرح"}
        >
          <div className="absolute inset-0 flex flex-col rounded-2xl border border-border bg-card p-6 card-soft [backface-visibility:hidden]">
            <div className="flex items-center justify-between">
              <Chip>
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {COURSE_SHORT[card.courseId] ?? ""}
              </Chip>
              {isRead && <Chip tone="success">قرأته</Chip>}
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <h2 className="font-display text-2xl font-bold leading-[1.7]">{card.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{card.chapter}</p>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <RotateCw className="h-3.5 w-3.5" /> اضغط البطاقة لترى الشرح
            </p>
          </div>

          <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card card-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="border-b border-border px-5 py-4">
              <p className="font-display text-base font-semibold leading-7">{card.title}</p>
              <p className="text-sm text-muted-foreground">{course?.name}</p>
            </div>
            <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
              <p className="text-base leading-8">{card.explanation}</p>
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-gem" /> أمثلة من الميدان
                </p>
                {examplesOf(card).map((ex, i) => (
                  <p key={i} className="rounded-xl bg-muted p-3 text-sm leading-7 text-secondary-foreground">
                    {ex}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </ScreenShell>
  );
}
