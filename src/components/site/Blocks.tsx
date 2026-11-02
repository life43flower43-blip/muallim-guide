// قطع الموقع المشتركة: بطاقة المقال، والشريط الجانبي، ومسار التنقل، وعنوان القسم، وأزرار المشاركة
import Link from "next/link";
import { Search, Clock, Smartphone, ChevronLeft } from "lucide-react";
import type { Concept } from "@/lib/types";
import { chapterLabel, courseList, SITE_URL } from "@/lib/public-bank";
import { APP_SECTIONS, courseMeta, excerpt, pickedConcepts, readMinutes } from "@/lib/site-nav";
import { ad } from "@/lib/arabic";
import AdSlot from "./AdSlot";
import ShareBar from "./ShareBar";
import { Cover, MiniCover } from "./Cover";
import { type Article, allArticles, arDate, articleCourse } from "@/lib/articles";

const href = (c: Concept) => `/learn/${c.courseId}/${c.id}`;

/** غلاف المقال: خاص بكل مقال (لون المحور، وزخرفة، وأيقونة الموضوع، والعنوان) */
export function Thumb({ c, className = "", compact = false }: { c: Concept; className?: string; compact?: boolean }) {
  return <Cover id={c.id} title={c.title} courseId={c.courseId} label={chapterLabel(c.chapter)} className={className} compact={compact} />;
}

export function CatBadge({ id }: { id: string }) {
  const m = courseMeta(id);
  return (
    <Link href={`/learn/${id}`} className="inline-block rounded-md px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: m.color }}>
      {m.short}
    </Link>
  );
}

/** بطاقة مقال: صورة، ثم التصنيف، ثم العنوان والمقتطف */
export function PostCard({ c, big = false }: { c: Concept; big?: boolean }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
      <Link href={href(c)} tabIndex={-1} aria-hidden="true"><Thumb c={c} compact className={big ? "h-48 sm:h-64" : "h-36"} /></Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <CatBadge id={c.courseId} />
          <span className="flex items-center gap-1 text-[12px] text-[#6B8077]"><Clock className="h-3.5 w-3.5" /> {ad(readMinutes(c))} د قراءة</span>
        </div>
        <h3 className={`mt-2 font-display font-bold leading-[1.55] text-[#14302A] ${big ? "text-[22px]" : "text-[17px]"}`}>
          <Link href={href(c)} className="hover:text-[#136F5C]">{c.title}</Link>
        </h3>
        <p className={`mt-1.5 leading-7 text-[#4D635A] ${big ? "line-clamp-3 text-[15px]" : "line-clamp-2 text-[14px]"}`}>{excerpt(c, big ? 220 : 130)}</p>
        <Link href={href(c)} className="mt-auto flex items-center gap-1 pt-3 text-[14px] font-bold text-[#136F5C]">اقرأ المزيد <ChevronLeft className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}

/** سطر مقال أفقي: صورة صغيرة بجانب العنوان */
export function PostRow({ c, showExcerpt = false }: { c: Concept; showExcerpt?: boolean }) {
  return (
    <article className="flex gap-3">
      <Link href={href(c)} tabIndex={-1} aria-hidden="true" className="shrink-0"><MiniCover id={c.id} title={c.title} courseId={c.courseId} hint={c.chapter} className="h-[72px] w-[96px] rounded-xl" /></Link>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-6 text-[#14302A]"><Link href={href(c)} className="hover:text-[#136F5C]">{c.title}</Link></h3>
        {showExcerpt ? (
          <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#4D635A]">{excerpt(c, 120)}</p>
        ) : (
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#6B8077]"><Clock className="h-3 w-3" /> {ad(readMinutes(c))} د قراءة</p>
        )}
      </div>
    </article>
  );
}

export function SectionTitle({ title, more }: { title: string; more?: { href: string; label: string } }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-[#E2ECE6]">
      <h2 className="-mb-0.5 border-b-2 border-[#136F5C] pb-2 font-display text-[20px] font-extrabold text-[#14302A]">{title}</h2>
      {more && <Link href={more.href} className="pb-2 text-[14px] font-bold text-[#136F5C]">{more.label}</Link>}
    </div>
  );
}

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="مسار التنقل" className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-[#6B8077]">
      <Link href="/" className="hover:text-[#136F5C]">الرئيسية</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronLeft className="h-3.5 w-3.5" />
          {it.href ? <Link href={it.href} className="hover:text-[#136F5C]">{it.label}</Link> : <span className="text-[#14302A]">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E2ECE6] bg-white p-4">
      <h2 className="mb-3 border-s-4 border-[#136F5C] ps-2.5 font-display text-[17px] font-extrabold text-[#14302A]">{title}</h2>
      {children}
    </section>
  );
}

