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
} from "lucide-react";
import { parseScores, parseSingle, statsOf, difficultyOf, discriminationOf, weightOf } from "@/lib/measure";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";

type ToolId = "stats" | "difficulty" | "discrim" | "weight";

const TOOLS: { id: ToolId; label: string; icon: typeof Gauge; desc: string }[] = [
  { id: "stats", label: "مركز البيانات", icon: ChartBarBig, desc: "الوسط والوسيط والمدى" },
  { id: "difficulty", label: "صعوبة السؤال", icon: Gauge, desc: "هل سؤالك سهل أم صعب؟" },
  { id: "discrim", label: "تمييز السؤال", icon: Split, desc: "هل يميّز الفاهم من غيره؟" },
  { id: "weight", label: "وزن الدرجة", icon: Scale, desc: "حصة السؤال من المجموع" },
];

// نسبة مئوية بأرقام مشرقية وعلامة ٪
const pct = (v: number) => `${ad(Math.round(v * 100))}٪`;

const inputCls =
  "w-full rounded-xl border-2 border-border bg-background p-3 text-center text-sm font-black tabular-nums outline-none focus:border-primary";

function ToolHeader({ icon: Icon, label, desc }: { icon: typeof Gauge; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
        <Icon className="h-5 w-5 text-primary" />
      </span>
      <div>
        <h3 className="text-sm font-black">{label}</h3>
        <p className="text-[11px] font-bold text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/70 p-3 text-xs font-bold leading-6 text-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>{children}</p>
    </div>
  );
}

export default function MeasureKit() {
  const clearMeasure = useUi((s) => s.clearMeasure);
  const [tool, setTool] = useState<ToolId>("stats");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="safe-top" />
      <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14919B] text-white">
              <Calculator className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-black">معدة القياس والتقويم</h2>
          </div>
          <button onClick={clearMeasure} className="rounded-full bg-muted p-2" aria-label="إغلاق المعدة">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 rounded-2xl border-2 border-[#14919B]/20 bg-gradient-to-l from-[#14919B]/10 to-transparent p-3.5 text-xs font-bold leading-6 text-foreground">
          حاسباتك الأربع لورقة التقويم: أدخل درجات طلابك أو إجاباتهم وستقرأ النتيجة مع تربويها — كل
          الحساب يجري على جهازك ولا يغادره.
        </p>

        {/* تبويبات الأدوات الأربع */}
        <div className="grid grid-cols-4 gap-1.5">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-[10px] font-black leading-4 ${
                  tool === t.id
                    ? "border-[#14919B] bg-[#14919B]/10 text-[#14919B]"
                    : "border-border bg-white text-muted-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border-2 border-border bg-white p-4">
          {tool === "stats" && <StatsTool />}
          {tool === "difficulty" && <DifficultyTool />}
          {tool === "discrim" && <DiscrimTool />}
          {tool === "weight" && <WeightTool />}
        </div>
      </div>
    </motion.div>
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
        <p className="mt-1.5 text-[11px] font-bold text-muted-foreground">
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
          <label className="mb-1 block text-center text-[11px] font-black text-muted-foreground">
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
          <label className="mb-1 block text-center text-[11px] font-black text-muted-foreground">
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
          <div className="flex items-center justify-between rounded-xl bg-muted/70 p-3">
            <span className="text-sm font-black">مؤشر الصعوبة</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-black ${
                res.tone === "easy"
                  ? "bg-emerald-100 text-emerald-700"
                  : res.tone === "mid"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {res.word}، {pct(res.p)}
            </span>
          </div>
          <div className="progress-track h-3">
            <div
              className="progress-fill h-full"
              style={{ width: `${res.p * 100}%` }}
            />
          </div>
          <Note>{res.note}</Note>
        </motion.div>
      ) : (
        (totalRaw !== "" || correctRaw !== "") && (
          <p className="mt-3 text-xs font-bold text-red-600">
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
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="mb-2 text-center text-[11px] font-black text-emerald-800">
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
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="mb-2 text-center text-[11px] font-black text-amber-800">
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
          <div className="flex items-center justify-between rounded-xl bg-muted/70 p-3">
            <span className="text-sm font-black">مؤشر التمييز</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-black ${
                res.tone === "great" || res.tone === "good"
                  ? "bg-emerald-100 text-emerald-700"
                  : res.tone === "neg"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
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
          <label className="mb-1 block text-center text-[11px] font-black text-muted-foreground">
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
          <label className="mb-1 block text-center text-[11px] font-black text-muted-foreground">
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
          <div className="flex items-center justify-between rounded-xl bg-muted/70 p-3">
            <span className="text-sm font-black">وزن السؤال</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-black text-sky-700">
              {pct(res.pct / 100)}
            </span>
          </div>
          <Note>{res.note}</Note>
        </motion.div>
      ) : (
        (scoreRaw !== "" || totalRaw !== "") && (
          <p className="mt-3 text-xs font-bold text-red-600">
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
    <div className="rounded-xl border-2 border-border bg-white p-3 text-center">
      <p className="text-[11px] font-black text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-black tabular-nums text-primary" dir="ltr">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">{hint}</p>
    </div>
  );
}
