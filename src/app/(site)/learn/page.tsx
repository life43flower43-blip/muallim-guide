import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, courseChapters, courseList } from "@/lib/public-bank";
import { arCount, CHAPTER_FORMS, CONCEPT_FORMS } from "@/lib/arabic";
import { courseMeta } from "@/lib/site-nav";
import { Crumbs, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "محاور إعداد المعلم | تربوي",
  description: "محاور مجانية لطلاب كليات التربية والمتقدمين لاختبارات التوظيف والرخصة المهنية للمعلمين: النمو، وعلم النفس التربوي، والتعلم، والتقويم، وطرق التدريس، والتربية الخاصة.",
  alternates: { canonical: `${SITE_URL}/learn` },
};

export default function LearnIndex() {
  const courses = courseList().filter((c) => c.concepts.length > 0);
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "المحاور" }]} />
      <h1 className="font-display text-[28px] font-extrabold">محاور إعداد المعلم</h1>
      <p className="mt-2 leading-8 text-[#4D635A]">
        شرح مبسط لكل مفهوم تربوي مع أمثلة من الصف، مرتب في محاور وفصول كما في مقررات كليات التربية واختبارات التوظيف.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {courses.map((c) => {
          const m = courseMeta(c.id);
          return (
            <Link key={c.id} href={`/learn/${c.id}`} className="group overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
              <span className="relative block h-32">
                <img src={m.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-0" style={{ background: `linear-gradient(to top, ${m.color}F0, ${m.color}40)` }} />
                <span className="absolute bottom-3 start-4 font-display text-[22px] font-extrabold text-white">{m.short}</span>
              </span>
              <span className="block p-4">
                <span className="block font-bold leading-7 group-hover:text-[#136F5C]">{c.name}</span>
                <span className="mt-1 block text-[13px] text-[#6B8077]">{arCount(courseChapters(c.id).length, CHAPTER_FORMS)}، {arCount(c.concepts.length, CONCEPT_FORMS)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </WithSidebar>
  );
}
