"use client";

// بطاقة مفهوم شائع: يخمّن القارئ «صحيحة أم خاطئة؟» ثم يرى الصواب وسببه وأثره في الصف
import { useState } from "react";
import { CheckCircle2, XCircle, Lightbulb, School } from "lucide-react";
import type { Misconception } from "@/lib/misconceptions";

export default function MythCard({ m, n }: { m: Misconception; n: string }) {
  const [guess, setGuess] = useState<boolean | null>(null);
  const shown = guess !== null;
  const right = guess === m.isTrue;
  return (
    <article className="rounded-2xl border border-[#E2ECE6] bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3ECF8] text-[13px] font-extrabold text-[#7A4E9C]">{n}</span>
        <p className="flex-1 pt-0.5 text-[17px] font-bold leading-8 text-[#14302A]">«{m.claim}»</p>
      </div>
      {!shown ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setGuess(true)} className="rounded-xl border-2 border-[#CFE6D8] py-2.5 font-bold text-[#1E7B4A] hover:bg-[#EAF6EF]">صحيحة</button>
          <button type="button" onClick={() => setGuess(false)} className="rounded-xl border-2 border-[#F2D2CD] py-2.5 font-bold text-[#C0392B] hover:bg-[#FDEDEB]">خاطئة</button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className={`flex items-center gap-2 rounded-xl px-3 py-2 font-bold ${right ? "bg-[#EAF6EF] text-[#1E7B4A]" : "bg-[#FDEDEB] text-[#C0392B]"}`}>
            {right ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {right ? "أحسنت." : "ليس تمامًا."} العبارة {m.isTrue ? "صحيحة" : "خاطئة"}
          </p>
          <p className="font-bold leading-8 text-[#14302A]">{m.fact}</p>
          <p className="flex gap-2 text-[15px] leading-7 text-[#3A5249]"><Lightbulb className="mt-1 h-4 w-4 shrink-0 text-[#E8A317]" />{m.why}</p>
          <p className="flex gap-2 rounded-xl bg-[#F4F8F6] p-3 text-[15px] leading-7 text-[#24403A]"><School className="mt-1 h-4 w-4 shrink-0 text-[#136F5C]" /><span><b>في الصف: </b>{m.classroom}</span></p>
        </div>
      )}
    </article>
  );
}
