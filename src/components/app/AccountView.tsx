"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Trophy,
  Star,
  BookOpen,
  Footprints,
  Target,
  RotateCcw,
  Timer,
  Brain,
  Settings,
  Trash2,
  ShieldCheck,
  History,
  MessageSquare,
  MessagesSquare,
  NotebookPen,
  MapPin,
  Award,
  CircleCheck,
  MinusCircle,
  Moon,
  Sun,
  Monitor,
  Share2,
  Vibrate,
  Download,
  Upload,
  Type,
  Smartphone,
  Mic,
  GraduationCap,
  Users,
} from "lucide-react";
import { conceptById, questionById } from "@/lib/qbank";
import { ACHIEVEMENTS, useApp } from "@/lib/store";
import type { LabAttempt } from "@/lib/lab";
import { useUi } from "@/lib/ui-store";
import { buildRedoSet } from "@/lib/srs";
import { shareText } from "@/lib/share";
import {
  composePortfolioText,
  readinessChecks,
  readinessDesc,
  readinessWord,
} from "@/lib/portfolio";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

const ACH_ICONS: Record<string, React.ElementType> = {
  Footprints,
  BookOpen,
  Target,
  Star,
  RotateCcw,
  Timer,
  Brain,
  MessageSquare,
  MessagesSquare,
  NotebookPen,
  MapPin,
  Mic,
  GraduationCap,
  Award,
  Users,
};

type FontScale = "normal" | "large" | "bigger";

// حدث تثبيت التطبيق — يمنحه المتصفح مرة واحدة لكل زيارة
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

