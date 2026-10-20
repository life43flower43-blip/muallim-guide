// تصدير السيناريوهات التربوية إلى Markdown قابل للقراءة على GitHub
import { SCENARIOS } from "../src/lib/scenarios";

const fs = require("fs");

let md = `# السيناريوهات التربوية — تصدير قابل للقراءة\n\n`;
md += `المصدر: \`src/lib/scenarios.ts\` — ${SCENARIOS.length} موقفاً صفياً.\n`;
md += `لكل موقف: النص، ثم الخيارات مع تصنيف كل خيار (excellent جيد جداً / good مقبول / poor ضعيف) ونتيجته المتوقعة وتفسيره التربوي.\n\n`;

let i = 1;
for (const s of SCENARIOS as any[]) {
  md += `---\n\n## السيناريو ${i}: ${s.title ?? s.situation?.slice(0, 60) ?? ""}\n\n`;
  md += `**الموقف**: ${s.situation}\n\n`;
  const label: Record<string, string> = { best: "★ الاستجابة الأفضل", ok: "مقبول", poor: "ضعيف" };
  for (const o of s.options as any[]) {
    md += `### [${label[o.score] ?? o.score}] ${o.text}\n\n`;
    md += `${o.feedback}\n\n`;
  }
  i++;
}

fs.writeFileSync("review/scenarios-export.md", md, "utf-8");
console.log(`exported ${SCENARIOS.length} scenarios -> review/scenarios-export.md`);
