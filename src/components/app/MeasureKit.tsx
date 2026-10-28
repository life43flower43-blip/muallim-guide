"use client";

// معدة القياس والتقويم — من ميزة «ز» في بحث مشاكل الطلبة:
// صعوبة القياس والإحصاء التربوي، ومساق التقويم من الأصعب على الطلبة.
// أربع حاسبات تفاعلية بأرقام مشرقية وشرح تربوي لكل نتيجة.
// قواعد صارمة: صفر حروف لاتينية في النص المعروض، والتنصيص بعلامات «».

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Calculator,
  ChartBarBig,
  Gauge,
  Split,
  Scale,
  Info,
  Table2,
  ListChecks,
  ClipboardCheck,
  TrendingUp,
  ListFilter,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { BlueprintTool, ChecklistTool, DistractorTool, ReliabilityTool, RubricTool, ZScoreTool } from "./MeasureBuilders";
import { FitText } from "./FitText";
import { parseScores, parseSingle, statsOf, difficultyOf, discriminationOf, weightOf } from "@/lib/measure";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Callout, IconTile, ScreenShell, SectionHeader } from "./ui-kit";

type ToolId = "blueprint" | "rubric" | "checklist" | "stats" | "difficulty" | "discrim" | "distractor" | "weight" | "zscore" | "reliability";

type ToolDef = { id: ToolId; label: string; icon: typeof Gauge; desc: string };
const BUILD_TOOLS: ToolDef[] = [
  { id: "blueprint", label: "جدول المواصفات", icon: Table2, desc: "وزّع أسئلة الاختبار على الموضوعات والأهداف" },
  { id: "rubric", label: "سلّم التقدير", icon: ListChecks, desc: "معايير ومستويات، ثم صحّح به" },
  { id: "checklist", label: "قائمة الرصد", icon: ClipboardCheck, desc: "رصد السلوكيات لكل طالب داخل الصف" },
];
const ANALYZE_TOOLS: ToolDef[] = [
  { id: "stats", label: "مركز البيانات", icon: ChartBarBig, desc: "الوسط والوسيط والمدى" },
  { id: "difficulty", label: "صعوبة السؤال", icon: Gauge, desc: "هل سؤالك سهل أم صعب؟" },
  { id: "discrim", label: "تمييز السؤال", icon: Split, desc: "هل يميّز الفاهم من غيره؟" },
  { id: "distractor", label: "تحليل البدائل", icon: ListFilter, desc: "أي البدائل الخاطئة يعمل وأيها لا يعمل" },
  { id: "weight", label: "وزن الدرجة", icon: Scale, desc: "حصة السؤال من المجموع" },
  { id: "zscore", label: "الدرجة المعيارية", icon: TrendingUp, desc: "قارن أداء الطالب في اختبارين مختلفين" },
  { id: "reliability", label: "ثبات الاختبار", icon: ShieldCheck, desc: "هل نتائج اختبارك متسقة؟" },
];
const TOOLS = [...BUILD_TOOLS, ...ANALYZE_TOOLS];

function ToolRow({ t, onClick }: { t: ToolDef; onClick: () => void }) {
  const Icon = t.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 items-center gap-3 rounded-[22px] border border-[var(--t075)] bg-white p-3 text-right transition active:scale-[0.98] dark:border-border dark:bg-card"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBF1D6] text-[#B8860B]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <FitText max={16} min={12} className="font-bold leading-7">{t.label}</FitText>
        <FitText max={13} min={9} className="leading-5 text-muted-foreground">{t.desc}</FitText>
      </span>
      <ChevronLeft className="h-5 w-5 shrink-0 text-[#C99A06]" />
    </button>
  );
}

// نسبة مئوية بأرقام مشرقية وعلامة ٪
const pct = (v: number) => `${ad(Math.round(v * 100))}٪`;

const inputCls =
  "h-12 w-full rounded-xl border border-input bg-card px-3 text-center text-base tabular-nums outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

function ToolHeader({ icon: Icon, label, desc }: { icon: typeof Gauge; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <IconTile icon={Icon} />
      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold">{label}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <Callout tone="neutral" className="mt-3">
      <p className="flex gap-2">
        <Info className="mt-1.5 h-4 w-4 shrink-0 text-primary" />
        <span>{children}</span>
      </p>
    </Callout>
  );
}

