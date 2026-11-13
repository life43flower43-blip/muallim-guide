"use client";

// اختبار تفاعلي في الموقع: سؤال في كل مرة، وتصحيح فوري مع التفسير، ثم النتيجة ودعوة إلى التطبيق
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, RotateCcw, Smartphone, ChevronLeft } from "lucide-react";
import type { SiteQ } from "@/lib/site-nav";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ad = (n: number) => String(n).replace(/\d/g, (d) => AR[+d]);
const LETTERS = ["أ", "ب", "ج", "د", "هـ"];

// كل محور والمعيار الذي يُذاكر به في صفحة المعايير العشرة
const STD: Record<string, { slug: string; t: string }> = {
  M1: { slug: "learner-learning", t: "المعرفة بالمتعلم وكيفية تعلمه" },
  M2: { slug: "learner-learning", t: "المعرفة بالمتعلم وكيفية تعلمه" },
  M3: { slug: "learner-learning", t: "المعرفة بالمتعلم وكيفية تعلمه" },
  SE1: { slug: "learning-environment", t: "تهيئة بيئات تعلم تفاعلية وداعمة" },
  M4: { slug: "assessment", t: "التقويم" },
  M5: { slug: "teaching-methods", t: "المعرفة بطرق التدريس العامة" },
  C1: { slug: "planning-teaching", t: "التخطيط للتدريس وتنفيذه" },
  F1: { slug: "ethics-identity", t: "القيم وأخلاقيات المهنة" },
};
const courseOf = (href: string) => href.split("/")[2] ?? "";

