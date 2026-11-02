// نموذج اختبار تربوي تفاعلي: عشرون سؤالًا من المحاور مع تصحيح فوري وتفسير
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/public-bank";
import { pickQuestions } from "@/lib/site-nav";
import { Crumbs, WithSidebar, PageHero } from "@/components/site/Blocks";
import QuizRunner from "@/components/site/QuizRunner";

export const metadata: Metadata = {
  title: "نموذج اختبار الرخصة المهنية للمعلمين (الجزء التربوي) تفاعلي مع الحل | تربوي",
  description:
    "اختبر نفسك في عشرين سؤالًا تربويًا بمستوى اختبارات الرخصة المهنية والتوظيف للمعلمين: النمو، وعلم النفس التربوي، والتعلم، والتقويم، وطرق التدريس، مع تصحيح فوري وتفسير لكل إجابة.",
  alternates: { canonical: `${SITE_URL}/practice-test` },
};

export default function PracticeTest() {
  const questions = pickQuestions(20);
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "نموذج اختبار تربوي" }]} />
      <PageHero kicker="اختبر نفسك" title="نموذج اختبار تربوي تفاعلي مع الحل" color="#1F6FA8" sub="عشرون سؤالًا من محاور الجزء التربوي العام في اختبارات الرخصة المهنية والتوظيف. اختر إجابتك، وسترى فورًا إن كانت صحيحة، ولماذا.">
        <ul className="mt-4 flex flex-wrap gap-2 text-[13px] font-bold">
          {["٢٠ سؤالًا", "تصحيح فوري", "تفسير لكل إجابة", "دون تسجيل"].map((t) => (
            <li key={t} className="rounded-full bg-white/15 px-3 py-1">{t}</li>
          ))}
        </ul>
      </PageHero>
      <div className="mt-6">
        <QuizRunner questions={questions} title="نتيجة نموذج الاختبار" />
      </div>
      <section className="mt-8 rounded-2xl border border-[#E2ECE6] bg-white p-5 leading-8 text-[#3A5249]">
        <h2 className="font-display text-[19px] font-extrabold text-[#14302A]">عن هذا النموذج</h2>
        <p className="mt-2">
          الأسئلة من بنك تربوي، وليست أسئلة الاختبار الرسمي. لكنها تغطي المحاور المشتركة في أغلب اختبارات المعلمين في البلاد العربية. لمعرفة المحاور وأوزانها في بلدك، راجع دليل الاختبار الرسمي.
        </p>
        <p className="mt-2">
          للتدرب على اختبار كامل بزمن حقيقي وأقسام موزعة على المحاور، استخدم <Link href="/sections/exam-simulator" className="font-bold text-[#136F5C]">اختبار المحاكاة</Link> في تطبيق تربوي، واقرأ <Link href="/license-guide" className="font-bold text-[#136F5C]">دليل الاستعداد لاختبار الرخصة</Link>.
        </p>
      </section>
    </WithSidebar>
  );
}
