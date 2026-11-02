// غلاف خاص بكل مقال: لون المحور، وزخرفة تختلف بحسب المقال، وأيقونة من موضوعه، وعنوانه
import { ARTICLE_COVERS } from "@/lib/article-covers";
import {
  Accessibility, Activity, Baby, BookOpen, Brain, BrainCircuit, ChartBar, ClipboardCheck, Compass, Cpu, Ear, Eye, FileQuestion,
  Flame, Gauge, GraduationCap, Hand, HeartHandshake, Heart, Lightbulb, ListChecks, Map, MessageCircle, Mic, Network, Palette,
  PenLine, Presentation, Puzzle, Repeat, Ruler, Scale, School, Search, ShieldCheck, Sigma, Smile, Sparkles, Sprout, Target,
  Timer, Trophy, Users, Languages, Layers, Gamepad2, Shapes, ShieldAlert, BatteryLow, Smartphone, Zap, TriangleAlert, Feather,
  Quote, Microscope, Globe, Landmark, Calculator, Music, Dumbbell, Atom, Library, Speech, Route, Footprints, Bot, type LucideIcon,
} from "lucide-react";
import { courseMeta } from "@/lib/site-nav";

/** أيقونة الموضوع من كلمات العنوان والفصل، والأسبق في القائمة أولى */
const RULES: [RegExp, LucideIcon][] = [
  [/تنمر/, ShieldAlert],
  [/بافلوف|إشراط|سكنر|ثورندايك|واطسون/, Trophy],
  [/احتراق|إنهاك/, BatteryLow],
  [/هاتف|جوال/, Smartphone],
  [/التعلم النشط|نشط/, Zap],
  [/متمايز|تمايز/, Shapes],
  [/روبوت|محادث|ChatGPT/i, Bot],
  [/أخطاء|خطأ|خرافات/, TriangleAlert],
  [/بلاغ|عروض|شعر|أدب|تناص|تذوق/, Feather],
  [/نحو|صرف|فصحى|لهج|ازدواج|عربية|لغو|إملاء|خط /, Languages],
  [/نص|قرائي|قراءة|مطالعة/, BookOpen],
  [/تحدث|خطاب|شفه/, Speech],
  [/اقتباس|مقولة/, Quote],
  [/علوم|تجرب|مختبر/, Microscope],
  [/فيزياء|كيمياء|ذرة/, Atom],
  [/جغراف|عالم|دولي|عالمي/, Globe],
  [/تاريخ|حضار|اجتماعيات|وطني/, Landmark],
  [/رياضيات|حساب|أعداد|هندسة|جبر|كسور/, Calculator],
  [/موسيق|إيقاع/, Music],
  [/رياض|بدنية/, Dumbbell],
  [/مسار|مراحل|خطوات/, Footprints],
  [/منهج|مقرر/, Route],
  [/مكتبة|مراجع/, Library],
  [/ذكاء اصطناعي|الآلة|رقمي|تقني|تكنولوج|حاسوب|إلكترون/, Cpu],
  [/توحد|طيف/, Puzzle],
  [/إعاق|خاصة|دامج|دمج|صعوبات/, Accessibility],
  [/سمع|استماع|أصوات/, Ear],
  [/بصر|رؤية|إدراك بصري/, Eye],
  [/موهب|تفوق|إبداع|ابتكار/, Sparkles],
  [/ذكاء|ذكاءات/, Brain],
  [/ذاكرة|تذكر|نسيان|استرجاع|ترميز/, BrainCircuit],
  [/انفعال|مشاعر|عاطف|قلق|خوف|غضب|ضغط/, Heart],
  [/دافع|حافز|تحفيز|رغبة/, Flame],
  [/تعزيز|عقاب|ثواب|مكافأ|إشراط/, Trophy],
  [/ثبات|صدق|معامل|إحصا|درجات|متوسط|انحراف|توزيع/, ChartBar],
  [/اختبار|سؤال|أسئلة|بنود|مفردات/, FileQuestion],
  [/تقويم|قياس|تقييم/, ClipboardCheck],
  [/مواصفات|جدول/, ListChecks],
  [/هدف|أهداف/, Target],
  [/خطة|تخطيط/, Map],
  [/لغ|قراءة|كتابة|حروف|نطق/, Languages],
  [/رياضيات|حساب|أعداد/, Sigma],
  [/حرك|جسم|جسمي|بدني/, Activity],
  [/طفولة|رضيع|مهد|حمل/, Baby],
  [/مراهق|نمو|مراحل/, Sprout],
  [/اجتماع|أقران|جماع|تعاون|فريق/, Users],
  [/أخلاق|قيم|ضمير/, Scale],
  [/تواصل|حوار|مناقشة|اتصال/, MessageCircle],
  [/إلقاء|عرض|محاضرة/, Mic],
  [/إدارة الصف|انضباط|سلوك|نظام/, ShieldCheck],
  [/لعب|ألعاب/, Gamepad2],
  [/فن|رسم|ألوان/, Palette],
  [/وقت|زمن/, Timer],
  [/تفكير|حل المشكلات|ناقد|ما وراء/, Lightbulb],
  [/بنائ|معرفي|مخطط|سقالات/, Layers],
  [/نظري|مدرسة|اتجاه/, Network],
  [/تكرار|مراجعة|تدريب|ممارسة/, Repeat],
  [/مهار/, Hand],
  [/إرشاد|رعاية|دعم|أسرة|أولياء/, HeartHandshake],
  [/استراتيجي|طريق|طرائق|أسلوب|تدريس/, Presentation],
  [/معلم|مهنة/, GraduationCap],
  [/مدرس|صف|فصل/, School],
  [/بحث|استقصاء|اكتشاف/, Search],
  [/مقياس|معيار|مستوى/, Ruler],
  [/سرعة|أداء/, Gauge],
  [/شكل|أشكال|تصنيف/, Shapes],
  [/سعاد|رضا|ذات/, Smile],
  [/كتاب|مكتبة|مصدر/, BookOpen],
  [/كتب|صياغة/, PenLine],
];

