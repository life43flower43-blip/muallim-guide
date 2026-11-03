// صفحة تعريف بقسم من أقسام التطبيق، مع زر يفتحه مباشرة
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { APP_SECTIONS, sectionBySlug } from "@/lib/site-nav";
import { Crumbs, ShareRow, WithSidebar } from "@/components/site/Blocks";

export const dynamicParams = false;
export function generateStaticParams() {
  return APP_SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = sectionBySlug((await params).slug);
  if (!s) return {};
  return { title: `${s.title} | تطبيق تربوي`, description: s.lead, alternates: { canonical: `${SITE_URL}/sections/${s.slug}` } };
}

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = sectionBySlug((await params).slug);
  if (!s) notFound();
  const others = APP_SECTIONS.filter((x) => x.slug !== s.slug).slice(0, 4);
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/sections", label: "أقسام التطبيق" }, { label: s.title }]} />
      <article className="overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
        <img src={s.img} alt="" className="h-56 w-full object-cover sm:h-72" />
        <div className="space-y-6 p-5 sm:p-7">
          <h1 className="font-display text-[30px] font-extrabold">{s.title}</h1>
          <p className="text-[18px] leading-9 text-[#24403A]">{s.lead}</p>
          <section>
            <h2 className="mb-3 font-display text-[20px] font-extrabold">ماذا تجد في هذا القسم؟</h2>
            <ul className="space-y-3">
              {s.points.map((p) => (
                <li key={p} className="flex gap-3 leading-8"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#136F5C]" />{p}</li>
              ))}
            </ul>
          </section>
          <div className="rounded-xl bg-[#136F5C] p-5 text-white">
            <p className="font-display text-[19px] font-extrabold">جرّب {s.title} الآن</p>
            <p className="mt-1 text-[14px] leading-7 text-white/85">مجانًا ومن المتصفح، ودون تسجيل.</p>
            <Link prefetch={false} href={`/app?open=${s.open}`} className="mt-3 inline-block rounded-xl bg-[#7C5CFF] px-5 py-2.5 font-bold text-white">افتح {s.title}</Link>
          </div>
          <div className="border-t border-[#EEF3F0] pt-5"><ShareRow path={`/sections/${s.slug}`} title={`${s.title} في تطبيق تربوي`} /></div>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-[20px] font-extrabold">أقسام أخرى</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {others.map((o) => (
            <Link key={o.slug} href={`/sections/${o.slug}`} className="overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
              <img src={o.img} alt="" loading="lazy" className="h-24 w-full object-cover" />
              <p className="truncate px-3 py-2 text-center text-[14px] font-bold">{o.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </WithSidebar>
  );
}
