// موقف صفي: التصرف الشائع (التقليدي) وأثره، والتصرف المتقدم ولماذا ينجح
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDot, Smartphone } from "lucide-react";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { SIM_SCENARIOS, type SimOption, type SimRating } from "@/lib/sim";
import { Crumbs, ShareRow, WithSidebar } from "@/components/site/Blocks";

export const dynamicParams = false;
export function generateStaticParams() {
  return SIM_SCENARIOS.map((s) => ({ id: s.id.toLowerCase() }));
}
const find = (id: string) => SIM_SCENARIOS.find((s) => s.id.toLowerCase() === id);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const s = find((await params).id);
  if (!s) return {};
  return {
    title: `${s.title}: كيف يتصرف المعلم؟ | تربوي`,
    description: s.intro.slice(0, 150),
    alternates: { canonical: `${SITE_URL}/classroom-problems/${s.id.toLowerCase()}` },
  };
}

const GROUPS: { r: SimRating; title: string; sub: string; color: string; bg: string; Icon: typeof CheckCircle2 }[] = [
  { r: "poor", title: "التصرف التقليدي الشائع", sub: "ما يفعله كثيرون، وماذا يحدث بعده", color: "#C0392B", bg: "#FDEDEB", Icon: AlertTriangle },
  { r: "ok", title: "تصرف مقبول", sub: "يحل جزءًا من المشكلة", color: "#B7791F", bg: "#FFF6E5", Icon: CircleDot },
  { r: "good", title: "التصرف المتقدم", sub: "ما يفعله المعلم المتمكن، ولماذا ينجح", color: "#1E7B4A", bg: "#EAF6EF", Icon: CheckCircle2 },
];

function Option({ o, color }: { o: SimOption; color: string }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="font-bold leading-7" style={{ color }}>«{o.text}»</p>
      <p className="mt-2 text-[15px] leading-7 text-[#24403A]"><b>ماذا حدث: </b>{o.outcome}</p>
      <p className="mt-2 text-[15px] leading-7 text-[#3A5249]"><b>التحليل: </b>{o.insight}</p>
      {o.risks && <p className="mt-2 text-[14px] leading-7 text-[#6B5A3A]">{o.risks}</p>}
    </div>
  );
}

export default async function Problem({ params }: { params: Promise<{ id: string }> }) {
  const s = find((await params).id);
  if (!s) notFound();
  const start = s.nodes.start ?? Object.values(s.nodes)[0];
  const concepts = s.conceptIds.map((id) => publicBank().concepts.find((c) => c.id === id)).filter(Boolean);
  const others = SIM_SCENARIOS.filter((x) => x.id !== s.id).slice(0, 4);
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/classroom-problems", label: "مشكلات صفية" }, { label: s.title }]} />
      <article className="overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
        <header className="bg-[linear-gradient(135deg,#8A3B1F,#B4532A)] p-6 text-white">
          <p className="text-[13px] font-bold text-white/80">{s.stage}</p>
          <h1 className="mt-1 font-display text-[28px] font-extrabold leading-[1.5]">{s.title}</h1>
        </header>
        <div className="space-y-6 p-5 sm:p-7">
          <section>
            <h2 className="font-display text-[19px] font-extrabold">الموقف</h2>
            <p className="mt-2 text-[17px] leading-9 text-[#24403A]">{s.intro}</p>
            <p className="mt-3 rounded-xl border-s-4 border-[#B4532A] bg-[#FBF1EC] p-4 font-bold leading-8 text-[#5A2A14]">{start.text}</p>
          </section>

          {GROUPS.map((g) => {
            const opts = start.options.filter((o) => o.rating === g.r);
            if (!opts.length) return null;
            return (
              <section key={g.r} className="rounded-2xl p-4" style={{ background: g.bg }}>
                <h2 className="flex items-center gap-2 font-display text-[19px] font-extrabold" style={{ color: g.color }}><g.Icon className="h-5 w-5" />{g.title}</h2>
                <p className="mb-3 text-[13px] text-[#5B7268]">{g.sub}</p>
                <div className="space-y-3">{opts.map((o) => <Option key={o.text} o={o} color={g.color} />)}</div>
              </section>
            );
          })}

          <section className="rounded-2xl border border-[#E2ECE6] p-4">
            <h2 className="font-display text-[19px] font-extrabold">الخلاصة</h2>
            <p className="mt-2 leading-8 text-[#24403A]">{s.end}</p>
          </section>

          {concepts.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-[17px] font-extrabold">مفاهيم تفسر هذا الموقف</h2>
              <div className="flex flex-wrap gap-2">
                {concepts.map((c) => c && (
                  <Link key={c.id} href={`/learn/${c.courseId}/${c.id}`} className="rounded-full bg-[#EEF5F1] px-3 py-1.5 text-[14px] font-bold text-[#136F5C]">{c.title}</Link>
                ))}
              </div>
            </section>
          )}

          <div className="rounded-xl bg-[#B4532A] p-5 text-white">
            <p className="font-display text-[19px] font-extrabold">عِش الموقف كاملًا</p>
            <p className="mt-1 text-[14px] leading-7 text-white/85">في التطبيق يتغير الموقف بعد كل قرار، وتحصل على تقرير بكفاءاتك الخمس.</p>
            <Link href="/app?open=sim" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-bold text-[#B4532A]"><Smartphone className="h-5 w-5" /> جرّب في التطبيق</Link>
          </div>
          <div className="border-t border-[#EEF3F0] pt-5"><ShareRow path={`/classroom-problems/${s.id.toLowerCase()}`} title={`${s.title}: كيف يتصرف المعلم؟`} /></div>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-[19px] font-extrabold">مواقف أخرى</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {others.map((o) => (
            <Link key={o.id} href={`/classroom-problems/${o.id.toLowerCase()}`} className="rounded-2xl border border-[#E2ECE6] bg-white p-4 hover:border-[#B4532A]">
              <span className="text-[12px] font-bold text-[#8AA095]">{o.stage}</span>
              <span className="mt-1 block font-bold text-[#14302A]">{o.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </WithSidebar>
  );
}
