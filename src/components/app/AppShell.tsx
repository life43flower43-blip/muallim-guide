"use client";

// ============================================================================
// هيكل التطبيق — خمس وجهات على نمط أنظمة التصميم العالمية
// ============================================================================
// الجوال: شريط تنقل سفلي بخمس وجهات (Material 3 / Apple HIG).
// الجهاز اللوحي والحاسوب: قائمة جانبية ثابتة ومحتوى أعرض، كما في Coursera.
// الوجهات: اليوم، التعلّم، التدريب، أخطائي، حسابي.
// ============================================================================

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Settings, House, CircleUser, PencilLine, Target, WifiOff, BookOpenText, ArrowRight } from "lucide-react";
import { useApp, useAppHydrated } from "@/lib/store";
import { useUi, OPEN_SETTINGS_EVENT } from "@/lib/ui-store";
import { loadQbank } from "@/lib/qbank";
import { readPeerHash } from "@/lib/peer";
import { useAccount, afterSignIn } from "@/lib/account-client";
import { startProgressSync } from "@/lib/progress-sync";
import { useMistakes } from "@/lib/mistakes-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ad } from "@/lib/arabic";
import QuizSession from "./QuizSession";
import TodayView from "./TodayView";
import ConceptsView from "./ConceptsView";
import NotebookView from "./NotebookView";
import PracticeView from "./PracticeView";
import MistakesView from "./MistakesView";
import ProfileView from "./ProfileView";
import Onboarding from "./Onboarding";
import ScenariosView from "./ScenariosView";
import LabView from "./LabView";
import SimLabView from "./SimLabView";
import StudioView from "./StudioView";
import FieldLogView from "./FieldLogView";
import ChallengeSession from "./ChallengeSession";
import MeasureKit from "./MeasureKit";
import PeerChallenge from "./PeerChallenge";
import HeartOfClass from "./HeartOfClass";
import ExamSimView from "./ExamSimView";
import PlacementView from "./PlacementView";
import FlashcardsView from "./FlashcardsView";
import AiAssistantView from "./AiAssistantView";
import MindMapView from "./MindMapView";
import MisconceptionsView from "./MisconceptionsView";
import BootBank from "./BootBank";
import { ScreenShell } from "./ui-kit";
import { Splash } from "./Splash";

export type Tab = "today" | "notebook" | "practice" | "mistakes" | "profile";

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "today", label: "الرئيسية", icon: House },
  { id: "notebook", label: "الملخصات", icon: BookOpenText },
  { id: "practice", label: "التدريب", icon: PencilLine },
  { id: "mistakes", label: "أخطائي", icon: Target },
  { id: "profile", label: "حسابي", icon: CircleUser },
];

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function subscribeScheme(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] overflow-hidden bg-white">
<img src="/icons/logo-128.png" alt="" className="h-full w-full object-contain p-0.5" />
      </span>
      <span className="font-display text-xl font-bold text-primary">تربوي</span>
    </span>
  );
}

