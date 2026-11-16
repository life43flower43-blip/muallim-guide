"use client";

// ============================================================================
// هيكل التطبيق — خمس وجهات على نمط أنظمة التصميم العالمية
// ============================================================================
// الجوال: شريط تنقل سفلي بخمس وجهات (Material 3 / Apple HIG).
// الجهاز اللوحي والحاسوب: قائمة جانبية ثابتة ومحتوى أعرض، كما في Coursera.
// الوجهات: اليوم، التعلّم، التدريب، أخطائي، حسابي.
// ============================================================================

import { syncPush } from "@/lib/push-client";
import PushPrompt from "./PushPrompt";
import AccountDrawer from "./AccountDrawer";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Flame, Settings, House, CircleUser, PencilLine, Target, WifiOff, Compass, ArrowRight } from "lucide-react";
import { useApp, useAppHydrated, xpToday, DAILY_GOAL_XP } from "@/lib/store";
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
import SafeBoundary from "./SafeBoundary";
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
import LicenseBankView from "./LicenseBankView";
import PlacementView from "./PlacementView";
import FlashcardsView from "./FlashcardsView";
import MindMapView from "./MindMapView";
import MisconceptionsView from "./MisconceptionsView";
import BootBank from "./BootBank";
import { ScreenShell } from "./ui-kit";
import { Splash } from "./Splash";
import { GoalBurst } from "./GoalBurst";
import { BackButton, HeaderArt } from "./ui-kit";

export type Tab = "today" | "notebook" | "practice" | "mistakes" | "profile";

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "today", label: "الرئيسية", icon: House },
  { id: "notebook", label: "البوصلة", icon: Compass },
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
      <span className="font-display text-xl font-bold text-foreground">تربوي</span>
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

