"use client";

// ============================================================================
// «حسابي» — منقول من الملف الشخصي في أوريندو
// ============================================================================
// من أنت (أو دخول/إنشاء حساب للضيف)، ثم الجواهر وسجلها وما تُصرف عليه،
// ثم الإحصاءات والإنجازات بمستويات، ثم الهدف وموعد الاختبار والإعدادات.
// ============================================================================

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
  Zap,
} from "lucide-react";
import { useApp, type LearnerGoal } from "@/lib/store";
import { COURSES, chaptersOfCourse } from "@/lib/qbank";
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
import AuthPanel from "./AuthPanel";
import { Card, IconTile, PageTitle, ProgressBar, SecondaryButton, SectionHeader, pct } from "./ui-kit";

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
      concepts: Object.keys(st.conceptReads).length,
      chaptersMastered,
      examsPassed,
    };
  }, [st.attempts, st.best, st.conceptReads]);
  const fixed = mistakes?.stats.mastered ?? 0;
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
      <PageTitle title="حسابي" />

      {/* من أنت */}
      {isLoading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      ) : user ? (
        <Card className="flex items-center gap-4 p-5">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-16 w-16 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
              {user.name.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-bold">{user.name}</p>
            <p className="truncate text-[13px] text-muted-foreground" dir="ltr">
              {user.email}
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">انضممت في {dateFmt.format(new Date(user.createdAt))}</p>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold">احفظ تقدمك في حساب</h2>
          <p className="mb-5 mt-1 text-sm leading-6 text-muted-foreground">
            تعمل الآن ضيفًا: تقدمك وجواهرك على هذا الجهاز فقط. بالحساب تتابع من أي جهاز، وتحصل على ٥٠ جوهرة ترحيب.
          </p>
          <AuthPanel />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* الجواهر */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Gem} color="var(--gem)" size={48} />
            <div className="flex-1">
              <p className="text-[13px] text-muted-foreground">رصيد الجواهر</p>
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
              <p className="text-[13px] text-muted-foreground">
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
              <p className="mb-2 text-[13px] font-medium text-muted-foreground">آخر الحركات</p>
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

        {/* الإحصاءات */}
        <Card className="p-5">
          <SectionHeader title="إحصاءاتك" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Flame, label: "السلسلة", value: arCount(wallet.streak, DAY_FORMS) },
              { icon: Zap, label: "النقاط", value: ad(xp) },
              { icon: Target, label: "أسئلة أجبت عنها", value: ad(stats.answered) },
              { icon: CheckCircle2, label: "دقة الإجابة", value: pct(stats.accuracy) },
              { icon: BookOpen, label: "مفاهيم قرأتها", value: ad(stats.concepts) },
              { icon: Trophy, label: "أخطاء أصلحتها", value: ad(fixed) },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <s.icon className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{s.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* الإنجازات */}
      <section>
        <SectionHeader title="الإنجازات" sub="لكل إنجاز خمسة مستويات" />
        <Card className="divide-y divide-border">
          {achievements.map((a) => {
            const level = a.tiers.filter((t) => a.value >= t).length;
            const maxed = level === a.tiers.length;
            const target = maxed ? a.tiers[a.tiers.length - 1] : a.tiers[level];
            return (
              <div key={a.id} className="flex items-center gap-4 p-4">
                <IconTile icon={a.icon} color={level === 0 ? "var(--muted-foreground)" : "var(--primary)"} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[15px] font-semibold">{a.name}</p>
                    <span className="text-xs text-muted-foreground">المستوى {ad(level)} من ٥</span>
                  </div>
                  <ProgressBar value={(Math.min(a.value, target) / target) * 100} className="mt-2" />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {maxed ? "أعلى مستوى" : `${ad(Math.min(a.value, target))} من ${ad(target)} ${a.unit}`}
                  </p>
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      {/* الهدف والإعدادات */}
      <div className="grid gap-6 lg:grid-cols-2">
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
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-[15px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </Card>

        <Card className="space-y-4 p-5">
          <SectionHeader title="العرض" />
          <Segmented
            label="وضع العرض"
            value={st.darkMode}
            onChange={st.setDarkMode}
            options={[["light", "فاتح", Sun], ["auto", "تلقائي", Monitor], ["dark", "ليلي", Moon]] as const}
          />
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
        </Card>
      </div>

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
      <p className="text-center text-xs text-muted-foreground">
        <button type="button" onClick={() => onGoTab("today")} className="min-h-[36px]">
          العودة إلى اليوم
        </button>
      </p>
    </div>
  );
}