function SideNav({ tab, onTab, due }: { tab: Tab; onTab: (t: Tab) => void; due: number }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-l border-border bg-card px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onTab(n.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-base transition-colors",
                active ? "bg-accent font-semibold text-accent-foreground" : "text-secondary-foreground hover:bg-muted"
              )}
            >
              <n.icon className="h-5 w-5" strokeWidth={1.9} />
              <span className="flex-1 text-right">{n.label}</span>
              {n.id === "mistakes" && due > 0 && (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-destructive">{ad(due)}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function BottomNav({ tab, onTab, due }: { tab: Tab; onTab: (t: Tab) => void; due: number }) {
  return (
    <nav id="bottom-nav" aria-label="التنقل الرئيسي" className="safe-bottom px-2 pb-2 pt-1 min-[380px]:px-3 lg:hidden">
      {/* شريط عائم بإطار رفيع، والحبة الخضراء تنزلق بين التبويبات */}
      <div className="nav-gold grid grid-cols-5 gap-0.5 rounded-[26px] p-1 min-[380px]:gap-1 min-[380px]:p-1.5">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onTab(n.id)}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[20px] py-1.5 transition-transform active:scale-95"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[var(--t600)] to-[var(--t850)]"
                  aria-hidden="true"
                />
              )}
              <n.icon className={cn("relative h-6 w-6 transition-colors", active ? "text-white" : "text-[var(--t700)] dark:text-primary")} strokeWidth={active ? 2.3 : 1.9} />
              <span className={cn("relative whitespace-nowrap text-[clamp(10px,3.1vw,13px)] transition-colors", active ? "font-bold text-white" : "font-medium text-[var(--t700)] dark:text-primary")}>{n.label}</span>
              {n.id === "mistakes" && due > 0 && (
                <span className="absolute right-1/2 top-0.5 translate-x-5 rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-4 text-white ring-2 ring-white">
                  {ad(Math.min(due, 99))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// الشريط العلوي فاتح بلون خلفية التطبيق (ولون شريط حالة الهاتف): في الرئيسية الشعار والترحيب، وفي غيرها اسم الصفحة
function MobileTopBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  // تحية باسم المستخدم بدل اسم التطبيق: الشعار يكفي للتعريف
  const name = useApp((s) => s.name).trim().split(/\s+/)[0];
  const h = new Date().getHours();
  const greeting = `${h < 12 ? "صباح الخير" : "مساء الخير"}${name ? `، ${name}` : ""}`;
  const openSettings = () => {
    onTab("profile");
    setTimeout(() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT)), 50);
  };
  if (tab !== "today")
    return (
      <header className="green-head safe-top sticky top-0 z-30 px-2 pb-2 lg:hidden">
        <div className="relative flex h-14 items-center justify-center px-14">
          {/* رجوع إلى الرئيسية */}
          <button type="button" onClick={() => onTab("today")} aria-label="رجوع" className="absolute right-1.5 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
            <ArrowRight className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <h1 className="font-display text-xl font-extrabold">{NAV.find((n) => n.id === tab)?.label}</h1>
          {tab === "profile" && (
            <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))} aria-label="الإعدادات" className="absolute left-1.5 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
              <Settings className="h-6 w-6" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </header>
    );
  return (
    <header className="green-head safe-top sticky top-0 z-30 px-2 pb-1 lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-2.5">
        <span className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo-128.png" alt="" className="h-9 w-9 shrink-0 rounded-[12px] bg-white object-contain p-0.5 ring-1 ring-[var(--t100)]" />
          <span className="min-w-0 truncate font-display text-[19px] font-extrabold">{greeting}</span>
        </span>
        <button type="button" onClick={openSettings} aria-label="الإعدادات" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--t800)] hover:bg-black/5 dark:text-primary">
          <Settings className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-background" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="h-16 border-b border-border bg-card" />
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4">
        <div className="h-36 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export default function AppShell() {
  const hydrated = useAppHydrated();
  const { onboarded, darkMode, fontScale, theme } = useApp();
  const ui = useUi();
  const queryClient = useQueryClient();
  const { user } = useAccount();
  const { data: mistakes } = useMistakes();
  // العائد من تسجيل الدخول بـ Google يفتح على «حسابي»
  // ورابط مفهوم من صفحات الموقع العامة (?concept=) يفتح على «التعلّم»
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "today";
    const q = new URLSearchParams(window.location.search);
    const asked = q.get("tab");
    if (asked && NAV.some((n) => n.id === asked)) return asked as Tab;
    return q.has("login") ? "profile" : "today";
  });

  const [bankLoaded, setBankLoaded] = useState(false);
  const [bankProgress, setBankProgress] = useState(0);
  const [bankFailed, setBankFailed] = useState(false);
  const startBankLoad = () => {
    loadQbank((p) => setBankProgress(p))
      .then(() => setBankLoaded(true))
      .catch(() => setBankFailed(true));
  };
  useEffect(() => {
    startBankLoad();
  }, []);

  // زر الرجوع في الهاتف: يغلق الشاشة المفتوحة أولًا ويبقى في التبويب نفسه، ثم يعود إلى الرئيسية
  const overlayOpen =
    ui.scenariosOpen || ui.labOpen || ui.simOpen || ui.studioOpen || ui.fieldOpen || ui.challengesOpen || ui.measureOpen ||
    ui.heartOpen || ui.peerOpen || ui.examsimOpen || ui.placementOpen || ui.mindOpen || ui.mythOpen || ui.flashOpen || ui.aiOpen || ui.learnOpen;
  const overlayRef = useRef(false);
  useEffect(() => {
    if (overlayOpen && !overlayRef.current) window.history.pushState({ turbawyOverlay: true }, "");
    overlayRef.current = overlayOpen;
  }, [overlayOpen]);
  useEffect(() => {
    const onPop = () => {
      if (overlayRef.current) {
        overlayRef.current = false;
        ui.closeOverlays();
        return;
      }
      setTab("today");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [ui]);
  const isOnline = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const sysDark = useSyncExternalStore(subscribeScheme, () => window.matchMedia("(prefers-color-scheme: dark)").matches, () => false);
  const dark = darkMode === "dark" || (darkMode === "auto" && sysDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  // لون التطبيق المختار، ولون شريط حالة الهاتف معه
  useEffect(() => {
    const t = theme ?? "emerald";
    if (t === "emerald") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => bg && m.setAttribute("content", bg));
  }, [theme, dark]);
  useEffect(() => {
    document.documentElement.style.fontSize = fontScale === "large" ? "20px" : fontScale === "bigger" ? "22px" : "";
  }, [fontScale]);

  // عامل الخدمة للعمل دون اتصال، وإعادة تحميل واحدة عند وصول نسخة أحدث
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    let reloading = false;
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => {
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);

  // تحدٍّ وصل عبر رابط
  useEffect(() => {
    const p = readPeerHash();
    if (!p) return;
    ui.setPeerIncoming(p);
    ui.startPeer();
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch {}
  }, []);

  // رابط مفهوم من الموقع العام: يُفتح المفهوم بعد تحميل البنك
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("concept");
    if (!id) return;
    ui.openConcept(id);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // العودة من Google: رسالة، ثم نقل بيانات الجهاز إلى الحساب
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const login = params.get("login");
    if (!login) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (login === "success") {
      toast({ title: "تم تسجيل الدخول" });
      afterSignIn(queryClient);
    } else if (login === "error") {
      toast({
        title: params.get("reason") === "no_config" ? "الدخول بحساب Google غير مفعّل بعد" : "تعذّر تسجيل الدخول بحساب Google",
      });
    }
  }, []);

  // المسجَّل: مزامنة التقدم بين أجهزته
  useEffect(() => {
    if (user) startProgressSync();
  }, [user?.id]);

  if (!hydrated) return <ShellSkeleton />;
  if (!bankLoaded)
    return (
      <BootBank
        progress={bankProgress}
        failed={bankFailed}
        onRetry={() => {
          setBankFailed(false);
          setBankProgress(0);
          startBankLoad();
        }}
      />
    );
  if (!onboarded) return <Onboarding />;
  if (ui.quizConfig) return <QuizSession key={`${ui.quizConfig.label}:${ui.quizConfig.qids.join(",")}`} config={ui.quizConfig} />;
  if (ui.challengesOpen) return <ChallengeSession />;
  if (ui.measureOpen) return <MeasureKit />;
  if (ui.peerOpen) return <PeerChallenge />;
  if (ui.heartOpen) return <HeartOfClass key="heart" />;

  const due = mistakes?.stats.due ?? 0;
  const go = (t: Tab) => {
    ui.closeOverlays();
    // زر الرجوع في الهاتف يعيد إلى الرئيسية من أي تبويب بدل إغلاق التطبيق
    if (t !== "today" && tab === "today") window.history.pushState({ turbawyTab: t }, "");
    setTab(t);
    document.getElementById("main-scroll")?.scrollTo({ top: 0 });
  };

  return (
    <div className="flex h-dvh bg-background">
      <Splash />
      <SideNav tab={tab} onTab={go} due={due} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar tab={tab} onTab={go} />
        {!isOnline && (
          <div role="status" className="flex items-center justify-center gap-2 border-b border-border bg-gem-soft px-4 py-1.5 text-xs font-medium text-gem">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            أنت دون اتصال — التطبيق يعمل، وتُحفظ بياناتك على جهازك
          </div>
        )}
        <main id="main-scroll" className="no-scrollbar flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn("mx-auto w-full max-w-5xl px-4 pt-5 lg:px-8 lg:pt-8", tab === "today" ? "pb-2 lg:pb-10" : "pb-10")}
            >
              {tab === "today" && <TodayView onGoTab={go} />}
              {tab === "notebook" && <NotebookView />}
              {tab === "practice" && <PracticeView onGoTab={go} />}
              {tab === "mistakes" && <MistakesView onGoTab={go} />}
              {tab === "profile" && <ProfileView onGoTab={go} />}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav tab={tab} onTab={go} due={due} />
      </div>

      <AnimatePresence>{ui.simOpen && <SimLabView key="sim" />}</AnimatePresence>
      <AnimatePresence>{ui.labOpen && <LabView key="lab" />}</AnimatePresence>
      <AnimatePresence>{ui.studioOpen && <StudioView key="studio" />}</AnimatePresence>
      <AnimatePresence>{ui.fieldOpen && <FieldLogView key="field" />}</AnimatePresence>
      <AnimatePresence>{ui.scenariosOpen && <ScenariosView key="scenarios" />}</AnimatePresence>
      <AnimatePresence>{ui.examsimOpen && <ExamSimView key="examsim" />}</AnimatePresence>
      <AnimatePresence>{ui.placementOpen && <PlacementView key="placement" />}</AnimatePresence>
      {ui.learnOpen && (
        <ScreenShell title="المفاهيم التربوية" onClose={ui.clearLearn}>
          <ConceptsView />
        </ScreenShell>
      )}
      {ui.flashOpen && <FlashcardsView />}
      <AnimatePresence>{ui.aiOpen && <AiAssistantView key="ai" />}</AnimatePresence>
      {ui.mindOpen && <MindMapView />}
      {ui.mythOpen && <MisconceptionsView />}
    </div>
  );
}
