"use client";

// ============================================================================
// «التدريب» — مركز التدريب على نمط منصات بنوك الأسئلة (UWorld وKaplan)
// ============================================================================
// ١) لوحة أداء: الجاهزية، وما استخدمته من البنك، والدقة، والأخطاء المستحقة.
// ٢) أربعة إجراءات: تدريب ذكي، وأنشئ اختبارك، واختبار شامل، ومحاكي الاختبار الرسمي.
// ٤) حسب المحور: فصوله بنجوم أفضل نتيجة ودقة كل فصل.
// ٥) التطبيق في مواقف حقيقية، والمراجعة السريعة.
// ============================================================================

import { FitText } from "./FitText";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ClipboardCheck,
  RotateCcw,
  Gauge,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Users,
  Scale,
  ListChecks,
  Calculator,
  CalendarCheck,
  GraduationCap,
  Globe,
  BookA,
  MessagesSquare,
  Lightbulb,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { COURSES, COURSE_SHORT, QUESTIONS, chaptersOfCourse } from "@/lib/qbank";
import {
  EXAM_SECONDS,
  chapterSession,
  courseExam,
  courseMix,
  examKey,
  fullMockExam,
  smartSession,
  starsFor,
  topicKey,
} from "@/lib/practice-bank";
import { spacedDueIds } from "@/lib/srs";
import { ad, arCount, QUESTION_GEN_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import ProgressSummary from "./ProgressSummary";
import type { Tab } from "./AppShell";
import TestBuilder from "./TestBuilder";
import LicenseBankCard from "./LicenseBankCard";
import { Divided, PageTitle, Stars, pct, GameTile } from "./ui-kit";

const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

/** مربع إجراء موحّد: رمز ذهبي في دائرة، والعنوان تحته في سطر واحد */
const LICENSE_TOOLS = [
  { icon: Scale, title: "المقارنات", href: "/comparisons", emoji: "⚖️", sub: "مفاهيم يكثر الخلط بينها" },
  { icon: ListChecks, title: "المعايير العشرة", href: "/standards", emoji: "📋", sub: "ما يقيسه الاختبار" },
  { icon: Calculator, title: "حاسبة الرخصة", href: "/license-calculator", emoji: "🧮", sub: "قدّر مستواك" },
  { icon: CalendarCheck, title: "اختبار الأسبوع", href: "/weekly-test", emoji: "🗓️", sub: "٢٠ سؤالًا كل أحد" },
  { icon: GraduationCap, title: "أدلة التخصصات", href: "/specialized", emoji: "🎓", sub: "اختبار تخصصك" },
  { icon: Globe, title: "اختبارات الدول", href: "/teacher-exams", emoji: "🌍", sub: "السعودية والإمارات ومصر" },
  { icon: BookA, title: "المعجم", href: "/glossary", emoji: "📖", sub: "المصطلحات بإيجاز" },
  { icon: MessagesSquare, title: "مشكلات صفية", href: "/classroom-problems", emoji: "💬", sub: "مواقف وحلولها" },
  { icon: Lightbulb, title: "مفاهيم خاطئة", href: "/misconceptions", emoji: "💡", sub: "أفكار شائعة خاطئة" },
];

// ألوان الأيقونات: لكل بطاقة لونها حتى لا تتشابه
const COURSE_EMO: Record<string, string> = {
  M1: "🌱", M2: "🧠", M3: "💡", M4: "📊", M5: "🧑‍🏫", SE1: "🤝", F1: "🏛️", AI1: "🤖", G1: "📚", C1: "🛠️", L1: "🧭", R1: "🧩",
};
const TONES = [
  { bg: "#E6F4EF", fg: "#136F5C" },
  { bg: "#FBF3DA", fg: "#B8860B" },
  { bg: "#E3F1FB", fg: "#1F6FA8" },
  { bg: "#FDECE4", fg: "#C2562B" },
  { bg: "#E8F6F6", fg: "#0F8A8A" },
  { bg: "#EEF1FB", fg: "#3A55A4" },
];

/** بطاقة أفقية مستديرة: رمز ملون في دائرة، ثم العنوان ووصفه كاملين، وحافة سفلية بارزة */
function Tile({ emoji, title, sub, meta, tone = 0, onClick }: { icon?: React.ElementType; emoji: string; title: string; sub?: string; meta?: string; small?: boolean; tone?: number; onClick: () => void }) {
  const t = TONES[tone % TONES.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[64px] min-w-0 items-center gap-2 rounded-[26px] border-2 border-[#E3EDE8] border-b-[5px] border-b-[#C9DDD3] bg-white px-2.5 py-2.5 text-right text-foreground transition active:translate-y-[2px] active:border-b-2 dark:border-border dark:bg-card dark:text-foreground"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[24px] leading-none" style={{ background: t.bg }} aria-hidden="true">{emoji}</span>
      {/* العنوان في سطر واحد كاملًا: يصغر الخط عند الحاجة بدل القص */}
      <FitText max={14} min={9} group="tile-title" className="min-w-0 flex-1 whitespace-nowrap font-extrabold leading-6">{title}</FitText>
      {meta && <span className="absolute left-3 top-1.5 rounded-full bg-[var(--t100)] px-1.5 text-[10px] font-bold leading-4 text-foreground">{meta}</span>}
    </button>
  );
}

/** زر صغير داخل المحور */
function MiniBtn({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-[14px] border border-[#ECE3C4] bg-white text-sm font-bold text-foreground transition active:scale-[0.97] dark:bg-card dark:text-foreground">
      <Icon className="h-4 w-4 text-[#C9971C]" />
      {title}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PracticeView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const best = useApp((s) => s.best);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const ui = useUi();
  const [open, setOpen] = useState<string | null>(null);
  const [builder, setBuilder] = useState(false);
  const [view, setView] = useState<"tests" | "courses">("tests");

  const answered = useMemo(() => Object.keys(attempts).length, [attempts]);
  const due = useMemo(() => spacedDueIds(attempts), [attempts]);
  const bank = QUESTIONS.length;
  const openCourse = COURSES.find((c) => c.id === open);

  const startSmart = (courseId?: string, label = "تدريب ذكي") => ui.startQuiz({ mode: "training", label, qids: smartSession(attempts, courseId) });
  const startChapter = (courseId: string, chapter: string) => {
    setLastStudy(courseId, chapter);
    ui.startQuiz({ mode: "training", label: chapterLabel(chapter), qids: chapterSession(courseId, chapter, attempts), topicKey: topicKey(courseId, chapter) });
  };

  return (
    <div className="space-y-5">
      <PageTitle title="التدريب" />

      <LicenseBankCard />

      {/* البطاقة الرئيسية: تدريب ذكي، وشريط ما أنجزته من البنك (الأرقام في «حسابي») */}
      <button
        type="button"
        onClick={() => startSmart()}
        className="flex w-full min-w-0 items-center gap-2.5 rounded-[20px] bg-[var(--t700)] px-3 py-2.5 text-right text-white transition active:scale-[0.98]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-[#F3DC8E]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <FitText max={16} min={12} className="font-extrabold leading-6">تدريب ذكي · عشرة أسئلة لك</FitText>
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
            <span className="block h-full rounded-full bg-[#D4A017]" style={{ width: `${bank ? Math.max(2, (answered / bank) * 100) : 0}%` }} />
          </span>
        </span>
        <ChevronLeft className="h-5 w-5 shrink-0 text-[#F3DC8E]" />
      </button>


      {/* قسمان فقط، يظهر واحد منهما في كل مرة */}
      <div role="tablist" aria-label="أقسام التدريب" className="grid grid-cols-2 gap-1 rounded-[22px] border border-[#ECE3C4] bg-white p-1 dark:bg-card">
        {(
          [
            ["tests", "اختبارات"],
            ["courses", "حسب المحور"],
          ] as const
        ).map(([id, lbl]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={cn("min-h-[42px] rounded-[18px] text-base font-bold transition", view === id ? "bg-[var(--t700)] text-white" : "text-muted-foreground")}
          >
            {lbl}
          </button>
        ))}
      </div>

      {view === "tests" ? (
        <div className="grid grid-cols-2 gap-2.5 tiles2">
          <Tile tone={0} emoji="🛠️" sub="اختر المحاور والعدد" icon={SlidersHorizontal} title="أنشئ اختبارك" onClick={() => setBuilder(true)} />
          <Tile tone={1} emoji="⏱️" sub="كل المحاور بوقت محدد" icon={Timer} title="اختبار شامل" meta={best["ALL::exam"] !== undefined ? pct(best["ALL::exam"]) : undefined} onClick={() => ui.startQuiz({ mode: "exam", label: "اختبار تجريبي شامل", qids: fullMockExam(), timeLimitSec: EXAM_SECONDS * 2, topicKey: "ALL::exam" })} />
          <Tile tone={2} emoji="🎯" sub="اعرف من أين تبدأ" icon={Gauge} title="تحديد المستوى" onClick={ui.startPlacement} />
          <Tile tone={3} emoji="🤝" sub="نافس زميلك بالأسئلة" icon={Users} title="تحدّي زميل" onClick={ui.startPeer} />
          {/* أدوات الرخصة من الموقع: تفتح في الصفحة نفسها */}
          <p className="col-span-2 mt-3 font-extrabold text-foreground dark:text-foreground">أدوات الرخصة</p>
          <div className="col-span-2 grid grid-cols-2 gap-2.5 tiles2">
            {LICENSE_TOOLS.map((t, k) => (
              <Tile key={t.href} tone={k + 4} emoji={t.emoji} sub={t.sub} icon={t.icon} title={t.title} onClick={() => { window.location.href = t.href; }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 tiles2">
          {COURSES.map((c, k) => {
            const chapters = chaptersOfCourse(c.id);
            const stars = chapters.reduce((n, ch) => n + starsFor(best[topicKey(c.id, ch)]), 0);
            return <GameTile key={c.id} tone={k} emoji={COURSE_EMO[c.id] ?? "📚"} title={COURSE_SHORT[c.id] ?? c.name} meta={stars > 0 ? `★ ${ad(stars)}` : undefined} onClick={() => setOpen(c.id)} />;
          })}
        </div>
      )}

      {/* أرقامك وإنجازاتك في آخر الصفحة */}
      <ProgressSummary />

      {/* المحور المختار في ورقة من الأسفل: ثلاثة أزرار ثم فصوله */}
      {openCourse && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setOpen(null)}>
          <div className="safe-bottom max-h-[80dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-4 dark:bg-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={openCourse.name}>
            <span className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
            <FitText max={18} min={12} className="mb-3 text-center font-extrabold">{openCourse.name}</FitText>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <MiniBtn icon={Sparkles} title="ذكي" onClick={() => { setOpen(null); startSmart(openCourse.id, `تدريب ذكي: ${openCourse.name}`); }} />
              <MiniBtn icon={Shuffle} title="مزيج" onClick={() => { setOpen(null); ui.startQuiz({ mode: "training", label: `مزيج: ${openCourse.name}`, qids: courseMix(openCourse.id) }); }} />
              <MiniBtn icon={ClipboardCheck} title="اختبار" onClick={() => { setOpen(null); ui.startQuiz({ mode: "exam", label: `اختبار: ${openCourse.name}`, qids: courseExam(openCourse.id), timeLimitSec: EXAM_SECONDS, topicKey: examKey(openCourse.id) }); }} />
            </div>
            <div className="divide-y divide-[var(--t075)] overflow-hidden rounded-[18px] border border-[var(--t075)] dark:divide-border dark:border-border">
              {chaptersOfCourse(openCourse.id).map((ch) => {
                const b = best[topicKey(openCourse.id, ch)];
                return (
                  <button key={ch} type="button" onClick={() => { setOpen(null); startChapter(openCourse.id, ch); }} className="flex min-h-[48px] w-full min-w-0 items-center gap-2 px-3 text-right">
                    <FitText max={15} min={11} className="flex-1 font-medium">{chapterLabel(ch)}</FitText>
                    {b !== undefined && <Stars count={starsFor(b)} />}
                    <ChevronLeft className="h-4 w-4 shrink-0 text-[#C9971C]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {builder && <TestBuilder onClose={() => setBuilder(false)} />}
    </div>
  );
}
