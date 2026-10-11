"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BookOpen, User, School, Dumbbell, Target, WifiOff } from "lucide-react";
import { useApp, useAppHydrated } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import QuizSession from "./QuizSession";
import HomeView from "./HomeView";
import ConceptsView from "./ConceptsView";
import QuizHome from "./QuizHome";
import AccountView from "./AccountView";
import ScenariosView from "./ScenariosView";
import LabView from "./LabView";
import MistakesView from "./MistakesView";
import { Button } from "@/components/ui/button";

const TAB_TITLES: Record<string, string> = {
  home: "تربوي",
  concepts: "المكتبة",
  mistakes: "أخطائي",
  quiz: "الاختبارات",
  account: "حسابي",
};

// اشتراك أحداث الاتصال — لاستخدام useSyncExternalStore
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

// اشتراك تفضيل النظام للوضع الليلي — لوضع «تلقائي»
function subscribeScheme(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

// ---------- شريط التنقل السفلي الثابت (نقد البند 6) ----------
// الرئيسية / المكتبة / تدريب / حسابي — أهداف لمس ≥44px مع safe-area،
// والتمييز بالأيقونة واللون معًا.
function BottomNav({
  tab,
  onHome,
  onConcepts,
  onMistakes,
  onTrain,
  onAccount,
}: {
  tab: string;
  onHome: () => void;
  onConcepts: () => void;
  onMistakes: () => void;
  onTrain: () => void;
  onAccount: () => void;
}) {
  const scenariosOpen = useUi((s) => s.scenariosOpen);
  const labOpen = useUi((s) => s.labOpen);
  const items = [
    { id: "home", label: "الرئيسية", icon: Home, active: tab === "home", onClick: onHome },
    { id: "library", label: "المكتبة", icon: BookOpen, active: tab === "concepts", onClick: onConcepts },
    { id: "mistakes", label: "أخطائي", icon: Target, active: tab === "mistakes", onClick: onMistakes },
    { id: "train", label: "تدريب", icon: Dumbbell, active: labOpen || scenariosOpen, onClick: onTrain },
    { id: "account", label: "حسابي", icon: User, active: tab === "account", onClick: onAccount },
  ];
  return (
    <nav className="safe-bottom border-t border-border bg-white px-2 pt-1.5" aria-label="التنقل الرئيسي">
      <div className="flex items-stretch justify-around">
        {items.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={t.onClick}
              aria-label={t.label}
              aria-current={t.active ? "page" : undefined}
              className="relative flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-2xl px-3 pb-1.5 pt-1.5"
            >
              {t.active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-x-2 -top-0.5 h-1 rounded-full bg-primary"
                />
              )}
              <Icon
                className={`h-6 w-6 transition-colors ${
                  t.active ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={t.active ? 2.6 : 2}
              />
              <span
                className={`text-[11px] font-bold transition-colors ${
                  t.active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

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
          <School className="h-16 w-16" />
        </motion.div>
        <h1 className="text-4xl font-black">تربوي</h1>
        <p className="mt-3 max-w-xs text-sm leading-7 text-gray-100">
          مساعد إعداد المعلم يرافقك من طالب تربية إلى معلم جاهز: مفاهيم مشروحة بأمثلة واقعية من
          الميدان، تدريب بتوجيه فوري، مواقف صفّية تحاكي الصف الحقيقي، ومراجعة ذكية تثبّت المعرفة في
          ذاكرتك.
        </p>

        <div className="mt-10 w-full max-w-sm">
          <label className="mb-2 block text-right text-xs font-bold text-gray-100">
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

// ---------- هيكل الترحيب (skeleton) حتى جهوزية المخزن — بدل البطاقة الباهتة ----------
function ShellSkeleton() {
  return (
    <div
      className="mx-auto flex h-dvh max-w-[480px] flex-col bg-background shadow-xl"
      aria-busy="true"
      aria-label="جارٍ تحميل بياناتك"
    >
      <div className="safe-top px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-40 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="h-13 w-13 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-8 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="no-scrollbar flex-1 space-y-4 overflow-hidden px-4 pt-2">
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="h-20 animate-pulse rounded-3xl bg-muted" />
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
      </div>
      <BottomNav tab="home" onHome={() => {}} onConcepts={() => {}} onMistakes={() => {}} onTrain={() => {}} onAccount={() => {}} />
    </div>
  );
}

// ---------- الهيكل الرئيسي ----------
export default function AppShell() {
  const hydrated = useAppHydrated();
  const { onboarded, darkMode, fontScale } = useApp();
  const quizConfig = useUi((s) => s.quizConfig);
  const scenariosOpen = useUi((s) => s.scenariosOpen);
  const labOpen = useUi((s) => s.labOpen);
  const startLab = useUi((s) => s.startLab);
  const clearLab = useUi((s) => s.clearLab);
  const clearScenarios = useUi((s) => s.clearScenarios);
  const [tab, setTab] = useState("home");

  // حالة الاتصال — قراءة مباشرة من المتصفح بلا setState داخل الأثر
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
  const offline = !isOnline;

  // تفضيل النظام للوضع الليلي — يُتّبع في وضع «تلقائي»
  const sysDark = useSyncExternalStore(
    subscribeScheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false
  );
  const dark = darkMode === "dark" || (darkMode === "auto" && sysDark);

  // الوضع الليلي — يُطبق على الجذر كي تغطي متغيرات الثيم كل الواجهة
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // حجم الخط — يضبط خط الجذر فتكبر كل النصوص المتناسبة معه (وحدة rem) بانسجام
  useEffect(() => {
    document.documentElement.style.fontSize =
      fontScale === "large" ? "17.5px" : fontScale === "bigger" ? "19px" : "";
  }, [fontScale]);

  // مؤشر عدم الاتصال — اشتراك أحداث الشبكة (الاستماع فقط، لا حالة تُضبط يدويًا)
  // تسجيل عامل الخدمة للعمل دون اتصال
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!hydrated) return <ShellSkeleton />;

  if (!onboarded) return <Onboarding />;

  if (quizConfig) return <QuizSession config={quizConfig} />;

  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-background shadow-xl">
      {/* شريط علوي — الرئيسية ترويستها مدمجة داخل الصفحة (نقد البند 7) */}
      {tab !== "home" && (
        <header className="safe-top flex items-center justify-between border-b border-border bg-white/90 px-4 pb-2 pt-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <School className="h-5 w-5" />
            </span>
            <h1 className="text-lg font-black text-primary">{TAB_TITLES[tab]}</h1>
          </div>
        </header>
      )}

      {/* مؤشر عدم الاتصال — بلا إزعاج، يختفي تلقائيًا عند عودة الشبكة */}
      {offline && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-bold text-amber-800"
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          أنت الآن دون اتصال — التطبيق يواصل العمل كالمعتاد
        </div>
      )}

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
            {tab === "mistakes" && <MistakesView />}
            {tab === "quiz" && <QuizHome onGoTab={setTab} />}
            {tab === "account" && <AccountView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* شريط التنقل السفلي الثابت */}
      <BottomNav
        tab={tab}
        onHome={() => {
          clearScenarios(); // يغلق الطبقات المفتوحة ويعود للرئيسية
          clearLab(); // المختبر أيضاً طبقة ملء شاشة — يجب أن يغلقها زر الرئيسية
          setTab("home");
        }}
        onConcepts={() => setTab("concepts")}
        onMistakes={() => setTab("mistakes")}
        onTrain={startLab}
        onAccount={() => setTab("account")}
      />

      {/* مختبر المعلّم */}
      <AnimatePresence>{labOpen && <LabView key="lab" />}</AnimatePresence>

      {/* شاشة محاكاة الصف الدراسي */}
      <AnimatePresence>{scenariosOpen && <ScenariosView key="scenarios" />}</AnimatePresence>
    </div>
  );
}
