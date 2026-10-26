"use client";

// ============================================================================
// رسوم توضيحية للنظريات الأساسية — تظهر في صفحة قراءة المفهوم فوق الشرح
// ============================================================================
// مبنية بعناصر الصفحة نفسها لا بصور، فتبقى واضحة بالعربية على كل مقاس وفي الوضع الليلي.
// مصطلحاتها هي مصطلحات شرح المفهوم نفسه في البنك.
// ============================================================================

import { createContext, useContext } from "react";
import { ArrowDown, ArrowLeft } from "lucide-react";

// عنوان الصفحة التي يظهر فيها الرسم: لا يتكرر عنوان الرسم إن طابقه
const PageTitleCtx = createContext("");

const C = ["#C98A1E", "#E3A93B", "#E3A93B", "#1F8A6E", "#136F5C", "#1F7A63", "#14B8A6", "#6366F1"];
const tint = (c: string, p = 14) => `color-mix(in srgb, ${c} ${p}%, var(--card))`;

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  const page = useContext(PageTitleCtx);
  return (
    <figure className="rounded-2xl border-2 border-border bg-card p-4" aria-label={title}>
      {page.trim() !== title.trim() && <figcaption className="mb-4 text-center font-display text-base font-bold">{title}</figcaption>}
      {children}
    </figure>
  );
}

