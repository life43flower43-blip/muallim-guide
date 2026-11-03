// نص صفحة ثابتة (الخصوصية، الشروط، التواصل) بعمود قراءة واحد في الوسط، دون شريط جانبي كالمواقع المعروفة
import { Crumbs } from "./Blocks";

export default function Prose({ title, intro, updated, children }: { title: string; intro?: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <Crumbs items={[{ label: title }]} />
      <header className="border-b border-[#E2ECE6] pb-6">
        <h1 className="font-display text-[30px] font-extrabold leading-[1.4] text-[#14302A] sm:text-[36px]">{title}</h1>
        {intro && <p className="mt-3 text-[16.5px] leading-8 text-[#4A6158]">{intro}</p>}
        {updated && <p className="mt-3 text-[13px] text-[#8AA095]">آخر تحديث: {updated}</p>}
      </header>
      <article className="mt-6 space-y-5 text-[16.5px] leading-8 text-[#3A5249] [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-[21px] [&_h2]:font-extrabold [&_h2]:text-[#14302A] [&_li]:ms-5 [&_li]:list-disc [&_li]:mb-1.5 [&_a]:font-bold [&_a]:text-[#136F5C]">
        {children}
      </article>
    </div>
  );
}