/** تقرير المحاور بعد الاختبار: نتيجة كل محور، وروابط لمذاكرة الأضعف، والأسئلة التي أخطأ فيها */
function Report({ questions, answers }: { questions: SiteQ[]; answers: boolean[] }) {
  const by = new Map<string, { name: string; cid: string; right: number; total: number }>();
  questions.forEach((q, k) => {
    const cid = courseOf(q.href);
    const r = by.get(cid) ?? { name: q.course, cid, right: 0, total: 0 };
    r.total += 1;
    if (answers[k]) r.right += 1;
    by.set(cid, r);
  });
  const rows = [...by.values()].sort((a, b) => a.right / a.total - b.right / b.total);
  const weak = rows.filter((r) => r.right / r.total < 0.6);
  const wrong = questions.filter((_, k) => !answers[k]).slice(0, 6);
  const stds = weak.slice(0, 4).map((r) => STD[r.cid]).filter((x, i, a) => x && a.findIndex((y) => y?.slug === x.slug) === i);
  if (rows.length < 2) return null;
  return (
    <div className="mt-5 text-right">
      <p className="text-[15px] font-extrabold text-[#14302A]">نتيجتك في كل محور</p>
      <ul className="mt-2 space-y-2.5">
        {rows.map((r) => {
          const pct = Math.round((r.right / r.total) * 100);
          const color = pct >= 80 ? "#1E7B4A" : pct >= 60 ? "#B7791F" : "#C0392B";
          return (
            <li key={r.cid}>
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="font-bold text-[#2E4A42]">{r.name}</span>
                <span className="font-bold" style={{ color }}>{ad(r.right)} من {ad(r.total)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EEF3F0]"><div className="h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%`, background: color }} /></div>
            </li>
          );
        })}
      </ul>

      {weak.length > 0 && (
        <div className="mt-5 rounded-xl bg-[#FFF6E5] p-4">
          <p className="text-[14.5px] font-extrabold text-[#5A3A0A]">ابدأ مذاكرتك من هنا</p>
          <p className="mt-2 text-[12.5px] font-bold text-[#8A6A3A]">المحاور الأضعف</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {weak.slice(0, 4).map((r) => (
              <Link key={r.cid} href={`/learn/${r.cid}`} className="rounded-lg bg-white px-2.5 py-1 text-[13.5px] font-bold text-[#136F5C]">{r.name}</Link>
            ))}
          </div>
          {stds.length > 0 && (
            <>
              <p className="mt-3 text-[12.5px] font-bold text-[#8A6A3A]">المعايير التي تذاكر بها</p>
              <ul className="mt-1 space-y-1">
                {stds.map((x) => (
                  <li key={x.slug}><Link href={`/standards#${x.slug}`} className="flex items-center gap-1 text-[14px] font-bold leading-7 text-[#136F5C]"><ChevronLeft className="h-4 w-4 shrink-0" />{x.t}</Link></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {wrong.length > 0 && (
        <div className="mt-5">
          <p className="text-[14.5px] font-extrabold text-[#14302A]">راجع شرح ما أخطأت فيه</p>
          <ul className="mt-1 divide-y divide-[#EEF3F0]">
            {wrong.map((q) => (
              <li key={q.id}>
                <Link href={q.href} className="flex items-center gap-2 py-2.5 text-[14px] text-[#14302A] hover:text-[#136F5C]">
                  <XCircle className="h-4 w-4 shrink-0 text-[#C0392B]" />
                  <span className="min-w-0 flex-1">{q.concept}</span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-[#B5C6BE]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function QuizRunner({ questions, title, onConceptPage = false }: { questions: SiteQ[]; title?: string; onConceptPage?: boolean }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const done = answers.length === questions.length && picked === null;
  const q = questions[i];

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
  };
  const next = () => {
    setAnswers((a) => [...a, picked === q.correct]);
    setPicked(null);
    setI((x) => x + 1);
  };
  // الإجابة الصحيحة تنقل مباشرة إلى السؤال التالي دون عرض التفسير
  const right = picked !== null && picked === q?.correct;
  useEffect(() => {
    if (!right || questions.length === 1) return;
    const t = setTimeout(next, 700);
    return () => clearTimeout(t);
  }, [right]);
  const restart = () => { setI(0); setPicked(null); setAnswers([]); };

  if (done) {
    const right = answers.filter(Boolean).length;
    const pct = Math.round((right / questions.length) * 100);
    const msg = pct >= 80 ? "مستوى ممتاز. أنت قريب من الجاهزية." : pct >= 60 ? "مستوى جيد. بقي القليل لتطمئن." : "بداية جيدة. التدريب المنتظم يصنع الفرق.";
    return (
      <div className="rounded-2xl border border-[#E2ECE6] bg-white p-6 text-center">
        <p className="text-[14px] font-bold text-[#6B8077]">{title ?? "نتيجتك"}</p>
        <p className="mt-2 font-display text-[48px] font-extrabold text-[#136F5C]"><bdi dir="rtl">{ad(pct)}٪</bdi></p>
        <p className="text-[15px] text-[#4D635A]">أجبت إجابة صحيحة عن {ad(right)} من {ad(questions.length)}</p>
        <p className="mt-3 font-bold text-[#14302A]">{msg}</p>
        <Report questions={questions} answers={answers} />
        <div className="mt-5 rounded-2xl bg-[#136F5C] p-5 text-white">
          <p className="font-display text-[18px] font-extrabold">تابع في تطبيق تربوي</p>
          <p className="mt-1 text-[14px] leading-7 text-white/85">اختبار محاكٍ كامل بزمن حقيقي، وتحليل لكل محور، ومراجعة لأخطائك في موعدها. مجانًا.</p>
          <Link prefetch={false} href="/app?open=examsim" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#7C5CFF] px-5 py-2.5 font-bold text-white"><Smartphone className="h-5 w-5" /> ابدأ اختبار المحاكاة</Link>
        </div>
        <button type="button" onClick={restart} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#136F5C]"><RotateCcw className="h-4 w-4" /> أعد المحاولة</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E2ECE6] bg-white p-5">
      <div className="flex items-center justify-between text-[13px] font-bold text-[#6B8077]">
        <span>{questions.length === 1 ? title ?? "سؤال" : `السؤال ${ad(i + 1)} من ${ad(questions.length)}`}</span>
        <span className="rounded-full bg-[#EEF5F1] px-2.5 py-0.5 text-[#136F5C]">{q.course}</span>
      </div>
      <div className={`mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF3F0] ${questions.length === 1 ? "hidden" : ""}`}>
        <div className="h-full rounded-full bg-[#136F5C] transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>
      <p className="mt-4 text-[17px] font-bold leading-8 text-[#14302A]">{q.q}</p>
      <ul className="mt-4 space-y-2.5">
        {q.options.map((o, k) => {
          const state = picked === null ? "idle" : k === q.correct ? "right" : k === picked ? "wrong" : "dim";
          return (
            <li key={k}>
              <button
                type="button"
                onClick={() => choose(k)}
                disabled={picked !== null}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-right text-[15px] leading-7 transition ${
                  state === "right" ? "border-[#1E7B4A] bg-[#EAF6EF]" : state === "wrong" ? "border-[#C0392B] bg-[#FDEDEB]" : state === "dim" ? "border-[#EEF3F0] opacity-60" : "border-[#E2ECE6] hover:border-[#136F5C]"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${state === "right" ? "bg-[#1E7B4A] text-white" : state === "wrong" ? "bg-[#C0392B] text-white" : "bg-[#EEF5F1] text-[#136F5C]"}`}>
                  {state === "right" ? <CheckCircle2 className="h-4 w-4" /> : state === "wrong" ? <XCircle className="h-4 w-4" /> : LETTERS[k]}
                </span>
                <span className="flex-1">{o}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {right && questions.length > 1 && <p className="mt-4 text-center font-bold text-[#1E7B4A]">إجابة صحيحة ✓</p>}
      {picked !== null && !(right && questions.length > 1) && (
        <div className={`mt-4 rounded-xl p-4 ${picked === q.correct ? "bg-[#EAF6EF]" : "bg-[#FFF6E5]"}`}>
          <p className="font-bold text-[#14302A]">{picked === q.correct ? "إجابة صحيحة" : "إجابة غير صحيحة، والصحيحة مظللة بالأخضر"}</p>
          {!right && <p className="mt-1 text-[14px] leading-7 text-[#3A5249]">{q.reason}</p>}
          {!right && !onConceptPage && <Link href={q.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-[#136F5C]">اقرأ شرح «{q.concept}» <ChevronLeft className="h-4 w-4" /></Link>}
          {questions.length === 1 ? (
            <Link prefetch={false} href="/app?tab=practice" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#136F5C] py-3 font-bold text-white"><Smartphone className="h-5 w-5" /> تدرّب على أسئلة أكثر في التطبيق</Link>
          ) : (
            <button type="button" onClick={next} className="mt-3 block w-full rounded-xl bg-[#136F5C] py-3 font-bold text-white">{i + 1 === questions.length ? "اعرض النتيجة" : "السؤال التالي"}</button>
          )}
        </div>
      )}
    </div>
  );
}
