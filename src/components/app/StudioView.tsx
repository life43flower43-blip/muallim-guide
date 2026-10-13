"use client";

// استوديو خطط الدروس — طبقة ملء شاشة من رؤية المستخدم (بند «تخطيط الدروس»):
// نموذج موجّه بكامل أركان الخطة (بطاقة، أهداف، معرفة سابقة، وسائل، استراتيجيات،
// خطوات بخمس مراحل، أسئلة، واجب، فروق فردية) + تقييم قواعدي للخطة + «خططي» بعرض وتعديل ومشاركة.
// قواعد صارمة: صفر أرقام ولا لاتيني ولا إيموجي في النصوص المعروضة، والتنصيص ب«».

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  ClipboardList,
  NotebookPen,
  FolderOpen,
  ClipboardCheck,
  Save,
  ChevronRight,
  Share2,
  Pencil,
  Trash2,
  CircleCheck,
  CircleAlert,
  MinusCircle,
  FileText,
  Target,
  Layers,
  Boxes,
  Compass,
  Route,
  HelpCircle,
  BookMarked,
  Users,
  Sparkles,
  LayoutTemplate,
} from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { useApp } from "@/lib/store";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import {
  DURATION_OPTIONS,
  STRATEGY_OPTIONS,
  PHASE_META,
  PLAN_TEMPLATES,
  planReview,
  composePlanText,
  planMaturityWord,
  PLAN_STATUS_WORD,
  type LessonPlan,
  type LessonPlanPhases,
  type PlanCheckStatus,
  type PlanReview,
} from "@/lib/plans";

type StudioTab = "new" | "templates" | "mine";
type FormPlan = Omit<LessonPlan, "id" | "ts">;

const emptyForm = (): FormPlan => ({
  subject: "",
  grade: "",
  topic: "",
  duration: "",
  objectives: "",
  prior: "",
  materials: "",
  strategies: [],
  phases: { open: "", present: "", practice: "", assess: "", close: "" },
  keyQuestions: "",
  homework: "",
  differentiation: "",
});

const statusIcon: Record<PlanCheckStatus, typeof CircleCheck> = {
  done: CircleCheck,
  partial: MinusCircle,
  missing: CircleAlert,
};
const statusCls: Record<PlanCheckStatus, string> = {
  done: "text-indigo-700",
  partial: "text-amber-700",
  missing: "text-red-700",
};

const inputCls =
  "w-full rounded-xl border-2 border-border bg-background p-3 text-sm leading-6 outline-none focus:border-primary";
const chipOff = "rounded-full border-2 border-border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary";
const chipOn = "rounded-full border-2 border-primary bg-accent px-3 py-1.5 text-xs font-black text-primary";

