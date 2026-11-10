"use client";
// بطاقة الدخول إلى «اختبار محاكاة الرخصة المهنية»: كل أسئلة البنك مرتبة
import { ChevronLeft, Library } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { QUESTIONS } from "@/lib/qbank";
import { ad } from "@/lib/arabic";

export default function LicenseBankCard() {
  const startBank = useUi((s) => s.startBank);
  const done = useApp((s) => Object.keys(s.attempts).length);
  const total = QUESTIONS.length;
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <button
      type="button"
      onClick={startBank}
      className="flex w-full min-w-0 items-center gap-3 rounded-[20px] bg-[var(--t800)] px-4 py-3.5 text-right text-white shadow-sm transition active:scale-[0.98]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F3DC8E] text-[#3a2c05]">
        <Library className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold leading-6">محاكاة الرخصة المهنية</span>
        <span className="block truncate text-[12.5px] leading-5 text-white/75">
          {done ? `أنجزت ${ad(done)} من ${ad(total)} سؤالًا` : `${ad(total)} سؤالًا مرتبة بالمحاور`}
        </span>
        {done > 0 && (
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full bg-[#F3DC8E]" style={{ width: `${Math.max(2, pct)}%` }} />
          </span>
        )}
      </span>
      <ChevronLeft className="h-5 w-5 shrink-0 text-white/70" />
    </button>
  );
}
