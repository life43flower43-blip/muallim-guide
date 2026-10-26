"use client";

// استوديو خطط الدروس — طبقة ملء شاشة من رؤية المستخدم (بند «تخطيط الدروس»):
// نموذج موجّه بكامل أركان الخطة (بطاقة، أهداف، معرفة سابقة، وسائل، استراتيجيات،
// خطوات بخمس مراحل، أسئلة، واجب، فروق فردية) + تقييم قواعدي للخطة + «خططي» بعرض وتعديل ومشاركة.
// قواعد صارمة: صفر أرقام ولا لاتيني ولا إيموجي في النصوص المعروضة، والتنصيص ب«».

import { FitText } from "./FitText";
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
  ChevronLeft,
} from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { useApp } from "@/lib/store";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import { ad } from "@/lib/arabic";
import { Callout, Card, Chip, Divided, EmptyState, IconTile, PrimaryButton, ScreenShell, SecondaryButton, SectionHeader } from "./ui-kit";
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
  done: "text-success",
  partial: "text-gem",
  missing: "text-destructive",
};

const inputCls =
  "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-base leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";
const chipOff = "min-h-[36px] rounded-full border border-border bg-card px-3 text-sm text-secondary-foreground transition-colors hover:bg-muted";
const chipOn = "min-h-[36px] rounded-full border border-primary bg-accent px-3 text-sm font-medium text-accent-foreground";

