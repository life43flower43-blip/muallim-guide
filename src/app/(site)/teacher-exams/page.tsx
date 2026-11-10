// اختبارات المعلمين في الدول العربية: ما تحققنا منه في كل بلد، مع إحالة إلى الجهة الرسمية
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "اختبارات توظيف المعلمين ورخصهم في الدول العربية | تربوي",
  description: "ما الذي يُطلب من المعلم في اختبارات التوظيف والرخصة والترقي في الدول العربية: السعودية والإمارات ومصر والأردن والكويت والجزائر والمغرب، والمحاور التربوية المشتركة بينها، وكيف تستعد لها.",
  alternates: { canonical: `${SITE_URL}/teacher-exams` },
};

const COUNTRIES = [
  {
    id: "sa",
    name: "السعودية",
    body: "الرخصة المهنية لشاغلي الوظائف التعليمية تصدرها هيئة تقويم التعليم والتدريب. ويتكون الاختبار من جزأين: الاختبار التربوي العام الذي يشترك فيه كل المعلمين، والاختبار التخصصي في مادة المعلم. وتُمنح الرخصة بمستويات بحسب الدرجة والخبرة.",
    links: [
      { href: "/license-guide", t: "دليل الاستعداد للرخصة" },
      { href: "/standards", t: "المعايير العشرة" },
      { href: "/specialized", t: "أدلة الاختبارات التخصصية" },
      { href: "/license-calculator", t: "حاسبة مستوى الرخصة" },
    ],
    official: { t: "هيئة تقويم التعليم والتدريب", href: "https://www.etec.gov.sa" },
  },
  {
    id: "ae",
    name: "الإمارات",
    body: "رخصة المعلم شرط لمزاولة التعليم في الإمارات منذ عام ٢٠٢١، وتشرف عليها وزارة التربية والتعليم، وتشمل المعلمين بكل تخصصاتهم ومنهم معلمو رياض الأطفال والتربية الخاصة. وللحصول عليها يجتاز المعلم اختبارًا تخصصيًا واختبارًا مهنيًا في أسس التربية. وتوجد أيضًا رخصة للقيادات المدرسية ورخصة للمهن المدرسية، وقد يُعفى من الاختبارات حامل رخصة دولية معترف بها.",
    links: [
      { href: "/learn", t: "محاور أسس التربية مشروحة" },
      { href: "/practice-test", t: "نموذج اختبار تربوي" },
      { href: "/specialized", t: "أدلة التخصصات" },
    ],
    official: { t: "وزارة التربية والتعليم في الإمارات", href: "https://www.moe.gov.ae" },
  },
  {
    id: "eg",
    name: "مصر",
    body: "تنظم الأكاديمية المهنية للمعلمين اختبارات الترقي بين درجات الوظائف التعليمية، ويحجز المعلم برامج التدريب والاختبارات عبر منصة المعلم الإلكترونية، وتُجرى الاختبارات حضوريًا في فروع الأكاديمية بالمحافظات. ولكل درجة شروطها، ومنها مدة العمل في الدرجة السابقة.",
    links: [
      { href: "/learn", t: "المحاور التربوية مشروحة" },
      { href: "/weekly-test", t: "اختبار الأسبوع" },
      { href: "/articles", t: "مقالات في طرق التدريس والتقويم" },
    ],
    official: { t: "وزارة التربية والتعليم في مصر، والأكاديمية المهنية للمعلمين التابعة لها", href: "https://moe.gov.eg" },
  },
  {
    id: "jo",
    name: "الأردن",
    body: "يُعيَّن المعلمون في المدارس الحكومية وفق جدول التشكيلات واحتياجات وزارة التربية والتعليم، وتنظم هيئة الخدمة والإدارة العامة اختبارات لتقييم كفايات المرشحين، ومنها اختبارات المرشحين لدبلوم تأهيل المعلمين قبل الخدمة الذي ينتهي بالتعيين.",
    links: [
      { href: "/learn", t: "المحاور التربوية مشروحة" },
      { href: "/practice-test", t: "نموذج اختبار تربوي" },
      { href: "/tatbeeq", t: "مواقف تربوية تطبيقية" },
    ],
    official: { t: "هيئة الخدمة والإدارة العامة، ووزارة التربية والتعليم في الأردن", href: "https://www.moe.gov.jo" },
  },
  {
    id: "kw",
    name: "الكويت",
    body: "أعلنت وزارة التربية خطة لرخصة المعلم تبدأ بالمعلمين الجدد، اختيارية في مراحلها الأولى ثم إلزامية، ويرتبط النجاح في اختباراتها الدورية باستمرار المعلم وترقيه. وتفاصيل التطبيق قد تتغير، فراجع الوزارة قبل الاستعداد.",
    links: [
      { href: "/learn", t: "المحاور التربوية مشروحة" },
      { href: "/weekly-test", t: "اختبار الأسبوع" },
    ],
    official: { t: "وزارة التربية في الكويت", href: "https://www.moe.edu.kw" },
  },
  {
    id: "dz",
    name: "الجزائر",
    body: "يُوظَّف الأساتذة عبر مسابقات تنظمها وزارة التربية الوطنية. وتتضمن الاختبارات الكتابية عادة اختبارًا في الثقافة العامة يتناول قضايا الساعة والمنظومة التربوية، واختبارًا في علوم التربية، إضافة إلى اختبار في مادة التخصص بحسب الطور.",
    links: [
      { href: "/learn", t: "علوم التربية: النمو والتعلم والتقويم" },
      { href: "/articles", t: "مقالات تربوية" },
      { href: "/glossary", t: "معجم المصطلحات التربوية" },
    ],
    official: { t: "وزارة التربية الوطنية الجزائرية", href: "https://www.education.gov.dz" },
  },
  {
    id: "ma",
    name: "المغرب",
    body: "تُجرى مباريات توظيف الأساتذة أطر الأكاديميات الجهوية للتربية والتكوين على مرحلتين: اختبارات كتابية ثم شفوية. وتنشر الوزارة لكل سلك بطاقات توصيف للاختبارات، وتشمل الكتابية مادة التخصص وديداكتيكها، إلى جانب مجالات تربوية عامة.",
    links: [
      { href: "/learn", t: "المحاور التربوية مشروحة" },
      { href: "/articles/c/teaching", t: "مقالات في طرق التدريس" },
      { href: "/articles/lesson-plan-steps", t: "كيف تكتب خطة درس" },
    ],
    official: { t: "بوابة توظيف أطر الأكاديميات، وزارة التربية الوطنية المغربية", href: "https://tawdif.men.gov.ma" },
  },
];

