// نتائج البحث في مقالات الموقع
import type { Metadata } from "next";
import Link from "next/link";
import { normalizeAr, searchConcepts } from "@/lib/site-nav";
import { allArticles, arDate } from "@/lib/articles";
import { ad } from "@/lib/arabic";
import { Crumbs, PostRow, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = { title: "البحث | تربوي", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const results = q ? searchConcepts(q) : [];
  const nq = normalizeAr(q);
  const arts = q ? allArticles().filter((a) => normalizeAr([a.title, a.description, a.tags.join(" "), a.body].join(" ")).includes(nq)) : [];
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "البحث" }]} />
      <h1 className="font-display text-[26px] font-extrabold">{q ? <>نتائج البحث عن «{q}»</> : "البحث في الموقع"}</h1>
      <form action="/search" className="mt-4 flex max-w-xl">
        <input name="q" defaultValue={q} placeholder="اكتب مفهومًا أو مصطلحًا" className="h-12 min-w-0 flex-1 rounded-s-xl border border-e-0 border-[#D4E3DA] bg-white px-4 text-[16px] outline-none focus:border-[#136F5C]" />
        <button className="h-12 rounded-e-xl bg-[#136F5C] px-5 font-bold text-white">بحث</button>
      </form>
      {q && (
        <p className="mt-4 text-[14px] text-[#6B8077]">
          {results.length + arts.length ? `عدد النتائج: ${ad(results.length + arts.length)}${results.length === 40 ? " أو أكثر" : ""}` : "لم نجد مقالًا بهذه الكلمات. جرّب كلمة أقصر أو مرادفًا."}
        </p>
      )}
      {arts.length > 0 && (
        <div className="mt-5 space-y-3 rounded-2xl border border-[#E2ECE6] bg-white p-5">
          <h2 className="font-display text-[17px] font-extrabold">مقالات</h2>
          {arts.map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="block rounded-xl p-2 hover:bg-[#F4F8F6]">
              <span className="block font-bold leading-7">{a.title}</span>
              <span className="text-[12px] text-[#6B8077]">{a.category}، {arDate(a.date)}</span>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-5 space-y-5 rounded-2xl border border-[#E2ECE6] bg-white p-5 empty:hidden">
        {results.map((c) => <PostRow key={c.id} c={c} showExcerpt />)}
      </div>
    </WithSidebar>
  );
}
