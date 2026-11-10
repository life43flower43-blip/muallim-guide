// بنك أسئلة الرخصة المهنية محلول: أسئلة على نمط الجزء التربوي العام، ظاهرة كلها مع الإجابة والشرح
// (يبحث المعلمون عن «أسئلة محلولة» و«مع الحل» و«PDF»؛ والمنافسون ملفات PDF قديمة أو تطبيقات مدفوعة)
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, SITE_NAME, publicBank } from "@/lib/public-bank";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";
import PrintButton from "@/components/site/PrintButton";
import type { Question } from "@/lib/types";

export const revalidate = 86400;

const PER_COURSE = 6;
const AR = "٠١٢٣٤٥٦٧٨٩";
const ad = (n: number) => String(n).replace(/\d/g, (d) => AR[+d]);
const LETTERS = ["أ", "ب", "ج", "د", "هـ"];

function pick() {
  const b = publicBank();
  const conceptCourse = new Map(b.concepts.map((c) => [c.id, c.courseId]));
  const conceptOf = new Map(b.concepts.map((c) => [c.id, c]));
  return Object.entries(b.courses)
    .map(([id, name]) => {
      // أسئلة اختيار من متعدد لها شرح كافٍ، موزعة على مفاهيم مختلفة
      const seen = new Set<string>();
      const qs: Question[] = [];
      for (const q of b.questions) {
        if (qs.length >= PER_COURSE) break;
        if (conceptCourse.get(q.conceptId) !== id || q.type !== "mcq" || seen.has(q.conceptId) || (q.reason ?? "").length < 60) continue;
        seen.add(q.conceptId);
        qs.push(q);
      }
      return { id, name, qs };
    })
    .filter((x) => x.qs.length > 0)
    .map((x) => ({ ...x, items: x.qs.map((q) => ({ q, concept: conceptOf.get(q.conceptId) })) }))
    .map((x, gi, all) => {
      const start = all.slice(0, gi).reduce((s, g) => s + g.items.length, 0);
      return { ...x, items: x.items.map((it, k) => ({ ...it, num: start + k + 1 })) };
    });
}

export const metadata: Metadata = {
  title: { absolute: "بنك أسئلة الرخصة المهنية للمعلمين محلول: أسئلة التربوي العام مع الإجابة والشرح" },
  description:
    "أسئلة تدريبية محلولة على نمط اختبار الرخصة المهنية للمعلمين (التربوي العام)، مقسمة حسب المحاور، ولكل سؤال الإجابة الصحيحة وسببها. احفظها PDF، أو تدرب على أكثر من ٧٥٠٠ سؤال في التطبيق مجانًا.",
  keywords: ["بنك أسئلة الرخصة المهنية", "أسئلة الرخصة المهنية محلولة", "أسئلة الرخصة المهنية مع الحل", "أسئلة التربوي العام", "الرخصة المهنية للمعلمين pdf", "اختبار الرخصة المهنية"],
  alternates: { canonical: `${SITE_URL}/license-questions` },
};

export default function LicenseQuestions() {
  const groups = pick();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  // بيانات «Quiz» المنظمة لأسئلة التدريب التعليمية
  const ld = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "بنك أسئلة الرخصة المهنية للمعلمين محلول",
    about: { "@type": "Thing", name: "اختبار الرخصة المهنية للمعلمين" },
    educationalLevel: "مهني",
    inLanguage: "ar",
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    hasPart: groups.flatMap((g) =>
      g.items.map(({ q }) => ({
        "@type": "Question",
        eduQuestionType: "Multiple choice",
        text: q.question,
        suggestedAnswer: q.options.filter((o) => !o.isCorrect).map((o) => ({ "@type": "Answer", text: o.text })),
        acceptedAnswer: { "@type": "Answer", text: q.correct, answerExplanation: { "@type": "Comment", text: q.reason } },
      }))
    ),
  };
  return (
    <WithSidebar>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Crumbs items={[{ href: "/license-guide", label: "الرخصة المهنية" }, { label: "بنك أسئلة محلول" }]} />
      <PageHero kicker="أسئلة محلولة" title="بنك أسئلة الرخصة المهنية للمعلمين محلول" sub={`${ad(total)} سؤالًا تدريبيًا على نمط الجزء التربوي العام، مقسمة حسب المحاور، ولكل سؤال الإجابة الصحيحة وسببها.`}>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PrintButton />
          <Link href="/app?open=bank" className="inline-flex items-center rounded-full bg-[#136F5C] px-4 py-2 text-[14px] font-extrabold text-white print:hidden">تدرّب على ٧٥٠٠+ سؤال في التطبيق</Link>
        </div>
      </PageHero>

      <p className="mt-5 rounded-xl bg-[#FFF8E6] p-3 text-[13.5px] leading-7 text-[#5B4A16]">
        هذه أسئلة تدريبية كتبها فريق {SITE_NAME} على نمط الاختبار، وليست أسئلة اختبار سابقة. حاول الإجابة قبل فتح الحل.
      </p>

      <div className="mt-6 space-y-9">
        {groups.map((g) => (
          <section key={g.id}>
            <h2 className="font-display text-[21px] font-extrabold text-[#0E3B32]">{g.name}</h2>
            <ol className="mt-3 space-y-3">
              {g.items.map(({ q, concept, num }) => {
                return (
                  <li key={q.id} className="break-inside-avoid rounded-2xl border border-[#E2ECE6] bg-white p-4">
                    <p className="text-[15.5px] font-bold leading-8 text-[#14302A]">
                      <span className="me-1 text-[#136F5C]">{ad(num)}.</span> {q.question}
                    </p>
                    <ul className="mt-2 space-y-1 text-[14.5px] leading-7 text-[#2C4A40]">
                      {q.options.map((o, i) => (
                        <li key={i}>
                          <span className="font-bold">{LETTERS[i]})</span> {o.text}
                        </li>
                      ))}
                    </ul>
                    <details className="mt-3 rounded-xl bg-[#F3F8F5] p-3 open:bg-[#EEF5F1] print:block" open={false}>
                      <summary className="cursor-pointer text-[14px] font-extrabold text-[#136F5C]">الإجابة الصحيحة والشرح</summary>
                      <p className="mt-2 text-[14.5px] font-bold leading-7 text-[#0E3B32]">✓ {LETTERS[q.options.findIndex((o) => o.isCorrect)]}) {q.correct}</p>
                      <p className="mt-1 text-[14px] leading-7 text-[#3A5249]">{q.reason}</p>
                      {concept && (
                        <Link href={`/learn/${concept.courseId}/${concept.id}`} className="mt-1 inline-block text-[13px] font-bold text-[#136F5C] print:hidden">
                          اقرأ شرح «{concept.title}»
                        </Link>
                      )}
                    </details>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <section className="mt-9 rounded-2xl bg-[#0E3B32] p-6 text-white print:hidden">
        <h2 className="font-display text-[20px] font-extrabold">تريد أسئلة أكثر؟</h2>
        <p className="mt-2 text-[15px] leading-8 text-white/85">في التطبيق المجاني «اختبار محاكاة الرخصة المهنية»: أكثر من ٧٥٠٠ سؤال مرتبة بالمحاور، ومحاكي بوقت حقيقي، ومراجعة لأخطائك.</p>
        <Link href="/app?open=bank" className="mt-4 inline-block rounded-full bg-[#F3DC8E] px-5 py-2.5 text-[15px] font-extrabold text-[#3a2c05]">افتح بنك الأسئلة</Link>
      </section>
    </WithSidebar>
  );
}
