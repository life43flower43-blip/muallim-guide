// صفحة تعريف بتطبيق تربوي: صور حقيقية من التطبيق، ومزاياه، وزر التثبيت
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, BellRing, Bot, Brain, CalendarCheck, ChevronLeft, ClipboardList, Flame, Layers, RotateCcw, Timer, WifiOff } from "lucide-react";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { arCount, CONCEPT_FORMS, QUESTION_FORMS } from "@/lib/arabic";
import InstallApp from "@/components/site/InstallApp";
import { SectionTitle } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "تطبيق تربوي: استعد لاختبار المعلمين على هاتفك مجانًا",
  description:
    "تطبيق عربي مجاني لاختبار الرخصة المهنية والتوظيف للمعلمين: آلاف الأسئلة مع تفسير كل خيار، واختبارات محاكية بزمن حقيقي، ومراجعة متباعدة لأخطائك، ومواقف صفية، وخرائط ذهنية. يعمل من المتصفح ويُثبَّت على الهاتف.",
  alternates: { canonical: `${SITE_URL}/tatbeeq` },
};

const SHOTS = [
  { src: "/shots/home.jpg", t: "الرئيسية" },
  { src: "/shots/examsim.jpg", t: "اختبار المحاكاة" },
  { src: "/shots/practice.jpg", t: "التدريب الذكي" },
  { src: "/shots/learn.jpg", t: "المفاهيم" },
  { src: "/shots/sim.jpg", t: "المواقف الصفية" },
  { src: "/shots/mind.jpg", t: "الخرائط الذهنية" },
];

const FEATURES = [
  { icon: Timer, c: "#B4532A", t: "اختبار محاكٍ بزمن حقيقي", d: "أقسام موزعة على المحاور، ومؤقت، وخريطة للأسئلة، ثم تقرير لكل قسم." },
  { icon: RotateCcw, c: "#7A4E9C", t: "مراجعة متباعدة لأخطائك", d: "يعيد عليك السؤال الذي أخطأت فيه في الوقت الذي تبدأ فيه بنسيانه." },
  { icon: BarChart3, c: "#1F6FA8", t: "مستوى استعدادك لكل محور", d: "تعرف أين أنت قوي وأين تحتاج مراجعة، بدل أن تذاكر كل شيء من جديد." },
  { icon: Brain, c: "#136F5C", t: "تفسير لكل خيار", d: "لا تعرف أنك أخطأت فقط، بل لماذا كان اختيارك خطأ، ولماذا الصحيح صحيح." },
  { icon: ClipboardList, c: "#A0466B", t: "مواقف صفية تفاعلية", d: "تختار تصرفك في موقف حقيقي، وترى أثره، والمفهوم التربوي الذي يفسره." },
  { icon: Layers, c: "#4E6E3A", t: "خرائط ذهنية ومقاطع مصورة", d: "خريطة لكل فصل، ومقاطع قصيرة بصوت عربي لأهم النظريات." },
  { icon: Bot, c: "#3A55A4", t: "مساعد ذكي", d: "اسأل عن أي مفهوم تربوي واحصل على شرح مبسط بمثال." },
  { icon: Flame, c: "#F97316", t: "سلسلة أيام وهدف يومي", d: "عشر دقائق كل يوم، وتذكير لطيف حتى لا تنقطع." },
  { icon: BellRing, c: "#7C5CFF", t: "تذكير بالمراجعة", d: "إشعار حين يحين موعد مراجعة أخطائك." },
  { icon: WifiOff, c: "#5B7268", t: "يعمل دون اتصال", d: "بعد أول فتح، تتدرب حتى دون إنترنت." },
  { icon: CalendarCheck, c: "#2E7D5B", t: "مجاني ودون تسجيل", d: "ابدأ فورًا. وسجّل بحساب Google إن أردت حفظ تقدمك على أكثر من جهاز." },
];

export default function AppPage() {
  const b = publicBank();
  return (
    <div className="space-y-12">
      <section className="relative rounded-[28px] bg-[linear-gradient(135deg,#0E4F42,#136F5C_55%,#1F8A70)] px-5 py-9 text-white sm:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192-v3.png" alt="" className="h-16 w-16 rounded-2xl bg-white" />
              <div>
                <p className="font-display text-[26px] font-extrabold">تطبيق تربوي</p>
                <p className="text-[14px] text-white/80">مجاني، بالعربية، لكل المعلمين العرب</p>
              </div>
            </div>
            <h1 className="mt-5 font-display text-[28px] font-extrabold leading-[1.45] sm:text-[38px]">استعد لاختبار المعلمين على هاتفك، عشر دقائق كل يوم</h1>
            <ul className="mt-4 flex flex-wrap gap-2 text-[13px] font-bold">
              <li className="rounded-full bg-white/15 px-3 py-1">{arCount(b.questions.length, QUESTION_FORMS)} مع التفسير</li>
              <li className="rounded-full bg-white/15 px-3 py-1">{arCount(b.concepts.length, CONCEPT_FORMS)} بشرح مبسط</li>
              <li className="rounded-full bg-white/15 px-3 py-1">اختبارات محاكية</li>
            </ul>
            <InstallApp className="mt-6" />
          </div>
          <div className="mx-auto w-[220px] overflow-hidden rounded-[32px] border-[6px] border-[#0B2A23] bg-white sm:w-[250px]">
            <img src="/shots/home.jpg" alt="الشاشة الرئيسية في تطبيق تربوي" className="block w-full" />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="من داخل التطبيق" color="#3A55A4" />
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
          {SHOTS.map((s) => (
            <figure key={s.src} className="w-[180px] shrink-0 snap-start sm:w-[210px]">
              <div className="overflow-hidden rounded-[26px] border-[5px] border-[#14302A] bg-white">
                <img src={s.src} alt={`${s.t} في تطبيق تربوي`} loading="lazy" className="block w-full" />
              </div>
              <figcaption className="mt-2 text-center text-[14px] font-bold text-[#14302A]">{s.t}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="ماذا يقدم لك التطبيق؟" color="#B4532A" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="flex gap-3 rounded-2xl border border-[#E2ECE6] bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${f.c}18`, color: f.c }}><f.icon className="h-6 w-6" /></span>
              <span>
                <span className="block font-bold text-[#14302A]">{f.t}</span>
                <span className="mt-0.5 block text-[14px] leading-7 text-[#4D635A]">{f.d}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/practice-test" className="flex items-center justify-between rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
          <span>
            <span className="block font-display text-[18px] font-extrabold">جرّب قبل أن تثبّت</span>
            <span className="mt-1 block text-[14px] text-[#4D635A]">نموذج اختبار من ٢٠ سؤالًا في الموقع</span>
          </span>
          <ChevronLeft className="h-5 w-5 text-[#136F5C]" />
        </Link>
        <Link href="/sections" className="flex items-center justify-between rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
          <span>
            <span className="block font-display text-[18px] font-extrabold">كل أقسام التطبيق</span>
            <span className="mt-1 block text-[14px] text-[#4D635A]">صفحة لكل قسم وما فيه</span>
          </span>
          <ChevronLeft className="h-5 w-5 text-[#136F5C]" />
        </Link>
      </section>
    </div>
  );
}