// ---------- صفحة حسابي: الملف الشخصي + تثبيت الفهم + السجل — بلا أرقام ولا إحصاءات (قرار المستخدم) ----------
export default function AccountView() {
  const {
    name,
    xp,
    attempts,
    sessions,
    conceptReads,
    scenarioChoices,
    labAttempts,
    lessonPlans,
    fieldVisits,
    speechRecords,
    studyDone,
    setName,
  } = useApp();
  const darkMode = useApp((s) => s.darkMode);
  const setDarkMode = useApp((s) => s.setDarkMode);
  const haptics = useApp((s) => s.haptics);
  const setHaptics = useApp((s) => s.setHaptics);
  const fontScale = useApp((s) => s.fontScale);
  const setFontScale = useApp((s) => s.setFontScale);
  const startQuiz = useUi((s) => s.startQuiz);
  const resetAll = useApp((s) => s.resetAll);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const fileRef = useRef<HTMLInputElement>(null);

  // تثبيت التطبيق على الشاشة الرئيسية — زر يظهر فقط حين يسمح المتصفح بذلك
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);
  // الوضع المستقل (مثبّت) — يُقرأ مرة عند أول رسم عميل، ثم يُحدّث بحدث التثبيت
  const [standalone, setStandalone] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches
  );
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setStandalone(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // ---- نسخ احتياطي واستعادة (ميزة تقرير المنافسين) — ينتقل بها التقدم بين الأجهزة ----
  const exportBackup = () => {
    try {
      const s = useApp.getState();
      const payload = {
        app: "turbawy",
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          name: s.name,
          xp: s.xp,
          weeklyXp: s.weeklyXp,
          weekStart: s.weekStart,
          attempts: s.attempts,
          conceptReads: s.conceptReads,
          sessions: s.sessions,
          scenarioChoices: s.scenarioChoices,
          reportedQuestions: s.reportedQuestions,
          studentExamples: s.studentExamples,
          labAttempts: s.labAttempts,
          lessonPlans: s.lessonPlans,
          fieldVisits: s.fieldVisits,
          onboarded: s.onboarded,
          darkMode: s.darkMode,
          fontScale: s.fontScale,
          haptics: s.haptics,
        },
      };
      const blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "turbawy-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "حُفظت نسخة تقدمك في ملفات جهازك" });
    } catch {
      toast({ title: "تعذّر إنشاء النسخة — أعد المحاولة" });
    }
  };

  const importBackup = (file: File) => {
    file
      .text()
      .then((t) => {
        const p = JSON.parse(t);
        const d = p?.data;
        if (p?.app !== "turbawy" || !d || typeof d !== "object") throw new Error("bad");
        const rec = (v: unknown, fb: unknown) => (v && typeof v === "object" ? v : fb);
        useApp.setState({
          name: typeof d.name === "string" ? d.name : "",
          xp: Number(d.xp) || 0,
          weeklyXp: Number(d.weeklyXp) || 0,
          weekStart: typeof d.weekStart === "string" ? d.weekStart : "",
          attempts: rec(d.attempts, {}) as typeof attempts,
          conceptReads: rec(d.conceptReads, {}) as typeof conceptReads,
          sessions: Array.isArray(d.sessions) ? d.sessions : [],
          scenarioChoices: rec(d.scenarioChoices, {}) as typeof scenarioChoices,
          reportedQuestions: Array.isArray(d.reportedQuestions) ? d.reportedQuestions : [],
          studentExamples: rec(d.studentExamples, {}) as NonNullable<ReturnType<typeof useApp.getState>["studentExamples"]>,
          labAttempts: Array.isArray(d.labAttempts)
            ? d.labAttempts.filter((a: unknown) => !!a && typeof a === "object" && typeof (a as LabAttempt).sid === "string")
            : [],
          lessonPlans: Array.isArray(d.lessonPlans)
            ? d.lessonPlans.filter(
                (p: unknown) =>
                  !!p && typeof p === "object" && typeof (p as { id?: unknown }).id === "string"
              )
            : [],
          fieldVisits: Array.isArray(d.fieldVisits)
            ? d.fieldVisits.filter(
                (v: unknown) =>
                  !!v && typeof v === "object" && typeof (v as { id?: unknown }).id === "string"
              )
            : [],
          onboarded: !!d.onboarded,
          darkMode:
            d.darkMode === "auto" || d.darkMode === "dark"
              ? d.darkMode
              : d.darkMode === "light"
                ? "light"
                : d.dark
                  ? "dark"
                  : "light",
          fontScale: (d.fontScale === "large" || d.fontScale === "bigger"
            ? d.fontScale
            : "normal") as FontScale,
          haptics: d.haptics !== false,
        });
        toast({ title: "تمت استعادة تقدمك بنجاح" });
      })
      .catch(() => {
        toast({ title: "الملف غير صالح — تأكد أنه نسخة احتياطية من هذا التطبيق" });
      });
  };

  const redoSet = useMemo(() => buildRedoSet(attempts), [attempts]);

  // المفهوم الذي تتكرر فيه الأخطاء — توجيه بلا نسب (قرار المستخدم: حذف الأرقام لا إخفاؤها)
  const weakestConcept = useMemo(() => {
    const stats = new Map<string, { t: number; c: number }>();
    for (const [qid, at] of Object.entries(attempts)) {
      const q = questionById(qid);
      if (!q) continue;
      const s = stats.get(q.conceptId) ?? { t: 0, c: 0 };
      s.t++;
      if (at.correct) s.c++;
      stats.set(q.conceptId, s);
    }
    const sorted = [...stats.entries()]
      .filter(([, s]) => s.t >= 2 && s.c < s.t)
      .sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
    if (sorted.length === 0) return null;
    const [cid] = sorted[0];
    return conceptById(cid) ?? null;
  }, [attempts]);

  // ---- محطات التقدم ----
  const earned = useMemo(
    () =>
      ACHIEVEMENTS.map((a) => ({
        ...a,
        ok: a.earned({
          attempts,
          sessions,
          conceptReads,
          scenarioChoices,
          lessonPlans,
          fieldVisits,
          speechRecords,
          studyDone,
        }),
      })),
    [attempts, sessions, conceptReads, scenarioChoices, lessonPlans, fieldVisits, speechRecords, studyDone]
  );

  // ---- ملف الإنجاز المهني — جاهزيتك من كل مصادر التطبيق كلمات لا نسب ----
  const portfolio = useMemo(() => {
    const input = {
      name,
      xp,
      attempts,
      sessions,
      conceptReads,
      scenarioChoices,
      labAttempts,
      lessonPlans,
      fieldVisits,
      achievementsTotal: ACHIEVEMENTS.length,
      achievementsEarned: earned.filter((a) => a.ok).length,
    };
    const word = readinessWord(input);
    return {
      word,
      desc: readinessDesc(input),
      checks: readinessChecks(input),
      shareText: () => composePortfolioText(input, word),
    };
  }, [name, xp, attempts, sessions, conceptReads, scenarioChoices, labAttempts, lessonPlans, fieldVisits, earned]);

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* البطاقة الشخصية */}
      <div className="card-soft rounded-3xl border border-border bg-gradient-to-l from-[#5B21B6] to-[#6D28D9] p-5 text-white">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <User className="h-8 w-8" />
          </span>
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="اكتب اسمك"
                  className="w-full rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-bold text-white placeholder:text-white/60 focus:outline-none"
                />
                <button
                  className="rounded-xl bg-white px-3 py-2 text-xs font-black text-primary"
                  onClick={() => {
                    setName(draft.trim());
                    setEditing(false);
                  }}
                >
                  حفظ
                </button>
              </div>
            ) : (
              <button className="text-right" onClick={() => setEditing(true)}>
                <p className="text-lg font-black">{name || "اضغط لضبط اسمك"}</p>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ملف الإنجاز المهني — جاهزيتك كلمات لا نسب، من كل مصادر التطبيق */}
      <div className="card-soft rounded-3xl border border-primary/20 bg-accent p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-black">
            <Award className="h-4 w-4 text-primary" /> ملف إنجازك المهني
          </p>
          <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black text-primary-foreground">
            {portfolio.word}
          </span>
        </div>
        <p className="mt-2 text-xs font-bold leading-5 text-muted-foreground">{portfolio.desc}</p>
        <div className="mt-3 space-y-1.5">
          {portfolio.checks.map(({ check, ok }) => (
            <div key={check.key} className="flex items-start gap-2 rounded-xl bg-background/60 px-3 py-2">
              {ok ? (
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              ) : (
                <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <p className="text-[11px] font-bold leading-5 text-foreground">{ok ? check.label : check.next}</p>
            </div>
          ))}
        </div>
        <button
          onClick={async () => {
            const r = await shareText("ملف إنجاز المعلم المتدرب", portfolio.shareText());
            if (r === "copied") toast({ title: "نُسخ ملف إنجازك إلى الحافظة" });
            else if (r === "failed") toast({ title: "تعذّر النسخ — أعد المحاولة" });
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground"
        >
          <Share2 className="h-4 w-4" /> شارك ملف إنجازك
        </button>
      </div>

      {/* إعادة الأسئلة الخاطئة */}
      {redoSet.length > 0 && (
        <div className="card-soft rounded-3xl border border-border bg-white p-5">
          <button
            onClick={() => startQuiz({ mode: "redo", label: "إعادة الأسئلة الخاطئة", qids: redoSet })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-black text-white"
          >
            <RotateCcw className="h-4 w-4" /> إعادة أسئلتي الخاطئة
          </button>
        </div>
      )}

      {/* المفهوم الذي يحتاج تركيزاً أكثر — توجيه بلا نسب */}
      {weakestConcept && (
        <div className="card-soft rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-center gap-2 text-sm font-black text-amber-900">
            <Brain className="h-4 w-4" /> يحتاج تركيزاً أكثر
          </p>
          <p className="mt-2 font-extrabold text-foreground">{weakestConcept.title}</p>
          <p className="mt-1 text-xs leading-6 text-amber-900/80">
            راجع شرحه ثم تدرب على أسئلته من صفحة المكتبة.
          </p>
        </div>
      )}

      {/* محطات التقدم */}
      <div className="card-soft rounded-3xl border border-border bg-white p-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-black">
          <Trophy className="h-4 w-4 text-primary" /> محطات التقدم
        </p>
        <div className="grid grid-cols-2 gap-2">
          {earned.map((a) => {
            const Icon = ACH_ICONS[a.icon] ?? Star;
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-3 ${
                  a.ok ? "border-indigo-200 bg-indigo-50" : "border-border bg-muted/40 opacity-60"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    a.ok ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-2 text-xs font-black">{a.title}</p>
                <p className="text-[10px] leading-4 text-muted-foreground">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* سجل الجلسات — بلا نسب (قرار المستخدم) */}
      <div className="card-soft rounded-3xl border border-border bg-white p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-black">
          <History className="h-4 w-4 text-primary" /> آخر الجلسات
        </p>
        {sessions.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            لا جلسات بعد — ابدأ أول اختبار وسيظهر السجل هنا
          </p>
        ) : (
          <div className="no-scrollbar max-h-72 space-y-2 overflow-y-auto">
            {sessions.slice(0, 20).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-bold">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(s.ts).toLocaleDateString("ar", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* الإعدادات */}
      <div className="card-soft rounded-3xl border border-border bg-white p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-black">
          <Settings className="h-4 w-4 text-primary" /> الإعدادات والبيانات
        </p>
        <div className="space-y-2 text-xs leading-6 text-muted-foreground">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-indigo-600" />
            كل تقدمك (إجاباتك، مفاهيمك، جدول المراجعة) محفوظ على هاتفك فقط — يعمل التطبيق حتى دون إنترنت بعد أول فتح، والتطبيق مجاني بالكامل.
          </p>
        </div>

        {/* وضع العرض — فاتح / يتبع النظام / ليلي */}
        <div className="mt-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
          <p className="mb-2 text-sm font-black text-foreground">وضع العرض</p>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="وضع العرض">
            {(
              [
                ["light", "فاتح", Sun],
                ["auto", "تلقائي", Monitor],
                ["dark", "ليلي", Moon],
              ] as const
            ).map(([v, lbl, Icon]) => (
              <button
                key={v}
                onClick={() => setDarkMode(v)}
                aria-pressed={darkMode === v}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black transition-colors ${
                  darkMode === v
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-white text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* الاهتزاز عند الإجابة — مفتاح مباشر */}
        <button
          onClick={() => setHaptics(!haptics)}
          aria-pressed={haptics}
          className="mt-2 flex w-full items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-black text-foreground">
            <Vibrate className="h-4 w-4 text-primary" />
            اهتزاز عند الإجابة
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${
              haptics ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                haptics ? "right-0.5" : "right-[22px]"
              }`}
            />
          </span>
        </button>

        {/* حجم الخط — ثلاث درجات تضبط قراءة الشرح والأمثلة */}
        <div className="mt-2 rounded-2xl border border-border bg-muted/40 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-black text-foreground">
              <Type className="h-4 w-4 text-primary" />
              حجم الخط
            </span>
            <div className="flex gap-1.5" role="group" aria-label="حجم الخط">
              {(
                [
                  ["normal", "عادي"],
                  ["large", "كبير"],
                  ["bigger", "أكبر"],
                ] as const
              ).map(([v, lbl]) => (
                <button
                  key={v}
                  onClick={() => setFontScale(v)}
                  aria-pressed={fontScale === v}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-colors ${
                    fontScale === v
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-white text-muted-foreground"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* تثبيت التطبيق على الشاشة الرئيسية — يظهر فقط حين يسمح المتصفح */}
        {installEvt && !standalone && (
          <button
            onClick={() => {
              installEvt.prompt();
              setInstallEvt(null);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3 text-xs font-black text-primary"
          >
            <Smartphone className="h-4 w-4" />
            أضف التطبيق إلى شاشتك الرئيسية
          </button>
        )}

        {/* مشاركة التطبيق مع الزملاء */}
        <button
          onClick={async () => {
            const r = await shareText(
              "مساعد إعداد المعلم",
              "تطبيق يرافق طالب الإعداد من مقاعده الدراسية إلى فصله الأول — مفاهيم، أسئلة مكثفة، ومحاكاة صفية، كلها تعمل حتى دون إنترنت. جرّبه وشاركه مع زملائك."
            );
            if (r === "copied") toast({ title: "نُسخ نص الدعوة — الصقه حيث تريد" });
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3 text-xs font-black text-primary"
        >
          <Share2 className="h-4 w-4" />
          شارك التطبيق مع زملائك
        </button>

        {/* نسخ احتياطي واستعادة التقدم — للانتقال بين الأجهزة بلا فقدان */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={exportBackup}
            className="flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-xs font-black text-secondary-foreground"
          >
            <Download className="h-4 w-4" /> نسخ احتياطي
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-xs font-black text-secondary-foreground"
          >
            <Upload className="h-4 w-4" /> استعادة
          </button>
        </div>
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
            <Button variant="outline" className="mt-3 w-full rounded-2xl border-red-200 text-red-600">
              <Trash2 className="ml-1 h-4 w-4" /> تصفير كل التقدم
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>تصفير كل التقدم؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيُحذف سجل إجاباتك ومفاهيمك وجلساتك ومراجعاتك نهائياً من هذا الجهاز. لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">إلغاء</AlertDialogCancel>
              <AlertDialogAction className="rounded-full bg-red-500 hover:bg-red-600" onClick={resetAll}>
                نعم، صفّر
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
