// نتائج البحث في الموقع: مقالات، ومفاهيم مجمعة بحسب المحور بألوانها، ومواقف صفية، ومفاهيم خاطئة
import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Layers, School, AlertTriangle, SearchX } from "lucide-react";
import { courseMeta, normalizeAr, searchConcepts } from "@/lib/site-nav";
import { allArticles, arDate, articleCourse } from "@/lib/articles";
import { PROBLEMS } from "@/lib/site-problems";
import { MISCONCEPTIONS } from "@/lib/misconceptions";
import { ad } from "@/lib/arabic";
import { Crumbs, Tile, WithSidebar, conceptTile } from "@/components/site/Blocks";
import SearchBox from "@/components/site/SearchBox";
import type { Concept } from "@/lib/types";

export const metadata: Metadata = { title: "البحث | تربوي", robots: { index: false, follow: true } };

function Group({ icon: Icon, title, count, color, children }: { icon: typeof Newspaper; title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 flex items-center gap-2 font-display text-[19px] font-extrabold" style={{ color }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}18` }}><Icon className="h-5 w-5" /></span>
        {title}
        <span className="rounded-full px-2 text-[13px]" style={{ background: `${color}14` }}>{ad(count)}</span>
      </h2>
      {children}
    </section>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const nq = normalizeAr(q);
  const words = nq.split(/\s+/).filter((w) => w.length > 1);
  const has = (t: string) => words.length > 0 && words.every((w) => normalizeAr(t).includes(w));

  const concepts = q ? searchConcepts(q, 60) : [];
  const arts = q ? allArticles().filter((a) => has([a.title, a.description, a.tags.join(" "), a.body].join(" "))) : [];
  const probs = q ? PROBLEMS.filter((s) => has(`${s.title} ${s.intro}`)) : [];
  const myths = q ? MISCONCEPTIONS.filter((m) => has(`${m.claim} ${m.fact}`)) : [];
  const total = concepts.length + arts.length + probs.length + myths.length;

  // المفاهيم مجمعة بحسب المحور
  const byCourse = new Map<string, Concept[]>();
  for (const c of concepts) byCourse.set(c.courseId, [...(byCourse.get(c.courseId) ?? []), c]);

  return (
    <WithSidebar>
      <Crumbs items={[{ label: "البحث" }]} />
      <header className="relative z-20 border-b border-[#E2ECE6] pb-6">
        <h1 className="font-display text-[28px] font-extrabold leading-[1.45] text-[#14302A] sm:text-[34px]">{q ? <>نتائج البحث عن «{q}»</> : "ابحث في تربوي"}</h1>
        <p className="mt-1 text-[15px] text-[#4A6158]">{q ? (total ? `وجدنا ${ad(total)} نتيجة في المقالات والمفاهيم والمواقف` : "لا نتائج مطابقة") : "مقالات، ومفاهيم، ومواقف صفية، ومفاهيم خاطئة"}</p>
        <div className="mt-4 text-right"><SearchBox /></div>
      </header>

      {q && total === 0 && (
        <div className="mt-6 rounded-2xl border border-[#E2ECE6] bg-white p-6 text-center">
          <SearchX className="mx-auto h-10 w-10 text-[#8AA095]" />
          <p className="mt-2 font-bold text-[#14302A]">لم نجد نتيجة بهذه الكلمات</p>
          <p className="mt-1 text-[14px] text-[#6B8077]">جرّب كلمة أقصر، أو مرادفًا، أو تصفح <Link prefetch={false} href="/glossary" className="font-bold text-[#136F5C]">معجم المصطلحات</Link>.</p>
        </div>
      )}

      {arts.length > 0 && (
        <Group icon={Newspaper} title="مقالات" count={arts.length} color="#B4532A">
          <div className="grid gap-3 sm:grid-cols-2">
            {arts.map((a) => <Tile key={a.slug} href={`/articles/${a.slug}`} id={a.slug} title={a.title} courseId={articleCourse(a)} meta={`${a.category}، ${arDate(a.date)}`} />)}
          </div>
        </Group>
      )}

      {probs.length > 0 && (
        <Group icon={School} title="مشكلات صفية" count={probs.length} color="#A0466B">
          <div className="grid gap-3 sm:grid-cols-2">
            {probs.map((s) => (
              <Link key={s.id} href={`/classroom-problems/${s.slug}`} className="rounded-2xl border border-[#E2ECE6] bg-white p-4 hover:border-[#A0466B]">
                <span className="text-[12px] font-bold text-[#A0466B]">{s.stage}</span>
                <span className="mt-1 block font-bold text-[#14302A]">{s.title}</span>
              </Link>
            ))}
          </div>
        </Group>
      )}

      {myths.length > 0 && (
        <Group icon={AlertTriangle} title="مفاهيم خاطئة شائعة" count={myths.length} color="#7A4E9C">
          <div className="space-y-2">
            {myths.map((m) => (
              <Link key={m.id} href="/misconceptions" className="block rounded-2xl border border-[#E2ECE6] bg-white p-4 hover:border-[#7A4E9C]">
                <span className="font-bold leading-7 text-[#14302A]">«{m.claim}»</span>
                <span className={`ms-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${m.isTrue ? "bg-[#EAF6EF] text-[#1E7B4A]" : "bg-[#FDEDEB] text-[#C0392B]"}`}>{m.isTrue ? "صحيحة" : "خاطئة"}</span>
              </Link>
            ))}
          </div>
        </Group>
      )}

      {concepts.length > 0 && (
        <Group icon={Layers} title="مفاهيم من المحاور" count={concepts.length} color="#1F6FA8">
          <div className="space-y-5">
            {[...byCourse.entries()].map(([cid, list]) => (
              <div key={cid}>
                <p className="mb-2 flex items-center gap-2 text-[14px] font-extrabold" style={{ color: courseMeta(cid).color }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: courseMeta(cid).color }} />
                  {courseMeta(cid).short}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">{list.map(conceptTile)}</div>
              </div>
            ))}
          </div>
        </Group>
      )}
    </WithSidebar>
  );
}