function BottomNav({ tab, onTab, due, onBack, onAccount, accountOpen }: { tab: Tab; onTab: (t: Tab) => void; due: number; onBack: () => void; onAccount: () => void; accountOpen: boolean }) {
  // يختفي الشريط تدريجيًا حين يسحب الطالب الصفحة للأسفل، ويعود حين يسحبها للأعلى
  const [hidden, setHidden] = useState(false);
  // ارتفاع الشريط الفعلي (مع مساحة أزرار الهاتف) ليترك المحتوى تحته مسافة تكفي فلا تختفي آخر بطاقة
  useEffect(() => {
    const nav = document.getElementById("bottom-nav");
    if (!nav || typeof ResizeObserver === "undefined") return;
    const set = () => document.documentElement.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = document.getElementById("main-scroll");
    if (!el) return;
    let last = el.scrollTop;
    const onScroll = () => {
      const y = el.scrollTop;
      if (y > last + 6 && y > 40) setHidden(true);
      else if (y < last - 6 || y <= 40) setHidden(false);
      last = y;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [tab]);
  return (
    <>
    {/* شريط ثابت بلون أسفل الشريط المتنقل خلف أزرار الهاتف السفلية، يبقى حتى حين يختفي الشريط عند التمرير */}
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-[47] lg:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)", background: "color-mix(in srgb, var(--t700) 88%, #000)" }} />
    <nav
      id="bottom-nav"
      aria-label="التنقل الرئيسي"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[48] transition-[transform,opacity] duration-300 ease-out lg:hidden",
        hidden ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}
    >
      {/* شريط بلون التطبيق متدرج، فيه نقاط لامعة، والتبويب الحالي حبة بيضاء تنزلق بين التبويبات */}
      <div className="nav-bar relative grid min-w-0 grid-cols-5 gap-0.5 overflow-hidden px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-3 min-[380px]:gap-1">
        {[[8, 30], [27, 70], [46, 22], [63, 78], [81, 40], [93, 64]].map(([l, t], k) => (
          <span key={k} className="spark" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${k * 0.5}s` }} aria-hidden="true" />
        ))}
        {NAV.map((n) => {
          const active = n.id === "profile" ? accountOpen || (tab === "profile") : tab === n.id && !accountOpen;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => (n.id === "profile" ? onAccount() : onTab(n.id))}
              data-account-toggle={n.id === "profile" ? "true" : undefined}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[20px] py-1.5 transition-transform active:scale-95"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.18)] dark:bg-card"
                  aria-hidden="true"
                />
              )}
              <n.icon className={cn("relative h-6 w-6 transition-colors", active ? "text-[var(--t700)]" : "text-white/85")} strokeWidth={active ? 2.4 : 1.9} />
              <span className={cn("relative whitespace-nowrap text-[clamp(10px,3.1vw,13px)] transition-colors", active ? "font-extrabold text-[var(--t700)]" : "font-medium text-white/85")}>{n.label}</span>
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
    </>
  );
}

// الشريط العلوي فاتح بلون خلفية التطبيق (ولون شريط حالة الهاتف): في الرئيسية الشعار والترحيب، وفي غيرها اسم الصفحة
function MobileTopBar({ tab, onTab, due, onBack }: { tab: Tab; onTab: (t: Tab) => void; due: number; onBack: () => void }) {
  // الشعلة بلا رقم: حلقة هدف اليوم وحدها
  const sessions = useApp((s) => s.sessions);
  const goal = Math.min(1, xpToday(sessions) / DAILY_GOAL_XP);
  if (tab !== "today")
    return (
      <header className="green-head safe-top sticky top-0 z-30 px-2 pb-0.5 lg:hidden">
        <HeaderArt />
        <div className="relative flex h-12 items-center justify-center px-14">
          {/* زر الرجوع في الشريط العلوي، فلا يغطي شيئًا من محتوى الصفحة */}
          <BackButton onClick={onBack} className="absolute right-1.5 h-10 w-10" />
          <h1 className="font-display text-lg font-extrabold">{NAV.find((n) => n.id === tab)?.label}</h1>
        </div>
      </header>
    );
  return (
    <header className="green-head safe-top sticky top-0 z-30 px-2 pb-2 lg:hidden">
        <HeaderArt />
      <div className="flex items-center justify-between gap-2 px-2.5 pb-1 pt-1">
        <span className="flex min-w-0 items-center gap-2 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo-128.png" alt="" className="h-11 w-11 shrink-0 rounded-[14px] bg-white object-contain p-0.5 ring-1 ring-[#D4A017]/70" />
          <span className="shrink-0 whitespace-nowrap font-display text-[clamp(20px,6.8vw,28px)] font-extrabold leading-9">تربوي</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <span className="flex items-center gap-1 rounded-full bg-white p-[4px] max-[360px]:hidden text-base font-extrabold text-[#C9971C] dark:bg-card" aria-label={`هدف اليوم ${ad(Math.round(goal * 100))}٪`}>
            {/* حلقة هدف اليوم تمتلئ بالذهبي حول الشعلة، وتتوهج عند اكتمالها */}
            <span className={cn("relative h-[28px] w-[28px] rounded-full", goal >= 1 && "ring-2 ring-[#F3DC8E]")}>
              <GoalBurst done={goal >= 1} />
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="goalGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#111111" />
                    <stop offset="1" stopColor="#111111" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15" fill="none" stroke="#F3EEFF" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="url(#goalGold)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${goal * 94.25} 94.25`} className="transition-[stroke-dasharray] duration-700" />
              </svg>
              <Flame className="absolute inset-0 m-auto h-[14px] w-[14px]" fill="#111111" stroke="#111111" strokeWidth={1.5} />
            </span>
            
          </span>
          <button type="button" onClick={() => onTab("mistakes")} aria-label={due > 0 ? `${ad(due)} أخطاء مستحقة` : "الإشعارات"} className="relative flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-[#111111] dark:bg-card">
            <Bell className="h-[18px] w-[18px]" strokeWidth={2.2} />
            {due > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-destructive px-1 text-center text-[11px] font-bold leading-5 text-white">{ad(Math.min(due, 99))}</span>
            )}
          </button>

        </span>
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
  // سجل التبويبات التي زارها المستخدم، ليعيده زر الرجوع خطوة واحدة إلى الخلف
  const tabTrail = useRef<Tab[]>([]);

  const [accountOpen, setAccountOpen] = useState(false);
  // شريط حالة الهاتف بلون أعلى شريط العنوان (كما في أوريندو): يتبع لون التطبيق المختار
  useEffect(() => {
    const t = setTimeout(() => {
      // لون الشريط الأغمق (أعلى شريط العنوان): لون التطبيق مغمقًا ١٢٪، بصيغة سداسية يقبلها الهاتف
      const c = getComputedStyle(document.documentElement).getPropertyValue("--t700").trim() || "#279488";
      const hex = /^#([0-9a-f]{6})$/i.test(c) ? c.slice(1) : "279488";
      const rgb =
        "#" +
        [0, 2, 4]
          .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.88).toString(16).padStart(2, "0"))
          .join("");
      let metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      if (!metas.length) {
        const m = document.createElement("meta");
        m.name = "theme-color";
        document.head.appendChild(m);
        metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      }
      metas.forEach((m) => { m.content = rgb; m.removeAttribute("media"); });
      // خلفية الصفحة الجذرية بلون أسفل الشريط المتنقل، فيأخذ شريط الهاتف السفلي اللون نفسه
      document.documentElement.style.backgroundColor = rgb;
    }, 50);
    return () => clearTimeout(t);
  }, [theme, darkMode]);
  const [bankLoaded, setBankLoaded] = useState(false);
  const [bankProgress, setBankProgress] = useState(0);
  const [bankFailed, setBankFailed] = useState(false);
  const startBankLoad = () => {
    // تأكيد اشتراك الإشعارات بعد تنزيل بنك الأسئلة، فلا يتزاحمان على شبكة الجوال
    const afterBank = () => setTimeout(() => void syncPush().then(() => setTimeout(() => void import("@/lib/diag").then((m) => m.sendDiag()), 3000)), 1500);
    loadQbank((p) => setBankProgress(p))
      .then(() => setBankLoaded(true))
      .catch(() => setBankFailed(true))
      .finally(afterBank);
  };
  useEffect(() => {
    startBankLoad();
  }, []);

  // زر الرجوع في الهاتف: يغلق الشاشة المفتوحة أولًا ويبقى في التبويب نفسه، ثم يعود إلى الرئيسية
  const overlayOpen =
    ui.scenariosOpen || ui.labOpen || ui.simOpen || ui.studioOpen || ui.fieldOpen || ui.challengesOpen || ui.measureOpen ||
    ui.heartOpen || ui.peerOpen || ui.examsimOpen || ui.bankOpen || ui.placementOpen || ui.mindOpen || ui.mythOpen || ui.flashOpen || ui.learnOpen;
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
      setTab(tabTrail.current.pop() ?? "today");
      document.getElementById("main-scroll")?.scrollTo({ top: 0 });
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
    // بقي لونان فقط: الأخضر والكحلي؛ ومن اختار لونًا محذوفًا يعود إلى الأخضر
    const t = theme === "navy" ? "navy" : "emerald";
    if (t === "emerald") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, [theme, dark]);
  useEffect(() => {
    document.documentElement.style.fontSize = fontScale === "large" ? "20px" : fontScale === "bigger" ? "22px" : "";
  }, [fontScale]);

  // عامل الخدمة للعمل دون اتصال، وإعادة تحميل واحدة عند وصول نسخة أحدث
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // لا يُخزَّن ملف العامل نفسه، ويُفحص التحديث كلما عاد المستخدم إلى التطبيق
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
    const check = () => { if (document.visibilityState === "visible") navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {}); };
    document.addEventListener("visibilitychange", check);
    let reloading = false;
    const hadController = !!navigator.serviceWorker.controller;
    const onChange = () => {
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  // تحديث تلقائي: إن نُشرت نسخة أحدث والتبويب مفتوح، يُعاد التحميل حين يعود المستخدم إلى التطبيق
  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_ID;
    if (!mine || mine === "dev") return;
    let busy = false;
    const check = () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      fetch("/api/version", { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { v?: string }) => {
          if (j.v && j.v !== mine && sessionStorage.getItem("turbawy-reloaded-for") !== j.v) {
            sessionStorage.setItem("turbawy-reloaded-for", j.v);
            window.location.reload();
          }
        })
        .catch(() => {})
        .finally(() => { busy = false; });
    };
    check();
    document.addEventListener("visibilitychange", check);
    const t = window.setInterval(check, 10 * 60 * 1000);
    return () => { document.removeEventListener("visibilitychange", check); window.clearInterval(t); };
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

  // روابط الموقع العام (?concept= لمفهوم، و?open= لقسم): يُحفظ الطلب أولًا،
  // ثم يُنفَّذ بعد أن يكمل الزائر الجديد شاشة البداية، حتى لا يضيع ما ضغطه في الموقع
  const PENDING = "turbawy-pending-open";
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const what = q.get("open");
    const concept = q.get("concept");
    if (!what && !concept) return;
    try { sessionStorage.setItem(PENDING, JSON.stringify({ what, concept })); } catch {}
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  useEffect(() => {
    if (!hydrated || !onboarded) return;
    let req: { what?: string | null; concept?: string | null } | null = null;
    try { req = JSON.parse(sessionStorage.getItem(PENDING) || "null"); sessionStorage.removeItem(PENDING); } catch {}
    if (!req) return;
    const s = useUi.getState();
    if (req.concept) { s.openConcept(req.concept); return; }
    const open: Record<string, () => void> = {
      examsim: s.startExamsim, bank: s.startBank, placement: s.startPlacement, learn: s.startLearn, sim: s.startSim, lab: s.startLab,
      studio: s.startStudio, scenarios: s.startScenarios, measure: s.startMeasure, mind: s.startMind, myths: s.startMyths,
      flash: s.startFlash, challenges: s.startChallenges, field: s.startField,
    };
    if (req.what) open[req.what]?.();
  }, [hydrated, onboarded]);

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
  // شاشة الترحيب لا تحتاج بنك الأسئلة، فتظهر فورًا بينما يتنزل البنك في الخلفية
  if (!onboarded) return <Onboarding />;
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
  if (ui.quizConfig) return <SafeBoundary full><QuizSession key={`${ui.quizConfig.label}:${ui.quizConfig.qids.join(",")}`} config={ui.quizConfig} /></SafeBoundary>;
  if (ui.challengesOpen) return <SafeBoundary full><ChallengeSession /></SafeBoundary>;
  if (ui.measureOpen) return <SafeBoundary full><MeasureKit /></SafeBoundary>;
  if (ui.peerOpen) return <SafeBoundary full><PeerChallenge /></SafeBoundary>;
  if (ui.heartOpen) return <SafeBoundary full><HeartOfClass key="heart" /></SafeBoundary>;

  const due = mistakes?.stats.due ?? 0;
  const go = (t: Tab) => {
    ui.closeOverlays();
    if (t === tab) return;
    // نحفظ التبويب الحالي حتى يعيدنا زر الرجوع إليه (وزر الرجوع في الهاتف كذلك)
    tabTrail.current.push(tab);
    window.history.pushState({ turbawyTab: t }, "");
    setTab(t);
    document.getElementById("main-scroll")?.scrollTo({ top: 0 });
  };
  const back = () => {
    if (tabTrail.current.length) window.history.back();
    else setTab("today");
  };

  return (
    <div className="flex h-dvh bg-background">
      <Splash />
      <SideNav tab={tab} onTab={go} due={due} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar tab={tab} onTab={go} due={due} onBack={back} />
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
              className={cn("mx-auto w-full max-w-5xl px-4 pt-5 lg:px-8 lg:pt-8", "pb-[calc(var(--nav-h,96px)+28px)] lg:pb-10")}
            >
              <SafeBoundary key={tab}>
              {tab === "today" && <TodayView onGoTab={go} />}
              {tab === "notebook" && <NotebookView />}
              {tab === "practice" && <PracticeView onGoTab={go} />}
              {tab === "mistakes" && <MistakesView onGoTab={go} />}
              {tab === "profile" && <ProfileView onGoTab={go} />}
              </SafeBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav tab={tab} onTab={(t) => { setAccountOpen(false); go(t); }} due={due} onBack={back} onAccount={() => setAccountOpen((v) => !v)} accountOpen={accountOpen} />
        <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} onOpenProfile={() => go("profile")} />
      </div>

      <SafeBoundary full>
      <AnimatePresence>{ui.simOpen && <SimLabView key="sim" />}</AnimatePresence>
      <AnimatePresence>{ui.labOpen && <LabView key="lab" />}</AnimatePresence>
      <AnimatePresence>{ui.studioOpen && <StudioView key="studio" />}</AnimatePresence>
      <AnimatePresence>{ui.fieldOpen && <FieldLogView key="field" />}</AnimatePresence>
      <AnimatePresence>{ui.scenariosOpen && <ScenariosView key="scenarios" />}</AnimatePresence>
      <AnimatePresence>{ui.bankOpen && <LicenseBankView key="bank" />}</AnimatePresence>
      <AnimatePresence>{ui.examsimOpen && <ExamSimView key="examsim" />}</AnimatePresence>
      <PushPrompt />
      <AnimatePresence>{ui.placementOpen && <PlacementView key="placement" />}</AnimatePresence>
      {ui.learnOpen && (
        <ScreenShell title="المفاهيم التربوية" onClose={ui.clearLearn}>
          <ConceptsView />
        </ScreenShell>
      )}
      {ui.flashOpen && <FlashcardsView />}
      {ui.mindOpen && <MindMapView />}
      {ui.mythOpen && <MisconceptionsView />}
      </SafeBoundary>
    </div>
  );
}
