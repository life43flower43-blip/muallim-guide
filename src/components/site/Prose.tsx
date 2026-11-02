// نص صفحة ثابتة (عن الموقع، الخصوصية، الشروط) داخل قالب الموقع مع الشريط الجانبي
import { Crumbs, WithSidebar } from "./Blocks";

export default function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: title }]} />
      <article className="space-y-5 rounded-2xl border border-[#E2ECE6] bg-white p-5 leading-8 text-[#3A5249] sm:p-7 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-[#14302A] [&_li]:ms-5 [&_li]:list-disc [&_a]:font-bold [&_a]:text-[#136F5C]">
        <h1 className="font-display text-[28px] font-extrabold text-[#14302A]">{title}</h1>
        {children}
      </article>
    </WithSidebar>
  );
}
