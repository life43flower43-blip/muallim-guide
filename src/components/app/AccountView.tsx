"use client";

import { useMemo, useState } from "react";
import {
  User,
  Flame,
  Zap,
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
  BarChart3,
  TrendingUp,
  History,
  Crown,
  MessageSquare,
  MessagesSquare,
  Gem,
  ShoppingBag,
} from "lucide-react";
import { levelFromXp, levelTitle, COURSES, questionsOfCourse, conceptById, questionById } from "@/lib/qbank";
import { ACHIEVEMENTS, useApp } from "@/lib/store";
import { SHOP_ITEMS } from "@/lib/shop";
import { useUi } from "@/lib/ui-store";
import {
  ad,
} from "@/lib/arabic";
import ShopDialog from "./ShopDialog";
import { buildRedoSet } from "@/lib/srs";
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
  Flame,
  Target,
  Star,
  Zap,
  RotateCcw,
  Timer,
  Brain,
  Crown,
  MessageSquare,
  MessagesSquare,
  ShoppingBag,
};

const DIFF_COLORS: Record<string, string> = {
  سهل: "#2D6A4F",
  متوسط: "#F59E0B",
  صعب: "#DC2626",
};

// ---------- صفحة حسابي الموحدة: المستوى + التقدم + الإنجازات + السجل ----------
export default function AccountView() {
  const { name, xp, streak, attempts, sessions, conceptReads, scenarioChoices, gems, ownedItems, equipped, setName } = useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const resetAll = useApp((s) => s.resetAll);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [shopOpen, setShopOpen] = useState(false);

  const level = levelFromXp(xp);

  // ---- الإحصائيات (مدمجة من شاشة التقدم) ----
  const vals = Object.values(attempts);
  const totalAnswered = vals.length;
  const totalCorrect = vals.filter((a) => a.correct).length;
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  // الدقة لا تُعرض قبل 10 إجابات مسجلة (نقد البند 4)
  const showAccuracy = totalAnswered >= 10;

  const perCourse = useMemo(() => {
    return COURSES.map((c) => {
      const qs = questionsOfCourse(c.id);
      const answered = qs.filter((q) => attempts[q.id]);
      const correct = answered.filter((q) => attempts[q.id].correct).length;
      return {
        course: c,
        total: qs.length,
        answered: answered.length,
        correct,
        pct: answered.length ? Math.round((correct / answered.length) * 100) : 0,
      };
    });
  }, [attempts]);

  const perDifficulty = useMemo(() => {
    const map: Record<string, { total: number; correct: number }> = {
      سهل: { total: 0, correct: 0 },
      متوسط: { total: 0, correct: 0 },
      صعب: { total: 0, correct: 0 },
    };
    for (const [qid, at] of Object.entries(attempts)) {
      const q = questionById(qid);
      if (!q) continue;
      map[q.difficulty].total++;
      if (at.correct) map[q.difficulty].correct++;
    }
    return map;
  }, [attempts]);

  const redoSet = useMemo(() => buildRedoSet(attempts), [attempts]);

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
      .filter(([, s]) => s.t >= 2)
      .sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t);
    if (sorted.length === 0) return null;
    const [cid, s] = sorted[0];
    return { concept: conceptById(cid), pct: Math.round((s.c / s.t) * 100) };
  }, [attempts]);

  // ---- الإنجازات ----
  const earned = useMemo(
    () =>
      ACHIEVEMENTS.map((a) => ({
        ...a,
        ok: a.earned({ xp, streak, attempts, sessions, conceptReads, scenarioChoices, ownedItems }),
      })),
    [xp, streak, attempts, sessions, conceptReads, scenarioChoices, ownedItems]
  );
  const earnedCount = earned.filter((e) => e.ok).length;
  const ownedList = SHOP_ITEMS.filter((i) => ownedItems[i.id]);

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* البطاقة الشخصية */}
      <div className="card-soft rounded-3xl border border-border bg-gradient-to-l from-[#1B4332] to-[#2D6A4F] p-5 text-white">
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
                <p className="mt-1 text-xs text-emerald-100">{levelTitle(level)}</p>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-xs font-bold leading-6 text-emerald-100">
            <Trophy className="h-4 w-4 shrink-0 text-yellow-300" />
            رحلتك من طالب تربية إلى معلّم جاهز — تتقدّم مراحلها كلما قرأت وتدرّبت
          </p>
        </div>
      </div>

      {/* الدقة العامة */}
      <div className="card-soft rounded-3xl border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black">
              <Target className="h-4 w-4 text-primary" /> الدقة العامة
            </p>
            <p className="mt-1 text-3xl font-black text-primary">
              <span>{showAccuracy ? `${ad(accuracy)}٪` : "—"}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {showAccuracy
                ? "نسبة إجاباتك الصحيحة في كل ما تدربت عليه"
                : "أجب عن عشرة أسئلة فتصحّ الدقة — النسبة المبكرة خادعة"}
            </p>
          </div>
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#E7ECE6" strokeWidth="10" fill="none" />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#2D6A4F"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - accuracy / 100)}
              />
            </svg>
          </div>
        </div>

        {redoSet.length > 0 && (
          <button
            onClick={() => startQuiz({ mode: "redo", label: "إعادة الأسئلة الخاطئة", qids: redoSet })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-black text-white"
          >
            <RotateCcw className="h-4 w-4" /> إعادة أسئلتي الخاطئة
          </button>
        )}
      </div>

      {/* الدقة حسب المحور */}
      <div className="card-soft rounded-3xl border border-border bg-white p-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-black">
          <BarChart3 className="h-4 w-4 text-primary" /> الدقة حسب المحور
        </p>
        <div className="space-y-4">
          {perCourse.map((row) => (
            <div key={row.course.id}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                <span className="leading-5">{row.course.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {row.answered > 0 ? `${ad(row.pct)}٪` : "لم تبدأ بعد"}
                </span>
              </div>
              <div className="progress-track h-2.5">
                <div className="progress-fill h-full" style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* حسب الصعوبة + أضعف مفهوم */}
      <div className="card-soft rounded-3xl border border-border bg-white p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-black">
          <TrendingUp className="h-4 w-4 text-primary" /> الدقة حسب الصعوبة
        </p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(perDifficulty).map(([diff, s]) => {
            const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <div key={diff} className="rounded-2xl bg-muted/60 p-3 text-center">
                <p className="text-lg font-black" style={{ color: DIFF_COLORS[diff] }}>
                  {s.total ? <span>{`${ad(pct)}٪`}</span> : "—"}
                </p>
                <p className="text-xs font-bold">{diff}</p>
              </div>
            );
          })}
        </div>
      </div>

      {weakestConcept?.concept && (
        <div className="card-soft rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-center gap-2 text-sm font-black text-amber-900">
            <Brain className="h-4 w-4" /> يحتاج تركيزاً أكثر
          </p>
          <p className="mt-2 font-extrabold text-foreground">{weakestConcept.concept.title}</p>
          <p className="mt-1 text-xs leading-6 text-amber-900/80">
            دقتك فيه <span>{ad(weakestConcept.pct)}٪</span> — راجع شرحه ثم تدرب على أسئلته من مكتبة المفاهيم.
          </p>
        </div>
      )}

      {/* الإنجازات */}
      <div className="card-soft rounded-3xl border border-border bg-white p-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-black">
          <Star className="h-4 w-4 text-amber-500" /> الإنجازات
        </p>
        <div className="grid grid-cols-2 gap-2">
          {earned.map((a) => {
            const Icon = ACH_ICONS[a.icon] ?? Star;
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-3 ${
                  a.ok ? "border-emerald-200 bg-emerald-50" : "border-border bg-muted/40 opacity-60"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    a.ok ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
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

      {/* متجر الجنية والجواهر */}
      <div className="card-soft rounded-3xl border border-cyan-100 bg-cyan-50/50 p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-black">
            <Gem className="h-4 w-4 text-cyan-600" /> متجر الجنية
          </p>
        </div>
        <p className="mt-2 text-xs leading-6 text-foreground/70">
          تكسب الجواهر بإكمال أي جلسة، وأكثر إذا أنهيتها كاملة بلا خطأ. صرفها على قطع تظهر
          كشارات صغيرة بجانب الجنية على مسار رحلتك في الرئيسية.
        </p>
        {ownedList.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground">قطعك:</span>
            {ownedList.map((i) => (
              <span
                key={i.id}
                className={`flex h-8 w-8 items-center justify-center rounded-full border bg-white text-base shadow-sm ${
                  equipped?.[i.id] ? "border-amber-300" : "border-border opacity-60"
                }`}
                title={i.name}
              >
                {i.emoji}
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => setShopOpen(true)}
          className="mt-4 w-full rounded-2xl bg-cyan-600 py-3 text-sm font-black text-white transition-transform active:scale-[0.98]"
        >
          فتح متجر الجواهر
        </button>
      </div>

      {/* سجل الجلسات */}
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
            {sessions.slice(0, 20).map((s) => {
              const pct = Math.round((s.correctCount / Math.max(1, s.total)) * 100);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${
                      pct >= 80 ? "bg-emerald-600" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                  >
                    <span>{ad(pct)}٪</span>
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
              );
            })}
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
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
            كل تقدمك (نقاطك، أخطاؤك، جدول المراجعة) محفوظ على هاتفك فقط — يعمل التطبيق حتى دون إنترنت بعد أول فتح.
          </p>
        </div>
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
                سيُحذف سجل النقاط والسلسلة والأخطاء والمراجعات نهائياً من هذا الجهاز. لا يمكن التراجع.
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

      <p className="pb-2 text-center text-[10px] text-muted-foreground">
        تربوي — مساعد إعداد المعلم: من أول سنة جامعية إلى التدريب العملي والتخرج
      </p>

      <ShopDialog open={shopOpen} onOpenChange={setShopOpen} />
    </div>
  );
}
