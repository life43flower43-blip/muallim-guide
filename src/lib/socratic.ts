// المدرّب السقراطي — يبني خطوات تفكير موجّهة بعد الخطأ بدل إعطاء الجواب مباشرة
// يستحضر المفهوم المرتبط بالسؤال ويقود الطالب من تحديد المطلوب إلى الوصول للإجابة بنفسه.

import { conceptById } from "./qbank";
import type { Question } from "./types";

export interface SocraticStep {
  prompt: string;
  hint: string;
}

export function buildSocraticSteps(q: Question): SocraticStep[] {
  const concept = conceptById(q.conceptId);
  const title = concept?.title ?? "المفهوم المرتبط بالسؤال";
  const chapter = concept?.chapter ?? "";
  const example = concept?.example ?? "";
  const correct = q.correct;

  return [
    {
      prompt: "ما الذي يسأل عنه السؤال تحديداً؟ حدّد المطلوب قبل النظر إلى الخيارات.",
      hint: `السؤال يدور حول مفهوم «${title}»${chapter ? ` في موضوع «${chapter}»` : ""}. استرجع تعريفه وجوهره أولاً.`,
    },
    {
      prompt: "افحص الخيارات بعين ناقدة: هل يوجد خيار يستبعد نفسه لغةً أو منطقاً؟",
      hint: "ابحث عن الصيغ المطلقة مثل «دائماً» و«بلا استثناء» و«كل» — فهي غالباً خيارات خاطئة مبالغ فيها. ابدأ باستبعادها.",
    },
    {
      prompt: "اربط ما تبقى بالواقع التربوي: أي الخيارات يطابق ما يحدث فعلاً في الميدان؟",
      hint: example
        ? `تذكّر المثال التطبيقي للمفهوم: ${example.slice(0, 120)}${example.length > 120 ? "…" : ""} — أي خيار يطابق هذا الواقع؟`
        : "تذكّر موقفاً صفياً حقيقياً تعاملت فيه مع هذا المفهوم، وقارنه بكل خيار متبقٍ.",
    },
    {
      prompt: "اختر الآن الإجابة الأقرب إلى تعريف المفهوم وأدلته — وستصل إليها بنفسك.",
      hint: `الإجابة الصحيحة: ${correct}. ${q.reason.slice(0, 130)}${q.reason.length > 130 ? "…" : ""}`,
    },
  ];
}
