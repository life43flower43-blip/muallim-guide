import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/public-bank";
import { APP_SECTIONS } from "@/lib/site-nav";
import { Crumbs, WithSidebar, PageHero } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "أقسام تطبيق تربوي | اختبارات محاكية ومواقف صفية وأدوات للمعلم",
  description: "تعرّف على أقسام تطبيق تربوي المجاني: اختبار المحاكاة، واختبر نفسك، والمفاهيم التربوية، والمواقف الصفية، ومهارات التدريس، وخطة الدرس، وأدوات القياس، والخرائط الذهنية.",
  alternates: { canonical: `${SITE_URL}/sections` },
};

export default function Sections() {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "أقسام التطبيق" }]} />
      <PageHero kicker="تطبيق تربوي" title="أقسام التطبيق" color="#3A55A4" sub="كل ما في التطبيق مجاني ويفتح من المتصفح. اختر القسم لتعرف ما فيه، ثم افتحه مباشرة." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {APP_SECTIONS.map((s) => (
          <article key={s.slug} className="flex flex-col overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
            <Link href={`/sections/${s.slug}`} tabIndex={-1} aria-hidden="true"><img src={s.img} alt="" loading="lazy" className="h-40 w-full object-cover" /></Link>
            <div className="flex flex-1 flex-col p-4">
              <h2 className="font-display text-[19px] font-extrabold"><Link href={`/sections/${s.slug}`} className="hover:text-[#136F5C]">{s.title}</Link></h2>
              <p className="mt-1.5 leading-7 text-[#4D635A]">{s.lead}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Link prefetch={false} href={`/app?open=${s.open}`} className="rounded-xl bg-[#136F5C] px-4 py-2 text-[14px] font-bold text-white">افتح في التطبيق</Link>
                <Link href={`/sections/${s.slug}`} className="rounded-xl border border-[#D4E3DA] px-4 py-2 text-[14px] font-bold text-[#136F5C]">التفاصيل</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </WithSidebar>
  );
}
