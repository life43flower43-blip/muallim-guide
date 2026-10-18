"use client";

// سجل التدريب الميداني — طبقة ملء شاشة من رؤية المستخدم (بندي «التدريب الميداني» و«سجل التدريب الميداني»):
// جاهزية قبل دخول المدرسة (قائمة تفاعلية) + زيارة جديدة (مشاهدة أو تنفيذ، بطاقة، ملاحظة أثناء الحصة،
// ما حدث، التأمل الرباعي بعد الحصة، تقييم كلمات) + سجل الزيارات بعرض تفصيلي ومشاركة وتعديل وحذف.
// قواعد صارمة: صفر أرقام ولا لاتيني ولا إيموجي في النصوص المعروضة، والتنصيص ب«».

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Backpack,
  NotebookPen,
  FolderOpen,
  Save,
  ChevronRight,
  Share2,
  Pencil,
  Trash2,
  School,
  Eye,
  Footprints,
  ListChecks,
  Search,
  MessageSquareQuote,
  Star,
  Sunrise,
  ChevronLeft,
  Check,
} from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { useApp } from "@/lib/store";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import FirstDayList from "./FirstDayList";
import { ad } from "@/lib/arabic";
import { Callout, Card, Chip, Divided, EmptyState, IconTile, PrimaryButton, ProgressBar, ScreenShell, SecondaryButton } from "./ui-kit";
import {
  SIZE_OPTIONS,
  RATING_OPTIONS,
  OBSERVE_OPTIONS,
  READY_CHECKLIST,
  REFLECT_FIELDS,
  VISIT_KIND_LABEL,
  readinessWord,
  fieldJourneyWord,
  visitDayWord,
  composeVisitText,
  type FieldVisit,
  type VisitKind,
} from "@/lib/field";

type FieldTab = "new" | "log" | "first";
type VisitForm = Omit<FieldVisit, "id" | "ts">;

const emptyForm = (): VisitForm => ({
  kind: "observe",
  school: "",
  grade: "",
  subject: "",
  supervisor: "",
  topic: "",
  size: "",
  observed: [],
  happened: "",
  learned: "",
  good: "",
  improve: "",
  wouldDo: "",
  rating: "",
});

const inputCls =
  "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-[15px] leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";
const chipOff = "min-h-[36px] rounded-full border border-border bg-card px-3 text-sm text-secondary-foreground transition-colors hover:bg-muted";
const chipOn = "min-h-[36px] rounded-full border border-primary bg-accent px-3 text-sm font-medium text-accent-foreground";

