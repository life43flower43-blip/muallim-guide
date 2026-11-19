"use client";
// مفاهيم خاطئة داخل التطبيق: عبارة واحدة في كل شاشة، مع شريط تقدم وعدّاد للصح والخطأ.
// يحكم المتعلم «صحيحة» أو «خاطئة»، فيظهر الصواب وسببه وأثره في الصف، ثم «التالي» أو «السابق».
import { useEffect, useState } from "react";
import { Check, CircleCheck, CircleX, Lightbulb, School, X } from "lucide-react";
import { MISCONCEPTIONS } from "@/lib/misconceptions";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { ScreenShell } from "./ui-kit";

export default function MythsView({ onClose }: { onClose: () => void }) {
  const total = MISCONCEPTIONS.length;
  // الشريط المتنقل يبقى ظاهرًا فوق هذه الشاشة، وأزرارها فوقه مباشرة
  useEffect(() => {
    document.documentElement.classList.add("nav-over");
    return () => document.documentElement.classList.remove("nav-over");
  }, []);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const m = MISCONCEPTIONS[i];
  const picked = answers[m.id];
  const answered = picked !== undefined;
  const correct = answered && picked === m.isTrue;
  const right = MISCONCEPTIONS.filter((x) => answers[x.id] !== undefined && answers[x.id] === x.isTrue).length;
  const wrong = Object.keys(answers).length - right;

  const choose = (v: boolean) => !answered && setAnswers((a) => ({ ...a, [m.id]: v }));

  return (
    <ScreenShell
      title="مفاهيم خاطئة"
      onBack={onClose}
      footer={
        <>
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="h-12 flex-1 rounded-[16px] bg-[#C5E5DF]/50 text-[15px] font-extrabold text-[#14302A] disabled:opacity-40 dark:text-foreground">
            السابق
          </button>
          <button type="button" disabled={i === total - 1} onClick={() => setI(i + 1)} className="h-12 flex-[1.4] rounded-[16px] bg-[#168477] text-[15px] font-extrabold text-white disabled:opacity-40">
            التالي
          </button>
        </>
      }
    >
      {/* التقدم: عدد الصح والخطأ ثم رقم العبارة وشريط */}
      <div className="flex items-center gap-2">
        <span className="flex h-8 items-center gap-1 rounded-full bg-[#DCF2E3] px-3 text-[14px] font-extrabold text-[#1E7A45]">
          <Check className="h-4 w-4" /> {ad(right)}
        </span>
        <span className="flex h-8 items-center gap-1 rounded-full bg-[#FBE1E1] px-3 text-[14px] font-extrabold text-[#B42A2A]">
          <X className="h-4 w-4" /> {ad(wrong)}
        </span>
        <span className="ms-auto text-[14px] font-bold text-muted-foreground">{`${ad(i + 1)} / ${ad(total)}`}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#C5E5DF]/60">
        <div className="h-full rounded-full bg-[#168477] transition-[width] duration-300" style={{ width: `${((i + 1) / total) * 100}%` }} />
      </div>

      <p className="mt-6 text-[13px] font-extrabold text-[#168477]">{`العبارة ${ad(i + 1)}`}</p>
      <h2 className="mt-1 text-[21px] font-extrabold leading-10 text-foreground">«{m.claim.replace(/\.$/, "")}»</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {([true, false] as const).map((v) => {
          const isPick = picked === v;
          const isAns = answered && m.isTrue === v;
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => choose(v)}
              disabled={answered}
              className={cn(
                "h-14 rounded-[18px] border-2 text-[17px] font-extrabold transition-colors",
                !answered && (v ? "border-[#C5E5DF] text-[#1E7A45]" : "border-[#F2CFCF] text-[#B42A2A]"),
                answered && isAns && "border-[#1E7A45] bg-[#DCF2E3] text-[#1E7A45]",
                answered && isPick && !isAns && "border-[#B42A2A] bg-[#FBE1E1] text-[#B42A2A]",
                answered && !isPick && !isAns && "border-border text-muted-foreground opacity-60"
              )}
            >
              {v ? "صحيحة" : "خاطئة"}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-5 space-y-3">
          <div className={cn("flex items-center gap-2 rounded-[16px] px-4 py-3 text-[15px] font-extrabold", correct ? "bg-[#DCF2E3] text-[#1E7A45]" : "bg-[#FBE1E1] text-[#B42A2A]")}>
            {correct ? <CircleCheck className="h-5 w-5 shrink-0" /> : <CircleX className="h-5 w-5 shrink-0" />}
            {correct ? "أحسنت." : "ليس تمامًا."} العبارة {m.isTrue ? "صحيحة" : "خاطئة"}
          </div>
          <p className="text-[17px] font-extrabold leading-9 text-foreground">{m.fact}</p>
          <p className="flex gap-2 text-[15px] leading-8 text-muted-foreground">
            <Lightbulb className="mt-1.5 h-4 w-4 shrink-0 text-[#168477]" /> {m.why}
          </p>
          <div className="flex gap-2 rounded-[16px] bg-[#F1F8F6] px-4 py-3 text-[15px] leading-8 text-foreground dark:bg-white/5">
            <School className="mt-1.5 h-4 w-4 shrink-0 text-[#168477]" />
            <span><b>في الصف: </b>{m.classroom}</span>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}