// بطاقة قسم موجه — أيقونة وعنوان وسؤال توجيهي
function SectionCard({
  icon: Icon,
  title,
  guide,
  children,
}: {
  icon: React.ElementType;
  title: string;
  guide?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border-2 border-border bg-white p-4">
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black leading-6">{title}</h3>
          {guide && <p className="text-[11px] font-bold leading-4 text-muted-foreground">{guide}</p>}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// قسم نصي بعرض الخطة — أسطر مفصولة تُعرض شرطات، ويختفي القسم إن كان فارغًا
function PlanLines({ title, body }: { title: string; body: string }) {
  const lines = body.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="rounded-2xl border-2 border-border bg-white p-4">
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-2 space-y-1">
        {lines.map((ln, i) => (
          <p key={i} className="text-xs font-bold leading-6">
            – {ln}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function StudioView() {
  const clearStudio = useUi((s) => s.clearStudio);
  const lessonPlans = useApp((s) => s.lessonPlans);
  const saveLessonPlan = useApp((s) => s.saveLessonPlan);
  const removeLessonPlan = useApp((s) => s.removeLessonPlan);

  const [tab, setTab] = useState<StudioTab>("new");
  const [form, setForm] = useState<FormPlan>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [review, setReview] = useState<PlanReview | null>(null);
  const [formErr, setFormErr] = useState("");
  const [selected, setSelected] = useState<LessonPlan | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const reviewRef = useRef<HTMLDivElement | null>(null);

  function setField<K extends keyof FormPlan>(k: K, v: FormPlan[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setPhase(k: keyof LessonPlanPhases, v: string) {
    setForm((f) => ({ ...f, phases: { ...f.phases, [k]: v } }));
  }

  const runReview = () => {
    setReview(planReview({ ...form, id: "", ts: 0 }));
    setFormErr("");
    setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 90);
  };

  const doSave = () => {
    if (!form.topic.trim()) {
      setFormErr("اكتب موضوع الدرس قبل الحفظ — فهو عنوان خطتك في «خططي»");
      return;
    }
    saveLessonPlan({ ...form, id: editingId ?? `LP${Date.now()}`, ts: Date.now() });
    toast({ title: editingId ? "حُفظ تعديل خطتك" : "حُفظت خطتك في «خططي»" });
    setForm(emptyForm());
    setEditingId(null);
    setReview(null);
    setFormErr("");
    setTab("mine");
  };

  const startEdit = (p: LessonPlan) => {
    setForm({
      subject: p.subject,
      grade: p.grade,
      topic: p.topic,
      duration: p.duration,
      objectives: p.objectives,
      prior: p.prior,
      materials: p.materials,
      strategies: [...p.strategies],
      phases: { ...p.phases },
      keyQuestions: p.keyQuestions,
      homework: p.homework,
      differentiation: p.differentiation,
    });
    setEditingId(p.id);
    setReview(null);
    setFormErr("");
    setSelected(null);
    setTab("new");
  };

  const resetDraft = () => {
    setForm(emptyForm());
    setEditingId(null);
    setReview(null);
    setFormErr("");
  };

  // تحميل قالب جاهز إلى النموذج — يبدأ من خطة احترافية كاملة الأركان ويكيّفها
  const loadTemplate = (t: (typeof PLAN_TEMPLATES)[number]) => {
    setForm({ ...t.form, phases: { ...t.form.phases }, strategies: [...t.form.strategies] });
    setEditingId(null);
    setReview(null);
    setFormErr("");
    setTab("new");
    toast({ title: `حُمّل قالب «${t.name}» — كيّفه بصفّك وموضوعك` });
  };

  const share = async (p: LessonPlan) => {
    const res = await shareText(`خطة درس: ${p.topic}`, composePlanText(p));
    if (res === "copied") toast({ title: "نُسخ نص الخطة إلى الحافظة" });
    else if (res === "failed") toast({ title: "تعذّر النسخ — أعد المحاولة" });
  };

  const doDelete = (id: string) => {
    if (confirmDel !== id) {
      setConfirmDel(id);
      return;
    }
    removeLessonPlan(id);
    setConfirmDel(null);
    setSelected(null);
    toast({ title: "حُذفت الخطة من «خططي»" });
  };

  // ---------- شاشة عرض خطة محفوظة ----------
  if (selected) {
    const r = planReview(selected);
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="mx-auto max-w-lg px-4 pb-28 pt-5">
          <button
            onClick={() => setSelected(null)}
            className="mb-4 flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" /> عودة إلى خططي
          </button>

          <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-l from-accent to-white p-4">
            <h2 className="text-lg font-black leading-7">{selected.topic}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.subject && (
                <span className="rounded-full border border-primary/20 bg-white px-2.5 py-1 text-[10px] font-black text-primary">{selected.subject}</span>
              )}
              {selected.grade && (
                <span className="rounded-full border border-primary/20 bg-white px-2.5 py-1 text-[10px] font-black text-primary">{selected.grade}</span>
              )}
              {selected.duration && (
                <span className="rounded-full border border-primary/20 bg-white px-2.5 py-1 text-[10px] font-black text-primary">{selected.duration}</span>
              )}
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">{planMaturityWord(selected)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <PlanLines title="الأهداف التعليمية" body={selected.objectives} />
            <PlanLines title="المعرفة السابقة" body={selected.prior} />
            <PlanLines title="الوسائل والأدوات" body={selected.materials} />
            {selected.strategies.length > 0 && (
              <div className="rounded-2xl border-2 border-border bg-white p-4">
                <h3 className="text-sm font-black">استراتيجيات التدريس</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.strategies.map((s) => (
                    <span key={s} className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-black text-primary">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {PHASE_META.some((ph) => selected.phases[ph.key].trim()) && (
              <div className="rounded-2xl border-2 border-border bg-white p-4">
                <h3 className="text-sm font-black">خطوات التنفيذ</h3>
                <div className="mt-3 space-y-3">
                  {PHASE_META.filter((ph) => selected.phases[ph.key].trim()).map((ph) => (
                    <div key={ph.key} className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs font-black text-primary">{ph.label}</p>
                      {selected.phases[ph.key]
                        .split(/\n+/)
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((ln, i) => (
                          <p key={i} className="mt-1 text-xs font-bold leading-6">
                            – {ln}
                          </p>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <PlanLines title="الأسئلة المفتاحية" body={selected.keyQuestions} />
            <PlanLines title="الواجب" body={selected.homework} />
            <PlanLines title="الفروق الفردية" body={selected.differentiation} />

            <div className="rounded-2xl border-2 border-border bg-white p-4">
              <p className="flex items-center gap-1.5 text-sm font-black">
                <ClipboardCheck className="h-4 w-4 text-primary" /> تقييم الخطة
              </p>
              <p className="mt-1 text-xs font-black leading-5">{r.verdict}</p>
              {r.items
                .filter((it) => it.status !== "done")
                .map((it) => (
                  <p key={it.key} className="mt-1 text-[11px] font-bold leading-5 text-muted-foreground">
                    {it.label}: {it.note}
                  </p>
                ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => share(selected)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-black text-primary-foreground"
            >
              <Share2 className="h-4.5 w-4.5" /> مشاركة أو نسخ
            </button>
            <button
              onClick={() => startEdit(selected)}
              aria-label="تعديل الخطة"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-white text-muted-foreground"
            >
              <Pencil className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => doDelete(selected.id)}
              aria-label={confirmDel === selected.id ? "تأكيد حذف الخطة" : "حذف الخطة"}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${
                confirmDel === selected.id ? "border-red-300 bg-red-50 text-red-600" : "border-border bg-white text-muted-foreground"
              }`}
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
          {confirmDel === selected.id && (
            <p className="mt-2 text-center text-xs font-bold text-red-600">اضغط زر الحذف مجددًا للتأكيد</p>
          )}
        </div>
      </motion.div>
    );
  }

  // ---------- الشاشة الرئيسية: هيدر + تبويبان ----------
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ClipboardList className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-foreground">استوديو خطط الدروس</h1>
              <p className="text-xs text-muted-foreground">اصنع خطتك بخطوات موجهة وقيّمها قبل الحصة</p>
            </div>
          </div>
          <button
            onClick={clearStudio}
            aria-label="إغلاق"
            className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-1.5">
          {(
            [
              ["new", "خطة جديدة", NotebookPen],
              ["templates", "قوالب", LayoutTemplate],
              ["mine", "خططي", FolderOpen],
            ] as const
          ).map(([id, lbl, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-xl border-2 px-1.5 py-2 text-[11px] font-bold ${
                tab === id ? "border-primary bg-accent text-primary" : "border-border bg-white text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
        {tab === "new" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-l from-accent to-white p-4">
              <p className="flex items-center gap-2 text-sm font-black text-primary">
                <Sparkles className="h-4 w-4" /> كيف يعمل الاستوديو؟
              </p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                ابدأ من قالب جاهز أو املأ الأركان بنفسك — كل حقل موجه بسؤال يذكّرك بالأفضل المهني — ثم اطلب التقييم ليريك ما اكتمل وما يحتاج
                لمسة، واحفظ خطتك لتعود إليها وتشاركها وقتما شئت.
              </p>
            </div>

            <SectionCard icon={FileText} title="بطاقة الدرس" guide="عنوان خطتك وما تدور حوله">
              <div className="space-y-2.5">
                <input
                  value={form.topic}
                  onChange={(e) => setField("topic", e.target.value)}
                  placeholder="موضوع الدرس — مثال: جمع الكسور المتشابهة"
                  aria-label="موضوع الدرس"
                  className={inputCls}
                />
                <div className="flex gap-2.5">
                  <input
                    value={form.subject}
                    onChange={(e) => setField("subject", e.target.value)}
                    placeholder="المادة"
                    aria-label="المادة"
                    className={inputCls}
                  />
                  <input
                    value={form.grade}
                    onChange={(e) => setField("grade", e.target.value)}
                    placeholder="الصف"
                    aria-label="الصف"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">زمن التنفيذ</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setField("duration", form.duration === d ? "" : d)}
                        className={form.duration === d ? chipOn : chipOff}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Target}
              title="الأهداف التعليمية"
              guide="هدف في كل سطر — ابدأ بفعل قابل للملاحظة مثل يذكر أو يقارن أو يصمم"
            >
              <textarea
                value={form.objectives}
                onChange={(e) => setField("objectives", e.target.value)}
                rows={3}
                placeholder={"يذكر الطالب...\nيقارن الطالب..."}
                aria-label="الأهداف التعليمية"
                className={inputCls}
              />
            </SectionCard>

            <SectionCard icon={Layers} title="المعرفة السابقة" guide="ما الذي يُفترض أن يعرفه الطلاب قبل الدرس؟">
              <textarea
                value={form.prior}
                onChange={(e) => setField("prior", e.target.value)}
                rows={2}
                placeholder="مثال: يعرف الطالب مفهوم الكسر كجزء من كل"
                aria-label="المعرفة السابقة"
                className={inputCls}
              />
            </SectionCard>

            <SectionCard icon={Boxes} title="الوسائل والأدوات" guide="أداة في كل سطر — ما ستجهزه قبل الحصة">
              <textarea
                value={form.materials}
                onChange={(e) => setField("materials", e.target.value)}
                rows={2}
                placeholder={"نماذج كسور ورقية\nسبورة وأقلام ملونة"}
                aria-label="الوسائل والأدوات"
                className={inputCls}
              />
            </SectionCard>

            <SectionCard icon={Compass} title="استراتيجيات التدريس" guide="اختر ما يخدم طبيعة الموضوع ومرحلة طلابك — ويمكن الجمع">
              <div className="flex flex-wrap gap-1.5">
                {STRATEGY_OPTIONS.map((s) => {
                  const on = form.strategies.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setField("strategies", on ? form.strategies.filter((x) => x !== s) : [...form.strategies, s])}
                      className={on ? chipOn : chipOff}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard icon={Route} title="خطوات التنفيذ" guide="خمس مراحل تمر بها الحصة — صِف كل مرحلة بسطر أو سطرين">
              <div className="space-y-3">
                {PHASE_META.map((ph) => (
                  <div key={ph.key} className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs font-black text-primary">{ph.label}</p>
                    <p className="text-[11px] font-bold leading-4 text-muted-foreground">{ph.guide}</p>
                    <textarea
                      value={form.phases[ph.key]}
                      onChange={(e) => setPhase(ph.key, e.target.value)}
                      rows={2}
                      placeholder={ph.placeholder}
                      aria-label={ph.label}
                      className={`${inputCls} mt-2 bg-white`}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={HelpCircle} title="الأسئلة المفتاحية" guide="سؤال في كل سطر — أسئلتك الجاهزة تقود الحوار الصفي">
              <textarea
                value={form.keyQuestions}
                onChange={(e) => setField("keyQuestions", e.target.value)}
                rows={2}
                placeholder={"متى لا يصح أن نجمع كسورين مباشرة؟\nكيف نعرف أن الجواب منطقي؟"}
                aria-label="الأسئلة المفتاحية"
                className={inputCls}
              />
            </SectionCard>

            <SectionCard icon={BookMarked} title="الواجب" guide="ماذا ينجز الطالب بعد الحصة ليثبت تعلمه؟">
              <textarea
                value={form.homework}
                onChange={(e) => setField("homework", e.target.value)}
                rows={2}
                placeholder="تمرين قصير متدرج من كتاب النشاط مع مسألة حياتية واحدة"
                aria-label="الواجب"
                className={inputCls}
              />
            </SectionCard>

            <SectionCard icon={Users} title="الفروق الفردية" guide="كيف تخدم المتعثر بتيسير؟ والمتفوق بإثراء؟">
              <textarea
                value={form.differentiation}
                onChange={(e) => setField("differentiation", e.target.value)}
                rows={2}
                placeholder="للمتعثر: نماذج محسوسة بجواري — للمتفوق: مسألة تحدٍ مفتوحة"
                aria-label="الفروق الفردية"
                className={inputCls}
              />
            </SectionCard>

            <div className="flex gap-2 pt-1">
              <button
                onClick={runReview}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-accent py-3 font-black text-primary"
              >
                <ClipboardCheck className="h-5 w-5" /> قيّم خطتك
              </button>
              <button
                onClick={doSave}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-black text-primary-foreground"
              >
                <Save className="h-5 w-5" /> {editingId ? "احفظ التعديل" : "احفظ في خططي"}
              </button>
            </div>
            {formErr && <p className="text-center text-xs font-black text-red-600">{formErr}</p>}
            {editingId && (
              <button onClick={resetDraft} className="w-full py-1 text-center text-xs font-bold text-muted-foreground underline">
                إلغاء التعديل والبدء من جديد
              </button>
            )}

            {review && (
              <motion.div
                ref={reviewRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-primary/25 bg-white p-4"
              >
                <p className="flex items-center gap-1.5 text-sm font-black text-primary">
                  <Sparkles className="h-4 w-4" /> تقييم الخطة
                </p>
                <p className="mt-1 text-xs font-black leading-5">{review.verdict}</p>
                <div className="mt-3 space-y-2">
                  {review.items.map((it) => {
                    const Icon = statusIcon[it.status];
                    return (
                      <div key={it.key} className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${statusCls[it.status]}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-black">
                            {it.label} <span className={statusCls[it.status]}>· {PLAN_STATUS_WORD[it.status]}</span>
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold leading-5 text-muted-foreground">{it.note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        ) : tab === "templates" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-l from-accent to-white p-4">
              <p className="flex items-center gap-2 text-sm font-black text-primary">
                <LayoutTemplate className="h-4 w-4" /> قوالب جاهزة كاملة الأركان
              </p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                كل قالب خطة محترفة مكتملة من معلمين سابقين — حمّل ما يناسب نوع درسك ثم كيّفه بصفّك وموضوعك، فالبداية من منتصف الطريق أنجح من البداية من الصفر.
              </p>
            </div>
            {PLAN_TEMPLATES.map((t) => (
              <div key={t.id} className="rounded-2xl border-2 border-border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black leading-6">{t.name}</h3>
                    <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-primary">{t.tag}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-muted-foreground">{t.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.form.strategies.map((s) => (
                    <span key={s} className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{s}</span>
                  ))}
                </div>
                <button
                  onClick={() => loadTemplate(t)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-accent py-2.5 text-xs font-black text-primary"
                >
                  <NotebookPen className="h-4 w-4" /> ابدأ بهذا القالب
                </button>
              </div>
            ))}
          </div>
        ) : lessonPlans.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-white p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <NotebookPen className="h-7 w-7 text-primary" />
            </span>
            <h3 className="mt-3 text-sm font-black">لم تحفظ خططًا بعد</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
              ابدأ من تبويب «خطة جديدة» — الخطوات الموجهة تسهّل البناء، والتقييم يذكّرك بما نقص قبل أن تصعد المنصة
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessonPlans.map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelected(p);
                  setConfirmDel(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSelected(p);
                    setConfirmDel(null);
                  }
                }}
                className="block w-full cursor-pointer rounded-2xl border-2 border-border bg-white p-4 text-right transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black leading-6">{p.topic}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {planMaturityWord(p)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.subject && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">{p.subject}</span>}
                  {p.grade && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{p.grade}</span>}
                  {p.duration && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{p.duration}</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(p);
                    }}
                    className="flex items-center gap-1 rounded-full border border-primary/30 bg-white px-3 py-1 text-[11px] font-black text-primary"
                  >
                    <Pencil className="h-3 w-3" /> تعديل
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      doDelete(p.id);
                    }}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black ${
                      confirmDel === p.id ? "border-red-300 bg-red-50 text-red-600" : "border-border bg-white text-muted-foreground"
                    }`}
                  >
                    <Trash2 className="h-3 w-3" /> {confirmDel === p.id ? "اضغط مجددًا للتأكيد" : "حذف"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
