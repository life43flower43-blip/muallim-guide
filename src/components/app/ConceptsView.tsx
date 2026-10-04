"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Brain, Lightbulb, KeyRound, AlertTriangle, Link2 } from "lucide-react";
import { CONCEPTS, CAT_MAP, CATEGORIES, CONCEPT_MAP } from "@/lib/content";
import type { CategoryId, Concept } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useNav } from "@/lib/nav";
import { CategoryChip, AppCard } from "./shared";
import { cn } from "@/lib/utils";

export default function ConceptsView() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const explored = useAppStore((s) => s.exploredConcepts);
  const { openConcept, startQuiz } = useNav();

  const filtered = CONCEPTS.filter((c) => {
    const inCat = cat === "all" || c.category === cat;
    const q = query.trim();
    const inQuery =
      !q || c.title.includes(q) || c.en.toLowerCase().includes(q.toLowerCase()) || c.simple.includes(q);
    return inCat && inQuery;
  });

  return (
    <div className="px-5 pt-6 pb-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-extrabold text-stone-900">مكتبة المفاهيم</h1>
        <p className="text-[11px] text-stone-400 mt-0.5">
          {explored.length} من {CONCEPTS.length} مفهوماً مستكشفاً — المس المفهوم لتفاصيله
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مفهوم..."
          className="w-full h-11 rounded-2xl bg-white shadow-soft pr-10 pl-10 text-[13px] outline-none border border-transparent focus:border-teal-300 transition-colors placeholder:text-stone-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center"
          >
            <X className="w-3 h-3 text-stone-500" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pb-1 -mx-5 px-5">
        <CatChip active={cat === "all"} onClick={() => setCat("all")} color="#1c2422" label="الكل" />
        {CATEGORIES.map((c) => (
          <CatChip
            key={c.id}
            active={cat === c.id}
            onClick={() => setCat(c.id)}
            color={c.color}
            label={c.short}
          />
        ))}
      </div>

      {/* Concept cards */}
      <div className="mt-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <AppCard
                className="p-4 flex items-center gap-3.5"
                onClick={() => openConcept(c.id)}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 relative"
                  style={{ backgroundColor: CAT_MAP[c.category].soft }}
                >
                  {c.icon}
                  {explored.includes(c.id) && (
                    <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white">
                        <path
                          d="M2.5 6.5 5 9l4.5-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[14px] font-extrabold text-stone-800">{c.title}</p>
                    <CategoryChip id={c.category} small />
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">{c.simple}</p>
                </div>
              </AppCard>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="text-center text-xs text-stone-400 py-10">لا نتائج مطابقة — جرّب كلمة أخرى</p>
        )}
      </div>
    </div>
  );
}

function CatChip({
  active,
  onClick,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold transition-all",
        active ? "text-white shadow" : "bg-white text-stone-500 shadow-soft"
      )}
      style={active ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}

/** ===== طبقة تفاصيل المفهوم ===== */
export function ConceptDetail() {
  const conceptId = useNav((s) => s.conceptId);
  const close = useNav((s) => s.closeConcept);
  const startQuiz = useNav((s) => s.startQuiz);
  const openConcept = useNav((s) => s.openConcept);
  const markExplored = useAppStore((s) => s.markExplored);

  if (!conceptId) return null;
  const c: Concept = CONCEPT_MAP[conceptId];
  if (!c) return null;
  const cat = CAT_MAP[c.category];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[60] bg-stone-900/40 backdrop-blur-[2px]"
        onClick={close}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="absolute inset-x-0 bottom-0 top-10 bg-background rounded-t-[2rem] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div
            className="shrink-0 px-5 pt-4 pb-5 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${cat.color}14, ${cat.color}05)` }}
          >
            <button
              onClick={close}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center"
            >
              <X className="w-4 h-4 text-stone-500" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-3xl"
              >
                {c.icon}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-stone-900">{c.title}</h2>
                <p className="text-[11px] text-stone-400 font-medium" dir="ltr">
                  {c.en}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <CategoryChip id={c.category} />
            </div>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto nice-scroll px-5 py-4 space-y-4">
            <Block
              icon={<BookOpenIcon />}
              color="#0f766e"
              title="التعريف العلمي"
              body={c.definition}
            />
            <Block
              icon={<Lightbulb className="w-4 h-4" />}
              color="#f59e0b"
              title="التبسيط"
              body={c.simple}
              bg="#fdf8ec"
            />
            <Block
              icon={<FlaskIcon />}
              color="#8b5cf6"
              title="مثال من الصف"
              body={c.example}
              bg="#f6f2fe"
            />

            {/* keys */}
            <div className="bg-white rounded-3xl shadow-soft p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-teal-700" />
                </div>
                <p className="text-[13px] font-extrabold text-stone-800">نقاط مفتاحية</p>
              </div>
              <ul className="space-y-2">
                {c.keys.map((k, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] text-stone-600 leading-relaxed">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500" />
                    {k}
                  </li>
                ))}
              </ul>
            </div>

            {c.mistake && (
              <div className="bg-rose-50 rounded-3xl p-4 border border-rose-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <p className="text-[13px] font-extrabold text-rose-600">احذر الخلط</p>
                </div>
                <p className="text-[12px] text-rose-700/90 leading-relaxed">{c.mistake}</p>
              </div>
            )}

            {/* related */}
            {c.related.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Link2 className="w-4 h-4 text-stone-400" />
                  <p className="text-[12px] font-bold text-stone-500">مفاهيم مرتبطة</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.related
                    .map((r) => CONCEPT_MAP[r])
                    .filter(Boolean)
                    .map((rc) => (
                      <button
                        key={rc.id}
                        onClick={() => openConcept(rc.id)}
                        className="px-3 py-2 rounded-2xl bg-white shadow-soft text-[11px] font-bold text-stone-600 flex items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <span>{rc.icon}</span>
                        {rc.title}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="shrink-0 p-4 bg-white/80 backdrop-blur border-t border-stone-100">
            <button
              onClick={() => {
                markExplored(c.id);
                close();
                startQuiz({
                  category: "all",
                  count: 5,
                  mode: "concept",
                  conceptId: c.id,
                  title: `اختبار: ${c.title}`,
                });
              }}
              className="w-full h-12 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lift active:scale-[0.98] transition-transform"
              style={{ backgroundColor: cat.color }}
            >
              <Brain className="w-4 h-4" />
              اختبرني في هذا المفهوم
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Block({
  icon,
  color,
  title,
  body,
  bg = "#ffffff",
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  body: string;
  bg?: string;
}) {
  return (
    <div className="rounded-3xl shadow-soft p-4" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "14", color }}>
          {icon}
        </div>
        <p className="text-[13px] font-extrabold text-stone-800">{title}</p>
      </div>
      <p className="text-[12.5px] text-stone-600 leading-6">{body}</p>
    </div>
  );
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 2v7.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9.5V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </svg>
  );
}
