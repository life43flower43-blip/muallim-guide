// غلاف خاص بكل مقال: لون المحور، وزخرفة تختلف بحسب المقال، وأيقونة من موضوعه، وعنوانه
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

/** غلاف كبير: يُستعمل في البطاقات وأعلى المقال */
export function Cover({ id, title, courseId, label, className = "", compact = false }: { id: string; title: string; courseId: string; label?: string; className?: string; compact?: boolean }) {
  const m = courseMeta(courseId);
  const seed = hash(id);
  const Icon = topicIcon(title) !== Compass ? topicIcon(title) : topicIcon(label ?? "");
  const angle = 120 + (seed % 100);
  return (
    <span className={`relative block overflow-hidden ${className}`} style={{ background: `linear-gradient(${angle}deg, ${m.color} 0%, ${m.color}CC 55%, #0E3B32 130%)` }}>
      <Pattern seed={seed} />
      {compact ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-white/15 ring-1 ring-white/25">
              <Icon className="h-11 w-11 text-white" strokeWidth={1.6} />
            </span>
          </span>
          {label && <span className="absolute bottom-3 start-3 max-w-[85%] truncate rounded-md bg-black/20 px-2 py-0.5 text-[12px] font-bold text-white/90">{label}</span>}
        </>
      ) : (
      <>
      <span className="absolute end-4 top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
        <Icon className="h-8 w-8 text-white" strokeWidth={1.7} />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4">
        {label && <span className="mb-1.5 inline-block rounded-md bg-black/20 px-2 py-0.5 text-[11px] font-bold text-white/90">{label}</span>}
        <span className="line-clamp-3 block font-display text-[20px] font-extrabold leading-[1.45] text-white sm:text-[24px]">{title}</span>
      </span>
      </>
      )}
    </span>
  );
}

/** غلاف مصغر: أيقونة الموضوع على لون المحور */
export function MiniCover({ id, title, courseId, hint = "", className = "" }: { id: string; title: string; courseId: string; hint?: string; className?: string }) {
  const m = courseMeta(courseId);
  const seed = hash(id);
  const Icon = topicIcon(title) !== Compass ? topicIcon(title) : topicIcon(hint);
  return (
    <span className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: `linear-gradient(${120 + (seed % 100)}deg, ${m.color}, ${m.color}B3)` }}>
      <Pattern seed={seed} />
      <Icon className="relative h-8 w-8 text-white" strokeWidth={1.8} />
    </span>
  );
}
