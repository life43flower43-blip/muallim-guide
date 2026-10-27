"use client";

// ============================================================================
// «حسابي» — منقول من الملف الشخصي في أوريندو
// ============================================================================
// من أنت ومستواك (أو دخول/إنشاء حساب للضيف)،
// ثم أرقامك والاختبارات السابقة والإنجازات؛ والإعدادات والجواهر في شاشة الإعدادات.
// ============================================================================

import { FitText } from "./FitText";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Download,
  Flame,
  Gem,
  LogOut,
  Monitor,
  Moon,
  ShieldAlert,
  Smartphone,
  Snowflake,
  Sun,
  Target,
  Trash2,
  Trophy,
  Upload,
  Settings,
  ChevronLeft,
  UserRound,
} from "lucide-react";
import { useApp, type LearnerGoal, THEMES } from "@/lib/store";
import { COURSES, LEVEL_XP, chaptersOfCourse, levelFromXp, levelTitle, xpInLevel } from "@/lib/qbank";
import { chapterStats } from "@/lib/practice-bank";
import { useMistakes } from "@/lib/mistakes-client";
import { GEM_RULES, MAX_STREAK_FREEZES } from "@/lib/gems-rules";
import { GEM_REASON_LABELS, deleteAccount, signOut, spendGems, useAccount, useWallet } from "@/lib/account-client";
import { useLocalMistakesStore } from "@/lib/local-mistakes-store";
import { ad, arCount, DAY_FORMS } from "@/lib/arabic";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tab } from "./AppShell";
import { OPEN_SETTINGS_EVENT } from "@/lib/ui-store";
import { disablePush, enablePush, usePushState } from "@/lib/push-client";
import AuthPanel from "./AuthPanel";
import PastTests from "./PastTests";
import { Card, IconTile, PageTitle, ProgressBar, ScreenShell, SecondaryButton, SectionHeader, pct } from "./ui-kit";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const GOALS: { id: LearnerGoal; label: string }[] = [
  { id: "job", label: "اختبار التوظيف" },
  { id: "university", label: "مقررات الكلية" },
  { id: "teacher", label: "تطوير الممارسة" },
];

const dateFmt = new Intl.DateTimeFormat("ar-u-nu-arab", { day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("ar-u-nu-arab", { day: "numeric", month: "short" });

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly (readonly [T, string, React.ElementType?])[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="grid rounded-xl bg-muted p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, lbl, Icon]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg text-sm transition-colors",
            value === v ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {lbl}
        </button>
      ))}
    </div>
  );
}

