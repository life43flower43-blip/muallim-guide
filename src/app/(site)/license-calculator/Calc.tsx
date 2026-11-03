"use client";

// حاسبة مستوى الرخصة: يُدخل المعلم درجتيه في الاختبارين، فيظهر المستوى بحسب الحدود المعلنة
import { useState } from "react";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ad = (n: number) => String(n).replace(/\d/g, (d) => AR[+d]);
const toNum = (s: string) => Number(s.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/[^\d.]/g, ""));

const LEVELS = [
  { min: 80, t: "معلم خبير", c: "#136F5C", d: "٨٠ فأكثر في الاختبارين" },
  { min: 70, t: "معلم متقدم", c: "#1F6FA8", d: "من ٧٠ إلى ٧٩" },
  { min: 50, t: "معلم ممارس", c: "#7C5CFF", d: "من ٥٠ إلى ٦٩" },
];

export default function Calc() {
  const [g, setG] = useState("");
  const [s, setS] = useState("");
  const gn = toNum(g), sn = toNum(s);
  const ready = g !== "" && s !== "" && gn >= 0 && gn <= 100 && sn >= 0 && sn <= 100;
  const low = Math.min(gn, sn);
  const level = ready ? LEVELS.find((l) => low >= l.min) : undefined;
  const next = ready ? [...LEVELS].reverse().find((l) => l.min > low) : undefined;
  const field = "mt-1 h-12 w-full rounded-xl border-2 border-[#E2ECE6] bg-white px-4 text-center font-display text-[20px] font-extrabold text-[#14302A] outline-none focus:border-[#136F5C]";

  return (
    <div className="rounded-2xl border border-[#E2ECE6] bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[14px] font-bold text-[#2E4A42]">
          درجة الاختبار التربوي العام
          <input inputMode="numeric" value={g} onChange={(e) => setG(e.target.value)} placeholder="مثلًا ٧٢" className={field} />
        </label>
        <label className="block text-[14px] font-bold text-[#2E4A42]">
          درجة الاختبار التخصصي
          <input inputMode="numeric" value={s} onChange={(e) => setS(e.target.value)} placeholder="مثلًا ٧٨" className={field} />
        </label>
      </div>

      <div className="mt-5 min-h-[104px] rounded-xl bg-[#F5F8F6] p-5 text-center" aria-live="polite">
        {!ready ? (
          <p className="pt-6 text-[14.5px] text-[#6B8077]">اكتب درجتيك من ١٠٠ لتعرف مستواك.</p>
        ) : level ? (
          <>
            <p className="text-[13px] font-bold text-[#6B8077]">مستواك المتوقع</p>
            <p className="mt-1 font-display text-[30px] font-extrabold" style={{ color: level.c }}>{level.t}</p>
            {next && <p className="mt-1 text-[14px] text-[#3A5249]">ينقصك {ad(next.min - low)} درجة في الاختبار الأقل لتصل إلى «{next.t}».</p>}
          </>
        ) : (
          <>
            <p className="font-display text-[22px] font-extrabold text-[#C0392B]">لم تصل إلى حد الرخصة بعد</p>
            <p className="mt-1 text-[14px] text-[#3A5249]">ينقصك {ad(50 - low)} درجة في الاختبار الأقل لتصل إلى «معلم ممارس».</p>
          </>
        )}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <li key={l.t} className={`rounded-xl border p-3 text-center ${level?.t === l.t ? "border-2" : "border-[#E2ECE6]"}`} style={level?.t === l.t ? { borderColor: l.c } : undefined}>
            <p className="text-[14.5px] font-extrabold" style={{ color: l.c }}>{l.t}</p>
            <p className="mt-0.5 text-[13px] text-[#6B8077]">{l.d}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
