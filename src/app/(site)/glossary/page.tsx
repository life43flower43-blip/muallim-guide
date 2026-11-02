// معجم المصطلحات التربوية: كل المفاهيم على حروف الهجاء، ولكل مصطلح رابط إلى مقاله
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { courseMeta, normalizeAr } from "@/lib/site-nav";
import { ad } from "@/lib/arabic";
import { Crumbs, WithSidebar, PageHero } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "معجم المصطلحات التربوية من الألف إلى الياء | تربوي",
  description: "معجم مجاني للمصطلحات التربوية والنفسية مرتب على حروف الهجاء، لكل مصطلح شرح مبسط وأمثلة من الصف وأسئلة تدريب للمعلمين وطلاب كليات التربية.",
  alternates: { canonical: `${SITE_URL}/glossary` },
};

const LETTERS = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");

/** الحرف الذي يُرتَّب عليه المصطلح: بعد حذف «ال» التعريف */
function letterOf(title: string) {
  const t = normalizeAr(title).replace(/^[«"(]/, "").trim();
  const word = t.startsWith("ال") && t.length > 3 ? t.slice(2) : t;
  const ch = word[0] ?? "";
  return LETTERS.includes(ch) ? ch : "#";
}

export default function Glossary() {
  const groups = new Map<string, { id: string; course: string; title: string }[]>();
  const seen = new Set<string>();
  for (const c of publicBank().concepts) {
    const key = normalizeAr(c.title);
    if (seen.has(key)) continue;
    seen.add(key);
    const l = letterOf(c.title);
    if (!groups.has(l)) groups.set(l, []);
    groups.get(l)!.push({ id: c.id, course: c.courseId, title: c.title });
  }
  for (const list of groups.values()) list.sort((a, b) => a.title.localeCompare(b.title, "ar"));
  const order = [...LETTERS, "#"].filter((l) => groups.has(l));

  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مصطلحات تربوية" }]} />
      <PageHero kicker="من الألف إلى الياء" title="معجم المصطلحات التربوية" color="#136F5C" sub={`المصطلحات التربوية والنفسية في الموقع مرتبة على حروف الهجاء (عددها ${ad(seen.size)}). اضغط المصطلح لتقرأ شرحه وأمثلته من الصف.`} />

      {/* أزرار الحروف */}
      <nav className="z-10 mt-5 flex flex-wrap gap-1.5 md:sticky md:top-12 rounded-2xl border border-[#E2ECE6] bg-white p-3">
        {order.map((l) => (
          <a key={l} href={`#l-${l}`} className="flex h-8 w-8 items-center text-[14px] sm:h-9 sm:w-9 justify-center rounded-lg bg-[#EEF5F1] font-bold text-[#136F5C] hover:bg-[#136F5C] hover:text-white">
            {l === "#" ? "…" : l}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-6">
        {order.map((l) => (
          <section key={l} id={`l-${l}`} className="scroll-mt-32 rounded-2xl border border-[#E2ECE6] bg-white p-5">
            <h2 className="mb-3 flex items-center gap-3 font-display text-[24px] font-extrabold text-[#136F5C]">
              {l === "#" ? "مصطلحات أخرى" : `حرف ${l}`}
              <span className="text-[13px] font-bold text-[#6B8077]">{ad(groups.get(l)!.length)}</span>
            </h2>
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {groups.get(l)!.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: courseMeta(t.course).color }} />
                  <Link href={`/learn/${t.course}/${t.id}`} className="leading-7 hover:text-[#136F5C]">{t.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </WithSidebar>
  );
}
