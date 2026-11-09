// فهرس المواضيع التربوية
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/public-bank";
import { TOPICS, topicArticles, topicConcepts } from "@/lib/topics";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "مواضيع تربوية للمعلمين: شرح ومقالات وأسئلة تدريب | تربوي",
  description: "أهم المواضيع التربوية في مكان واحد: التعلم النشط، وإدارة الصف، وتصنيف بلوم، والتقويم، ونظريات التعلم، والرخصة المهنية، ولكل موضوع شرح ومقالات وأسئلة.",
  alternates: { canonical: `${SITE_URL}/topics` },
};

export default function Topics() {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مواضيع تربوية" }]} />
      <PageHero kicker="مواضيع" title="مواضيع تربوية للمعلمين" sub="لكل موضوع شرح مختصر، ومقالاته، ومفاهيمه المشروحة، وأسئلة تدريب عليه." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <Link key={t.slug} href={`/topics/${t.slug}`} className="rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
            <h2 className="font-display text-[18px] font-extrabold text-[#0E3B32]">{t.name}</h2>
            <p className="mt-1.5 text-[14px] leading-7 text-[#3A5249]">{t.description}</p>
            <p className="mt-2 text-[12px] font-bold text-[#136F5C]">{topicArticles(t).length} مقال · {topicConcepts(t).length} مفهوم</p>
          </Link>
        ))}
      </div>
    </WithSidebar>
  );
}
