"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    icon: "🧠",
    title: "المفاهيم ببساطة عميقة",
    desc: "24 مفهوماً أساسياً في تعديل السلوك والتربية، كل مفهوم بتعريف علمي وتبسيط واضح ومثال صفي واقعي.",
    bg: "#e6f2f0",
  },
  {
    icon: "🎯",
    title: "اختبر نفسك بذكاء",
    desc: "أسئلة متدرجة الصعوبة مع توجيه فوري بعد كل خطأ: لماذا أخطأت؟ وما الفكرة التي تحتاج ضبطها؟",
    bg: "#fdf3e0",
  },
  {
    icon: "📈",
    title: "تقدمك يُقاس ويُحفظ",
    desc: "نقاط خبرة، مستويات، سلسلة أيام، وصندوق أخطاء ذكي يعيد لك ما أخطأت فيه حتى تتقنه.",
    bg: "#e4f5ec",
  },
];

export default function Onboarding() {
  const [idx, setIdx] = useState(0);
  const complete = useAppStore((s) => s.completeOnboarding);
  const slide = SLIDES[idx];
  const last = idx === SLIDES.length - 1;

  return (
    <div className="ambient-bg min-h-dvh flex justify-center">
      <div className="relative w-full max-w-md h-dvh bg-background flex flex-col overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-56 h-56 rounded-full bg-amber-100/50 blur-3xl" />

        <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
            >
              <div
                className="w-28 h-28 rounded-[2rem] flex items-center justify-center text-6xl mb-8 shadow-soft"
                style={{ backgroundColor: slide.bg }}
              >
                {slide.icon}
              </div>
              <h1 className="text-2xl font-extrabold text-stone-900 mb-3">{slide.title}</h1>
              <p className="text-sm text-stone-500 leading-7 max-w-xs">{slide.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pb-10 px-8 relative z-10">
          <div className="flex justify-center gap-2 mb-6">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? "w-7 bg-teal-700" : "w-1.5 bg-stone-300"
                }`}
              />
            ))}
          </div>
          <Button
            onClick={() => (last ? complete() : setIdx(idx + 1))}
            className="w-full h-12 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-base font-bold shadow-lift"
          >
            {last ? "ابدأ رحلتك التعليمية" : "التالي"}
          </Button>
          {!last && (
            <button
              onClick={complete}
              className="w-full text-center text-xs text-stone-400 mt-4 hover:text-stone-600"
            >
              تخطي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
