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
} from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { useApp } from "@/lib/store";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import FirstDayList from "./FirstDayList";
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
  "w-full rounded-xl border-2 border-border bg-background p-3 text-sm leading-6 outline-none focus:border-primary";
const chipOff =
  "rounded-full border-2 border-border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary";
const chipOn =
  "rounded-full border-2 border-primary bg-accent px-3 py-1.5 text-xs font-black text-primary";

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

// قسم نصي بعرض الزيارة — أسطر مفصولة تُعرض شرطات، ويختفي القسم إن كان فارغًا
function VisitLines({ title, body }: { title: string; body: string }) {
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

  // ---------- شاشة عرض زيارة محفوظة ----------
  if (selected) {
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
            <ChevronRight className="h-4 w-4" /> عودة إلى سجل الزيارات
          </button>

          <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-black leading-7">{selected.school}</h2>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">
                {VISIT_KIND_LABEL[selected.kind]}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-muted-foreground">{selected.topic}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.grade && (
                <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-black text-amber-800">{selected.grade}</span>
              )}
              {selected.subject && (
                <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-black text-amber-800">{selected.subject}</span>
              )}
              {selected.supervisor && (
                <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-black text-amber-800">المشرف: {selected.supervisor}</span>
              )}
              {selected.size && (
                <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-black text-muted-foreground">{selected.size}</span>
              )}
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">{visitDayWord(selected.ts)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {selected.observed.length > 0 && (
              <div className="rounded-2xl border-2 border-border bg-white p-4">
                <h3 className="text-sm font-black">ما لاحظته أثناء الحصة</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.observed.map((o) => (
                    <span key={o} className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-black text-primary">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <VisitLines title="ما حدث في الحصة" body={selected.happened} />
            {REFLECT_FIELDS.filter((f) => selected[f.key].trim()).map((f) => (
              <VisitLines key={f.key} title={f.label} body={selected[f.key]} />
            ))}
            {selected.rating && (
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-black text-amber-900">
                  <Star className="h-4 w-4" /> تقييم الحصة
                </p>
                <p className="mt-1 text-xs font-black text-amber-800">{selected.rating}</p>
              </div>
            )}
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
              aria-label="تعديل الزيارة"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-white text-muted-foreground"
            >
              <Pencil className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => doDelete(selected.id)}
              aria-label={confirmDel === selected.id ? "تأكيد حذف الزيارة" : "حذف الزيارة"}
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
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
              <Backpack className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-foreground">سجل التدريب الميداني</h1>
              <p className="text-xs text-muted-foreground">وثّق زياراتك وتأملها — من الملاحظة إلى صفك الخاص</p>
            </div>
          </div>
          <button
            onClick={clearField}
            aria-label="إغلاق"
            className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-1.5">
          {(
            [
              ["new", "زيارة جديدة", NotebookPen],
              ["log", "سجل الزيارات", FolderOpen],
              ["first", "اليوم الأول", Sunrise],
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
            <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-amber-900">
                <Footprints className="h-4 w-4" /> كيف يعمل السجل؟
              </p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                استعد بقائمة الجاهزية قبل دخول المدرسة، ثم سجّل زيارتك بعد الحصة: ما لاحظته وما حدث وما تعلمته —
                فالتأمل المكتوب هو ما يحوّل الزيارة من مشاهدة إلى خبرة تبقى.
              </p>
            </div>

            {/* الجاهزية قبل دخول المدرسة — ماذا أفعل؟ ماذا أحضر؟ الأخلاقيات */}
            <SectionCard
              icon={ListChecks}
              title="جاهزيتك قبل دخول المدرسة"
              guide="انقر ما أنجزته — الأخلاقيات أولًا دائمًا"
            >
              <div className="space-y-1.5">
                {READY_CHECKLIST.map((item, i) => {
                  const on = checked.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleReady(i)}
                      aria-pressed={on}
                      className={`flex w-full items-start gap-2.5 rounded-xl border-2 p-2.5 text-right transition ${
                        on ? "border-emerald-300 bg-emerald-50" : "border-border bg-white"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          on ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-white"
                        }`}
                      >
                        {on && <span className="text-[10px] font-black">✓</span>}
                      </span>
                      <span className={`text-xs font-bold leading-5 ${on ? "text-emerald-900" : "text-foreground"}`}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 rounded-xl bg-muted/60 px-3 py-2 text-xs font-black text-primary">
                جاهزيتك الآن: {readinessWord(checked.length)}
              </p>
            </SectionCard>

            {/* نوع الزيارة */}
            <SectionCard icon={Eye} title="نوع الزيارة" guide="تشاهد حصة معلم أم تنفذ حصة بنفسك؟">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["observe", "مشاهدة حصة", Eye],
                    ["teach", "تنفيذ حصة", Footprints],
                  ] as const
                ).map(([k, lbl, Icon]) => (
                  <button
                    key={k}
                    onClick={() => setField("kind", k)}
                    aria-pressed={form.kind === k}
                    className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black transition-colors ${
                      form.kind === k
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-border bg-white text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {lbl}
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* بطاقة الزيارة */}
            <SectionCard icon={School} title="بطاقة الزيارة" guide="معلومات الحصة التي عشتها اليوم">
              <div className="space-y-2.5">
                <input
                  value={form.school}
                  onChange={(e) => setField("school", e.target.value)}
                  placeholder="المدرسة — مثال: مدرسة الأمل الابتدائية"
                  aria-label="المدرسة"
                  className={inputCls}
                />
                <input
                  value={form.topic}
                  onChange={(e) => setField("topic", e.target.value)}
                  placeholder="موضوع الدرس الذي شاهدته أو نفذته"
                  aria-label="موضوع الدرس"
                  className={inputCls}
                />
                <div className="flex gap-2.5">
                  <input
                    value={form.grade}
                    onChange={(e) => setField("grade", e.target.value)}
                    placeholder="الصف"
                    aria-label="الصف"
                    className={inputCls}
                  />
                  <input
                    value={form.subject}
                    onChange={(e) => setField("subject", e.target.value)}
                    placeholder="المادة"
                    aria-label="المادة"
                    className={inputCls}
                  />
                </div>
                <input
                  value={form.supervisor}
                  onChange={(e) => setField("supervisor", e.target.value)}
                  placeholder="اسم المشرف المرافق — اختياري"
                  aria-label="المشرف"
                  className={inputCls}
                />
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">حجم الصف</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setField("size", form.size === s ? "" : s)}
                        className={form.size === s ? chipOn : chipOff}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* قائمة الملاحظة أثناء الحصة */}
            <SectionCard
              icon={Search}
              title="ما لاحظته أثناء الحصة"
              guide="انقر ما ركزت عليه في ملاحظتك — ويمكن الجمع"
            >
              <div className="flex flex-wrap gap-1.5">
                {OBSERVE_OPTIONS.map((o) => {
                  const on = form.observed.includes(o);
                  return (
                    <button key={o} onClick={() => toggleObserved(o)} className={on ? chipOn : chipOff}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* ما حدث */}
            <SectionCard icon={MessageSquareQuote} title="ما حدث في الحصة" guide="اسرد الموقف كما جرى — بلا تجميل">
              <textarea
                value={form.happened}
                onChange={(e) => setField("happened", e.target.value)}
                rows={3}
                placeholder="مثال: بدأت المعلم بعرض تجربة محيرة فقام الطلاب بطرح أسئلة متتالية حتى صاغوا الفكرة بأنفسهم"
                aria-label="ما حدث في الحصة"
                className={inputCls}
              />
            </SectionCard>

            {/* التأمل الرباعي بعد الحصة — أسئلة رؤية المستخدم */}
            <SectionCard
              icon={NotebookPen}
              title="تأملك بعد الحصة"
              guide="أربعة أسئلة تحوّل الزيارة إلى خبرة — اجب بها بشيء من الصدق"
            >
              <div className="space-y-3">
                {REFLECT_FIELDS.map((f) => (
                  <div key={f.key} className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs font-black text-primary">{f.label}</p>
                    <p className="text-[11px] font-bold leading-4 text-muted-foreground">{f.guide}</p>
                    <textarea
                      value={form[f.key]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      rows={2}
                      placeholder={f.placeholder}
                      aria-label={f.label}
                      className={`${inputCls} mt-2 bg-white`}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* تقييم الحصة */}
            <SectionCard icon={Star} title="تقييمك للحصة" guide="حكم واحد بلسان صريح">
              <div className="flex flex-wrap gap-1.5">
                {RATING_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setField("rating", form.rating === r ? "" : r)}
                    className={form.rating === r ? chipOn : chipOff}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </SectionCard>

            <button
              onClick={doSave}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-black text-primary-foreground"
            >
              <Save className="h-5 w-5" /> {editingId ? "احفظ التعديل" : "احفظ الزيارة في السجل"}
            </button>
            {formErr && <p className="text-center text-xs font-black text-red-600">{formErr}</p>}
            {editingId && (
              <button
                onClick={() => {
                  setForm(emptyForm());
                  setEditingId(null);
                  setFormErr("");
                }}
                className="w-full py-1 text-center text-xs font-bold text-muted-foreground underline"
              >
                إلغاء التعديل والبدء من جديد
              </button>
            )}
          </div>
        ) : tab === "first" ? (
          <FirstDayList />
        ) : fieldVisits.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-white p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Backpack className="h-7 w-7 text-primary" />
            </span>
            <h3 className="mt-3 text-sm font-black">لم تسجل زيارة بعد</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
              {fieldJourneyWord(0)} — من تبويب «زيارة جديدة»: جاهزيتك قبل الحصة، وما لاحظته، وتأملك بعدها
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-black text-amber-900">
              رحلتك الميدانية: {fieldJourneyWord(fieldVisits.length)}
            </p>
            {fieldVisits.map((v) => (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelected(v);
                  setConfirmDel(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSelected(v);
                    setConfirmDel(null);
                  }
                }}
                className="block w-full cursor-pointer rounded-2xl border-2 border-border bg-white p-4 text-right transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-6">{v.school}</p>
                    <p className="truncate text-[11px] font-bold text-muted-foreground">{v.topic}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                    {VISIT_KIND_LABEL[v.kind]}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{visitDayWord(v.ts)}</span>
                  {v.grade && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">{v.grade}</span>}
                  {v.rating && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{v.rating}</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(v);
                    }}
                    className="flex items-center gap-1 rounded-full border border-primary/30 bg-white px-3 py-1 text-[11px] font-black text-primary"
                  >
                    <Pencil className="h-3 w-3" /> تعديل
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      doDelete(v.id);
                    }}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black ${
                      confirmDel === v.id ? "border-red-300 bg-red-50 text-red-600" : "border-border bg-white text-muted-foreground"
                    }`}
                  >
                    <Trash2 className="h-3 w-3" /> {confirmDel === v.id ? "اضغط مجددًا للتأكيد" : "حذف"}
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
