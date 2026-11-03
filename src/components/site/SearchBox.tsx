"use client";

// مربع بحث باقتراحات فورية: تظهر العناوين المطابقة أثناء الكتابة، والإدخال يفتح صفحة النتائج
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowLeft } from "lucide-react";

type Item = { t: string; u: string; c: string };
let cache: Item[] | null = null;

const norm = (s: string) =>
  s.replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase();

const SUGGEST = ["إدارة الصف", "التعزيز", "بياجيه", "التقويم البنائي", "التنمر", "الذكاء الاصطناعي"];

export default function SearchBox({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[] | null>(cache);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  const load = () => {
    if (cache) return;
    fetch("/search-index.json").then((r) => r.json()).then((d: Item[]) => { cache = d; setItems(d); }).catch(() => {});
  };
  useEffect(() => { if (autoFocus) { load(); ref.current?.focus(); } }, [autoFocus]);

  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
    if (!words.length || !items) return [];
    const out: { it: Item; s: number }[] = [];
    for (const it of items) {
      const t = norm(it.t);
      if (!words.every((w) => t.includes(w))) continue;
      out.push({ it, s: (t.startsWith(words[0]) ? 2 : 0) + (it.c === "مقال" ? 1 : 0) - t.length / 200 });
    }
    return out.sort((a, b) => b.s - a.s).slice(0, 8).map((x) => x.it);
  }, [q, items]);

  const go = (url: string) => { setOpen(false); onDone?.(); router.push(url); };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`); }}
        className="flex h-[52px] items-stretch overflow-hidden rounded-xl border-2 border-[#136F5C] bg-white focus-within:border-[#0E3B32]"
      >
        <span className="flex items-center ps-3 text-[#136F5C]"><Search className="h-5 w-5" strokeWidth={2.4} /></span>
        <input
          ref={ref}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { load(); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          enterKeyHint="search"
          placeholder="ابحث عن مفهوم أو مقال تربوي"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-[16px] font-medium text-[#14302A] outline-none placeholder:text-[#7A8F86]"
        />
        {q && <button type="button" aria-label="مسح" onClick={() => { setQ(""); ref.current?.focus(); }} className="px-2 text-[#A9874A]"><X className="h-5 w-5" /></button>}
        <button type="submit" className="shrink-0 bg-[#136F5C] px-4 text-[15px] font-extrabold text-white hover:bg-[#0E3B32]">بحث</button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-[54px] z-40 overflow-hidden rounded-2xl border border-[#D4E3DA] bg-white">
          {q.trim().length < 2 ? (
            <div className="p-3">
              <p className="mb-2 text-[12px] font-bold text-[#6B8077]">عمليات بحث شائعة</p>
              <div className="flex flex-wrap gap-2">
                {SUGGEST.map((s) => (
                  <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(`/search?q=${encodeURIComponent(s)}`)} className="rounded-full bg-[#EEF5F1] px-3 py-1.5 text-[13px] font-bold text-[#136F5C]">{s}</button>
                ))}
              </div>
            </div>
          ) : results.length ? (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.u}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(r.u)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-right hover:bg-[#F4F8F6]">
                    <span className="min-w-0 truncate font-bold text-[#14302A]">{r.t}</span>
                    <span className="shrink-0 rounded-md bg-[#EEF5F1] px-2 py-0.5 text-[11px] font-bold text-[#136F5C]">{r.c}</span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="flex w-full items-center gap-2 border-t border-[#EEF3F0] px-4 py-3 text-[14px] font-bold text-[#136F5C]">
                  كل النتائج عن «{q.trim()}» <ArrowLeft className="h-4 w-4" />
                </button>
              </li>
            </ul>
          ) : (
            <p className="p-4 text-[14px] text-[#6B8077]">{items ? "لا توجد عناوين مطابقة. اضغط بحث للبحث داخل النصوص." : "جارٍ التحميل…"}</p>
          )}
        </div>
      )}
    </div>
  );
}
