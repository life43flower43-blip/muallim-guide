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
  return (
    <button
      type="button"
      onClick={startBank}
      className="glow-pulse relative isolate flex w-full min-w-0 items-center gap-3 rounded-[22px] border-2 border-[#D4A017] bg-gradient-to-l from-[#FBF3DA] to-white px-3.5 py-3 text-right transition active:scale-[0.98] dark:from-card dark:to-card"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D4A017] text-white">
        <Library className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold leading-6 text-foreground">اختبار محاكاة الرخصة المهنية</span>
        <span className="block text-[12.5px] leading-5 text-muted-foreground">
          كل الأسئلة ({ad(total)}) مرتبة بالمحاور{done ? ` · أنجزت ${ad(done)}` : ""}
        </span>
      </span>
      <ChevronLeft className="h-5 w-5 shrink-0 text-[#B8860B]" />
    </button>
  );
}
