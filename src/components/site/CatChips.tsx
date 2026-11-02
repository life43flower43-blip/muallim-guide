// أزرار تصنيفات المقالات، كل تصنيف بلونه
import Link from "next/link";
import { articleCats, ARTICLE_CATS } from "@/lib/articles";
import { courseMeta } from "@/lib/site-nav";
import { ad } from "@/lib/arabic";

export default function CatChips({ active }: { active?: string }) {
  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" aria-label="تصنيفات المقالات">
      <Link href="/articles" className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-bold ${!active ? "bg-[#14302A] text-white" : "border border-[#D4E3DA] bg-white text-[#14302A]"}`}>الكل</Link>
      {articleCats().map((c) => {
        const color = courseMeta(ARTICLE_CATS[c.name] ?? "M5").color;
        const on = active === c.name;
        return (
          <Link key={c.slug} href={`/articles/c/${c.slug}`} className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold" style={on ? { background: color, color: "#fff" } : { background: `${color}14`, color }}>
            {c.name}
            <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/25" : "bg-white"}`}>{ad(c.count)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
