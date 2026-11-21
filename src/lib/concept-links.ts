// روابط المصطلحات داخل المقالات: أول ذكر لمفهوم من المعجم يصبح رابطًا إلى صفحة شرحه.
// تُحسب عند العرض. القواعد: أربعة روابط على الأكثر لكل مقال، ورابط واحد لكل مفهوم،
// ولا روابط في العناوين أو الجداول أو الاقتباسات أو داخل رابط موجود، ويُقبل المصطلح المكوّن من كلمتين فأكثر فقط.
import { publicBank } from "./public-bank";

const MAX_LINKS = 4;
let cache: { key: string; href: string; re: RegExp }[] | null = null;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function targets() {
  if (cache) return cache;
  const b = publicBank();
  const by = new Map<string, string[]>();
  for (const c of b.concepts) {
    const key = c.title.split(/[:؟]/)[0].replace(/\s*\(.*?\)/g, "").trim();
    if (key.length < 8 || key.length > 40 || !key.includes(" ")) continue;
    by.set(key, [...(by.get(key) ?? []), `/learn/${c.courseId}/${c.id}`]);
  }
  cache = [...by]
    .filter(([, hrefs]) => hrefs.length === 1)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([key, [href]]) => ({ key, href, re: new RegExp(`(^|[\\s«(،:]|[\\s«(][وبلف])(${esc(key)})(?=$|[\\s.،؛:؟!»)])`) }));
  return cache;
}

export function withConceptLinks(md: string): string {
  const list = targets();
  const used = new Set<string>();
  let n = 0;
  let inBox = false;
  const held: string[] = [];
  return md
    .split("\n")
    .map((line) => {
      if (line.trim() === ":::") inBox = !inBox;
      if (n >= MAX_LINKS || inBox || /^\s*(#|\||>|!|:::)/.test(line) || !line.trim()) return line;
      // الأجزاء التي فيها روابط موجودة تبقى كما هي
      return line
        .split(/(\[[^\]]*\]\([^)]*\))/)
        .map((seg) => {
          if (seg.startsWith("[") || n >= MAX_LINKS) return seg;
          for (const t of list) {
            if (n >= MAX_LINKS) break;
            if (used.has(t.href)) continue;
            const m = t.re.exec(seg);
            if (!m) continue;
            used.add(t.href);
            n++;
            // الرابط المضاف يُحجز بعلامة مؤقتة حتى لا يُطابَق داخله مصطلح أقصر
            held.push(`[${m[2]}](${t.href})`);
            seg = seg.slice(0, m.index) + m[1] + `\u0000${held.length - 1}\u0000` + seg.slice(m.index + m[0].length);
          }
          return seg.replace(/\u0000(\d+)\u0000/g, (_, i) => held[+i]);
        })
        .join("");
    })
    .join("\n");
}
