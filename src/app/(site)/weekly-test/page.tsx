// اختبار الأسبوع: عشرون سؤالًا جديدة تتغير تلقائيًا كل أحد بتوقيت مكة
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { pickQuestions } from "@/lib/site-nav";
import { todayISO, arDate } from "@/lib/articles";
import { ad } from "@/lib/arabic";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";
import QuizRunner from "@/components/site/QuizRunner";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "اختبار الأسبوع للرخصة المهنية: عشرون سؤالًا تربويًا تتجدد كل أحد | تربوي",
  description: "اختبار تربوي أسبوعي مجاني من عشرين سؤالًا بمستوى الاختبار التربوي العام للرخصة المهنية، يتجدد كل يوم أحد، مع تصحيح فوري وتقرير لنقاط الضعف.",
  alternates: { canonical: `${SITE_URL}/weekly-test` },
};

/** رقم الأسبوع وتاريخ الأحد الذي بدأ فيه، بتوقيت مكة */
function thisWeek() {
  const today = new Date(todayISO() + "T12:00:00Z");
  const sunday = new Date(today);
  sunday.setUTCDate(today.getUTCDate() - today.getUTCDay());
  const week = Math.floor(sunday.getTime() / (7 * 86400000));
  const next = new Date(sunday);
  next.setUTCDate(sunday.getUTCDate() + 7);
  return { week, from: sunday.toISOString().slice(0, 10), next: next.toISOString().slice(0, 10) };
}

export default function WeeklyTest() {
  const w = thisWeek();
  const questions = pickQuestions(20, w.week);
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/license-guide", label: "دليل الرخصة" }, { label: "اختبار الأسبوع" }]} />
      <PageHero kicker="يتجدد كل أحد" title="اختبار الأسبوع" color="#7A4E9C" sub="عشرون سؤالًا تربويًا جديدة كل أسبوع من محاور الاختبار التربوي العام. حلّها، واعرف نقاط ضعفك، وعُد الأحد القادم لاختبار جديد.">
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EEF5F1] px-3 py-1 text-[#136F5C] text-[13px] font-bold">
          <CalendarDays className="h-4 w-4" /> أسبوع {arDate(w.from)}، والاختبار التالي {arDate(w.next)}
        </p>
      </PageHero>
      <div className="mt-6">
        <QuizRunner key={w.week} questions={questions} title={`نتيجة اختبار الأسبوع (${ad(questions.length)} سؤالًا)`} />
      </div>
      <p className="mt-6 text-[14px] leading-7 text-[#4A6158]">
        تريد التدرب أكثر؟ جرّب <Link href="/practice-test" className="font-bold text-[#136F5C]">نموذج الاختبار</Link>، أو ذاكر بـ<Link href="/standards" className="font-bold text-[#136F5C]">المعايير العشرة</Link>.
      </p>
    </WithSidebar>
  );
}