/** الشريط الجانبي: بحث، والتطبيق، والتصنيفات، وأحدث المقالات، ومختارات */
export function Sidebar() {
  const courses = courseList().filter((c) => c.concepts.length > 0);
  return (
    <aside className="space-y-5">
      <Widget title="ابحث في الموقع">
        <form action="/search" className="flex">
          <input name="q" placeholder="مثال: التعزيز، بياجيه" className="h-11 min-w-0 flex-1 rounded-s-xl border border-e-0 border-[#D4E3DA] bg-[#F7FAF8] px-3 text-[15px] outline-none focus:border-[#136F5C]" />
          <button aria-label="بحث" className="flex h-11 w-11 items-center justify-center rounded-e-xl bg-[#136F5C] text-white"><Search className="h-5 w-5" /></button>
        </form>
      </Widget>

      <section className="rounded-2xl bg-[#136F5C] p-5 text-white">
        <Smartphone className="h-7 w-7 text-[#F2C94C]" />
        <h2 className="mt-2 font-display text-[19px] font-extrabold">تدرّب في تطبيق تربوي</h2>
        <p className="mt-1 text-[14px] leading-7 text-white/85">آلاف الأسئلة مع تفسير كل خيار، واختبارات محاكية، ومراجعة لأخطائك. مجانًا ومن المتصفح.</p>
        <Link href="/app" className="mt-3 inline-block rounded-xl bg-[#E8A317] px-5 py-2.5 text-[15px] font-bold text-[#2B1D00]">افتح التطبيق</Link>
      </section>

      <Widget title="التصنيفات">
        <ul className="divide-y divide-[#EEF3F0] text-[15px]">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/learn/${c.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-[#136F5C]">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: courseMeta(c.id).color }} />{courseMeta(c.id).short}</span>
                <span className="rounded-full bg-[#EEF5F1] px-2 text-[12px] font-bold text-[#136F5C]">{ad(c.concepts.length)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Widget>

      <AdSlot />

      <Widget title="أحدث المقالات">
        <div className="space-y-4">
          {allArticles().slice(0, 5).map((a) => (
            <article key={a.slug} className="flex gap-3">
              <Link href={`/articles/${a.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0"><MiniCover id={a.slug} title={a.title} courseId={articleCourse(a)} className="h-[72px] w-[96px] rounded-xl" /></Link>
              <div className="min-w-0">
                <h3 className="line-clamp-2 font-bold leading-6 text-[#14302A]"><Link href={`/articles/${a.slug}`} className="hover:text-[#136F5C]">{a.title}</Link></h3>
                <p className="mt-0.5 text-[12px] text-[#6B8077]">{arDate(a.date)}</p>
              </div>
            </article>
          ))}
        </div>
      </Widget>

      <Widget title="أقسام التطبيق">
        <ul className="flex flex-wrap gap-2">
          {APP_SECTIONS.map((s) => (
            <li key={s.slug}><Link href={`/sections/${s.slug}`} className="block rounded-lg border border-[#D4E3DA] px-3 py-1.5 text-[13px] font-bold text-[#1E3A32] hover:border-[#136F5C] hover:text-[#136F5C]">{s.title}</Link></li>
          ))}
        </ul>
      </Widget>

      <Widget title="مختارات للقراءة">
        <div className="space-y-4">{pickedConcepts(4).map((c) => <PostRow key={c.id} c={c} />)}</div>
      </Widget>
    </aside>
  );
}

/** صفحة بعمودين: المحتوى ثم الشريط الجانبي (تحته في الهاتف) */
export function WithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{children}</div>
      <Sidebar />
    </div>
  );
}

export function ShareRow({ path, title }: { path: string; title: string }) {
  return <ShareBar url={`${SITE_URL}${path}`} title={title} />;
}

/** بطاقة مقال مكتوب (قضايا تربوية) */
export function ArticleCard({ a, wide = false }: { a: Article; wide?: boolean }) {
  return (
    <article className={`flex overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white ${wide ? "flex-col sm:flex-row" : "flex-col"}`}>
      <Link href={`/articles/${a.slug}`} tabIndex={-1} aria-hidden="true" className={wide ? "sm:w-[46%] sm:shrink-0" : ""}>
        <Cover id={a.slug} title={a.title} courseId={articleCourse(a)} label={a.category} compact className={wide ? "h-44 sm:h-full sm:min-h-[220px]" : "h-36"} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-[12px] text-[#6B8077]">
          <span className="rounded-md px-2 py-0.5 font-bold text-white" style={{ background: courseMeta(articleCourse(a)).color }}>{a.category}</span>
          <span>{arDate(a.date)}</span>
        </div>
        <h3 className={`mt-2 font-display font-bold leading-[1.55] text-[#14302A] ${wide ? "text-[20px]" : "text-[17px]"}`}>
          <Link href={`/articles/${a.slug}`} className="hover:text-[#136F5C]">{a.title}</Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[14px] leading-7 text-[#4D635A]">{a.description}</p>
        <Link href={`/articles/${a.slug}`} className="mt-auto flex items-center gap-1 pt-3 text-[14px] font-bold text-[#136F5C]">اقرأ المقال <ChevronLeft className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}

/** بطاقة صغيرة: غلاف ثم عنوان، تصلح لشبكة من عمودين في الهاتف */
export function Tile({ href, id, title, courseId, meta, card = false }: { href: string; id: string; title: string; courseId: string; label?: string; meta?: string; card?: boolean }) {
  // card: بطاقة عمودية للشرائط التي تُسحب جانبيًا. وبدونها: بطاقة أفقية، الصورة بجانب العنوان
  if (card)
    return (
      <Link href={href} className="group flex w-[68%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white transition hover:border-[#136F5C] sm:w-auto">
        <MiniCover id={id} courseId={courseId} className="h-32 sm:h-36" />
        <span className="flex flex-1 flex-col p-3">
          <span className="line-clamp-2 text-[15px] font-bold leading-6 text-[#14302A] group-hover:text-[#136F5C]">{title}</span>
          {meta && <span className="mt-auto pt-1.5 text-[12px] text-[#6B8077]">{meta}</span>}
        </span>
      </Link>
    );
  return (
    <Link href={href} className="group flex items-stretch gap-3 overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white p-2.5 transition hover:border-[#136F5C]">
      <MiniCover id={id} courseId={courseId} className="h-[84px] w-[104px] shrink-0 rounded-xl" />
      <span className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
        <span className="line-clamp-2 text-[15px] font-bold leading-6 text-[#14302A] group-hover:text-[#136F5C]">{title}</span>
        {meta && <span className="mt-1 text-[12px] text-[#6B8077]">{meta}</span>}
      </span>
    </Link>
  );
}

export const conceptTile = (c: Concept) => (
  <Tile key={c.id} href={href(c)} id={c.id} title={c.title} courseId={c.courseId} meta={`${courseMeta(c.courseId).short}، ${ad(readMinutes(c))} د قراءة`} />
);
export const conceptCard = (c: Concept) => (
  <Tile key={c.id} card href={href(c)} id={c.id} title={c.title} courseId={c.courseId} meta={`${courseMeta(c.courseId).short}، ${ad(readMinutes(c))} د قراءة`} />
);
