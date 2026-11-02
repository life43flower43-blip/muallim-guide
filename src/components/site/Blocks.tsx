// قطع الموقع المشتركة: بطاقة المقال، والشريط الجانبي، ومسار التنقل، وعنوان القسم، وأزرار المشاركة
import Link from "next/link";
import { Search, Clock, Smartphone, ChevronLeft } from "lucide-react";
import type { Concept } from "@/lib/types";
import { chapterLabel, courseList, SITE_URL } from "@/lib/public-bank";
import { APP_SECTIONS, courseMeta, excerpt, latestConcepts, pickedConcepts, readMinutes } from "@/lib/site-nav";
import { ad } from "@/lib/arabic";
import AdSlot from "./AdSlot";

const href = (c: Concept) => `/learn/${c.courseId}/${c.id}`;

/** صورة المقال المصغرة: صورة المحور بلونه، وعليها اسم الفصل */
export function Thumb({ c, className = "" }: { c: Concept; className?: string }) {
  const m = courseMeta(c.courseId);
  return (
    <span className={`relative block overflow-hidden bg-[#DDE8E2] ${className}`}>
      <img src={m.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute inset-0" style={{ background: `linear-gradient(to top, ${m.color}E6 0%, ${m.color}55 55%, transparent 100%)` }} />
      <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-[13px] font-bold leading-5 text-white">{chapterLabel(c.chapter)}</span>
    </span>
  );
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
      <Link href={href(c)} tabIndex={-1} aria-hidden="true"><Thumb c={c} className={big ? "h-56 sm:h-72" : "h-40"} /></Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <CatBadge id={c.courseId} />
          <span className="flex items-center gap-1 text-[12px] text-[#6B8077]"><Clock className="h-3.5 w-3.5" /> {ad(readMinutes(c))} د قراءة</span>
        </div>
        <h3 className={`mt-2 font-display font-bold leading-[1.55] text-[#14302A] ${big ? "text-[22px]" : "text-[17px]"}`}>
          <Link href={href(c)} className="hover:text-[#136F5C]">{c.title}</Link>
        </h3>
        <p className={`mt-1.5 leading-7 text-[#4D635A] ${big ? "text-[15px]" : "line-clamp-3 text-[14px]"}`}>{excerpt(c, big ? 220 : 130)}</p>
        <Link href={href(c)} className="mt-auto flex items-center gap-1 pt-3 text-[14px] font-bold text-[#136F5C]">اقرأ المزيد <ChevronLeft className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}

/** سطر مقال أفقي: صورة صغيرة بجانب العنوان */
export function PostRow({ c, showExcerpt = false }: { c: Concept; showExcerpt?: boolean }) {
  return (
    <article className="flex gap-3">
      <Link href={href(c)} tabIndex={-1} aria-hidden="true" className="shrink-0"><Thumb c={c} className="h-[72px] w-[96px] rounded-xl [&>span:last-child]:hidden" /></Link>
      <div className="min-w-0">
        <h3 className="font-bold leading-6 text-[#14302A]"><Link href={href(c)} className="hover:text-[#136F5C]">{c.title}</Link></h3>
        {showExcerpt ? (
          <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#4D635A]">{excerpt(c, 120)}</p>
        ) : (
          <p className="mt-0.5 text-[12px] text-[#6B8077]">{courseMeta(c.courseId).short}</p>
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
        <div className="space-y-4">{latestConcepts(5).map((c) => <PostRow key={c.id} c={c} />)}</div>
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
  const url = encodeURIComponent(`${SITE_URL}${path}`);
  const text = encodeURIComponent(title);
  const links = [
    { label: "واتساب", href: `https://wa.me/?text=${text}%20${url}`, bg: "#1FA855" },
    { label: "لينكدإن", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, bg: "#0A66C2" },
    { label: "إكس", href: `https://x.com/intent/post?text=${text}&url=${url}`, bg: "#111111" },
    { label: "تيليجرام", href: `https://t.me/share/url?url=${url}&text=${text}`, bg: "#229ED9" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14px] font-bold text-[#14302A]">شارك:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-white" style={{ background: l.bg }}>
          {l.label}
        </a>
      ))}
    </div>
  );
}
