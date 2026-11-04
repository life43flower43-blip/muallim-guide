// أفكار تربوية شائعة: صحيحة أم خاطئة؟ صفحة تفاعلية من بنك المفاهيم الخاطئة في التطبيق
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/public-bank";
import { MISCONCEPTIONS } from "@/lib/misconceptions";
import { ad } from "@/lib/arabic";
import { Crumbs, WithSidebar } from "@/components/site/Blocks";
import MythCard from "@/components/site/MythCard";

export const metadata: Metadata = {
  title: "مفاهيم تربوية خاطئة شائعة بين المعلمين: صحيحة أم خاطئة؟ | تربوي",
  description:
    "أفكار منتشرة بين المعلمين والطلاب عن التعلم والدماغ والتدريس، مثل أنماط التعلم و«نستخدم ١٠٪ من أدمغتنا». اختبر حكمك على كل عبارة، ثم اقرأ الصواب ودليله وما يعنيه في الصف.",
  alternates: { canonical: `${SITE_URL}/misconceptions` },
};

export default function Misconceptions() {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مفاهيم خاطئة شائعة" }]} />
      <header className="border-b border-[#E2ECE6] pb-6">
        <h1 className="font-display text-[28px] font-extrabold leading-[1.45] text-[#14302A] sm:text-[34px]">مفاهيم تربوية خاطئة شائعة: صحيحة أم خاطئة؟</h1>
        <p className="mt-2 text-[13px] font-bold text-[#136F5C]">اختبر نفسك</p>
        <p className="mt-2 max-w-3xl text-[16px] leading-8 text-[#4A6158]">
          {ad(MISCONCEPTIONS.length)} عبارة يتداولها المعلمون والطلاب عن التعلم والتدريس. احكم على كل عبارة أولًا، ثم اقرأ الصواب، ولماذا، وماذا يعني ذلك في صفك.
        </p>
      </header>
      <div className="mt-6 space-y-4">
        {MISCONCEPTIONS.map((m, i) => <MythCard key={m.id} m={m} n={ad(i + 1)} />)}
      </div>
      <div className="mt-8 rounded-2xl bg-[#0E3B32] p-5 text-white">
        <p className="font-display text-[19px] font-extrabold">تدرّب عليها في التطبيق</p>
        <p className="mt-1 text-[14px] leading-7 text-white/85">قسم «مفاهيم خاطئة شائعة» في تطبيق تربوي يحفظ إجاباتك ويعيد عليك ما أخطأت فيه.</p>
        <Link prefetch={false} href="/app?open=myths" className="mt-3 inline-block rounded-xl bg-[#7C5CFF] px-5 py-2.5 font-bold text-white">افتح القسم في التطبيق</Link>
      </div>
    </WithSidebar>
  );
}
