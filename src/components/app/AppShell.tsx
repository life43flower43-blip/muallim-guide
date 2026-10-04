"use client";

import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BookOpen, Brain, FlaskConical, ChartPie } from "lucide-react";
import { useNav, type Tab } from "@/lib/nav";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Onboarding from "./Onboarding";
import HomeView from "./HomeView";
import ConceptsView, { ConceptDetail } from "./ConceptsView";
import QuizView from "./QuizView";
import QuizSession from "./QuizSession";
import PracticeView, { ScenarioDetail, PlanGuide } from "./PracticeView";
import ProgressView from "./ProgressView";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "concepts", label: "المفاهيم", icon: BookOpen },
  { id: "quiz", label: "اختبار", icon: Brain },
  { id: "practice", label: "تطبيق", icon: FlaskConical },
  { id: "progress", label: "تقدمي", icon: ChartPie },
];

const emptySubscribe = () => () => {};

export default function AppShell() {
  // true only on the client after hydration — avoids SSR/localStorage mismatch
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const onboarded = useAppStore((s) => s.onboarded);
  const tab = useNav((s) => s.tab);
  const quiz = useNav((s) => s.quiz);
  const conceptId = useNav((s) => s.conceptId);
  const scenarioId = useNav((s) => s.scenarioId);
  const planOpen = useNav((s) => s.planOpen);
  const setTab = useNav((s) => s.setTab);

  if (!mounted) {
    return (
      <div className="ambient-bg min-h-dvh flex items-center justify-center">
        <div className="animate-pulse-soft flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-teal-700 flex items-center justify-center text-3xl shadow-lift">
            🎓
          </div>
          <p className="text-sm font-extrabold text-teal-800">تربوي</p>
        </div>
      </div>
    );
  }

  if (!onboarded) return <Onboarding />;

  const overlayOpen = !!quiz || !!conceptId || !!scenarioId || planOpen;

  return (
    <div className="ambient-bg min-h-dvh flex justify-center">
      <div className="relative w-full max-w-md h-dvh md:h-[94vh] md:max-h-[940px] md:my-auto bg-background md:rounded-[2.4rem] md:shadow-2xl md:border md:border-stone-200 overflow-hidden flex flex-col">
        {/* ===== content ===== */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 overflow-y-auto nice-scroll"
            >
              {tab === "home" && <HomeView />}
              {tab === "concepts" && <ConceptsView />}
              {tab === "quiz" && <QuizView />}
              {tab === "practice" && <PracticeView />}
              {tab === "progress" && <ProgressView />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ===== bottom nav ===== */}
        <AnimatePresence>
          {!overlayOpen && (
            <motion.nav
              initial={{ y: 70 }}
              animate={{ y: 0 }}
              exit={{ y: 70 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="shrink-0 bg-white/95 backdrop-blur border-t border-stone-100 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-2"
            >
              <div className="flex items-stretch justify-around px-2">
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl min-w-[56px]"
                      aria-label={t.label}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-2xl bg-teal-50"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <t.icon
                        className={cn(
                          "relative w-5 h-5 transition-colors",
                          active ? "text-teal-700" : "text-stone-400"
                        )}
                        strokeWidth={active ? 2.4 : 2}
                      />
                      <span
                        className={cn(
                          "relative text-[9.5px] font-bold transition-colors",
                          active ? "text-teal-800" : "text-stone-400"
                        )}
                      >
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* ===== overlays ===== */}
        <AnimatePresence>
          {quiz && (
            <QuizSession
              key={`${quiz.mode}-${quiz.count}-${quiz.category ?? ""}-${quiz.conceptId ?? ""}-${quiz.title ?? ""}`}
            />
          )}
        </AnimatePresence>
        <ScenarioDetail />
        <PlanGuide />
        <ConceptDetail />
      </div>
    </div>
  );
}