export default function MeasureKit() {
  const clearMeasure = useUi((s) => s.clearMeasure);
  const [tool, setTool] = useState<ToolId | null>(null);
  const def = TOOLS.find((t) => t.id === tool);

  if (!def) {
    return (
      <ScreenShell title="أدوات القياس والتقويم" onClose={clearMeasure}>
        <div className="space-y-6">
          <section>
            <SectionHeader title="بناء أدوات التقويم" />
            <div className="space-y-2.5">
              {BUILD_TOOLS.map((t) => <ToolRow key={t.id} t={t} onClick={() => setTool(t.id)} />)}
            </div>
          </section>
          <section>
            <SectionHeader title="تحليل النتائج" />
            <div className="space-y-2.5">
              {ANALYZE_TOOLS.map((t) => <ToolRow key={t.id} t={t} onClick={() => setTool(t.id)} />)}
            </div>
          </section>
          <p className="text-center text-xs text-muted-foreground">الحساب كله على جهازك، ولا تُرسل الدرجات إلى أي مكان.</p>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={def.label} onBack={() => setTool(null)}>
      <div className="rounded-[24px] border border-[var(--t075)] bg-white p-4 dark:border-border dark:bg-card">
        {tool === "blueprint" && <BlueprintTool />}
        {tool === "rubric" && <RubricTool />}
        {tool === "checklist" && <ChecklistTool />}
        {tool === "stats" && <StatsTool />}
        {tool === "difficulty" && <DifficultyTool />}
        {tool === "discrim" && <DiscrimTool />}
        {tool === "distractor" && <DistractorTool />}
        {tool === "weight" && <WeightTool />}
        {tool === "zscore" && <ZScoreTool />}
        {tool === "reliability" && <ReliabilityTool />}
      </div>
    </ScreenShell>
  );
}

// ---------- الحاسبة الأولى: الوسط والوسيط والمدى ----------
function StatsTool() {
  const [raw, setRaw] = useState("");
  const scores = useMemo(() => parseScores(raw), [raw]);
  const res = useMemo(() => statsOf(scores), [scores]);

  return (
    <div>
      <ToolHeader
        icon={ChartBarBig}
        label="مركز البيانات"
        desc="أدخل درجات الطلاب مفصولة بمسافة أو فاصلة"
      />
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={3}
        placeholder="مثال: ٨ ٧ ٩ ٥ ٦ ٨ ٧"
        className={`${inputCls} mt-3 text-right`}
      />
      {scores.length > 0 && (
        <p className="mt-1.5 text-xs font-medium text-muted-foreground">
          فسّرنا {ad(scores.length)} {scores.length === 1 ? "درجة" : "درجات"} من إدخالك
        </p>
      )}

      {res && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <ResultTile label="الوسط الحسابي" value={ad(res.mean.toFixed(1))} hint="مجموع الدرجات على عددها" />
            <ResultTile label="الوسيط" value={ad(res.median.toFixed(1))} hint="الدرجة الوسطية بعد الترتيب" />
            <ResultTile label="المدى" value={ad(res.range.toFixed(1))} hint="الفرق بين الأعلى والأدنى" />
            <ResultTile label="عدد الدرجات" value={ad(res.count)} hint="حجم مجموعتك" />
          </div>
          <Note>{res.note}</Note>
        </motion.div>
      )}
    </div>
  );
}