export default function ProfileView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const queryClient = useQueryClient();
  const { user, isLoading } = useAccount();
  const wallet = useWallet();
  const { data: mistakes } = useMistakes();
  const st = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const push = usePushState();
  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const history = useQuery({
    queryKey: ["gem-history"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch("/api/user/gems");
      if (!res.ok) throw new Error("failed");
      return (await res.json()).items as { id: string; amount: number; reason: string; createdAt: string }[];
    },
  });

  // الإحصاءات
  const stats = useMemo(() => {
    const all = Object.values(st.attempts);
    const correct = all.filter((a) => a.correct).length;
    let chaptersMastered = 0;
    for (const c of COURSES) for (const ch of chaptersOfCourse(c.id)) if (chapterStats(c.id, ch, st.attempts).level >= 2) chaptersMastered++;
    const examsPassed = Object.entries(st.best).filter(([k, v]) => k.endsWith("::exam") && v >= 60).length;
    return {
      answered: all.length,
      accuracy: all.length ? (correct / all.length) * 100 : 0,
            chaptersMastered,
      examsPassed,
    };
  }, [st.attempts, st.best, st.conceptReads]);
  const fixed = mistakes?.stats.mastered ?? 0;
  const daysLeft = st.examDate ? Math.ceil((new Date(st.examDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
  const xp = user ? Math.max(user.xp, st.xp) : st.xp;

  // الإنجازات بمستويات (كما في أوريندو)
  const achievements = [
    { id: "streak", name: "المواظبة", unit: "يومًا متتاليًا", icon: Flame, value: wallet.streak, tiers: [3, 7, 14, 30, 100] },
    { id: "answered", name: "التدريب", unit: "سؤالًا", icon: Target, value: stats.answered, tiers: [25, 100, 250, 500, 1000] },
    { id: "chapters", name: "الإتقان", unit: "فصلًا متمكَّنًا منه", icon: BookOpen, value: stats.chaptersMastered, tiers: [1, 5, 10, 25, 50] },
    { id: "fixed", name: "إصلاح الأخطاء", unit: "خطأً مُصلَحًا", icon: CheckCircle2, value: fixed, tiers: [1, 10, 25, 50, 100] },
    { id: "exams", name: "الاختبارات", unit: "اختبارًا ناجحًا", icon: Trophy, value: stats.examsPassed, tiers: [1, 2, 3, 5, 8] },
  ];

  const buyFreeze = async () => {
    const err = await spendGems(queryClient, "streak_freeze");
    toast({ title: err ?? "اشتريت تجميدًا: يحمي سلسلتك يومًا واحدًا" });
  };

  const exportBackup = () => {
    const s = useApp.getState();
    const payload = {
      app: "turbawy",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: { attempts: s.attempts, sessions: s.sessions, conceptReads: s.conceptReads, best: s.best, lessonPlans: s.lessonPlans, fieldVisits: s.fieldVisits, notes: s.notes, goal: s.goal, examDate: s.examDate, xp: s.xp },
      mistakes: useLocalMistakesStore.getState().mistakes,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "turbawy-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = (file: File) =>
    file
      .text()
      .then((t) => {
        const p = JSON.parse(t);
        if (p?.app !== "turbawy" || !p.data || typeof p.data !== "object") throw new Error("bad");
        const d = p.data;
        const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
        useApp.setState({
          attempts: obj(d.attempts) as typeof st.attempts,
          sessions: Array.isArray(d.sessions) ? d.sessions : [],
          conceptReads: obj(d.conceptReads) as typeof st.conceptReads,
          best: obj(d.best) as typeof st.best,
          lessonPlans: Array.isArray(d.lessonPlans) ? d.lessonPlans : [],
          fieldVisits: Array.isArray(d.fieldVisits) ? d.fieldVisits : [],
          notes: obj(d.notes) as typeof st.notes,
          goal: d.goal ?? null,
          examDate: typeof d.examDate === "string" ? d.examDate : null,
          xp: Number(d.xp) || 0,
        });
        if (Array.isArray(p.mistakes)) useLocalMistakesStore.setState({ mistakes: p.mistakes });
        toast({ title: "استُعيد تقدمك" });
      })
      .catch(() => toast({ title: "الملف غير صالح" }));

  return (
    <div className="space-y-6">
      <PageTitle
        title="حسابي"
        action={
          <SecondaryButton onClick={() => setSettingsOpen(true)} aria-label="الإعدادات" className="px-3">
            <Settings className="h-5 w-5" />
            <span className="hidden sm:inline">الإعدادات</span>
          </SecondaryButton>
        }
      />

      {/* من أنت والمستوى */}
      {isLoading ? (
        <div className="h-28 animate-pulse rounded-[22px] bg-muted" />
      ) : (
        <Card className="p-5">
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-[#F4D27A]" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--t100)] font-display text-2xl font-bold text-[var(--t800)] ring-2 ring-[#F4D27A]">
                {user ? user.name.charAt(0) : <UserRound className="h-8 w-8" />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <FitText max={20} min={14} className="font-display font-extrabold">{user ? user.name : "ضيف"}</FitText>
              <FitText max={14} min={10} className="mt-0.5 font-bold text-[#9A6A12]">{`المستوى ${ad(levelFromXp(xp))} · ${levelTitle(levelFromXp(xp))}`}</FitText>
              <ProgressBar value={(xpInLevel(xp) / LEVEL_XP) * 100} className="mt-2" />
            </div>
          </div>
          {!user && (
            <div className="mt-4 border-t border-border pt-4">
              <FitText max={14} min={10} className="mb-3 text-muted-foreground">سجّل لتحفظ تقدمك على كل أجهزتك</FitText>
              <AuthPanel />
            </div>
          )}
          {st.examDate && (
            <button type="button" onClick={() => setSettingsOpen(true)} className="mt-4 flex min-h-[44px] w-full items-center gap-3 border-t border-border pt-4 text-right text-sm">
              <CalendarClock className="h-5 w-5 shrink-0 text-[#C99A06]" />
              <span className="min-w-0 flex-1">
                <FitText max={14} min={10} className="font-bold">{daysLeft !== null && daysLeft >= 0 ? `اختبارك بعد ${arCount(daysLeft, DAY_FORMS)}` : "موعد اختبارك"}</FitText>
                <FitText max={12} min={9} className="text-muted-foreground">{dateFmt.format(new Date(st.examDate))}</FitText>
              </span>
              <ChevronLeft className="h-4 w-4 text-[#C99A06]" />
            </button>
          )}
        </Card>
      )}

      {/* أرقامك */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Flame, label: "أيام متتالية", value: ad(wallet.streak) },
          { icon: Target, label: "سؤالًا", value: ad(stats.answered) },
          { icon: CheckCircle2, label: "الدقة", value: pct(stats.accuracy) },
          { icon: Gem, label: "جوهرة", value: ad(wallet.gems) },
        ].map((s) => (
          <Card key={s.label} className="flex min-w-0 flex-col items-center gap-1 px-1.5 py-3 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF1D6] text-[#B8860B]">
              <s.icon className="h-[18px] w-[18px]" />
            </span>
            <FitText max={18} min={12} group="pf-val" className="w-full font-display font-extrabold">{s.value}</FitText>
            <FitText max={12} min={9} group="pf-lbl" className="w-full text-muted-foreground">{s.label}</FitText>
          </Card>
        ))}
      </div>

      <PastTests />

      {/* الإنجازات */}
      <section>
        <SectionHeader title="الإنجازات" />
        <Card className="grid grid-cols-5 gap-1 px-2 py-4">
          {achievements.map((a) => {
            const level = a.tiers.filter((t) => a.value >= t).length;
            const maxed = level === a.tiers.length;
            const prev = level === 0 ? 0 : a.tiers[level - 1];
            const target = maxed ? a.tiers[a.tiers.length - 1] : a.tiers[level];
            const frac = maxed ? 1 : Math.max(0, Math.min(1, (a.value - prev) / (target - prev)));
            const C = 2 * Math.PI * 21;
            return (
              <div key={a.id} className="flex min-w-0 flex-col items-center gap-1 text-center" title={maxed ? "أعلى مستوى" : `${ad(Math.min(a.value, target))} من ${ad(target)} ${a.unit}`}>
                <span className="relative flex h-12 w-12 items-center justify-center">
                  <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle cx="24" cy="24" r="21" fill="none" stroke="var(--t100)" strokeWidth="3" />
                    {frac > 0 && <circle cx="24" cy="24" r="21" fill="none" stroke="#E3B23C" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} />}
                  </svg>
                  <a.icon className={cn("h-5 w-5", level === 0 ? "text-muted-foreground" : "text-[var(--t700)]")} />
                </span>
                <FitText max={12} min={9} group="pf-ach" className="w-full font-bold">{a.name}</FitText>
                <span className="text-[11px] text-muted-foreground">{ad(level)}/٥</span>
              </div>
            );
          })}
        </Card>
      </section>

      {settingsOpen && (
        <ScreenShell title="الإعدادات" onClose={() => setSettingsOpen(false)}>
          <div className="space-y-6">
      {/* الهدف والإعدادات */}
      <div className="grid gap-6">
        <Card className="space-y-4 p-5">
          <SectionHeader title="هدفك" />
          <Segmented label="هدفك" value={st.goal ?? "job"} options={GOALS.map((g) => [g.id, g.label] as const)} onChange={st.setGoal} />
          <label className="block space-y-1.5">
            <span className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
              <CalendarClock className="h-4 w-4" /> موعد الاختبار
            </span>
            <input
              type="date"
              value={st.examDate ?? ""}
              onChange={(e) => st.setExamDate(e.target.value || null)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </Card>

        <Card className="space-y-4 p-5">
          <SectionHeader title="العرض" />
          <p className="text-sm font-medium text-secondary-foreground">المظهر</p>
          <Segmented
            label="وضع العرض"
            value={st.darkMode}
            onChange={st.setDarkMode}
            options={[["light", "فاتح", Sun], ["auto", "تلقائي", Monitor], ["dark", "ليلي", Moon]] as const}
          />
          <p className="text-sm font-medium text-secondary-foreground">لون التطبيق</p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="لون التطبيق">
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                role="radio"
                aria-checked={(st.theme ?? "emerald") === th.id}
                onClick={() => st.setTheme(th.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-[18px] border bg-white py-2.5 text-sm font-bold transition dark:bg-card",
                  (st.theme ?? "emerald") === th.id ? "border-[#E3B23C] ring-2 ring-[#F4D27A]" : "border-border"
                )}
              >
                <span className="relative h-8 w-8 rounded-full" style={{ background: th.color }}>
                  <span className="absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#E3B23C]" aria-hidden="true" />
                </span>
                {th.label}
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-secondary-foreground">شكل الرئيسية</p>
          <Segmented label="شكل الرئيسية" value={st.homeStyle ?? "icons"} onChange={st.setHomeStyle} options={[["icons", "رموز"], ["photos", "صور"]] as const} />
          <p className="text-sm font-medium text-secondary-foreground">حجم الخط</p>
          <Segmented label="حجم الخط" value={st.fontScale} onChange={st.setFontScale} options={[["normal", "عادي"], ["large", "كبير"], ["bigger", "أكبر"]] as const} />
          <button
            type="button"
            role="switch"
            aria-checked={st.haptics}
            onClick={() => st.setHaptics(!st.haptics)}
            className="flex min-h-[44px] w-full items-center justify-between text-sm"
          >
            <span>اهتزاز خفيف عند الإجابة</span>
            <span className={cn("relative h-6 w-11 rounded-full transition-colors", st.haptics ? "bg-primary" : "bg-input")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", st.haptics ? "right-0.5" : "right-[22px]")} />
            </span>
          </button>
          {push !== "unsupported" && (
            <button
              type="button"
              role="switch"
              aria-checked={push === "on"}
              disabled={push === "denied"}
              onClick={() => (push === "on" ? disablePush() : enablePush().then((ok) => !ok && toast({ title: "لم يُسمح بالإشعارات على هذا الجهاز" })))}
              className="flex min-h-[44px] w-full items-center justify-between text-sm disabled:opacity-60"
            >
              <span className="text-right">
                تذكير يومي بالدراسة ومواعيد المراجعة
                {push === "denied" && <span className="block text-xs text-muted-foreground">الإشعارات محظورة في إعدادات المتصفح</span>}
              </span>
              <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", push === "on" ? "bg-primary" : "bg-input")}>
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", push === "on" ? "right-0.5" : "right-[22px]")} />
              </span>
            </button>
          )}
        </Card>
      </div>

      {/* الجواهر */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Gem} color="var(--gem)" size={48} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">رصيد الجواهر</p>
              <p className="font-display text-2xl font-bold">{ad(wallet.gems)}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-secondary-foreground">
            <li className="flex justify-between">
              <span>جلسة تدريب مكتملة (٥ أسئلة فأكثر)</span>
              <span className="font-medium text-gem">+{ad(GEM_RULES.session_complete.amount)}</span>
            </li>
            <li className="flex justify-between">
              <span>جلسة بلا أي خطأ</span>
              <span className="font-medium text-gem">+{ad(GEM_RULES.session_perfect.amount)}</span>
            </li>
            <li className="flex justify-between">
              <span>مراجعة أخطاء مكتملة</span>
              <span className="font-medium text-gem">+{ad(GEM_RULES.review_complete.amount)}</span>
            </li>
          </ul>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted p-3">
            <Snowflake className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">تجميد السلسلة</p>
              <p className="text-sm text-muted-foreground">
                يحمي سلسلتك يومًا فائتًا، لديك {ad(wallet.streakFreeze)} من {ad(MAX_STREAK_FREEZES)}
              </p>
            </div>
            <SecondaryButton
              onClick={buyFreeze}
              disabled={!wallet.signedIn || wallet.gems < GEM_RULES.streak_freeze.amount || wallet.streakFreeze >= MAX_STREAK_FREEZES}
              className="px-3 text-sm"
            >
              {ad(GEM_RULES.streak_freeze.amount)} جوهرة
            </SecondaryButton>
          </div>
          {user && (history.data?.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">آخر الحركات</p>
              <ul className="divide-y divide-border text-sm">
                {history.data!.slice(0, 6).map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-2">
                    <span>{GEM_REASON_LABELS[h.reason] ?? h.reason}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{shortFmt.format(new Date(h.createdAt))}</span>
                      <span className={cn("w-10 text-left font-medium", h.amount > 0 ? "text-gem" : "text-muted-foreground")}>
                        {h.amount > 0 ? "+" : "−"}
                        {ad(Math.abs(h.amount))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

      {/* البيانات والحساب */}
      <Card className="divide-y divide-border">
        {installEvt && (
          <button type="button" onClick={() => installEvt.prompt().then(() => setInstallEvt(null))} className="flex min-h-[52px] w-full items-center gap-3 px-5 text-sm">
            <Smartphone className="h-5 w-5 text-primary" /> أضف التطبيق إلى شاشتك الرئيسية
          </button>
        )}
        <button type="button" onClick={exportBackup} className="flex min-h-[52px] w-full items-center gap-3 px-5 text-sm">
          <Download className="h-5 w-5 text-primary" /> نسخة احتياطية من تقدمي
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-[52px] w-full items-center gap-3 px-5 text-sm">
          <Upload className="h-5 w-5 text-primary" /> استعادة نسخة احتياطية
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importBackup(f);
            e.target.value = "";
          }}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" className="flex min-h-[52px] w-full items-center gap-3 px-5 text-sm text-destructive">
              <Trash2 className="h-5 w-5" /> تصفير التقدم على هذا الجهاز
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>تصفير التقدم؟</AlertDialogTitle>
              <AlertDialogDescription>تُحذف إجاباتك وجلساتك ونتائجك من هذا الجهاز. لا يمكن التراجع.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { st.resetAll(); useLocalMistakesStore.getState().clearAll(); }}>
                صفّر
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {user && (
          <>
            <button
              type="button"
              onClick={async () => {
                await signOut(queryClient);
                toast({ title: "سُجّل الخروج" });
              }}
              className="flex min-h-[52px] w-full items-center gap-3 px-5 text-sm"
            >
              <LogOut className="h-5 w-5 text-primary" /> تسجيل الخروج
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="flex min-h-[52px] w-full items-center gap-3 px-5 text-sm text-destructive">
                  <ShieldAlert className="h-5 w-5" /> حذف الحساب نهائيًا
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف الحساب؟</AlertDialogTitle>
                  <AlertDialogDescription>يُحذف حسابك وجواهرك وأخطاؤك وتقدمك المحفوظ فيه نهائيًا.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={async () => {
                      const ok = await deleteAccount(queryClient);
                      toast({ title: ok ? "حُذف الحساب" : "تعذّر حذف الحساب" });
                    }}
                  >
                    احذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </Card>
          </div>
        </ScreenShell>
      )}
    </div>
  );
}
