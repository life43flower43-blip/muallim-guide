// الخرائط الذهنية التفاعلية: الأداة نفسها المستخدمة في التطبيق، داخل الموقع
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/public-bank";
import { Crumbs, PageHero } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "خرائط ذهنية تفاعلية للمحاور التربوية | تربوي",
  description: "خرائط ذهنية تفاعلية لكل محور وفصل: نظريات التعلم، والنمو، والتقويم، وطرق التدريس. اضغط أي فرع ليتفرع، وتنقّل بين المفاهيم.",
  alternates: { canonical: `${SITE_URL}/mind-maps` },
};

export default function MindMaps() {
  return (
    <div>
      <Crumbs items={[{ label: "الخرائط الذهنية" }]} />
      <PageHero kicker="راجع فصلًا كاملًا في دقائق" title="الخرائط الذهنية التفاعلية" color="#1F6FA8" sub="اختر المحور من الأعلى، ثم اضغط أي فرع ليتفرع. يمكنك التكبير والتصغير وسحب الخريطة." />
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
        <iframe src="/tools/mindmap.html?embed=1&theme=light" title="الخرائط الذهنية التفاعلية" className="block h-[78vh] min-h-[520px] w-full" loading="lazy" />
      </div>
    </div>
  );
}
