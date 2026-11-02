// الصفحة الرئيسية للموقع بالنمط المعتاد: مقالات مميزة، وأقسام التطبيق، ثم أحدث ما في كل تصنيف مع شريط جانبي
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { APP_SECTIONS, courseMeta } from "@/lib/site-nav";
import { PostCard, PostRow, SectionTitle, WithSidebar } from "@/components/site/Blocks";
import { ad } from "@/lib/arabic";
import type { Concept } from "@/lib/types";

export const metadata: Metadata = {
  title: "تربوي | الاستعداد لاختبار الرخصة المهنية والتوظيف للمعلمين",
  description:
    "موقع عربي مجاني للمعلمين وطلاب كليات التربية: مفاهيم تربوية مشروحة بأمثلة من الصف، وآلاف الأسئلة مع تفسير كل خيار، واختبارات محاكية، ومواقف صفية، وأدوات للقياس والتقويم.",
  alternates: { canonical: `${SITE_URL}/` },
};

const HOME_COURSES = ["M5", "M3", "M4", "M1", "M2", "SE1"];

/** مقالات من فصول مختلفة في التصنيف نفسه */
function spread(courseId: string, n: number): Concept[] {
  const all = publicBank().concepts.filter((c) => c.courseId === courseId);
  const seen = new Set<string>();
  const out: Concept[] = [];
  for (const c of all) {
    if (seen.has(c.chapter)) continue;
    seen.add(c.chapter);
    out.push(c);
    if (out.length === n) break;
  }
  return out;
}

const FAQ = [
  { q: "هل موقع تربوي مجاني؟", a: "نعم. المقالات والأسئلة والاختبارات المحاكية والأدوات كلها مجانية، ويمكنك أن تبدأ دون تسجيل." },
  { q: "لمن هذا الموقع؟", a: "للمتقدمين لاختبارات الرخصة المهنية والتوظيف في التعليم في البلاد العربية، ولطلاب كليات التربية، وللمعلمين الذين يطورون ممارستهم." },
  { q: "هل يطابق الاختبار الرسمي في بلدي؟", a: "يغطي المحاور التربوية المشتركة في أغلب هذه الاختبارات، لكنه ليس الاختبار الرسمي. راجع دليل الاختبار في بلدك لمعرفة المحاور وأوزانها." },
  { q: "ما الفرق بين الموقع والتطبيق؟", a: "الموقع للقراءة: شرح المفاهيم والمصطلحات. والتطبيق للتدريب: أسئلة مع التفسير، واختبارات بزمن، ومراجعة لأخطائك. يفتح التطبيق من المتصفح، ويمكن تثبيته على الهاتف." },
];

export default function Home() {
  const b = publicBank();
  const featured = [spread("M5", 1)[0], spread("M3", 2)[1], spread("M4", 1)[0], spread("M1", 1)[0], spread("SE1", 1)[0]].filter(Boolean);
  const [lead, ...side] = featured;

  return (
    <div className="space-y-10">
      {/* المقالات المميزة */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PostCard c={lead} big />
        <div className="rounded-2xl border border-[#E2ECE6] bg-white p-4">
          <h2 className="mb-4 border-s-4 border-[#E8A317] ps-2.5 font-display text-[18px] font-extrabold">مقالات مميزة</h2>
          <div className="space-y-4">{side.map((c) => <PostRow key={c.id} c={c} showExcerpt />)}</div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#EEF3F0] pt-4 text-center">
            <div><p className="font-display text-[22px] font-extrabold text-[#136F5C]">{ad(b.concepts.length)}</p><p className="text-[12px] text-[#5B7268]">مقال ومفهوم</p></div>
            <div><p className="font-display text-[22px] font-extrabold text-[#136F5C]">{ad(b.questions.length)}</p><p className="text-[12px] text-[#5B7268]">سؤال مع التفسير</p></div>
            <div><p className="font-display text-[22px] font-extrabold text-[#136F5C]">{ad(Object.keys(b.courses).length)}</p><p className="text-[12px] text-[#5B7268]">محاور</p></div>
          </div>
        </div>
      </section>

      {/* أقسام التطبيق */}
      <section>
        <SectionTitle title="أقسام تطبيق تربوي" more={{ href: "/sections", label: "كل الأقسام" }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {APP_SECTIONS.slice(0, 5).map((s) => (
            <Link key={s.slug} href={`/sections/${s.slug}`} className="group overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
              <img src={s.img} alt="" loading="lazy" className="h-28 w-full object-cover transition group-hover:scale-105" />
              <p className="truncate px-3 py-2.5 text-center font-bold text-[#14302A]">{s.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <WithSidebar>
        <div className="space-y-10">
          {HOME_COURSES.map((id) => (
            <section key={id}>
              <SectionTitle title={courseMeta(id).short} more={{ href: `/learn/${id}`, label: "المزيد" }} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {spread(id, 3).map((c) => <PostCard key={c.id} c={c} />)}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-[#E2ECE6] bg-white p-5">
            <h2 className="font-display text-[20px] font-extrabold">معجم المصطلحات التربوية</h2>
            <p className="mt-1 leading-7 text-[#4D635A]">كل المصطلحات التربوية في الموقع مرتبة على حروف الهجاء، ولكل مصطلح صفحة بشرحه وأمثلته.</p>
            <Link href="/glossary" className="mt-3 inline-block rounded-xl bg-[#136F5C] px-5 py-2.5 font-bold text-white">تصفّح المصطلحات</Link>
          </section>

          <section>
            <SectionTitle title="أسئلة شائعة" />
            <div className="divide-y divide-[#EEF3F0] rounded-2xl border border-[#E2ECE6] bg-white">
              {FAQ.map((f) => (
                <details key={f.q} className="px-5 py-4">
                  <summary className="cursor-pointer list-none font-bold">{f.q}</summary>
                  <p className="mt-2 leading-7 text-[#4D635A]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </WithSidebar>
    </div>
  );
}