// قسم من النموذج: عنوان ودليل قصير ثم الحقول
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
    <Card className="p-5">
      <div className="mb-4 flex items-start gap-3">
        <IconTile icon={Icon} />
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold leading-7">{title}</h3>
          {guide && <p className="text-sm leading-6 text-muted-foreground">{guide}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

// قسم نصي في عرض الخطة: كل سطر بند، ويختفي القسم الفارغ
function PlanLines({ title, body }: { title: string; body: string }) {
  const lines = body.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <section>
      <h3 className="mb-2 font-display text-base font-semibold">{title}</h3>
      <ul className="space-y-1.5 text-base leading-7 text-secondary-foreground">
        {lines.map((ln, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {ln}
          </li>
        ))}
      </ul>
    </section>
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

  // ---------- عرض خطة محفوظة ----------
  if (selected) {
    const r = planReview(selected);
    return (
      <ScreenShell
        title={selected.topic}
        sub="خطة درس"
        onBack={() => setSelected(null)}
        onClose={clearStudio}
        footer={
          <>
            <PrimaryButton onClick={() => share(selected)} className="flex-1">
              <Share2 className="h-4 w-4" /> مشاركة أو نسخ
            </PrimaryButton>
            <SecondaryButton onClick={() => startEdit(selected)} aria-label="تعديل الخطة" className="px-3">
              <Pencil className="h-4 w-4" />
            </SecondaryButton>
            <SecondaryButton
              onClick={() => doDelete(selected.id)}
              aria-label={confirmDel === selected.id ? "تأكيد حذف الخطة" : "حذف الخطة"}
              className={confirmDel === selected.id ? "border-destructive px-3 text-destructive" : "px-3"}
            >
              <Trash2 className="h-4 w-4" />
            </SecondaryButton>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {selected.subject && <Chip tone="primary">{selected.subject}</Chip>}
            {selected.grade && <Chip>{selected.grade}</Chip>}
            {selected.duration && <Chip>{selected.duration}</Chip>}
            <Chip>{planMaturityWord(selected)}</Chip>
          </div>
          {confirmDel === selected.id && <Callout tone="danger">اضغط زر الحذف مرة أخرى للتأكيد.</Callout>}
          <Card className="space-y-6 p-5">
            <PlanLines title="الأهداف التعليمية" body={selected.objectives} />
            <PlanLines title="المعرفة السابقة" body={selected.prior} />
            <PlanLines title="الوسائل والأدوات" body={selected.materials} />
            {selected.strategies.length > 0 && (
              <section>
                <h3 className="mb-2 font-display text-base font-semibold">استراتيجيات التدريس</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.strategies.map((x) => (
                    <Chip key={x} tone="primary">
                      {x}
                    </Chip>
                  ))}
                </div>
              </section>
            )}
            {PHASE_META.some((ph) => selected.phases[ph.key].trim()) && (
              <section>
                <h3 className="mb-3 font-display text-base font-semibold">خطوات التنفيذ</h3>
                <ol className="space-y-4">
                  {PHASE_META.filter((ph) => selected.phases[ph.key].trim()).map((ph, i) => (
                    <li key={ph.key} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{ad(i + 1)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{ph.label}</p>
                        {selected.phases[ph.key]
                          .split(/\n+/)
                          .map((x) => x.trim())
                          .filter(Boolean)
                          .map((ln, k) => (
                            <p key={k} className="mt-1 text-base leading-7 text-secondary-foreground">
                              {ln}
                            </p>
                          ))}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <PlanLines title="الأسئلة المفتاحية" body={selected.keyQuestions} />
            <PlanLines title="الواجب" body={selected.homework} />
            <PlanLines title="الفروق الفردية" body={selected.differentiation} />
          </Card>
          <ReviewCard review={r} />
        </div>
      </ScreenShell>
    );
  }

  const tabs = (
    <div role="tablist" aria-label="أقسام الاستوديو" className="mb-5 grid grid-cols-3 gap-1 rounded-[22px] border border-[#E3D3A0] bg-white p-1 dark:bg-card">
      {(
        [
          ["new", editingId ? "تعديل الخطة" : "خطة جديدة", NotebookPen],
          ["templates", "قوالب", LayoutTemplate],
          ["mine", `خططي${lessonPlans.length ? ` (${ad(lessonPlans.length)})` : ""}`, FolderOpen],
        ] as const
      ).map(([id, lbl]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={`flex min-h-[42px] min-w-0 items-center justify-center rounded-[18px] px-1 font-bold transition-colors ${
            tab === id ? "bg-gradient-to-l from-[#2C7D69] to-[#1C5E4F] text-white" : "text-[#5D7A71]"
          }`}
        >
          <FitText max={15} min={10} group="studio-tabs" className="text-center">{lbl}</FitText>
        </button>
      ))}
    </div>
  );

  return (
    <ScreenShell
      title="استوديو خطط الدروس"
      sub="خطة كاملة الأركان بخطوات موجهة، وتقييم قبل الحصة"
      onClose={clearStudio}
      footer={
        tab === "new" ? (
          <>
            <SecondaryButton onClick={runReview} className="flex-1">
              <ClipboardCheck className="h-4 w-4" /> قيّم الخطة
            </SecondaryButton>
            <PrimaryButton onClick={doSave} className="flex-1">
              <Save className="h-4 w-4" /> {editingId ? "احفظ التعديل" : "احفظ"}
            </PrimaryButton>
          </>
        ) : undefined
      }
    >
      {tabs}
      {tab === "new" ? (
        <div className="space-y-4">
          {formErr && <Callout tone="danger">{formErr}</Callout>}
          {editingId && (
            <Callout tone="info" title="تعدّل خطة محفوظة">
              <button type="button" onClick={resetDraft} className="font-medium text-primary underline">
                ابدأ خطة جديدة بدلًا من ذلك
              </button>
            </Callout>
          )}

          <SectionCard icon={FileText} title="بطاقة الدرس" guide="عنوان خطتك وما تدور حوله">
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-secondary-foreground">موضوع الدرس</span>
                <input value={form.topic} onChange={(e) => setField("topic", e.target.value)} placeholder="مثال: جمع الكسور المتشابهة" className={inputCls} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-secondary-foreground">المادة</span>
                  <input value={form.subject} onChange={(e) => setField("subject", e.target.value)} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-secondary-foreground">الصف</span>
                  <input value={form.grade} onChange={(e) => setField("grade", e.target.value)} className={inputCls} />
                </label>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-secondary-foreground">زمن التنفيذ</p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d} type="button" onClick={() => setField("duration", form.duration === d ? "" : d)} className={form.duration === d ? chipOn : chipOff}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Target} title="الأهداف التعليمية" guide="هدف في كل سطر، يبدأ بفعل قابل للملاحظة: يذكر، يقارن، يصمم">
            <textarea value={form.objectives} onChange={(e) => setField("objectives", e.target.value)} rows={3} placeholder={"يذكر الطالب...\nيقارن الطالب..."} aria-label="الأهداف التعليمية" className={inputCls} />
          </SectionCard>

          <SectionCard icon={Layers} title="المعرفة السابقة" guide="ما الذي يُفترض أن يعرفه الطلاب قبل الدرس؟">
            <textarea value={form.prior} onChange={(e) => setField("prior", e.target.value)} rows={2} placeholder="مثال: يعرف الطالب مفهوم الكسر جزءًا من كل" aria-label="المعرفة السابقة" className={inputCls} />
          </SectionCard>

          <SectionCard icon={Boxes} title="الوسائل والأدوات" guide="أداة في كل سطر، مما ستجهزه قبل الحصة">
            <textarea value={form.materials} onChange={(e) => setField("materials", e.target.value)} rows={2} placeholder={"نماذج كسور ورقية\nسبورة وأقلام ملونة"} aria-label="الوسائل والأدوات" className={inputCls} />
          </SectionCard>

          <SectionCard icon={Compass} title="استراتيجيات التدريس" guide="اختر ما يناسب الموضوع ومرحلة طلابك، ويمكن الجمع">
            <div className="flex flex-wrap gap-2">
              {STRATEGY_OPTIONS.map((x) => {
                const on = form.strategies.includes(x);
                return (
                  <button
                    key={x}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setField("strategies", on ? form.strategies.filter((y) => y !== x) : [...form.strategies, x])}
                    className={on ? chipOn : chipOff}
                  >
                    {x}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard icon={Route} title="خطوات التنفيذ" guide="خمس مراحل تمر بها الحصة، لكل مرحلة سطر أو سطران">
            <ol className="space-y-4">
              {PHASE_META.map((ph, i) => (
                <li key={ph.key} className="flex gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{ad(i + 1)}</span>
                  <label className="block min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-semibold">{ph.label}</span>
                    <span className="block text-sm leading-6 text-muted-foreground">{ph.guide}</span>
                    <textarea value={form.phases[ph.key]} onChange={(e) => setPhase(ph.key, e.target.value)} rows={2} placeholder={ph.placeholder} className={`${inputCls} mt-1.5`} />
                  </label>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard icon={HelpCircle} title="الأسئلة المفتاحية" guide="سؤال في كل سطر، تقود بها الحوار الصفي">
            <textarea value={form.keyQuestions} onChange={(e) => setField("keyQuestions", e.target.value)} rows={2} placeholder={"متى لا يصح أن نجمع كسرين مباشرة؟\nكيف نعرف أن الجواب منطقي؟"} aria-label="الأسئلة المفتاحية" className={inputCls} />
          </SectionCard>

          <SectionCard icon={BookMarked} title="الواجب" guide="ماذا ينجز الطالب بعد الحصة ليثبت تعلمه؟">
            <textarea value={form.homework} onChange={(e) => setField("homework", e.target.value)} rows={2} placeholder="تمرين قصير متدرج مع مسألة حياتية واحدة" aria-label="الواجب" className={inputCls} />
          </SectionCard>

          <SectionCard icon={Users} title="الفروق الفردية" guide="كيف تيسّر على المتعثر؟ وكيف تثري المتفوق؟">
            <textarea value={form.differentiation} onChange={(e) => setField("differentiation", e.target.value)} rows={2} placeholder="للمتعثر: نماذج محسوسة. للمتفوق: مسألة تحدٍ مفتوحة" aria-label="الفروق الفردية" className={inputCls} />
          </SectionCard>

          {review && (
            <div ref={reviewRef}>
              <ReviewCard review={review} />
            </div>
          )}
        </div>
      ) : tab === "templates" ? (
        <div className="space-y-4">
          <p className="text-base leading-7 text-secondary-foreground">قوالب مكتملة الأركان. حمّل ما يناسب نوع درسك، ثم كيّفه بصفك وموضوعك.</p>
          {PLAN_TEMPLATES.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base font-semibold leading-7">{t.name}</h3>
                <Chip tone="primary">{t.tag}</Chip>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.form.strategies.map((x) => (
                  <Chip key={x}>{x}</Chip>
                ))}
              </div>
              <SecondaryButton onClick={() => loadTemplate(t)} className="mt-4 w-full sm:w-auto">
                <NotebookPen className="h-4 w-4" /> ابدأ بهذا القالب
              </SecondaryButton>
            </Card>
          ))}
        </div>
      ) : lessonPlans.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="لم تحفظ خططًا بعد"
          sub="ابدأ خطة جديدة أو من قالب جاهز، ثم قيّمها واحفظها هنا."
          action={<PrimaryButton onClick={() => setTab("new")}>خطة جديدة</PrimaryButton>}
        />
      ) : (
        <Divided>
          {lessonPlans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelected(p);
                setConfirmDel(null);
              }}
              className="flex w-full items-start gap-3 px-4 py-4 text-right transition-colors hover:bg-muted/60"
            >
              <IconTile icon={FileText} />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium leading-6">{p.topic}</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {p.subject && <Chip tone="primary">{p.subject}</Chip>}
                  {p.grade && <Chip>{p.grade}</Chip>}
                  <Chip>{planMaturityWord(p)}</Chip>
                </span>
              </span>
              <ChevronLeft className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
            </button>
          ))}
        </Divided>
      )}
    </ScreenShell>
  );
}

function ReviewCard({ review }: { review: PlanReview }) {
  return (
    <Card className="p-5">
      <SectionHeader title="تقييم الخطة" sub={review.verdict} />
      <ul className="divide-y divide-border">
        {review.items.map((it) => {
          const Icon = statusIcon[it.status];
          return (
            <li key={it.key} className="flex gap-3 py-3">
              <Icon className={`mt-1 h-5 w-5 shrink-0 ${statusCls[it.status]}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {it.label}، <span className={statusCls[it.status]}>{PLAN_STATUS_WORD[it.status]}</span>
                </p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{it.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