/** هرم: القاعدة في الأسفل */
function Pyramid({ title, levels }: { title: string; levels: { name: string; note?: string }[] }) {
  const n = levels.length;
  return (
    <Frame title={title}>
      <div className="flex flex-col items-center gap-1.5">
        {[...levels].reverse().map((l, i) => {
          const k = n - 1 - i;
          return (
            <div
              key={l.name}
              className="rounded-[6px] px-3 py-2 text-center text-white"
              style={{ width: `${44 + ((n - 1 - k) / Math.max(1, n - 1)) * 56}%`, background: C[(n - 1 - k) % C.length] }}
            >
              <p className="text-base font-bold leading-6">{l.name}</p>
              {l.note && <p className="text-sm leading-5 opacity-90">{l.note}</p>}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/** خطوات متتابعة رأسية */
function Steps({ title, steps }: { title: string; steps: { name: string; note?: string; tag?: string }[] }) {
  return (
    <Frame title={title}>
      <ol className="space-y-1">
        {steps.map((s, i) => (
          <li key={s.name}>
            <div className="flex items-center gap-3 rounded-xl border-2 p-3" style={{ borderColor: C[i % C.length], background: tint(C[i % C.length]) }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C[i % C.length] }}>
                {(i + 1).toLocaleString("ar-u-nu-arab")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold leading-6">{s.name}</p>
                {s.note && <p className="text-sm leading-6 text-secondary-foreground">{s.note}</p>}
              </div>
              {s.tag && <span className="shrink-0 text-sm font-bold" style={{ color: C[i % C.length] }}>{s.tag}</span>}
            </div>
            {i < steps.length - 1 && <ArrowDown className="mx-auto my-0.5 h-4 w-4 text-muted-foreground" />}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

function Maslow() {
  return (
    <Pyramid
      title="هرم ماسلو للحاجات"
      levels={[
        { name: "الحاجات الفسيولوجية", note: "الطعام والشراب والنوم" },
        { name: "الأمن والسلامة", note: "الحماية والاستقرار" },
        { name: "الانتماء والحب", note: "القبول والصداقة" },
        { name: "التقدير", note: "احترام الذات والآخرين" },
        { name: "تحقيق الذات" },
      ]}
    />
  );
}

function Bloom() {
  return (
    <Pyramid
      title="مستويات بلوم المعرفية (التصنيف المحدّث)"
      levels={[
        { name: "تذكر", note: "استرجاع المعلومات" },
        { name: "فهم", note: "الشرح بكلمات أخرى" },
        { name: "تطبيق", note: "الاستخدام في موقف جديد" },
        { name: "تحليل", note: "التفكيك وكشف العلاقات" },
        { name: "تقويم", note: "الحكم بمعيار معلن" },
        { name: "إنشاء", note: "توليد عمل جديد" },
      ]}
    />
  );
}

function FreudStructure() {
  return (
    <Frame title="بنية الشخصية عند فرويد">
      <div className="overflow-hidden rounded-xl border-2 border-[#136F5C]">
        <div className="bg-[#DCEFE5] p-3 text-center dark:bg-[#136F5C]/15">
          <p className="text-sm text-secondary-foreground">الشعور</p>
          <p className="mt-1 text-base font-bold">الأنا الأعلى: الضمير ومبدأ الكمال</p>
        </div>
        <div className="bg-[#B8E6FF] p-3 text-center dark:bg-[#136F5C]/25">
          <p className="text-base font-bold">الأنا: الوسيط الواقعي بين الرغبة والواقع</p>
        </div>
        <div className="bg-[#0D5848] p-4 text-center text-white">
          <p className="text-sm opacity-80">اللاشعور</p>
          <p className="mt-1 text-base font-bold">الهو: الدوافع ومبدأ اللذة</p>
        </div>
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">ينشأ الأنا والأنا الأعلى من الهو بالاحتكاك بالواقع والتنشئة</p>
    </Frame>
  );
}

function FreudStages() {
  return (
    <Steps
      title="مراحل التطور النفسي عند فرويد"
      steps={[
        { name: "الفمية", note: "الرضاعة والمص", tag: "الرضاعة" },
        { name: "الشرجية", note: "ضبط الإخراج والنظام", tag: "١–٣ سنوات" },
        { name: "القضيبية", note: "الوعي بالجسم وفرق الجنس", tag: "٣–٦ سنوات" },
        { name: "الكامنة", note: "الطاقة إلى المدرسة والأصدقاء", tag: "٦–البلوغ" },
        { name: "التناسلية", note: "المراهقة", tag: "البلوغ" },
      ]}
    />
  );
}

function Erikson() {
  const rows = [
    ["الرضاعة", "الثقة مقابل عدم الثقة", "الأمل"],
    ["الطفولة المبكرة", "الاستقلال مقابل الخجل والشك", "الإرادة"],
    ["ما قبل المدرسة", "المبادرة مقابل الذنب", "الغاية"],
    ["المدرسة", "الإجادة مقابل الدونية", "الكفاءة"],
    ["المراهقة", "الهوية مقابل تشتت الدور", "الإخلاص"],
    ["الرشد المبكر", "الحميمية مقابل الانعزال", "الحب"],
    ["منتصف العمر", "الإنتاجية مقابل الركود", "الرعاية"],
    ["الشيخوخة", "التكامل مقابل اليأس", "الحكمة"],
  ];
  return (
    <Frame title="مراحل إريكسون الثماني">
      <div className="space-y-1.5">
        {rows.map(([age, crisis, virtue], i) => (
          <div key={age} className="grid grid-cols-[96px_1fr_auto] items-center gap-2 rounded-xl p-2.5" style={{ background: tint(C[i % C.length], 16) }}>
            <span className="text-sm font-bold" style={{ color: C[i % C.length] }}>
              {age}
            </span>
            <span className="text-base font-bold leading-6">{crisis}</span>
            <span className="rounded-[6px] px-2 py-0.5 text-sm font-bold text-white" style={{ background: C[i % C.length] }}>
              {virtue}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">العمود الأخير: الفضيلة التي يمنحها حسم الأزمة إيجابيًّا</p>
    </Frame>
  );
}

function Kohlberg() {
  const levels = [
    { name: "ما قبل العرفي", stages: ["تجنب العقاب والطاعة", "المنفعة المتبادلة"] },
    { name: "العرفي", stages: ["رضا الآخرين والعلاقات", "القانون والنظام"] },
    { name: "ما بعد العرفي", stages: ["العقد الاجتماعي", "المبادئ الأخلاقية العامة"] },
  ];
  return (
    <Frame title="مستويات كولبرغ للحكم الأخلاقي">
      <div className="space-y-2">
        {levels.map((l, i) => (
          <div key={l.name} className="rounded-xl border-2 p-3" style={{ borderColor: C[i * 2 + 1], background: tint(C[i * 2 + 1]) }}>
            <p className="text-base font-bold" style={{ color: C[i * 2 + 1] }}>
              {l.name}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {l.stages.map((s, k) => (
                <span key={s} className="rounded-[6px] bg-card p-2 text-center text-sm font-bold leading-6">
                  {(i * 2 + k + 1).toLocaleString("ar-u-nu-arab")}. {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Kolb() {
  const box = (name: string, note: string, c: string) => (
    <div className="rounded-xl border-2 p-3 text-center" style={{ borderColor: c, background: tint(c) }}>
      <p className="text-base font-bold leading-6">{name}</p>
      <p className="text-sm leading-6 text-secondary-foreground">{note}</p>
    </div>
  );
  return (
    <Frame title="دورة التعلم التجريبي عند كولب">
      <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-y-2">
        {box("خبرة ملموسة", "تُعاش بالحواس", C[0])}
        <ArrowLeft className="mx-auto h-5 w-5 text-muted-foreground" />
        {box("ملاحظة تأملية", "قراءة ما جرى", C[4])}
        <ArrowDown className="mx-auto h-5 w-5 rotate-180 text-muted-foreground" />
        <span />
        <ArrowDown className="mx-auto h-5 w-5 text-muted-foreground" />
        {box("تنشيط تجريبي", "اختبار المبدأ في موقف جديد", C[3])}
        <ArrowLeft className="mx-auto h-5 w-5 rotate-180 text-muted-foreground" />
        {box("تجريد", "استخلاص مبدأ عام", C[5])}
      </div>
    </Frame>
  );
}

function FiveE() {
  return (
    <Steps
      title="دورة التعلم الخماسية"
      steps={[
        { name: "الانشغال", note: "سؤال أو ظاهرة محيرة تكشف المعرفة السابقة" },
        { name: "الاستكشاف", note: "نشاط عملي قبل أي شرح" },
        { name: "التفسير", note: "يعرض الطلاب ما وجدوا ثم يقدم المعلم المصطلح" },
        { name: "التوسع", note: "تطبيق المفهوم في مواقف جديدة" },
        { name: "التقويم", note: "تقدير مدى الفهم" },
      ]}
    />
  );
}

function Zpd() {
  return (
    <Frame title="منطقة النمو القريب عند فيجوتسكي">
      <div className="mx-auto flex aspect-square max-w-[300px] items-center justify-center rounded-full bg-muted p-[9%] text-center">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#E3A93B] p-[14%] dark:bg-[#E3A93B]/70">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1F8A6E] p-2 text-white">
            <p className="text-sm font-bold leading-5">ما يستطيعه وحده</p>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#1F8A6E]" /> ما يؤديه الطالب بمفرده</p>
        <p className="flex items-start gap-2"><span className="mt-1.5 h-3 w-3 shrink-0 rounded-sm bg-[#E3A93B]" /><span><b>منطقة النمو القريب:</b> ما يؤديه بمساعدة الأكثر خبرة، وفيها يُثمر التدريس</span></p>
        <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-border bg-muted" /> ما يفوق قدرته حتى بالمساعدة</p>
      </div>
    </Frame>
  );
}

function Gardner() {
  const kinds = [
    ["اللساني", "اللغة وألفاظها"],
    ["المنطقي الرياضي", "الاستدلال والأعداد"],
    ["الفضائي", "العلاقات المكانية والصور"],
    ["الحركي", "حركات الجسم وتناسقها"],
    ["الموسيقي", "الإيقاع والنغم"],
    ["الاجتماعي", "فهم الآخرين"],
    ["الذاتي", "الوعي بالنفس"],
    ["الطبيعي", "تصنيف مظاهر البيئة"],
  ];
  return (
    <Frame title="الذكاءات الثمانية عند جاردنر">
      <div className="grid grid-cols-2 gap-2">
        {kinds.map(([k, n], i) => (
          <div key={k} className="rounded-xl border-[1.5px] p-2.5 text-center" style={{ borderColor: C[i], background: tint(C[i]) }}>
            <p className="text-base font-bold">{k}</p>
            <p className="text-sm leading-5 text-secondary-foreground">{n}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Forgetting() {
  return (
    <Frame title="منحنى النسيان وأثر المراجعة">
      <svg viewBox="0 0 320 170" className="w-full" role="img" aria-label="النسيان سريع في الساعات الأولى ثم يتباطأ، وكل مراجعة تجعل الانحدار التالي أبطأ">
        <line x1="300" y1="10" x2="300" y2="150" stroke="var(--border)" strokeWidth="2" />
        <line x1="20" y1="150" x2="300" y2="150" stroke="var(--border)" strokeWidth="2" />
        {/* دون مراجعة */}
        <path d="M300 18 C 270 95, 230 120, 20 132" fill="none" stroke="#FF4B4B" strokeWidth="4" strokeLinecap="round" />
        {/* مع المراجعة: ارتداد بعد كل مراجعة وانحدار أبطأ */}
        <path d="M300 18 C 288 50, 270 60, 250 64 L250 22 C 235 45, 210 52, 180 55 L180 22 C 160 36, 120 42, 90 44 L90 22 C 70 30, 45 33, 20 34" fill="none" stroke="#1F8A6E" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex justify-between text-sm text-muted-foreground">
        <span>لحظة التعلم</span>
        <span>الزمن</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <p className="flex items-center gap-2"><span className="h-1.5 w-6 rounded-full bg-[#FF4B4B]" /> دون مراجعة: يضيع جزء كبير في اليوم الأول</p>
        <p className="flex items-center gap-2"><span className="h-1.5 w-6 rounded-full bg-[#1F8A6E]" /> مع مراجعات متباعدة: كل مراجعة تبطئ النسيان التالي</p>
      </div>
    </Frame>
  );
}

function Pavlov() {
  const row = (label: string, a: string, b: string, c: string) => (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="mb-2 text-sm font-bold text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <span className="flex-1 rounded-[6px] p-2 text-center text-sm font-bold leading-6" style={{ background: tint(c, 20) }}>{a}</span>
        <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="flex-1 rounded-[6px] p-2 text-center text-sm font-bold leading-6" style={{ background: tint(C[3], 20) }}>{b}</span>
      </div>
    </div>
  );
  return (
    <Frame title="الإشراط الكلاسيكي عند بافلوف">
      <div className="space-y-2">
        {row("قبل الإشراط", "الطعام: محفز غير مشروط", "اللعاب: استجابة غير مشروطة", C[1])}
        {row("أثناء الإشراط", "الجرس المحايد مع الطعام مرارًا", "اللعاب", C[4])}
        {row("بعد الإشراط", "الجرس: محفز مشروط", "اللعاب: استجابة مشروطة", C[5])}
      </div>
    </Frame>
  );
}


/** بطاقات متجاورة: عنوان وشرح قصير لكل عنصر */
function Tiles({ title, items, cols = 2 }: { title: string; items: [string, string][]; cols?: 1 | 2 }) {
  return (
    <Frame title={title}>
      <div className={cols === 2 ? "grid grid-cols-2 gap-2" : "space-y-2"}>
        {items.map(([k, n], i) => (
          <div key={k} className="rounded-xl border-[1.5px] p-2.5 text-center" style={{ borderColor: C[i % C.length], background: tint(C[i % C.length]) }}>
            <p className="text-base font-bold leading-6">{k}</p>
            <p className="text-sm leading-6 text-secondary-foreground">{n}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** مقارنة بين جهتين في صفوف */
function Compare({ title, a, b, rows }: { title: string; a: string; b: string; rows: [string, string, string][] }) {
  return (
    <Frame title={title}>
      <div className="grid grid-cols-2 gap-2 text-center">
        <p className="rounded-[6px] bg-[#136F5C] p-2 text-base font-bold text-white">{a}</p>
        <p className="rounded-[6px] bg-[#1F7A63] p-2 text-base font-bold text-white">{b}</p>
        {rows.map(([topic, x, y]) => (
          <div key={topic} className="col-span-2">
            <p className="mb-1 text-sm font-bold text-muted-foreground">{topic}</p>
            <div className="grid grid-cols-2 gap-2">
              <p className="rounded-[6px] p-2 text-sm font-medium leading-6" style={{ background: tint("#136F5C") }}>{x}</p>
              <p className="rounded-[6px] p-2 text-sm font-medium leading-6" style={{ background: tint("#1F7A63") }}>{y}</p>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function InfoProcessing() {
  const box = (name: string, note: string, c: string) => (
    <div className="flex-1 rounded-xl border-2 p-2.5 text-center" style={{ borderColor: c, background: tint(c) }}>
      <p className="text-base font-bold leading-6">{name}</p>
      <p className="text-sm leading-5 text-secondary-foreground">{note}</p>
    </div>
  );
  return (
    <Frame title="نموذج معالجة المعلومات عند أتكينسون وشفرين">
      <div className="space-y-1">
        <p className="text-center text-sm font-bold text-muted-foreground">مدخلات الحواس</p>
        <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" />
        {box("المخزن الحسي", "جزء من الثانية للبصري وثوانٍ للسمعي", C[1])}
        <p className="text-center text-sm font-bold text-[#0D5848]">↓ الانتباه</p>
        {box("المخزن قصير المدى", "نحو سبعة عناصر ونحو عشرين ثانية", C[4])}
        <p className="text-center text-sm font-bold text-[#0D5848]">↓ المراجعة والتنظيم</p>
        {box("المخزن طويل المدى", "سعة شبه غير محدودة ومدد ممتدة", C[3])}
        <p className="pt-1 text-center text-sm text-muted-foreground">ما لا يُنتبه إليه يسقط، وما لا يُراجَع يُنسى</p>
      </div>
    </Frame>
  );
}

function WorkingMemory() {
  return (
    <Frame title="الذاكرة العاملة عند باديلي">
      <div className="mx-auto w-fit rounded-xl bg-[#C98A1E] px-5 py-2.5 text-center text-white">
        <p className="text-base font-bold">التنفيذي المركزي</p>
        <p className="text-sm opacity-90">يوزع الانتباه وينسق</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["الحلقة الصوتية", "المعلومات اللفظية", C[4]],
          ["المخزن المرحلي", "يربط المكونات بالذاكرة الطويلة", C[5]],
          ["المفكرة البصرية المكانية", "الصور والمواقع", C[3]],
        ].map(([n, d, c]) => (
          <div key={n} className="rounded-xl border-2 p-2" style={{ borderColor: c, background: tint(c) }}>
            <p className="text-sm font-bold leading-6">{n}</p>
            <p className="text-xs leading-5 text-secondary-foreground">{d}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Bandura() {
  return (
    <Steps
      title="مراحل التعلم بالملاحظة عند باندورا"
      steps={[
        { name: "الانتباه", note: "تركيز النظر على أفعال النموذج" },
        { name: "الاحتفاظ", note: "تخزين المشهد صورًا ذهنية وترميزًا لفظيًّا" },
        { name: "الإعادة الإنتاجية", note: "تحويل ما حُفظ إلى أداء فعلي" },
        { name: "الدافعية", note: "محفز يدفع إلى إظهار السلوك" },
      ]}
    />
  );
}

function PiagetStages() {
  return (
    <Steps
      title="مراحل النمو المعرفي عند بياجيه"
      steps={[
        { name: "الحس حركية", note: "التعلم بالحواس والحركة وثبات الشيء", tag: "٠–٢" },
        { name: "ما قبل العمليات", note: "الرمز واللغة والتمركز حول الذات", tag: "٢–٧" },
        { name: "العمليات المادية", note: "منطق منظم مقيد بالملموس", tag: "٧–١١" },
        { name: "العمليات المجردة", note: "الفرضيات والتفكير في التفكير", tag: "١١ فما بعد" },
      ]}
    />
  );
}

function PiagetVygotsky() {
  return (
    <Compare
      title="بياجيه وفيجوتسكي"
      a="بياجيه"
      b="فيجوتسكي"
      rows={[
        ["صورة الطفل", "عالم صغير يكتشف وحده", "اجتماعي منذ البداية"],
        ["التعلم والنمو", "النمو يسبق التعلم", "التعلم يقود النمو"],
        ["مصدر المعرفة", "التفاعل الفردي مع الأشياء", "اللغة والتفاعل مع الأدرى"],
        ["في الصف", "أنشطة اكتشاف تناسب الجاهزية", "دعم موجه وحوار وتعاون"],
      ]}
    />
  );
}

function ValidityReliability() {
  const target = (hits: [number, number][], label: string, note: string, ok: boolean) => (
    <div className="text-center">
      <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-[120px]" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="var(--card)" stroke="var(--border)" strokeWidth="3" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="50" cy="50" r="15" fill="#FFDFE0" stroke="#FF4B4B" strokeWidth="3" />
        {hits.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill={ok ? "#1F8A6E" : "#136F5C"} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <p className="mt-1 text-sm font-bold">{label}</p>
      <p className="text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
  return (
    <Frame title="العلاقة بين الصدق والثبات">
      <div className="grid grid-cols-3 gap-2">
        {target([[22, 30], [74, 26], [30, 76], [70, 72], [52, 14]], "لا ثبات", "ولا صدق", false)}
        {target([[24, 24], [29, 21], [22, 30], [30, 28], [26, 33]], "ثبات بلا صدق", "مستقر في الخطأ", false)}
        {target([[48, 47], [53, 52], [46, 54], [55, 46], [50, 50]], "ثبات وصدق", "مستقر ويصيب الهدف", true)}
      </div>
      <p className="mt-3 text-center text-sm font-bold">لا صدق بلا ثبات، وقد يوجد ثبات بلا صدق</p>
    </Frame>
  );
}

function AssessmentTimeline() {
  const items: [string, string, string][] = [
    ["قبل التعلم", "التشخيصي", "رسم نقاط القوة والضعف"],
    ["أثناء التعلم", "التكويني", "تغذية راجعة وتعديل التدريس"],
    ["بعد التعلم", "الختامي", "الحكم على تحقق الأهداف"],
  ];
  return (
    <Frame title="التقويم بحسب توقيته">
      <div className="relative grid grid-cols-3 gap-2 text-center">
        <span className="absolute inset-x-6 top-4 h-1 rounded-full bg-border" aria-hidden="true" />
        {items.map(([when, name, note], i) => (
          <div key={name} className="relative">
            <span className="mx-auto block h-9 w-9 rounded-full border-4 border-card" style={{ background: C[[1, 4, 3][i]] }} />
            <p className="mt-1 text-xs text-muted-foreground">{when}</p>
            <p className="text-base font-bold">{name}</p>
            <p className="text-sm leading-5 text-secondary-foreground">{note}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function NormalCurve() {
  return (
    <Frame title="التوزيع الاعتدالي والانحراف المعياري">
      <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="منحنى الجرس: أغلب الدرجات قرب المتوسط وتقل كلما ابتعدنا عنه">
        <path d="M10 130 C 70 130, 100 128, 125 80 C 145 38, 150 18, 160 18 C 170 18, 175 38, 195 80 C 220 128, 250 130, 310 130 Z" fill="#DCEFE5" stroke="#136F5C" strokeWidth="3" />
        <path d="M125 80 C 145 38, 150 18, 160 18 C 170 18, 175 38, 195 80 L195 130 L125 130 Z" fill="#136F5C" opacity="0.35" />
        <line x1="160" y1="14" x2="160" y2="132" stroke="#C98A1E" strokeWidth="2.5" strokeDasharray="5 4" />
        <line x1="10" y1="132" x2="310" y2="132" stroke="var(--border)" strokeWidth="2" />
      </svg>
      <div className="mt-1 grid grid-cols-3 text-center text-sm">
        <span className="text-muted-foreground">درجات منخفضة</span>
        <span className="font-bold text-[#C98A1E]">المتوسط</span>
        <span className="text-muted-foreground">درجات مرتفعة</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
        <p className="rounded-[6px] p-2 leading-6" style={{ background: tint(C[3]) }}><b>انحراف صغير:</b> صف متجانس متقارب</p>
        <p className="rounded-[6px] p-2 leading-6" style={{ background: tint(C[1]) }}><b>انحراف كبير:</b> تفاوت يستدعي تدريسًا متمايزًا</p>
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">الرتبة المئينية: نسبة الطلاب الذين تقل درجاتهم عن درجة الطالب</p>
    </Frame>
  );
}

function ProblemSolving() {
  return (
    <Steps
      title="خطوات حل المشكلات"
      steps={[
        { name: "فهم المشكلة وتحديدها", note: "المطلوب والمعطيات والقيود" },
        { name: "تمثيل المشكلة", note: "رسم أو جدول أو معادلة" },
        { name: "استدعاء المعرفة المرتبطة" },
        { name: "تخطيط الحل", note: "اختيار استراتيجية مناسبة" },
        { name: "التنفيذ مع المراقبة" },
        { name: "التحقق من الحل" },
        { name: "الاستفادة", note: "ماذا تعلمت من المشكلة؟" },
      ]}
    />
  );
}

function CoopElements() {
  return (
    <Tiles
      title="عناصر التعلم التعاوني الخمسة"
      cols={1}
      items={[
        ["الاعتماد المتبادل الإيجابي", "نجاح الفرد مرتبط بنجاح المجموعة"],
        ["المسؤولية الفردية", "يُحاسَب كل طالب على إسهامه"],
        ["التفاعل المباشر", "عمل ونقاش وجهًا لوجه"],
        ["المهارات الاجتماعية", "الحوار والإنصات وإدارة الخلاف"],
        ["معالجة المجموعة", "مراجعة الأداء واقتراح التحسين"],
      ]}
    />
  );
}

function Jigsaw() {
  return (
    <Steps
      title="خطوات التعلم بالتجزيء (جيكسو)"
      steps={[
        { name: "تقسيم المحتوى", note: "أجزاء متكافئة بعدد أعضاء المجموعة" },
        { name: "مجموعات الخبراء", note: "يجتمع أصحاب الجزء نفسه لدراسته" },
        { name: "العودة إلى المجموعة الأصلية", note: "كل خبير يعلّم جزءه" },
        { name: "التقويم الفردي", note: "يغطي المحتوى كله" },
      ]}
    />
  );
}

function Thorndike() {
  return (
    <Tiles
      title="قوانين ثورندايك الثلاثة"
      cols={1}
      items={[
        ["قانون الأثر", "الاستجابة التي يتبعها رضا تقوى، والتي يتبعها عدم رضا تضعف"],
        ["قانون الاستعداد", "الروابط المستعدة للعمل يبعث عملها على الرضا"],
        ["قانون التمرين", "الممارسة تقوي الروابط وانقطاعها يضعفها"],
      ]}
    />
  );
}

function Gestalt() {
  const dot = (cx: number, cy: number, c = "#136F5C") => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill={c} />;
  const law = (name: string, note: string, art: React.ReactNode) => (
    <div className="rounded-xl border-2 border-border p-2 text-center">
      <svg viewBox="0 0 80 50" className="mx-auto h-12 w-full" aria-hidden="true">{art}</svg>
      <p className="text-sm font-bold">{name}</p>
      <p className="text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
  return (
    <Frame title="قوانين الجشطالت في الإدراك">
      <div className="grid grid-cols-2 gap-2">
        {law("القرب", "المتقاربات مجموعة واحدة", <>{[10, 22].flatMap((x) => [15, 35].map((y) => dot(x, y)))}{[54, 66].flatMap((x) => [15, 35].map((y) => dot(x, y)))}</>)}
        {law("الشبه", "المتشابهات تُجمع معًا", <>{[10, 30, 50, 70].map((x, i) => dot(x, 15, i % 2 ? "#E3A93B" : "#136F5C"))}{[10, 30, 50, 70].map((x, i) => dot(x, 35, i % 2 ? "#E3A93B" : "#136F5C"))}</>)}
        {law("الإغلاق", "يكمل الذهن الشكل الناقص", <circle cx="40" cy="25" r="18" fill="none" stroke="#1F8A6E" strokeWidth="4" strokeDasharray="24 8" />)}
        {law("الشكل والخلفية", "يبرز المهم على محيطه", <><rect x="5" y="3" width="70" height="44" rx="4" fill="var(--muted)" /><rect x="27" y="13" width="26" height="24" rx="4" fill="#C98A1E" /></>)}
      </div>
    </Frame>
  );
}

function Ausubel() {
  return (
    <Frame title="المنظم المتقدم عند أوزوبل">
      <div className="space-y-1 text-center">
        <p className="rounded-xl bg-[#1F7A63] p-2.5 text-base font-bold text-white">المنظم المتقدم: إطار عام قبل الدرس</p>
        <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" />
        <div className="grid grid-cols-2 gap-2">
          <p className="rounded-xl border-2 border-[#136F5C] p-2 text-sm font-bold leading-6" style={{ background: tint("#136F5C") }}>الاستدلالي: إطار تُشتق منه التفاصيل</p>
          <p className="rounded-xl border-2 border-[#E3A93B] p-2 text-sm font-bold leading-6" style={{ background: tint("#E3A93B") }}>المقارن: يوازن بالمألوف ليمنع الخلط</p>
        </div>
        <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" />
        <p className="rounded-xl border-2 border-[#1F8A6E] p-2.5 text-base font-bold" style={{ background: tint("#1F8A6E") }}>المحتوى الجديد يرتبط بالبنية المعرفية السابقة</p>
        <p className="pt-1 text-sm text-muted-foreground">فيصير التلقي ذا معنى لا حفظًا رتيبًا</p>
      </div>
    </Frame>
  );
}

function Cpa() {
  return (
    <Frame title="من الملموس إلى المجرد">
      <div className="grid grid-cols-[1fr_20px_1fr_20px_1fr] items-center text-center">
        <div className="rounded-xl border-2 p-2" style={{ borderColor: C[1], background: tint(C[1]) }}>
          <div className="mx-auto mb-1 flex w-fit gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-4 w-4 rounded-[3px] bg-[#E3A93B]" />)}</div>
          <p className="text-sm font-bold">ملموس</p>
          <p className="text-xs text-muted-foreground">مكعبات بين اليدين</p>
        </div>
        <ArrowLeft className="mx-auto h-4 w-4 text-muted-foreground" />
        <div className="rounded-xl border-2 p-2" style={{ borderColor: C[4], background: tint(C[4]) }}>
          <div className="mx-auto mb-1 flex w-fit gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-4 w-4 rounded-full border-2 border-[#136F5C]" />)}</div>
          <p className="text-sm font-bold">صوري</p>
          <p className="text-xs text-muted-foreground">رسوم وأشكال</p>
        </div>
        <ArrowLeft className="mx-auto h-4 w-4 text-muted-foreground" />
        <div className="rounded-xl border-2 p-2" style={{ borderColor: C[5], background: tint(C[5]) }}>
          <p className="mb-1 text-base font-extrabold text-[#1F7A63]">٣</p>
          <p className="text-sm font-bold">مجرد</p>
          <p className="text-xs text-muted-foreground">رموز وأرقام</p>
        </div>
      </div>
    </Frame>
  );
}

function Motivation() {
  return (
    <Compare
      title="الدافعية الداخلية والخارجية"
      a="داخلية"
      b="خارجية"
      rows={[
        ["مصدرها", "النشاط نفسه: الفضول ومتعة الفهم والإتقان", "عوامل خارجه: الجوائز والدرجات والثناء"],
        ["استمرارها", "ثابتة لا تتوقف على المعزز", "تضعف حين تزول المكافأة"],
        ["أثرها", "تعلم أعمق وإبداع أكبر", "مفيدة في بداية تعلم مهارة جديدة"],
      ]}
    />
  );
}

const MAP: Record<string, () => React.ReactElement> = {
  C078: Maslow,
  D1332: Maslow,
  D1461: Bloom,
  D1466: Bloom,
  D1660: Bloom,
  D1676: Bloom,
  D1685: Bloom,
  D1321: FreudStructure,
  D1925: FreudStructure,
  D1325: FreudStages,
  D926: Erikson,
  D1328: Erikson,
  D974: Kohlberg,
  D1254: Kolb,
  N612: FiveE,
  D925: Zpd,
  C064: Zpd,
  C049: Gardner,
  D1303: Gardner,
  C071: Forgetting,
  C059: Pavlov,
  D1204: Pavlov,
  D1234: InfoProcessing,
  D1235: WorkingMemory,
  D1211: Bandura,
  C065: Bandura,
  D921: PiagetStages,
  D922: PiagetStages,
  D923: PiagetStages,
  D924: PiagetStages,
  D1222: PiagetStages,
  D1223: PiagetStages,
  D1224: PiagetStages,
  D1225: PiagetStages,
  D1227: PiagetStages,
  D1233: PiagetVygotsky,
  D1629: ValidityReliability,
  C086: ValidityReliability,
  C087: ValidityReliability,
  D1311: ValidityReliability,
  C094: AssessmentTimeline,
  D1605: AssessmentTimeline,
  D1603: AssessmentTimeline,
  D1604: AssessmentTimeline,
  C282: AssessmentTimeline,
  C283: AssessmentTimeline,
  D1705: NormalCurve,
  D1706: NormalCurve,
  D1707: NormalCurve,
  D1425: ProblemSolving,
  D1272: ProblemSolving,
  D2013: ProblemSolving,
  D1474: CoopElements,
  D1270: CoopElements,
  C181: CoopElements,
  D1810: Jigsaw,
  C060: Thorndike,
  D1206: Thorndike,
  D1215: Gestalt,
  D1218: Ausubel,
  C105: Cpa,
  N604: Cpa,
  C077: Motivation,
  D1483: Motivation,
};

export function ConceptDiagram({ conceptId, pageTitle = "" }: { conceptId: string; pageTitle?: string }) {
  const D = MAP[conceptId];
  return D ? (
    <PageTitleCtx.Provider value={pageTitle}>
      <D />
    </PageTitleCtx.Provider>
  ) : null;
}
