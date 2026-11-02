// الخرائط الذهنية التفاعلية: الأداة نفسها المستخدمة في التطبيق، داخل الموقع
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/public-bank";
import { Crumbs } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "خرائط ذهنية تفاعلية للمحاور التربوية | تربوي",
  description: "خرائط ذهنية تفاعلية لكل محور وفصل: نظريات التعلم، والنمو، والتقويم، وطرق التدريس. اضغط أي فرع ليتفرع، وتنقّل بين المفاهيم.",
  alternates: { canonical: `${SITE_URL}/mind-maps` },
};

export default function MindMaps() {
  return (
    <div>
      <Crumbs items={[{ label: "الخرائط الذهنية" }]} />
      <h1 className="font-display text-[28px] font-extrabold">الخرائط الذهنية التفاعلية</h1>
      <p className="mt-2 leading-8 text-[#4D635A]">اختر المحور من الأعلى، ثم اضغط أي فرع ليتفرع. يمكنك التكبير والتصغير وسحب الخريطة.</p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
        <iframe src="/tools/mindmap.html?embed=1&theme=light" title="الخرائط الذهنية التفاعلية" className="block h-[78vh] min-h-[520px] w-full" loading="lazy" />
      </div>
    </div>
  );
}
