"use client";

// أدوات القياس والتقويم الإضافية: جدول المواصفات، وسلّم التقدير، وقائمة الرصد،
// والدرجة المعيارية، وتحليل البدائل، وثبات الاختبار.
// الحساب كله على الجهاز، وما يبنيه المعلم (جدول، سلّم، قائمة) يُحفظ في متصفحه.

import { useEffect, useState } from "react";
import { Check, Plus, RotateCcw, Share2, Trash2, X } from "lucide-react";
import { blueprintOf, distractorsOf, kr21Of, parseScores, parseSingle, zScoreOf, type DistractorVerdict } from "@/lib/measure";
import { shareText } from "@/lib/share";
import { ad } from "@/lib/arabic";
import { OPTION_LETTERS } from "@/lib/qbank";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ---------- أدوات مشتركة ----------

export const inputCls =
  "h-11 w-full min-w-0 rounded-[14px] border border-[var(--t075)] bg-white px-3 text-base outline-none placeholder:text-muted-foreground focus:border-[var(--t500)] dark:border-border dark:bg-card";
const numCls = `${inputCls} text-center tabular-nums`;
const pct = (v: number) => `${ad(Math.round(v * 100))}٪`;
const fx = (v: number, d = 2) => ad(v.toFixed(d));

/** حالة تُحفظ في متصفح المعلم — وتعمل كاملة إن تعذّر الحفظ */
function usePersist<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : init;
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  }, [key, v]);
  return [v, setV] as const;
}

async function share(title: string, text: string) {
  const r = await shareText(title, text);
  if (r === "copied") toast({ title: "نُسخ إلى الحافظة" });
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-sm font-bold text-[var(--t600)]">{children}</p>;
}

function Note({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "fair" | "weak" }) {
  const cls = { neutral: "bg-[var(--t050)] text-secondary-foreground", good: "bg-[#E3F4EA] text-[#1F5B3C]", fair: "bg-[#FBF1D6] text-[#7A5410]", weak: "bg-danger-soft text-destructive" }[tone];
  return <p className={cn("rounded-[16px] px-3.5 py-3 text-[15px] leading-7", cls)}>{children}</p>;
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--t075)] p-2.5 text-center dark:border-border">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-xl font-extrabold tabular-nums text-[var(--t800)] dark:text-foreground">{value}</p>
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-[var(--t150)] text-sm font-bold text-[var(--t700)]">
      <Plus className="h-4 w-4" /> {children}
    </button>
  );
}

function DelBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function ActionBtn({ icon: Icon, onClick, children }: { icon: React.ElementType; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-[16px] border border-[#E3D3A0] text-sm font-bold text-[#9A6A12]">
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

// ================== جدول المواصفات ==================

const LEVELS = ["تذكّر", "فهم", "تطبيق", "تفكير عالٍ"];
const LEVELS_SHORT = ["تذكّر", "فهم", "تطبيق", "عالٍ"];
type Topic = { name: string; weight: string };

export function BlueprintTool() {
  const [total, setTotal] = usePersist("mk-bp-total", "٢٠");
  const [topics, setTopics] = usePersist<Topic[]>("mk-bp-topics", [
    { name: "الدرس الأول", weight: "٤" },
    { name: "الدرس الثاني", weight: "٣" },
    { name: "الدرس الثالث", weight: "٢" },
  ]);
  const [lv, setLv] = usePersist<string[]>("mk-bp-levels", ["٣٠", "٣٠", "٢٥", "١٥"]);
  const n = parseSingle(total) ?? 0;
  const weights = topics.map((t) => parseSingle(t.weight) ?? 0);
  const pcts = lv.map((x) => parseSingle(x) ?? 0);
  const pSum = pcts.reduce((a, b) => a + b, 0);
  const table = blueprintOf(Math.round(n), weights, pcts);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const set = (i: number, k: keyof Topic, v: string) => setTopics(topics.map((t, j) => (j === i ? { ...t, [k]: v } : t)));

  const shareIt = () => {
    if (!table) return;
    const lines = topics.map((t, i) => `${t.name || `الموضوع ${ad(i + 1)}`}: ${LEVELS.map((l, c) => `${l} ${ad(table[i][c])}`).join("، ")} (المجموع ${ad(table[i].reduce((a, b) => a + b, 0))})`);
    share("جدول المواصفات", `عدد الأسئلة: ${ad(Math.round(n))}\n${lines.join("\n")}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>عدد أسئلة الاختبار</Label>
        <input value={total} onChange={(e) => setTotal(e.target.value)} inputMode="numeric" className={numCls} />
      </div>

      <div>
        <Label>الموضوعات وعدد حصص كل منها</Label>
        <div className="space-y-2">
          {topics.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={t.name} onChange={(e) => set(i, "name", e.target.value)} placeholder={`الموضوع ${ad(i + 1)}`} className={cn(inputCls, "flex-1")} />
              <input value={t.weight} onChange={(e) => set(i, "weight", e.target.value)} inputMode="numeric" aria-label="الوزن" className={cn(numCls, "w-16 shrink-0")} />
              <DelBtn onClick={() => setTopics(topics.filter((_, j) => j !== i))} label="حذف الموضوع" />
            </div>
          ))}
          <AddBtn onClick={() => setTopics([...topics, { name: "", weight: "١" }])}>أضف موضوعًا</AddBtn>
        </div>
      </div>

      <div>
        <Label>نسبة كل مستوى من الأهداف</Label>
        <div className="grid grid-cols-4 gap-2">
          {LEVELS.map((l, c) => (
            <label key={l} className="min-w-0 text-center">
              <span className="mb-1 block truncate text-xs font-bold text-muted-foreground">{l}</span>
              <input value={lv[c]} onChange={(e) => setLv(lv.map((x, j) => (j === c ? e.target.value : x)))} inputMode="numeric" className={cn(numCls, "px-1")} />
            </label>
          ))}
        </div>
        {pSum !== 100 && <p className="mt-1.5 text-xs font-bold text-[#9A6A12]">مجموع النسب {ad(pSum)}٪، والأفضل أن يكون ١٠٠٪.</p>}
      </div>

      {table ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[18px] border border-[var(--t075)] dark:border-border">
            <table className="w-full table-fixed text-center text-sm">
              <thead className="bg-[var(--t050)] text-xs text-[var(--t700)] dark:bg-muted">
                <tr>
                  <th className="w-[28%] px-2 py-2 text-right">الموضوع</th>
                  {LEVELS_SHORT.map((l) => (
                    <th key={l} className="px-0.5 py-2 font-bold leading-4">{l}</th>
                  ))}
                  <th className="px-0.5 py-2">الكل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--t075)] dark:divide-border">
                {topics.map((t, i) => (
                  <tr key={i}>
                    <td className="truncate px-2 py-2 text-right font-bold">{t.name || `الموضوع ${ad(i + 1)}`}</td>
                    {table[i].map((x, c) => (
                      <td key={c} className="tabular-nums">{ad(x)}</td>
                    ))}
                    <td className="font-extrabold tabular-nums text-[var(--t800)] dark:text-foreground">{ad(table[i].reduce((a, b) => a + b, 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--t050)] font-extrabold dark:bg-muted">
                <tr>
                  <td className="px-2 py-2 text-right">الكل</td>
                  {LEVELS.map((_, c) => (
                    <td key={c} className="tabular-nums">{ad(table.reduce((a, r) => a + r[c], 0))}</td>
                  ))}
                  <td className="tabular-nums">{ad(Math.round(n))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Note>وزن الموضوع = حصصه ÷ مجموع الحصص ({ad(wSum)}). وعدد أسئلة الخانة = عدد الأسئلة × وزن الموضوع × نسبة المستوى، مع جبر الكسور حتى يبقى المجموع صحيحًا.</Note>
          <div className="flex gap-2">
            <ActionBtn icon={Share2} onClick={shareIt}>مشاركة</ActionBtn>
          </div>
        </div>
      ) : (
        <Note tone="fair">أدخل عدد الأسئلة، وموضوعًا واحدًا على الأقل بوزن أكبر من صفر.</Note>
      )}
    </div>
  );
}

// ================== سلّم التقدير ==================

const RUBRIC_LEVELS = [
  { name: "ممتاز", pts: 4 },
  { name: "جيد", pts: 3 },
  { name: "مقبول", pts: 2 },
  { name: "يحتاج دعمًا", pts: 1 },
];
type Criterion = { name: string; desc: string[] };
const blankCriterion = (name = ""): Criterion => ({ name, desc: RUBRIC_LEVELS.map(() => "") });

export function RubricTool() {
  const [title, setTitle] = usePersist("mk-rb-title", "");
  const [crit, setCrit] = usePersist<Criterion[]>("mk-rb-crit", [blankCriterion("دقة المحتوى"), blankCriterion("تنظيم الأفكار"), blankCriterion("اللغة والعرض")]);
  const [mode, setMode] = useState<"build" | "score">("build");
  const [marks, setMarks] = useState<(number | null)[]>([]);
  const max = crit.length * RUBRIC_LEVELS[0].pts;
  const got = crit.reduce((a, _, i) => a + (marks[i] != null ? RUBRIC_LEVELS[marks[i] as number].pts : 0), 0);
  const marked = crit.filter((_, i) => marks[i] != null).length;
  const setC = (i: number, c: Criterion) => setCrit(crit.map((x, j) => (j === i ? c : x)));

  const shareIt = () => {
    const body = crit
      .map((c, i) => `${ad(i + 1)}. ${c.name || "معيار"}\n${RUBRIC_LEVELS.map((l, k) => `   ${l.name} (${ad(l.pts)}): ${c.desc[k] || "—"}`).join("\n")}`)
      .join("\n\n");
    share(title || "سلّم تقدير", `${body}\n\nالدرجة العظمى: ${ad(max)}`);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-[18px] border border-[#E3D3A0] p-1" role="tablist">
        {(
          [
            ["build", "بناء السلّم"],
            ["score", "التصحيح به"],
          ] as const
        ).map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={cn("min-h-[40px] rounded-[14px] text-sm font-bold", mode === id ? "bg-[var(--t700)] text-white" : "text-[var(--t500)]")}>
            {l}
          </button>
        ))}
      </div>

      {mode === "build" ? (
        <>
          <div>
            <Label>عنوان المهمة</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تقرير عن رحلة علمية" className={inputCls} />
          </div>
          <div className="space-y-3">
            {crit.map((c, i) => (
              <div key={i} className="space-y-2 rounded-[18px] border border-[var(--t075)] p-3 dark:border-border">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--t050)] text-sm font-extrabold text-[var(--t700)]">{ad(i + 1)}</span>
                  <input value={c.name} onChange={(e) => setC(i, { ...c, name: e.target.value })} placeholder="اسم المعيار" className={cn(inputCls, "flex-1 font-bold")} />
                  <DelBtn onClick={() => setCrit(crit.filter((_, j) => j !== i))} label="حذف المعيار" />
                </div>
                {RUBRIC_LEVELS.map((l, k) => (
                  <div key={l.name} className="flex items-center gap-2">
                    <span className="w-[86px] shrink-0 text-xs font-bold text-muted-foreground">
                      {l.name} ({ad(l.pts)})
                    </span>
                    <input value={c.desc[k]} onChange={(e) => setC(i, { ...c, desc: c.desc.map((d, j) => (j === k ? e.target.value : d)) })} placeholder="وصف الأداء في هذا المستوى" className={cn(inputCls, "h-10 flex-1 text-sm")} />
                  </div>
                ))}
              </div>
            ))}
            <AddBtn onClick={() => setCrit([...crit, blankCriterion()])}>أضف معيارًا</AddBtn>
          </div>
          <Note>صف في كل مستوى سلوكًا يمكن ملاحظته، لا حكمًا عامًا: «يذكر ثلاثة أدلة من النص» أوضح من «جيد جدًا».</Note>
          <div className="flex gap-2">
            <ActionBtn icon={Share2} onClick={shareIt}>مشاركة السلّم</ActionBtn>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            {crit.map((c, i) => (
              <div key={i}>
                <p className="mb-1.5 font-bold">{c.name || `معيار ${ad(i + 1)}`}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {RUBRIC_LEVELS.map((l, k) => (
                    <button
                      key={l.name}
                      type="button"
                      onClick={() => setMarks(crit.map((_, j) => (j === i ? (marks[i] === k ? null : k) : marks[j] ?? null)))}
                      title={c.desc[k] || undefined}
                      className={cn("min-h-[44px] min-w-0 rounded-[14px] border px-1 text-xs font-bold leading-4", marks[i] === k ? "border-transparent bg-[var(--t700)] text-white" : "border-[var(--t075)] text-[var(--t700)] dark:border-border")}
                    >
                      {l.name}
                      <span className="block opacity-75">{ad(l.pts)}</span>
                    </button>
                  ))}
                </div>
                {marks[i] != null && c.desc[marks[i] as number] && <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.desc[marks[i] as number]}</p>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Big label="الدرجة" value={`${ad(got)} من ${ad(max)}`} />
            <Big label="النسبة" value={max ? pct(got / max) : "—"} />
          </div>
          {marked < crit.length && <Note tone="fair">قدّرت {ad(marked)} من {ad(crit.length)} معايير.</Note>}
          <div className="flex gap-2">
            <ActionBtn icon={RotateCcw} onClick={() => setMarks([])}>طالب جديد</ActionBtn>
          </div>
        </>
      )}
    </div>
  );
}

// ================== قائمة الرصد ==================

type Mark = "y" | "n";

export function ChecklistTool() {
  const [items, setItems] = usePersist<string[]>("mk-cl-items", ["يشارك في النقاش", "يتعاون مع زملائه", "ينجز المهمة في وقتها", "يستخدم المصطلحات بدقة"]);
  const [students, setStudents] = usePersist<string[]>("mk-cl-students", []);
  const [marks, setMarks] = usePersist<Record<string, Mark>>("mk-cl-marks", {});
  const [cur, setCur] = useState(0);
  const [newItem, setNewItem] = useState("");
  const [newStudent, setNewStudent] = useState("");
  const key = (s: number, i: number) => `${students[s]}::${items[i]}`;
  const toggle = (s: number, i: number, m: Mark) => {
    const k = key(s, i);
    const next = { ...marks };
    if (next[k] === m) delete next[k];
    else next[k] = m;
    setMarks(next);
  };
  const addStudent = () => {
    const n = newStudent.trim();
    if (!n || students.includes(n)) return;
    setStudents([...students, n]);
    setCur(students.length);
    setNewStudent("");
  };
  const addItem = () => {
    const n = newItem.trim();
    if (!n || items.includes(n)) return;
    setItems([...items, n]);
    setNewItem("");
  };
  const yesOf = (s: number) => items.filter((_, i) => marks[key(s, i)] === "y").length;
  const itemRate = (i: number) => {
    const done = students.map((_, s) => marks[key(s, i)]).filter(Boolean);
    return done.length ? done.filter((m) => m === "y").length / done.length : null;
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>السلوكيات التي ترصدها</Label>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it} className="flex items-center gap-2 rounded-[14px] bg-[var(--t050)] pr-3 dark:bg-muted">
              <span className="min-w-0 flex-1 text-[15px] font-bold leading-6">{it}</span>
              <DelBtn onClick={() => setItems(items.filter((_, j) => j !== i))} label="حذف السلوك" />
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="سلوك جديد" className={cn(inputCls, "flex-1")} />
            <button type="button" onClick={addItem} aria-label="أضف السلوك" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--t700)] text-white">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <Label>الطلاب</Label>
        <div className="flex gap-2">
          <input value={newStudent} onChange={(e) => setNewStudent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStudent()} placeholder="اسم الطالب" className={cn(inputCls, "flex-1")} />
          <button type="button" onClick={addStudent} aria-label="أضف الطالب" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--t700)] text-white">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {students.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
            {students.map((s, i) => (
              <button key={s} type="button" onClick={() => setCur(i)} className={cn("min-h-[38px] shrink-0 rounded-full border px-3.5 text-sm font-bold", cur === i ? "border-transparent bg-[var(--t700)] text-white" : "border-[var(--t075)] text-[var(--t700)] dark:border-border")}>
                {s} <span className="opacity-75">{ad(yesOf(i))}/{ad(items.length)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {students[cur] && items.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-extrabold">{students[cur]}</p>
            <button
              type="button"
              onClick={() => {
                const name = students[cur];
                const next = Object.fromEntries(Object.entries(marks).filter(([k]) => !k.startsWith(`${name}::`)));
                setMarks(next);
                setStudents(students.filter((_, j) => j !== cur));
                setCur(0);
              }}
              className="text-sm font-bold text-muted-foreground"
            >
              حذف الطالب
            </button>
          </div>
          {items.map((it, i) => {
            const m = marks[key(cur, i)];
            return (
              <div key={it} className="flex items-center gap-2 rounded-[16px] border border-[var(--t075)] p-2 pr-3 dark:border-border">
                <span className="min-w-0 flex-1 text-[15px] leading-6">{it}</span>
                <button type="button" onClick={() => toggle(cur, i, "y")} aria-label="تحقق" aria-pressed={m === "y"} className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border", m === "y" ? "border-transparent bg-[#2E9E6A] text-white" : "border-[var(--t075)] text-[#2E9E6A] dark:border-border")}>
                  <Check className="h-5 w-5" strokeWidth={3} />
                </button>
                <button type="button" onClick={() => toggle(cur, i, "n")} aria-label="لم يتحقق" aria-pressed={m === "n"} className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border", m === "n" ? "border-transparent bg-[#D64545] text-white" : "border-[var(--t075)] text-[#D64545] dark:border-border")}>
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <Note>أضف طالبًا لتبدأ الرصد. تُحفظ القائمة على جهازك.</Note>
      )}

      {students.length > 1 && (
        <div>
          <Label>نسبة التحقق في الصف</Label>
          <div className="space-y-2">
            {items.map((it, i) => {
              const r = itemRate(i);
              return (
                <div key={it} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-bold">{it}</span>
                  <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--t075)]">
                    <span className="block h-full rounded-full bg-[var(--t700)]" style={{ width: `${(r ?? 0) * 100}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-left font-bold tabular-nums text-muted-foreground">{r === null ? "—" : pct(r)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ================== الدرجة المعيارية ==================

type ZTest = { name: string; scores: string; student: string };

export function ZScoreTool() {
  const [tests, setTests] = useState<ZTest[]>([
    { name: "الاختبار الأول", scores: "", student: "" },
    { name: "الاختبار الثاني", scores: "", student: "" },
  ]);
  const res = tests.map((t) => {
    const s = parseSingle(t.student);
    return s === null ? null : zScoreOf(parseScores(t.scores), s);
  });
  const set = (i: number, k: keyof ZTest, v: string) => setTests(tests.map((t, j) => (j === i ? { ...t, [k]: v } : t)));
  const both = res[0] && res[1];

  return (
    <div className="space-y-4">
      {tests.map((t, i) => (
        <div key={i} className="space-y-2 rounded-[18px] border border-[var(--t075)] p-3 dark:border-border">
          <input value={t.name} onChange={(e) => set(i, "name", e.target.value)} className={cn(inputCls, "font-bold")} aria-label="اسم الاختبار" />
          <textarea value={t.scores} onChange={(e) => set(i, "scores", e.target.value)} rows={2} placeholder="درجات الصف كله، مثال: ١٥ ١٨ ١٢ ٢٠ ١٧" className={cn(inputCls, "h-auto py-2 leading-7")} />
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm font-bold text-[var(--t600)]">درجة الطالب</span>
            <input value={t.student} onChange={(e) => set(i, "student", e.target.value)} inputMode="decimal" className={numCls} />
          </div>
          {res[i] && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Big label="الزائية" value={fx(res[i]!.z)} />
              <Big label="التائية" value={ad(Math.round(res[i]!.t))} />
              <Big label="المئينية" value={pct(res[i]!.percentile)} />
            </div>
          )}
          {res[i] && <p className="text-xs leading-5 text-muted-foreground">متوسط الصف {fx(res[i]!.mean, 1)}، والانحراف المعياري {fx(res[i]!.sd)}.</p>}
        </div>
      ))}
      {both ? (
        <Note tone="good">
          {Math.abs(res[0]!.z - res[1]!.z) < 0.1
            ? "أداء الطالب متقارب في الاختبارين قياسًا إلى صفه."
            : `أداء الطالب أفضل في «${(res[0]!.z > res[1]!.z ? tests[0] : tests[1]).name}» قياسًا إلى صفه، وإن اختلفت الدرجتان الخام.`}
        </Note>
      ) : (
        <Note>الدرجة الزائية = (درجة الطالب − متوسط الصف) ÷ الانحراف المعياري. وبها تقارن أداءه في اختبارين مختلفين في الصعوبة. و«المئينية» نسبة من يقل عنه في صفه تقريبًا، بافتراض توزيع قريب من الاعتدالي.</Note>
      )}
    </div>
  );
}

// ================== تحليل البدائل ==================

const VERDICT: Record<DistractorVerdict, { word: string; tone: "good" | "fair" | "weak" }> = {
  "key-good": { word: "الإجابة الصحيحة تميّز جيدًا", tone: "good" },
  "key-weak": { word: "الإجابة الصحيحة تميّز ضعيفًا", tone: "fair" },
  "key-neg": { word: "اختارها الأضعف أكثر: راجع المفتاح", tone: "weak" },
  dead: { word: "لم يختره أحد: بديل غير فعّال", tone: "fair" },
  reverse: { word: "جذب الأقوياء أكثر: راجع صياغته", tone: "weak" },
  good: { word: "بديل فعّال", tone: "good" },
};

export function DistractorTool() {
  const [key, setKey] = useState(0);
  const [up, setUp] = useState(["", "", "", ""]);
  const [lo, setLo] = useState(["", "", "", ""]);
  const num = (a: string[]) => a.map((x) => parseSingle(x) ?? 0);
  const res = distractorsOf(key, num(up), num(lo));
  const toneCls = { good: "text-[#1F7A4D]", fair: "text-[#9A6A12]", weak: "text-destructive" };

  return (
    <div className="space-y-4">
      <div>
        <Label>الإجابة الصحيحة</Label>
        <div className="grid grid-cols-4 gap-2">
          {OPTION_LETTERS.slice(0, 4).map((l, i) => (
            <button key={l} type="button" onClick={() => setKey(i)} className={cn("min-h-[42px] rounded-[14px] border font-extrabold", key === i ? "border-transparent bg-[var(--t700)] text-white" : "border-[var(--t075)] text-[var(--t700)] dark:border-border")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>كم طالبًا اختار كل بديل؟</Label>
        <div className="space-y-2">
          <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 text-center text-xs font-bold text-muted-foreground">
            <span />
            <span>المجموعة العليا</span>
            <span>المجموعة الدنيا</span>
          </div>
          {OPTION_LETTERS.slice(0, 4).map((l, i) => (
            <div key={l} className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2">
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-full font-extrabold", key === i ? "bg-[var(--t700)] text-white" : "bg-[var(--t050)] text-[var(--t700)] dark:bg-muted")}>{l}</span>
              <input value={up[i]} onChange={(e) => setUp(up.map((x, j) => (j === i ? e.target.value : x)))} inputMode="numeric" placeholder="٠" className={numCls} />
              <input value={lo[i]} onChange={(e) => setLo(lo.map((x, j) => (j === i ? e.target.value : x)))} inputMode="numeric" placeholder="٠" className={numCls} />
            </div>
          ))}
        </div>
      </div>
      {res ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Big label="معامل الصعوبة" value={fx(res.p)} />
            <Big label="معامل التمييز" value={fx(res.d)} />
          </div>
          <div className="divide-y divide-[var(--t075)] rounded-[18px] border border-[var(--t075)] dark:divide-border dark:border-border">
            {res.rows.map((r, i) => (
              <p key={i} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                <span className="w-5 shrink-0 font-extrabold">{OPTION_LETTERS[i]}</span>
                <span className={cn("min-w-0 flex-1 font-bold", toneCls[VERDICT[r.verdict].tone])}>{VERDICT[r.verdict].word}</span>
              </p>
            ))}
          </div>
        </div>
      ) : (
        <Note>رتّب أوراق الطلاب حسب الدرجة الكلية، وخذ أعلى ٢٧٪ وأدنى ٢٧٪ منها، ثم عُدّ من اختار كل بديل في هذا السؤال. البديل الجيد يجذب الأضعف أكثر من الأقوى.</Note>
      )}
    </div>
  );
}

// ================== ثبات الاختبار ==================

export function ReliabilityTool() {
  const [k, setK] = useState("");
  const [raw, setRaw] = useState("");
  const items = parseSingle(k) ?? 0;
  const scores = parseScores(raw);
  const res = kr21Of(Math.round(items), scores);

  return (
    <div className="space-y-4">
      <div>
        <Label>عدد أسئلة الاختبار (كل سؤال بدرجة واحدة)</Label>
        <input value={k} onChange={(e) => setK(e.target.value)} inputMode="numeric" placeholder="مثال: ٢٠" className={numCls} />
      </div>
      <div>
        <Label>الدرجات الكلية للطلاب</Label>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={3} placeholder="مثال: ١٥ ١٨ ١٢ ٢٠ ١٧ ٩ ١٤" className={cn(inputCls, "h-auto py-2 leading-7")} />
        {scores.length > 0 && <p className="mt-1 text-xs font-bold text-muted-foreground">{ad(scores.length)} درجة</p>}
      </div>
      {res ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Big label="معامل الثبات" value={fx(res.r)} />
            <Big label="المتوسط" value={fx(res.mean, 1)} />
            <Big label="التباين" value={fx(res.variance, 1)} />
          </div>
          <Note tone={res.tone}>
            <b>{res.word}.</b> {res.note}
          </Note>
          <p className="text-xs leading-5 text-muted-foreground">يُحسب بمعادلة كودر ريتشاردسون ٢١، وهي تعطي تقديرًا أقل قليلًا من الحقيقي إذا اختلفت صعوبة الأسئلة كثيرًا.</p>
        </div>
      ) : (
        (k || raw) && <Note tone="fair">أدخل عدد الأسئلة، وثلاث درجات على الأقل، ولا تزيد أي درجة على عدد الأسئلة.</Note>
      )}
    </div>
  );
}
