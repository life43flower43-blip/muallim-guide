// أدلة الاختبارات التخصصية للرخصة المهنية: صفحة تجمع التخصصات المتاحة
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { SPECIALTIES } from "@/lib/specialties";
import { ad } from "@/lib/arabic";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "أدلة الاختبار التخصصي للرخصة المهنية: ١٢ تخصصًا بمجالاتها وخطة مذاكرتها | تربوي",
  description: "دليل لكل اختبار تخصصي في الرخصة المهنية للمعلمين: مجالات التخصص، وما تركز عليه في المذاكرة، وأخطاء شائعة، وروابط للأدلة المنشورة.",
  alternates: { canonical: `${SITE_URL}/specialized` },
};

export default function Specialized() {
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/license-guide", label: "دليل الرخصة" }, { label: "الاختبارات التخصصية" }]} />
      <PageHero
        kicker="الرخصة المهنية في السعودية"
        title="أدلة الاختبار التخصصي"
        color="#3A55A4"
        sub="بعد الاختبار التربوي العام يأتي اختبار تخصصك. لكل تخصص هنا مجالاته، وما تركز عليه في المذاكرة، وأخطاء شائعة، وروابط للأدلة المنشورة."
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {SPECIALTIES.map((s) => (
          <li key={s.slug}>
            <Link href={`/specialized/${s.slug}`} className="flex h-full items-center gap-4 rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
              <span className="h-12 w-1.5 shrink-0 rounded-full bg-[#136F5C]" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] font-extrabold text-[#14302A]">{s.name}</span>
                <span className="mt-0.5 block text-[13.5px] leading-6 text-[#5B7268]">{ad(s.domains.length)} مجالات، وخطة مذاكرة، وأخطاء شائعة</span>
              </span>
              <ChevronLeft className="h-5 w-5 shrink-0 text-[#B5C6BE]" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-xl bg-[#F3F7F5] p-4 text-[14px] leading-7 text-[#3A5249]">
        نضيف تخصصات أخرى تباعًا. وعدد أسئلة الاختبار التخصصي يختلف من تخصص لآخر، وتذكر المصادر المنشورة أنه بين ٦٠ و٨٨ سؤالًا. والمرجع الرسمي هو <a href="https://www.etec.gov.sa" target="_blank" rel="noopener noreferrer" className="font-bold text-[#136F5C] underline">هيئة تقويم التعليم والتدريب</a>.
      </p>
    </WithSidebar>
  );
}