// ---------- الحاسبة الثانية: صعوبة السؤال ----------
function DifficultyTool() {
  const [totalRaw, setTotalRaw] = useState("");
  const [correctRaw, setCorrectRaw] = useState("");
  const total = parseSingle(totalRaw);
  const correct = parseSingle(correctRaw);
  const res = total !== null && correct !== null ? difficultyOf(correct, total) : null;

  return (
    <div>
      <ToolHeader
        icon={Gauge}
        label="صعوبة السؤال"
        desc="كم أجاب من الطلاب إجابة صحيحة؟"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-center text-sm font-medium text-secondary-foreground">
            عدد المجيبين كلهم
          </label>
          <input
            value={totalRaw}
            onChange={(e) => setTotalRaw(e.target.value)}
            inputMode="numeric"
            placeholder="٠"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-center text-sm font-medium text-secondary-foreground">
            منهم أجاب صحيحًا
          </label>
          <input
            value={correctRaw}
            onChange={(e) => setCorrectRaw(e.target.value)}
            inputMode="numeric"
            placeholder="٠"
            className={inputCls}
          />
        </div>
      </div>

      {res ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <span className="text-sm font-semibold">مؤشر الصعوبة</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                res.tone === "easy"
                  ? "bg-success-soft text-success"
                  : res.tone === "mid"
                    ? "bg-accent text-accent-foreground"
                    : "bg-danger-soft text-destructive"
              }`}
            >
              {res.word}، {pct(res.p)}
            </span>
          </div>
          <div className="progress-track h-2">
            <div
              className="progress-fill h-full"
              style={{ width: `${res.p * 100}%` }}
            />
          </div>
          <Note>{res.note}</Note>
        </motion.div>
      ) : (
        (totalRaw !== "" || correctRaw !== "") && (
          <p className="mt-3 text-xs font-medium text-destructive">
            أدخل عددًا صحيحًا في كل خانة، والمجيبون الصحيحون لا يفوقون المجموع
          </p>
        )
      )}
    </div>
  );
}

// ---------- الحاسبة الثالثة: تمييز السؤال ----------
function DiscrimTool() {
  const [topTotalRaw, setTopTotalRaw] = useState("");
  const [topCorrectRaw, setTopCorrectRaw] = useState("");
  const [botTotalRaw, setBotTotalRaw] = useState("");
  const [botCorrectRaw, setBotCorrectRaw] = useState("");
  const res = discriminationOf(
    parseSingle(topTotalRaw) ?? 0,
    parseSingle(topCorrectRaw) ?? 0,
    parseSingle(botTotalRaw) ?? 0,
    parseSingle(botCorrectRaw) ?? 0
  );

  return (
    <div>
      <ToolHeader
        icon={Split}
        label="تمييز السؤال"
        desc="قارن المجموعة العليا بالدنيا في نتيجة الاختبار"
      />
      <div className="mt-3 space-y-2">
        <div className="rounded-xl bg-success-soft p-3">
          <p className="mb-2 text-center text-xs font-semibold text-success">
            المجموعة العليا — أعلى الدرجات
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={topTotalRaw}
              onChange={(e) => setTopTotalRaw(e.target.value)}
              inputMode="numeric"
              placeholder="عددهم"
              className={inputCls}
            />
            <input
              value={topCorrectRaw}
              onChange={(e) => setTopCorrectRaw(e.target.value)}
              inputMode="numeric"
              placeholder="أصابوا هذا السؤال"
              className={inputCls}
            />
          </div>
        </div>
        <div className="rounded-xl bg-gem-soft p-3">
          <p className="mb-2 text-center text-xs font-semibold text-gem">
            المجموعة الدنيا — أدنى الدرجات
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={botTotalRaw}
              onChange={(e) => setBotTotalRaw(e.target.value)}
              inputMode="numeric"
              placeholder="عددهم"
              className={inputCls}
            />
            <input
              value={botCorrectRaw}
              onChange={(e) => setBotCorrectRaw(e.target.value)}
              inputMode="numeric"
              placeholder="أصابوا هذا السؤال"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {res && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <span className="text-sm font-semibold">مؤشر التمييز</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                res.tone === "great" || res.tone === "good"
                  ? "bg-success-soft text-success"
                  : res.tone === "neg"
                    ? "bg-danger-soft text-destructive"
                    : "bg-gem-soft text-gem"
              }`}
            >
              {res.word}، {ad(res.d.toFixed(2))}
            </span>
          </div>
          <Note>{res.note}</Note>
        </motion.div>
      )}
      <Note>
        العادة: خذ أعلى وأدنى ربع أو ثلث من الطلاب في نتيجة الاختبار كلها، ثم قارن نجاحهما في هذا
        السؤال تحديدًا.
      </Note>
    </div>
  );
}

// ---------- الحاسبة الرابعة: وزن الدرجة ----------
function WeightTool() {
  const [scoreRaw, setScoreRaw] = useState("");
  const [totalRaw, setTotalRaw] = useState("");
  const score = parseSingle(scoreRaw);
  const total = parseSingle(totalRaw);
  const res = score !== null && total !== null ? weightOf(score, total) : null;

  return (
    <div>
      <ToolHeader icon={Scale} label="وزن الدرجة" desc="كم يمثل هذا السؤال من الدرجة الكلية؟" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-center text-sm font-medium text-secondary-foreground">
            درجة السؤال
          </label>
          <input
            value={scoreRaw}
            onChange={(e) => setScoreRaw(e.target.value)}
            inputMode="numeric"
            placeholder="٠"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-center text-sm font-medium text-secondary-foreground">
            الدرجة الكلية للاختبار
          </label>
          <input
            value={totalRaw}
            onChange={(e) => setTotalRaw(e.target.value)}
            inputMode="numeric"
            placeholder="٠"
            className={inputCls}
          />
        </div>
      </div>

      {res ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <span className="text-sm font-semibold">وزن السؤال</span>
            <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
              {pct(res.pct / 100)}
            </span>
          </div>
          <Note>{res.note}</Note>
        </motion.div>
      ) : (
        (scoreRaw !== "" || totalRaw !== "") && (
          <p className="mt-3 text-xs font-medium text-destructive">
            أدخل عددًا موجبًا في كل خانة، ودرجة السؤال لا تفوق الكلية
          </p>
        )
      )}
    </div>
  );
}

// بلاطة نتيجة — القيمة بأرقام مشرقية والشرح تحتها
function ResultTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums text-primary" dir="ltr">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
