"use client";
// المعجم التربوي داخل التطبيق: كل المفاهيم مرتبة هجائيًّا (دون «ال» التعريف)، مع بحث فوري
// وشريط حروف ثابت ينقل إلى الحرف. الضغط على المصطلح يُظهر بطاقة تعريف قصيرة (التعريف ومثال ومصطلحات قريبة)،
// ومنها يمكن فتح الشرح الكامل.
import { useMemo, useRef, useState } from "react";
import { BookOpen, CircleCheck, Search, X } from "lucide-react";
import { CONCEPTS, COURSE_SHORT } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { ScreenShell } from "./ui-kit";
import { ConceptReader } from "./ConceptsView";

const LETTERS = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");

/** توحيد الحروف للبحث والترتيب: الهمزات والتاء المربوطة والألف المقصورة والتشكيل */
function norm(s: string) {
  return s
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}
/** مفتاح الترتيب: الكلمة الأولى بلا «ال» التعريف، فيأتي «التعزيز» تحت التاء */
function sortKey(title: string) {
  const t = norm(title).replace(/^[«"(]+/, "");
  return t.startsWith("ال") && t.length > 3 ? t.slice(2) : t;
}

export default function GlossaryView({ onClose }: { onClose: () => void }) {
  const reads = useApp((s) => s.conceptReads);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [defId, setDefId] = useState<string | null>(null);
  const def = defId ? CONCEPTS.find((c) => c.id === defId) : undefined;
  const related = def ? CONCEPTS.filter((c) => c.courseId === def.courseId && c.chapter === def.chapter && c.id !== def.id).slice(0, 4) : [];
  const [active, setActive] = useState<string>("ا");
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const groups = useMemo(() => {
    const items = CONCEPTS.map((c) => ({ c, key: sortKey(c.title) })).sort((a, b) => a.key.localeCompare(b.key, "ar"));
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const L = LETTERS.includes(it.key[0]) ? it.key[0] : "#";
      if (!map.has(L)) map.set(L, []);
      map.get(L)!.push(it);
    }
    return map;
  }, []);

  const results = useMemo(() => {
    const n = norm(q);
    if (!n) return null;
    return CONCEPTS.filter((c) => norm(c.title).includes(n))
      .sort((a, b) => Number(!norm(b.title).startsWith(n)) - Number(!norm(a.title).startsWith(n)) || a.title.length - b.title.length)
      .slice(0, 60);
  }, [q]);

  const jump = (L: string) => {
    setActive(L);
    refs.current[L]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const Row = ({ id, title }: { id: string; title: string; courseId: string; rule?: string }) => (
    <button type="button" onClick={() => setDefId(id)} className="flex min-h-[50px] w-full items-center gap-3 border-b border-[var(--t075)] px-1 py-1 text-right last:border-b-0 active:bg-[var(--t050)] dark:border-border">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold leading-6 text-foreground">{title}</span>
      </span>
      {reads[id] ? <CircleCheck className="h-4 w-4 shrink-0 text-[#168477]" aria-label="قرأته" /> : null}
    </button>
  );

  return (
    <>
      <ScreenShell title="المعجم التربوي" onBack={onClose}>
        {/* البحث وشريط الحروف ثابتان أعلى القائمة */}
        <div className="sticky top-0 z-20 -mx-4 space-y-2 bg-background/95 px-4 pb-2 pt-1 backdrop-blur">
          <div className="flex h-11 items-center gap-2 rounded-[16px] border border-[#C5E5DF] bg-white px-3 focus-within:border-[#168477] dark:border-border dark:bg-card">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`ابحث في ${ad(CONCEPTS.length)} مصطلحًا`} aria-label="ابحث في المعجم" className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="مسح البحث" className="flex h-8 w-8 items-center justify-center rounded-full">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {!results && (
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
              {LETTERS.filter((L) => groups.has(L)).map((L) => (
                <button key={L} type="button" onClick={() => jump(L)} className={cn("flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-[15px] font-extrabold transition-colors", active === L ? "bg-[#168477] text-white" : "bg-[#C5E5DF]/45 text-[#14302A] dark:bg-white/10 dark:text-foreground")}>
                  {L}
                </button>
              ))}
            </div>
          )}
        </div>

        {results ? (
          results.length ? (
            <div className="mt-2 rounded-[18px] border border-[var(--t075)] bg-white px-3 dark:border-border dark:bg-card">
              {results.map((c) => <Row key={c.id} id={c.id} title={c.title} courseId={c.courseId} rule={c.rule} />)}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">لا مصطلح مطابق، جرّب كلمة أقصر</p>
          )
        ) : (
          <div className="mt-2 space-y-4">
            {[...groups.entries()].map(([L, items]) => (
              <section key={L} ref={(el) => { refs.current[L] = el; }} className="scroll-mt-28">
                <div className="mb-1.5 flex items-baseline gap-2 px-1">
                  <h2 className="text-[22px] font-extrabold leading-8 text-[#168477]">{L}</h2>
                  <span className="text-[12px] text-muted-foreground">{ad(items.length)}</span>
                </div>
                <div className="rounded-[18px] border border-[var(--t075)] bg-white px-3 dark:border-border dark:bg-card">
                  {items.map(({ c }) => <Row key={c.id} id={c.id} title={c.title} courseId={c.courseId} rule={c.rule} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </ScreenShell>
      {/* بطاقة التعريف: لوح من أسفل الشاشة بالتعريف القصير ومثال ومصطلحات من الموضوع نفسه */}
      {def && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/40" onClick={() => setDefId(null)}>
          <div role="dialog" aria-label={def.title} onClick={(e) => e.stopPropagation()} className="safe-bottom max-h-[80dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-4 pt-3 dark:bg-card">
            <span className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
            <h3 className="text-[20px] font-extrabold leading-8 text-foreground">{def.title}</h3>
            <span className="mt-1 inline-block rounded-full bg-[#C5E5DF]/60 px-2.5 py-0.5 text-[12px] font-bold text-[#168477]">{COURSE_SHORT[def.courseId] ?? ""}</span>
            <p className="mt-3 text-[16px] font-bold leading-8 text-foreground">{def.rule || def.explanation.split(/(?<=[.؟!])\s/)[0]}</p>
            {(def.examples?.[0] || def.example) && (
              <div className="mt-3 rounded-[16px] border-r-[3px] border-r-[#168477] bg-[#F1F8F6] px-4 py-3 dark:bg-white/5">
                <p className="text-[12px] font-extrabold text-[#168477]">مثال</p>
                <p className="mt-1 text-[14px] leading-7 text-foreground">{def.examples?.[0] ?? def.example}</p>
              </div>
            )}
            {related.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[13px] font-extrabold text-muted-foreground">مصطلحات قريبة</p>
                <div className="flex flex-wrap gap-1.5">
                  {related.map((r) => (
                    <button key={r.id} type="button" onClick={() => setDefId(r.id)} className="rounded-full border border-[#C5E5DF] bg-white px-3 py-1.5 text-[13px] font-bold text-foreground dark:bg-card">{r.title}</button>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={() => { setOpenId(def.id); setDefId(null); }} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#168477] text-[15px] font-extrabold text-white">
              <BookOpen className="h-4 w-4" /> اقرأ الشرح الكامل
            </button>
          </div>
        </div>
      )}
      {openId && <ConceptReader conceptId={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}