export function topicIcon(text: string): LucideIcon {
  for (const [re, icon] of RULES) if (re.test(text)) return icon;
  return Compass;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** زخرفة الخلفية: أربعة أنماط، ومواضع تختلف من مقال لآخر */
function Pattern({ seed }: { seed: number }) {
  const v = seed % 4;
  const x = 20 + (seed % 60);
  const y = 15 + ((seed >> 4) % 55);
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {v === 0 && [0, 1, 2, 3].map((i) => <circle key={i} cx={x * 4} cy={y * 3} r={40 + i * 38} fill="none" stroke="#fff" strokeOpacity={0.14 - i * 0.025} strokeWidth="2" />)}
      {v === 1 && Array.from({ length: 9 }, (_, i) => <line key={i} x1={-50 + i * 55} y1="260" x2={60 + i * 55 + (seed % 40)} y2="-10" stroke="#fff" strokeOpacity="0.09" strokeWidth="14" />)}
      {v === 2 && Array.from({ length: 70 }, (_, i) => <circle key={i} cx={(i % 10) * 44 + 12} cy={Math.floor(i / 10) * 40 + 14} r={2.4} fill="#fff" fillOpacity={((i * 7 + seed) % 5) / 18 + 0.05} />)}
      {v === 3 && [0, 1, 2].map((i) => <path key={i} d={`M-10 ${80 + i * 55 + (seed % 30)} C 100 ${20 + i * 50}, 260 ${160 + i * 30}, 420 ${60 + i * 50}`} fill="none" stroke="#fff" strokeOpacity="0.13" strokeWidth="10" />)}
      <circle cx={400 - x * 2} cy={250 - y} r="70" fill="#fff" fillOpacity="0.07" />
    </svg>
  );
}

/** صور كل محور: تُختار واحدة منها بحسب المقال، مع زاوية قص مختلفة، حتى لا تتكرر الصورة نفسها متجاورة */
const PHOTOS: Record<string, string[]> = {
  M1: ["/home/situations-v2.jpg", "/home/skills-v2.jpg"],
  M2: ["/home/concepts-v2.jpg", "/home/situations-v2.jpg"],
  M3: ["/home/methods-v2.jpg", "/home/concepts-v2.jpg"],
  M4: ["/home/test-v2.jpg", "/home/plan-v2.jpg"],
  M5: ["/home/skills-v2.jpg", "/home/methods-v2.jpg"],
  SE1: ["/home/situations-v2.jpg", "/home/skills-v2.jpg"],
  F1: ["/home/plan-v2.jpg", "/home/concepts-v2.jpg"],
  AI1: ["/home/concepts-v2.jpg", "/home/methods-v2.jpg"],
  G1: ["/home/plan-v2.jpg", "/home/concepts-v2.jpg"],
  C1: ["/home/skills-v2.jpg", "/home/situations-v2.jpg"],
};
const POS = ["50% 50%", "30% 40%", "70% 45%", "50% 25%", "40% 70%", "65% 60%"];

export function photoFor(id: string, courseId: string) {
  if (ARTICLE_COVERS.has(id)) return { src: `/covers/${id}.jpg`, pos: "50% 45%" };
  const seed = hash(id);
  const list = PHOTOS[courseId] ?? ["/home/concepts-v2.jpg"];
  return { src: list[seed % list.length], pos: POS[(seed >> 3) % POS.length] };
}

/** غلاف بصورة: في البطاقات صورة فقط، وفي رأس المقال صورة وعليها العنوان */
export function Cover({ id, title, courseId, label, className = "", compact = false }: { id: string; title: string; courseId: string; label?: string; className?: string; compact?: boolean }) {
  const m = courseMeta(courseId);
  const p = photoFor(id, courseId);
  return (
    <span className={`relative block overflow-hidden bg-[#DDE8E2] ${className}`}>
      <img src={p.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p.pos }} />
      {compact ? (
        label && <span className="absolute bottom-2 start-2 max-w-[85%] truncate rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: `${m.color}E6` }}>{label}</span>
      ) : (
        <>
          <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,30,25,0.88)_0%,rgba(10,30,25,0.35)_55%,transparent_100%)]" />
          <span className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            {label && <span className="mb-2 inline-block rounded-md px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: m.color }}>{label}</span>}
            <span className="line-clamp-3 block font-display text-[22px] font-extrabold leading-[1.45] text-white sm:text-[28px]">{title}</span>
          </span>
        </>
      )}
    </span>
  );
}

/** صورة مصغرة */
export function MiniCover({ id, courseId, className = "" }: { id: string; title?: string; courseId: string; hint?: string; className?: string }) {
  const p = photoFor(id, courseId);
  return (
    <span className={`relative block overflow-hidden bg-[#DDE8E2] ${className}`}>
      <img src={p.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p.pos }} />
    </span>
  );
}
