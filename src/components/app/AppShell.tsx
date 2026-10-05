"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BookOpen, Target, User, GraduationCap, Flame } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { CONCEPTS, QUESTIONS } from "@/lib/qbank";
import QuizSession from "./QuizSession";
import HomeView from "./HomeView";
import ConceptsView from "./ConceptsView";
import QuizHome from "./QuizHome";
import AccountView from "./AccountView";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "concepts", label: "المفاهيم", icon: BookOpen },
  { id: "quiz", label: "الاختبار", icon: Target },
  { id: "account", label: "حسابي", icon: User },
];

const TAB_TITLES: Record<string, string> = {
  home: "تربوي",
  concepts: "المفاهيم",
  quiz: "الاختبارات",
  account: "حسابي",
};

// ---------- شاشة الترحيب الأولى ----------
function Onboarding() {
  const { setName, setOnboarded } = useApp();
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] p-6 text-white">
      <div className="safe-top" />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/15"
        >
          <GraduationCap className="h-16 w-16" />
        </motion.div>
        <h1 className="text-4xl font-black">تربوي</h1>
        <p className="mt-3 max-w-xs text-sm leading-7 text-emerald-100">
          رفيقك في التربية وعلم النفس التربوي: {CONCEPTS.length} مفهوماً و{QUESTIONS.length} سؤالاً من الكتاب والمكتبة التربوية، توجيه ذكي بعد كل خطأ،
          ومراجعة متباعدة تثبّت المعرفة في ذاكرتك.
        </p>

        <div className="mt-10 w-full max-w-sm">
          <label className="mb-2 block text-right text-xs font-bold text-emerald-100">
            ما اسمك يا معلم المستقبل؟
          </label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب اسمك هنا"
            className="w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3.5 text-center font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <Button
            onClick={() => {
              setName(draft.trim());
              setOnboarded();
            }}
            className="mt-4 h-14 w-full rounded-2xl bg-amber-400 text-lg font-black text-amber-950 hover:bg-amber-300"
          >
            لنبدأ الرحلة
          </Button>
        </div>
      </div>
      <div className="safe-bottom" />
    </div>
  );
}

// انتظار إعادة ترطيب المتجر من التخزين المحلي (يمنع عدم تطابق الترطيب)
function useHydrated() {
  return useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false
  );
}

// ---------- الهيكل الرئيسي ----------
export default function AppShell() {
  const hydrated = useHydrated();
  const { onboarded, streak } = useApp();
  const quizConfig = useUi((s) => s.quizConfig);
  const [tab, setTab] = useState("home");

  // تسجيل عامل الخدمة للعمل دون اتصال
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <GraduationCap className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  if (!onboarded) return <Onboarding />;

  if (quizConfig) return <QuizSession config={quizConfig} />;

  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-background shadow-xl">
      {/* شريط علوي */}
      <header className="safe-top flex items-center justify-between border-b border-border bg-white/90 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-black text-primary">{TAB_TITLES[tab]}</h1>
        </div>
        {streak > 0 && (
          <motion.span
            key={streak}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-600"
          >
            <Flame className="h-3.5 w-3.5" />
            {streak}
          </motion.span>
        )}
      </header>

      {/* المحتوى */}
      <main className="no-scrollbar flex-1 overflow-y-auto pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "home" && <HomeView onGoTab={setTab} />}
            {tab === "concepts" && <ConceptsView />}
            {tab === "quiz" && <QuizHome />}
            {tab === "account" && <AccountView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* شريط التنقل السفلي */}
      <nav className="safe-bottom border-t border-border bg-white px-2 pt-1.5">
        <div className="flex items-stretch justify-around">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex min-w-[56px] flex-col items-center gap-0.5 rounded-2xl px-2 pb-1.5 pt-1"
                aria-label={t.label}
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-x-1 -top-0.5 h-1 rounded-full bg-primary"
                  />
                )}
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-bold transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
