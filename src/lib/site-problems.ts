// مواقف الصف للموقع: مواقف المحاكاة ومواقف مختبر مهارات التدريس في شكل واحد
import { SIM_SCENARIOS } from "@/lib/sim";
import { LAB_SCENARIOS } from "@/lib/lab";

export type ProblemOption = { text: string; outcome: string; rating: "good" | "ok" | "poor"; insight?: string; risks?: string };
export type Problem = {
  id: string;
  slug: string;
  kind: "class" | "skill";
  title: string;
  stage: string;
  intro: string;
  startText: string;
  options: ProblemOption[];
  end: string;
  conceptIds: string[];
  tags: string[];
};

export const PROBLEMS: Problem[] = [
  ...SIM_SCENARIOS.map((s) => {
    const st = s.nodes.start ?? Object.values(s.nodes)[0];
    return { id: s.id, slug: s.id.toLowerCase(), kind: "class" as const, title: s.title, stage: s.stage, intro: s.intro, startText: st.text, options: st.options, end: s.end, conceptIds: s.conceptIds, tags: [...s.skills] };
  }),
  ...LAB_SCENARIOS.map((s) => {
    const st = s.nodes.start ?? Object.values(s.nodes)[0];
    return { id: s.id, slug: s.id.toLowerCase(), kind: "skill" as const, title: s.title, stage: s.stage, intro: s.intro, startText: st.text, options: st.options, end: s.end, conceptIds: s.conceptIds, tags: [s.skill] };
  }),
];

export const problemBySlug = (slug: string) => PROBLEMS.find((p) => p.slug === slug);

/** المواقف التي يفسرها مفهوم معين */
export const problemsForConcept = (conceptId: string) => PROBLEMS.filter((p) => p.conceptIds.includes(conceptId));

export const TAG_COLOR: Record<string, string> = {
  "إدارة الصف": "#136F5C",
  التواصل: "#1F6FA8",
  "فهم المتعلم": "#7A4E9C",
  "اتخاذ القرار التربوي": "#B4532A",
  "التقويم والتغذية الراجعة": "#8A6A12",
  "وضوح الشرح": "#3A55A4",
  "التعامل مع الإجابات الخاطئة": "#A0466B",
  "مراعاة الفروق الفردية": "#4E6E3A",
  "إدارة الوقت وتنظيم الحصة": "#2E7D5B",
  "تحفيز المشاركة": "#C26A1B",
  "بناء التقويم": "#6B5B2E",
};
export const tagColor = (t: string) => TAG_COLOR[t] ?? "#5B7268";