function SectionCard({ icon: Icon, title, guide, children }: { icon: React.ElementType; title: string; guide?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start gap-3">
        <IconTile icon={Icon} />
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold leading-7">{title}</h3>
          {guide && <p className="text-[13px] leading-6 text-muted-foreground">{guide}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function VisitLines({ title, body }: { title: string; body: string }) {
  const lines = body.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <section>
      <h3 className="mb-2 font-display text-base font-semibold">{title}</h3>
      <ul className="space-y-1.5 text-[15px] leading-7 text-secondary-foreground">
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

export default function FieldLogView() {
  const clearField = useUi((s) => s.clearField);
  const fieldVisits = useApp((s) => s.fieldVisits);
  const addFieldVisit = useApp((s) => s.addFieldVisit);
  const removeFieldVisit = useApp((s) => s.removeFieldVisit);

  const [tab, setTab] = useState<FieldTab>("new");
  const [form, setForm] = useState<VisitForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [formErr, setFormErr] = useState("");
  const [selected, setSelected] = useState<FieldVisit | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  function setField<K extends keyof VisitForm>(k: K, v: VisitForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const toggleObserved = (o: string) =>
    setField("observed", form.observed.includes(o) ? form.observed.filter((x) => x !== o) : [...form.observed, o]);

  const toggleReady = (i: number) =>
    setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

  const doSave = () => {
    if (!form.school.trim() || !form.topic.trim()) {
      setFormErr("اكتب اسم المدرسة وموضوع الدرس قبل الحفظ — فهما عنوان الزيارة في سجلك");
      return;
    }
    addFieldVisit({ ...form, id: editingId ?? `FV${Date.now()}`, ts: Date.now() });
    toast({ title: editingId ? "حُفظ تعديل زيارتك" : "حُفظت زيارتك في السجل" });
    setForm(emptyForm());
    setEditingId(null);
    setChecked([]);
    setFormErr("");
    setTab("log");
  };

  const startEdit = (v: FieldVisit) => {
    setForm({
      kind: v.kind,
      school: v.school,
      grade: v.grade,
      subject: v.subject,
      supervisor: v.supervisor,
      topic: v.topic,
      size: v.size,
      observed: [...v.observed],
      happened: v.happened,
      learned: v.learned,
      good: v.good,
      improve: v.improve,
      wouldDo: v.wouldDo,
      rating: v.rating,
    });
    setEditingId(v.id);
    setChecked([]);
    setFormErr("");
    setSelected(null);
    setTab("new");
  };

  const share = async (v: FieldVisit) => {
    const res = await shareText(`زيارة ميدانية: ${v.school}`, composeVisitText(v));
    if (res === "copied") toast({ title: "نُسخ نص الزيارة إلى الحافظة" });
    else if (res === "failed") toast({ title: "تعذّر النسخ — أعد المحاولة" });
  };

  const doDelete = (id: string) => {
    if (confirmDel !== id) {
      setConfirmDel(id);
      return;
    }
    removeFieldVisit(id);
    setConfirmDel(null);
    setSelected(null);
    toast({ title: "حُذفت الزيارة من السجل" });
  };

  // ---------- عرض زيارة محفوظة ----------
  if (selected) {
    return (
      <ScreenShell
        title={selected.school}
        sub={selected.topic}
        onBack={() => setSelected(null)}
        onClose={clearField}
        footer={
          <>
            <PrimaryButton onClick={() => share(selected)} className="flex-1">
              <Share2 className="h-4 w-4" /> مشاركة أو نسخ
            </PrimaryButton>
            <SecondaryButton onClick={() => startEdit(selected)} aria-label="تعديل الزيارة" className="px-3">
              <Pencil className="h-4 w-4" />
            </SecondaryButton>
            <SecondaryButton
              onClick={() => doDelete(selected.id)}
              aria-label={confirmDel === selected.id ? "تأكيد حذف الزيارة" : "حذف الزيارة"}
              className={confirmDel === selected.id ? "border-destructive px-3 text-destructive" : "px-3"}
            >
              <Trash2 className="h-4 w-4" />
            </SecondaryButton>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Chip tone="primary">{VISIT_KIND_LABEL[selected.kind]}</Chip>
            <Chip>{visitDayWord(selected.ts)}</Chip>
            {selected.grade && <Chip>{selected.grade}</Chip>}
            {selected.subject && <Chip>{selected.subject}</Chip>}
            {selected.size && <Chip>{selected.size}</Chip>}
            {selected.supervisor && <Chip>المشرف: {selected.supervisor}</Chip>}
          </div>
          {confirmDel === selected.id && <Callout tone="danger">اضغط زر الحذف مرة أخرى للتأكيد.</Callout>}
          <Card className="space-y-6 p-5">
            {selected.observed.length > 0 && (
              <section>
                <h3 className="mb-2 font-display text-base font-semibold">ما لاحظته أثناء الحصة</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.observed.map((o) => (
                    <Chip key={o} tone="primary">
                      {o}
                    </Chip>
                  ))}
                </div>
              </section>
            )}
            <VisitLines title="ما حدث في الحصة" body={selected.happened} />
            {REFLECT_FIELDS.filter((f) => selected[f.key].trim()).map((f) => (
              <VisitLines key={f.key} title={f.label} body={selected[f.key]} />
            ))}
          </Card>
          {selected.rating && (
            <Callout tone="warning" icon={Star} title="تقييمك للحصة">
              {selected.rating}
            </Callout>
          )}
        </div>
      </ScreenShell>
    );
  }

  const tabs = (
    <div role="tablist" aria-label="أقسام السجل" className="mb-6 grid grid-cols-3 rounded-xl bg-muted p-1">
      {(
        [
          ["new", editingId ? "تعديل الزيارة" : "زيارة جديدة", NotebookPen],
          ["log", `زياراتي${fieldVisits.length ? ` (${ad(fieldVisits.length)})` : ""}`, FolderOpen],
          ["first", "اليوم الأول", Sunrise],
        ] as const
      ).map(([id, lbl, Icon]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg text-[13px] transition-colors ${
            tab === id ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" /> {lbl}
        </button>
      ))}
    </div>
  );

  return (
    <ScreenShell
      title="سجل التدريب الميداني"
      sub="وثّق زياراتك وتأملها، من الملاحظة إلى صفك الخاص"
      onClose={clearField}
      footer={
        tab === "new" ? (
          <PrimaryButton onClick={doSave} className="w-full">
            <Save className="h-4 w-4" /> {editingId ? "احفظ التعديل" : "احفظ الزيارة"}
          </PrimaryButton>
        ) : undefined
      }
    >
      {tabs}
      {tab === "new" ? (
        <div className="space-y-4">
          {formErr && <Callout tone="danger">{formErr}</Callout>}
          {editingId && (
            <Callout tone="info" title="تعدّل زيارة محفوظة">
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm());
                  setEditingId(null);
                  setFormErr("");
                }}
                className="font-medium text-primary underline"
              >
                ابدأ زيارة جديدة بدلًا من ذلك
              </button>
            </Callout>
          )}

          <SectionCard icon={ListChecks} title="جاهزيتك قبل دخول المدرسة" guide="علّم ما أنجزته، والأخلاقيات أولًا دائمًا">
            <ul className="space-y-1">
              {READY_CHECKLIST.map((item, i) => {
                const on = checked.includes(i);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleReady(i)}
                      className="flex min-h-[44px] w-full items-start gap-3 rounded-lg px-1 py-2 text-right hover:bg-muted/60"
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className={`text-[15px] leading-6 ${on ? "text-muted-foreground line-through" : ""}`}>{item}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <ProgressBar value={(checked.length / Math.max(1, READY_CHECKLIST.length)) * 100} className="flex-1" />
              <span className="shrink-0 text-[13px] text-muted-foreground">{readinessWord(checked.length)}</span>
            </div>
          </SectionCard>

          <SectionCard icon={Eye} title="نوع الزيارة" guide="تشاهد حصة معلم، أم تنفذ حصة بنفسك؟">
            <div role="radiogroup" className="grid grid-cols-2 gap-3">
              {(
                [
                  ["observe", "مشاهدة حصة", Eye],
                  ["teach", "تنفيذ حصة", Footprints],
                ] as const
              ).map(([k, lbl, Icon]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === k}
                  onClick={() => setField("kind", k)}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border text-sm transition-colors ${
                    form.kind === k ? "border-primary bg-accent font-medium text-accent-foreground ring-1 ring-primary" : "border-border bg-card text-secondary-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {lbl}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={School} title="بطاقة الزيارة" guide="معلومات الحصة التي عشتها">
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-secondary-foreground">المدرسة</span>
                <input value={form.school} onChange={(e) => setField("school", e.target.value)} placeholder="مثال: مدرسة الأمل الابتدائية" className={inputCls} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-secondary-foreground">موضوع الدرس</span>
                <input value={form.topic} onChange={(e) => setField("topic", e.target.value)} className={inputCls} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-secondary-foreground">الصف</span>
                  <input value={form.grade} onChange={(e) => setField("grade", e.target.value)} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-secondary-foreground">المادة</span>
                  <input value={form.subject} onChange={(e) => setField("subject", e.target.value)} className={inputCls} />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-secondary-foreground">المشرف المرافق (اختياري)</span>
                <input value={form.supervisor} onChange={(e) => setField("supervisor", e.target.value)} className={inputCls} />
              </label>
              <div>
                <p className="mb-2 text-sm font-medium text-secondary-foreground">حجم الصف</p>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((x) => (
                    <button key={x} type="button" onClick={() => setField("size", form.size === x ? "" : x)} className={form.size === x ? chipOn : chipOff}>
                      {x}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Search} title="ما لاحظته أثناء الحصة" guide="اختر ما ركزت عليه، ويمكن الجمع">
            <div className="flex flex-wrap gap-2">
              {OBSERVE_OPTIONS.map((o) => {
                const on = form.observed.includes(o);
                return (
                  <button key={o} type="button" aria-pressed={on} onClick={() => toggleObserved(o)} className={on ? chipOn : chipOff}>
                    {o}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard icon={MessageSquareQuote} title="ما حدث في الحصة" guide="اسرد الموقف كما جرى">
            <textarea value={form.happened} onChange={(e) => setField("happened", e.target.value)} rows={3} aria-label="ما حدث في الحصة" className={inputCls} />
          </SectionCard>

          <SectionCard icon={NotebookPen} title="تأملك بعد الحصة" guide="أربعة أسئلة تحوّل الزيارة إلى خبرة">
            <div className="space-y-4">
              {REFLECT_FIELDS.map((f) => (
                <label key={f.key} className="block space-y-1">
                  <span className="block text-sm font-semibold">{f.label}</span>
                  <span className="block text-[13px] leading-6 text-muted-foreground">{f.guide}</span>
                  <textarea value={form[f.key]} onChange={(e) => setField(f.key, e.target.value)} rows={2} placeholder={f.placeholder} className={`${inputCls} mt-1.5`} />
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Star} title="تقييمك للحصة" guide="حكم واحد صريح">
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((r) => (
                <button key={r} type="button" onClick={() => setField("rating", form.rating === r ? "" : r)} className={form.rating === r ? chipOn : chipOff}>
                  {r}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : tab === "first" ? (
        <FirstDayList />
      ) : fieldVisits.length === 0 ? (
        <EmptyState
          icon={Backpack}
          title="لم تسجل زيارة بعد"
          sub="سجّل زيارتك بعد كل حصة: ما لاحظته، وما حدث، وتأملك."
          action={<PrimaryButton onClick={() => setTab("new")}>زيارة جديدة</PrimaryButton>}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-[15px] text-secondary-foreground">رحلتك الميدانية: {fieldJourneyWord(fieldVisits.length)}</p>
          <Divided>
            {fieldVisits.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setSelected(v);
                  setConfirmDel(null);
                }}
                className="flex w-full items-start gap-3 px-4 py-4 text-right transition-colors hover:bg-muted/60"
              >
                <IconTile icon={v.kind === "teach" ? Footprints : Eye} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-6">{v.school}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">{v.topic}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <Chip tone="primary">{VISIT_KIND_LABEL[v.kind]}</Chip>
                    <Chip>{visitDayWord(v.ts)}</Chip>
                    {v.rating && <Chip>{v.rating}</Chip>}
                  </span>
                </span>
                <ChevronLeft className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
              </button>
            ))}
          </Divided>
        </div>
      )}
    </ScreenShell>
  );
}