export default function TeacherExams() {
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/license-guide", label: "الرخصة المهنية" }, { label: "اختبارات المعلمين في الدول العربية" }]} />
      <PageHero
        kicker="للمعلمين في كل الدول العربية"
        title="اختبارات المعلمين في الدول العربية"
        sub="تختلف الأنظمة من بلد إلى آخر، لكن الجزء التربوي متقارب: نمو المتعلم، والتعلم، والتقويم، وطرق التدريس، وأخلاقيات المهنة. وهذا ما يشرحه تربوي ويدرّب عليه."
      />

      <nav aria-label="الدول" className="mt-5 flex flex-wrap gap-2">
        {COUNTRIES.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="rounded-lg bg-[#F3F6F4] px-3 py-1.5 text-[14px] font-bold text-[#2E4A42] hover:bg-[#E6EFEA]">{c.name}</a>
        ))}
        <a href="#other" className="rounded-lg bg-[#F3F6F4] px-3 py-1.5 text-[14px] font-bold text-[#2E4A42] hover:bg-[#E6EFEA]">دول أخرى</a>
      </nav>

      <div className="mt-6 space-y-5">
        {COUNTRIES.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-16 rounded-2xl border border-[#E2ECE6] bg-white p-5">
            <h2 className="font-display text-[21px] font-extrabold text-[#14302A]">{c.name}</h2>
            <p className="mt-2 text-[15px] leading-8 text-[#3A5249]">{c.body}</p>
            <ul className="mt-3 divide-y divide-[#EEF3F0] border-t border-[#EEF3F0]">
              {c.links.map((l) => (
                <li key={l.href + l.t}>
                  <Link href={l.href} className="flex items-center gap-2 py-2.5 text-[14.5px] font-bold text-[#136F5C]">
                    <span className="flex-1">{l.t}</span><ChevronLeft className="h-4 w-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
            <a href={c.official.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#6B8077] hover:text-[#136F5C]">
              <ExternalLink className="h-4 w-4" /> المرجع الرسمي: {c.official.t}
            </a>
          </section>
        ))}

        <section id="other" className="scroll-mt-16 rounded-2xl border border-[#E2ECE6] bg-white p-5">
          <h2 className="font-display text-[21px] font-extrabold text-[#14302A]">دول أخرى</h2>
          <p className="mt-2 text-[15px] leading-8 text-[#3A5249]">
            في قطر وعُمان والبحرين والعراق وتونس وفلسطين وغيرها تختلف أنظمة تعيين المعلمين وترخيصهم، ولم نجد بعد مصادر رسمية كافية لنكتب عنها تفاصيل دقيقة. لذلك راجع وزارة التربية في بلدك للشروط والمواعيد. والمحتوى التربوي في تربوي، من مفاهيم وأسئلة ومقالات، يناسب الاستعداد لأي اختبار تربوي عام.
          </p>
          <p className="mt-2 text-[14px] leading-7 text-[#6B8077]">نعرف نظام بلدك؟ <Link href="/contact" className="font-bold text-[#136F5C]">أرسل لنا مصدره الرسمي</Link> لنضيفه.</p>
        </section>
      </div>
    </WithSidebar>
  );
}
