"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  RotateCcw,
  Zap,
  Timer,
  Dumbbell,
  ChevronLeft,
  BookOpenCheck,
  AlertTriangle,
  Target,
  Play,
  X,
  Puzzle,
  Flame,
  HeartPulse,
  Focus,
  Users,
  Award,
  Mic,
  GraduationCap,
  Calculator,
  FlaskConical,
  School,
  Backpack,
  ClipboardList,
  Compass,
  Layers,
  Shuffle,
} from "lucide-react";
import { COURSES, COURSE_SHORT, questionsOfCourse, QUESTIONS, conceptById, shuffle, buildProficiencySet } from "@/lib/qbank";
import { buildReviewSet, buildRedoSet, orderUnseenFirst } from "@/lib/srs";
import { useApp, currentStreak } from "@/lib/store";
import { ad } from "@/lib/arabic";
import { useUi } from "@/lib/ui-store";
import { ToolRow, NewBadge } from "./shared";
import { loadSnapshot, clearSnapshot, RESUME_FLAG, type SessionSnapshot } from "@/lib/session-snapshot";
import CalmBreak from "./CalmBreak";
import FocusTimer from "./FocusTimer";

function ModeCard({
  icon: Icon,
  title,
  desc,
  badge,
  disabled,
  color,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={`card-soft flex w-full items-center gap-4 rounded-3xl border border-border bg-white p-4 text-right ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ background: color }}
      >
        <Icon className="h-7 w-7" />
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-lg font-black">{title}</span>
          {badge && (
            <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-amber-950">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{desc}</span>
      </span>
      <ChevronLeft className="h-5 w-5 text-muted-foreground" />
    </motion.button>
  );
}

export default function QuizHome({ onGoTab }: { onGoTab: (t: string) => void }) {
  const startQuiz = useUi((s) => s.startQuiz);
  const startChallenges = useUi((s) => s.startChallenges);
  const startStage = useUi((s) => s.startStage);
  const startStudy = useUi((s) => s.startStudy);
  const startMeasure = useUi((s) => s.startMeasure);
  const startPeer = useUi((s) => s.startPeer);
  const startLab = useUi((s) => s.startLab);
  const startScenarios = useUi((s) => s.startScenarios);
  const startStudio = useUi((s) => s.startStudio);
  const startField = useUi((s) => s.startField);
  const startExamsim = useUi((s) => s.startExamsim);
  const startPlacement = useUi((s) => s.startPlacement);
  const startMatch = useUi((s) => s.startMatch);
  const startSpeed = useUi((s) => s.startSpeed);
  const startFlash = useUi((s) => s.startFlash);
  const attempts = useApp((s) => s.attempts);
  const sessions = useApp((s) => s.sessions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calmOpen, setCalmOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const streak = useMemo(() => currentStreak(sessions), [sessions]);

  // استئناف الجلسة المقطوعة — تظهر فقط إن وُجدت لقطة صالحة
  const [snap, setSnap] = useState<SessionSnapshot | null>(null);
  useEffect(() => {
    // قراءة اللقطة بعد الإطار الأول — تفادي التحديث المتزامد داخل الأثر وعدم تطابق الترطيب
    const id = requestAnimationFrame(() => setSnap(loadSnapshot()));
    return () => cancelAnimationFrame(id);
  }, []);
  const resume = () => {
    if (!snap) return;
    try {
      sessionStorage.setItem(RESUME_FLAG, "1");
    } catch {}
    startQuiz(snap.config);
  };

  const reviewSet = useMemo(() => buildReviewSet(attempts), [attempts]);
  const redoSet = useMemo(() => buildRedoSet(attempts), [attempts]);
  const seenCount = Object.keys(attempts).length;

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="card-soft rounded-3xl border border-border bg-gradient-to-l from-[#2A1058] to-[#6D28D9] p-5 text-white">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="h-8 w-8" />
          <div>
            <h2 className="text-lg font-black">مركز الاختبارات</h2>
            <p className="text-xs text-white/90">
              {seenCount > 0
                ? "راجع بذكاء، صحّح أخطاءك، وتحدّ نفسك — الجديد يأتي أولاً"
                : "ابدأ أول جلسة — أسئلة من محاور الرحلة كلها مع توجيه فوري"}
            </p>
          </div>
          {streak > 0 && (
            <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-amber-950">
              <Flame className="h-4 w-4" fill="currentColor" />
              {streak === 1 ? "يوم واحد" : streak === 2 ? "يومان" : `${ad(streak)} أيام`}
            </span>
          )}
        </div>
      </div>

      {/* زرا الهدوء والتركيز — من بحث مشاكل الطلبة: القلق والتشتت */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setCalmOpen(true)}
          className="card-soft flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2.5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-right">
            <span className="block text-sm font-black">هدّئ نفسك</span>
            <span className="block text-[10px] font-bold text-muted-foreground">قبل الاختبار — دقيقتان</span>
          </span>
        </button>
        <button
          onClick={() => setFocusOpen(true)}
          className="card-soft flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2.5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Focus className="h-5 w-5" />
          </span>
          <span className="text-right">
            <span className="block text-sm font-black">مؤقت التركيز</span>
            <span className="block text-[10px] font-bold text-muted-foreground">جلسة مذاكرة موقوتة</span>
          </span>
        </button>
      </div>

      <CalmBreak open={calmOpen} onClose={() => setCalmOpen(false)} />
      <FocusTimer open={focusOpen} onClose={() => setFocusOpen(false)} />

      {/* بطاقة استئناف الجلسة المقطوعة — تظهر فقط عند وجود جلسة لم تكتمل */}
      {snap && (
        <div className="card-soft flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-amber-950">
            <Play className="h-6 w-6" fill="currentColor" />
          </span>
          <button onClick={resume} className="min-w-0 flex-1 text-right">
            <span className="block text-sm font-black text-amber-900">أكمل جلستك السابقة</span>
            <span className="mt-0.5 block truncate text-xs font-bold text-amber-800/80">
              {snap.config.label}
            </span>
          </button>
          <button
            onClick={() => {
              clearSnapshot();
              setSnap(null);
            }}
            aria-label="تجاهل الاستئناف"
            className="rounded-full p-2 text-amber-700 transition-colors hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* الميزات الجديدة المستقاة من تطبيقات المحاكاة والبطاقات العالمية */}
      <ModeCard
        icon={GraduationCap}
        title="محاكي الرخصة والمسابقات"
        desc="بلاتنات موقوتة بأقسام ومحك نجاح: التربوي العام، التخصص، ومسابقة الكادر — بدرجة وتحليل أقسام بعد التسليم"
        badge="جديد"
        color="#4C1D95"
        onClick={startExamsim}
      />

      <ModeCard
        icon={Compass}
        title="اختبار تحديد المستوى"
        desc="اثنا عشر سؤالاً سريعًا من كل محور — يعرّفك بمستواك ونقاط قوتك وفجواتك ويعطيك خطة تنفيذية"
        badge="جديد"
        color="#B45309"
        onClick={startPlacement}
      />

      <ModeCard
        icon={Layers}
        title="بطاقات المفاهيم"
        desc="مئات البطاقات تنقلب باللمس: المصطلح في وجه، والشرح وأمثلته في الوجه الآخر — بنمط تطبيقات البطاقات العالمية"
        color="#6D28D9"
        onClick={startFlash}
      />

      <ModeCard
        icon={Puzzle}
        title="لعبة المطابقة"
        desc="صلّ المصطلح بشرحه المصغّر في أسرع وقت — لعبة تذكر معرفي سريعة تثبّت المصطلحات بلا ملل"
        badge="جديد"
        color="#7C3AED"
        onClick={startMatch}
      />

      <ModeCard
        icon={Zap}
        title="سباق السرعة"
        desc="عشرة أسئلة بعشرين ثانية للسؤال — مكافأة زمنية للإجابة المبكرة ومتتالية مضاعفة تُقطع بالخطأ"
        badge="جديد"
        color="#F59E0B"
        onClick={startSpeed}
      />

      <ModeCard
        icon={Puzzle}
        title="التحديات الذكية"
        desc="ترتيب خطوات، إكمال فراغات، وإنتاج كتابي بتوجيه حي — أنماط تحدٍّ تكسر الروتين وتثبّت الفهم"
        color="#B45309"
        onClick={startChallenges}
      />

      <ModeCard
        icon={Users}
        title="تحدّي الأقران"
        desc="أنشئ تحديًا من الأسئلة وشارك رابطه مع زميلك — يجيب هو عنها ويقارن نتيجتاكم بلا حسابات ولا سيرفرات"
        color="#B45309"
        onClick={startPeer}
      />

      <ModeCard
        icon={Brain}
        title="الاختبار المكثف"
        desc="جميع أسئلة البنك في جلسة واحدة — وعند كل خطأ نعرفك بمفهومه وأمثلته، ويُسجل الخطأ في صفحة أخطائي"
        color="#5B21B6"
        onClick={() =>
          startQuiz({
            mode: "intensive",
            label: "الاختبار المكثف — جميع الأسئلة",
            qids: orderUnseenFirst(
              QUESTIONS.map((q) => q.id),
              attempts
            ),
          })
        }
      />

      <ModeCard
        icon={Target}
        title="صفحة أخطائي"
        desc="كل خطأ مع شرح مفهومه وأمثلة متنوعة عليه — كل شيء مرتب حسب المفهوم"
        color="#DC2626"
        onClick={() => onGoTab("mistakes")}
      />

      <ModeCard
        icon={Brain}
        title="المراجعة الذكية"
        desc="تكرار متباعد: نعيد السؤال قبل أن تنساه — في وقته المثالي وفق منحنى النسيان"
        badge={reviewSet.length > 0 ? "مستحقة الآن" : undefined}
        disabled={reviewSet.length === 0}
        color="#7C3AED"
        onClick={() =>
          startQuiz({ mode: "review", label: "مراجعة ذكية متباعدة", qids: reviewSet })
        }
      />

      <ModeCard
        icon={RotateCcw}
        title="إعادة أخطائي"
        desc="الأسئلة التي أخطأت فيها سابقاً — صحّح مفاهيمك الآن"
        badge={redoSet.length > 0 ? "تنتظر إصلاحك" : undefined}
        disabled={redoSet.length === 0}
        color="#DC2626"
        onClick={() => startQuiz({ mode: "redo", label: "إعادة الأسئلة الخاطئة", qids: redoSet })}
      />

      <ModeCard
        icon={Shuffle}
        title="اختبار سريع"
        desc="أسئلة عشوائية من كل المحاور مع توجيه فوري"
        color="#F59E0B"
        onClick={() =>
          startQuiz({
            mode: "quick",
            label: "اختبار سريع",
            qids: shuffle(QUESTIONS).slice(0, 10).map((q) => q.id),
          })
        }
      />

      <ModeCard
        icon={Timer}
        title="اختبار محاكاة"
        desc="أسئلة مختارة في وقت محدد — بلا توجيه فوري، والنتيجة في النهاية (كالامتحان الحقيقي)"
        color="#6D28D9"
        onClick={() =>
          startQuiz({
            mode: "exam",
            label: "اختبار محاكاة",
            qids: shuffle(QUESTIONS).slice(0, 20).map((q) => q.id),
            timeLimitSec: 15 * 60,
          })
        }
      />

      <ModeCard
        icon={Award}
        title="اختبار الكفاءة الشامل"
        desc="خمسون سؤالًا من كل المحاور في خمسين دقيقة — بلا تلميحات ولا توجيه أثناءه، وتقرير نجاح بخطاب على المحاور"
        badge="وضع صارم"
        color="#5B21B6"
        onClick={() =>
          startQuiz({
            mode: "proficiency",
            label: "اختبار الكفاءة الشامل",
            qids: buildProficiencySet(50),
            timeLimitSec: 50 * 60,
          })
        }
      />

      <ModeCard
        icon={Mic}
        title="مِسرح الإلقاء"
        desc="سجّل شرحك بصوتك لمفهوم ما ثم استمع لنفسك وقيّم نفسك — سلم تدريجي يكسر رهبة الوقوف أمام الصف"
        badge="جديد"
        color="#BE185D"
        onClick={startStage}
      />

      <ModeCard
        icon={GraduationCap}
        title="مدرسة المذاكرة"
        desc="ستة دروس قصيرة تعلمك الاستدعاء والتباعد وفاينمان وبومودورو والخرائط وليلة الاختبار — وكل درس تطبقه هنا"
        badge="جديد"
        color="#4338CA"
        onClick={startStudy}
      />

      <ModeCard
        icon={Calculator}
        title="معدة القياس والتقويم"
        desc="حاسبات مساق التقويم الأربع: الوسط والوسيط والمدى، صعوبة السؤال وتمييزه، ووزن الدرجة — بشرح تربوي"
        color="#7C3AED"
        onClick={startMeasure}
      />

      {/* أدوات الممارسة — المنقولة من الرئيسية: مختبر، الصف الحي، الميدان، الاستوديو */}
      <div className="pt-1">
        <p className="mb-2 flex items-center gap-2 text-sm font-black text-primary">
          <Dumbbell className="h-4 w-4" /> أدوات الممارسة
        </p>
        <div className="space-y-2.5">
          <ToolRow
            icon={FlaskConical}
            title="مختبر المعلّم"
            desc="مواقف قراراتها تغيّر الموقف — تدرّب كأنك في صفك"
            onClick={startLab}
            badge={<NewBadge tone="violet" />}
          />
          <ToolRow
            icon={School}
            title="الصف الحي"
            desc="محاكاة صفية حية بقرارات متتابعة ونتائج واقعية"
            onClick={startScenarios}
            tone="amber"
          />
          <ToolRow
            icon={Backpack}
            title="سجل التدريب الميداني"
            desc="وثّق زياراتك الميدانية وتأملها بعد الحصة"
            onClick={startField}
            badge={<NewBadge tone="amber" />}
          />
          <ToolRow
            icon={ClipboardList}
            title="استوديو خطط الدروس"
            desc="اصنع خطة درس موجهة وقيّمها قبل الحصة"
            onClick={startStudio}
          />
        </div>
      </div>

      {/* تدريب حسب المحور */}
      <div className="card-soft rounded-3xl border border-border bg-white p-4">
        <button
          className="flex w-full items-center gap-4 text-right"
          onClick={() => setExpanded((e) => (e ? null : "courses"))}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#6D28D9] text-white">
            <Dumbbell className="h-7 w-7" />
          </span>
          <span className="flex-1">
            <span className="text-lg font-black">تدريب حسب المحور</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              اختر محورًا ثم موضوعًا لتتدرب على أسئلته مع توجيه فوري بعد كل سؤال — الجديد يأتي أولاً
            </span>
          </span>
          <ChevronLeft
            className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? "-rotate-90" : ""}`}
          />
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 space-y-2 overflow-hidden border-t border-border pt-3"
          >
            {COURSES.map((course) => {
              return (
                <div key={course.id} className="rounded-2xl bg-muted/60 p-3">
                  <button
                    className="flex w-full items-center justify-between text-right"
                    onClick={() => setExpanded((e) => (e === course.id ? null : course.id))}
                  >
                    <span className="text-sm font-extrabold leading-6 text-primary">{COURSE_SHORT[course.id]}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <ChevronLeft
                        className={`h-4 w-4 transition-transform ${
                          expanded === course.id ? "-rotate-90" : ""
                        }`}
                      />
                    </span>
                  </button>
                  {expanded === course.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1.5">
                      <button
                        onClick={() => {
                          const qs = questionsOfCourse(course.id);
                          startQuiz({
                            mode: "training",
                            label: COURSE_SHORT[course.id],
                            qids: orderUnseenFirst(qs.map((q) => q.id), attempts),
                          });
                        }}
                        className="w-full rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground"
                      >
                        تدريب شامل على المحور
                      </button>
                      <ChaptersGrid courseId={course.id} />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {redoSet.length === 0 && reviewSet.length === 0 && seenCount === 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          المراجعة الذكية وإعادة الأخطاء تُفعّلان تلقائياً بعد أول جلسة تدريب — النظام يتتبع أخطاءك وجدول نسيان كل سؤال.
        </div>
      )}
    </div>
  );
}

function ChaptersGrid({ courseId }: { courseId: string }) {
  const startQuiz = useUi((s) => s.startQuiz);
  const attempts = useApp((s) => s.attempts);
  // نجمع الموضوعات من بنك المفاهيم مباشرة
  const chaptersList = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const q of questionsOfCourse(courseId)) {
      const concept = conceptById(q.conceptId);
      if (!concept) continue;
      const arr = map.get(concept.chapter) ?? [];
      arr.push(q.id);
      map.set(concept.chapter, arr);
    }
    return Array.from(map.entries());
  }, [courseId]);

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {chaptersList.map(([chapter, qids]) => (
        <button
          key={chapter}
          onClick={() =>
            startQuiz({
              mode: "training",
              label: chapter,
              qids: orderUnseenFirst(qids, attempts),
            })
          }
          className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2 text-right text-xs font-bold text-foreground"
        >
          <span className="leading-5">{chapter}</span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
