// روابط داخلية تلقائية بين المقالات: أول ذكر لموضوع مقال آخر منشور في الفقرات يصبح رابطًا إليه.
// تُحسب عند العرض من المقالات المنشورة فقط، فلا تشير إلى مقال مجدول لم يُنشر بعد.
// القواعد: ثلاثة روابط على الأكثر لكل مقال، ورابط واحد لكل مقال هدف، ولا روابط في العناوين أو الاقتباسات أو الجداول،
// ولا داخل رابط موجود، ولا لموضوع المقال الحالي نفسه.
import type { Article } from "./articles";

const MAX_LINKS = 3;
const MIN_KEY = 5; // كلمات أقصر من هذا عامة جدًا ("التقويم" مثلًا تبقى، و"اللعب" لا)

/** أهداف مفضلة لعبارات عامة يشترك فيها أكثر من مقال */
const PREFER: Record<string, string> = { "الرخصة المهنية": "license-exam-plan", "الذكاء الاصطناعي": "ai-lesson-prep" };

const AR_LETTER = /[ء-ي٠-٩ٱ-ۓ]/;

/** الكلمة المفتاحية الأساسية لكل مقال (أول وسم)، بعد استبعاد ما يشترك فيه أكثر من مقال */
function keyTargets(all: Article[]): Map<string, Article> {
  const byKey = new Map<string, Article[]>();
  for (const a of all) {
    // موضوع المقال: أول وسمين، والجزء الرئيس من العنوان قبل النقطتين إن كان قصيرًا
    const head = a.title.split(/[:؟?]/)[0].trim();
    const keys = new Set([a.tags[0], a.tags[1], head.length <= 32 ? head : ""].map((k) => (k ?? "").trim()));
    for (const k of keys) {
      // كلمة واحدة عامة مثل «التقويم» أو «التواصل» لا تصلح رابطًا لمقال محدد؛ تُقبل الأسماء العلم فقط (بياجيه، باندورا)
      if (k.length < MIN_KEY || (!k.includes(" ") && k.startsWith("ال"))) continue;
      byKey.set(k, [...(byKey.get(k) ?? []), a]);
    }
  }
  const out = new Map<string, Article>();
  for (const [k, list] of byKey) {
    // إن اشترك عدة مقالات في الوسم نفسه نختار الذي يبدأ عنوانه به، وإلا نتركه لأنه غامض
    const pick = list.find((a) => PREFER[k] === a.slug) ?? (list.length === 1 ? list[0] : list.find((a) => a.title.startsWith(k)) ?? list.find((a) => a.tags[0] === k));
    if (pick) out.set(k, pick);
  }
  return out;
}

/** موضع أول ظهور للكلمة ككلمة مستقلة (يسمح بحرف عطف أو جر ملتصق: و ب ل ف ك)، خارج الروابط والرموز */
function findWord(line: string, key: string): number {
  let from = 0;
  for (;;) {
    const i = line.indexOf(key, from);
    if (i < 0) return -1;
    const before = line.slice(Math.max(0, i - 2), i);
    const prev = before.slice(-1);
    const okBefore = !prev || !AR_LETTER.test(prev) || ("وبلفك".includes(prev) && (before.length < 2 || !AR_LETTER.test(before[0])));
    const next = line[i + key.length];
    const okAfter = !next || !AR_LETTER.test(next);
    const open = line.lastIndexOf("[", i);
    const insideLink = open >= 0 && line.indexOf("]", open) >= i;
    const insideCode = (line.slice(0, i).match(/`/g)?.length ?? 0) % 2 === 1;
    if (okBefore && okAfter && !insideLink && !insideCode) return i;
    from = i + key.length;
  }
}

export function withInternalLinks(a: Article, all: Article[]): string {
  const own = new Set(a.tags.map((x) => x.trim()));
  const targets = [...keyTargets(all)].filter(([k, t]) => t.slug !== a.slug && !own.has(k));
  if (!targets.length) return a.body;
  // الأطول أولًا حتى لا تسبق كلمة قصيرة عبارة أطول تحتويها
  targets.sort((x, y) => y[0].length - x[0].length);
  const used = new Set<string>();
  let count = 0;
  const lines = a.body.split("\n");
  for (let n = 0; n < lines.length && count < MAX_LINKS; n++) {
    const line = lines[n];
    const t = line.trimStart();
    if (!t || t.startsWith("#") || t.startsWith(">") || t.startsWith("|") || t.startsWith("```")) continue;
    for (const [key, target] of targets) {
      if (count >= MAX_LINKS) break;
      if (used.has(target.slug) || a.body.includes(`/articles/${target.slug}`)) continue;
      const i = findWord(lines[n], key);
      if (i < 0) continue;
      lines[n] = `${lines[n].slice(0, i)}[${key}](/articles/${target.slug})${lines[n].slice(i + key.length)}`;
      used.add(target.slug);
      count++;
      break; // رابط واحد في الفقرة الواحدة
    }
  }
  return lines.join("\n");
}
