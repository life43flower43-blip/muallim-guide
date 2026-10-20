"use client";

// ============================================================================
// رسوم توضيحية للنظريات الأساسية — تظهر في صفحة قراءة المفهوم فوق الشرح
// ============================================================================
// مبنية بعناصر الصفحة نفسها لا بصور، فتبقى واضحة بالعربية على كل مقاس وفي الوضع الليلي.
// مصطلحاتها هي مصطلحات شرح المفهوم نفسه في البنك.
// ============================================================================

import { ArrowDown, ArrowLeft } from "lucide-react";

const C = ["#E8467C", "#FF9600", "#FFC800", "#58CC02", "#1CB0F6", "#A560E8", "#14B8A6", "#6366F1"];
const tint = (c: string, p = 14) => `color-mix(in srgb, ${c} ${p}%, var(--card))`;

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="rounded-2xl border-2 border-border bg-card p-4">
      <figcaption className="mb-4 text-center font-display text-base font-bold">{title}</figcaption>
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
      <div className="overflow-hidden rounded-xl border-2 border-[#1CB0F6]">
        <div className="bg-[#DDF4FF] p-3 text-center dark:bg-[#1CB0F6]/15">
          <p className="text-sm text-secondary-foreground">الشعور</p>
          <p className="mt-1 text-base font-bold">الأنا الأعلى: الضمير ومبدأ الكمال</p>
        </div>
        <div className="bg-[#B8E6FF] p-3 text-center dark:bg-[#1CB0F6]/25">
          <p className="text-base font-bold">الأنا: الوسيط الواقعي بين الرغبة والواقع</p>
        </div>
        <div className="bg-[#1478A8] p-4 text-center text-white">
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
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#FFC800] p-[14%] dark:bg-[#FFC800]/70">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#58CC02] p-2 text-white">
            <p className="text-sm font-bold leading-5">ما يستطيعه وحده</p>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#58CC02]" /> ما يؤديه الطالب بمفرده</p>
        <p className="flex items-start gap-2"><span className="mt-1.5 h-3 w-3 shrink-0 rounded-sm bg-[#FFC800]" /><span><b>منطقة النمو القريب:</b> ما يؤديه بمساعدة الأكثر خبرة، وفيها يُثمر التدريس</span></p>
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
          <div key={k} className="rounded-xl border-2 border-b-4 p-2.5 text-center" style={{ borderColor: C[i], background: tint(C[i]) }}>
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
        <path d="M300 18 C 288 50, 270 60, 250 64 L250 22 C 235 45, 210 52, 180 55 L180 22 C 160 36, 120 42, 90 44 L90 22 C 70 30, 45 33, 20 34" fill="none" stroke="#58CC02" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex justify-between text-sm text-muted-foreground">
        <span>لحظة التعلم</span>
        <span>الزمن</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <p className="flex items-center gap-2"><span className="h-1.5 w-6 rounded-full bg-[#FF4B4B]" /> دون مراجعة: يضيع جزء كبير في اليوم الأول</p>
        <p className="flex items-center gap-2"><span className="h-1.5 w-6 rounded-full bg-[#58CC02]" /> مع مراجعات متباعدة: كل مراجعة تبطئ النسيان التالي</p>
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
};

export function ConceptDiagram({ conceptId }: { conceptId: string }) {
  const D = MAP[conceptId];
  return D ? <D /> : null;
}
