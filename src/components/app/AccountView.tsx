"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { conceptById, questionById } from "@/lib/qbank";
import { ACHIEVEMENTS, useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
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
  Target,
  Star,
  RotateCcw,
  Timer,
  Brain,
  MessageSquare,
  MessagesSquare,
};

// ---------- صفحة حسابي: الملف الشخصي + تثبيت الفهم + السجل — بلا أرقام ولا إحصاءات (قرار المستخدم) ----------
export default function AccountView() {
  const { name, attempts, sessions, conceptReads, scenarioChoices, setName } = useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const resetAll = useApp((s) => s.resetAll);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

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
        ok: a.earned({ attempts, sessions, conceptReads, scenarioChoices }),
      })),
    [attempts, sessions, conceptReads, scenarioChoices]
  );

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
              </button>
            )}
          </div>
        </div>
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
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
            كل تقدمك (إجاباتك، مفاهيمك، جدول المراجعة) محفوظ على هاتفك فقط — يعمل التطبيق حتى دون إنترنت بعد أول فتح، والتطبيق مجاني بالكامل.
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
