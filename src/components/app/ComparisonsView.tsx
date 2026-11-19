"use client";
// المقارنات داخل التطبيق: قائمة «أ مقابل ب» مقسومة بالمجموعات، وكل مقارنة في شاشة كاملة:
// المفهومان في رأسين ملوّنين، ثم بطاقة لكل وجه مقارنة فيها الطرفان متقابلان، ثم «كيف تميّز بينهما».
import { useState } from "react";
import { ChevronLeft, Lightbulb } from "lucide-react";
import { COMPARISONS, COMPARISON_GROUPS, type Comparison } from "@/lib/comparisons";
import { ScreenShell } from "./ui-kit";

const A = "#168477";
const B = "#7C5CC4";

function Detail({ c, onBack }: { c: Comparison; onBack: () => void }) {
  return (
    <ScreenShell title="المقارنات" onBack={onBack}>
      {/* رأسا المفهومين متقابلين */}
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 pb-2 pt-1 backdrop-blur">
        <div className="grid grid-cols-2 items-stretch gap-2">
          <div className="flex items-center justify-center rounded-[16px] px-2 py-2.5 text-center text-[15px] font-extrabold leading-6 text-white" style={{ background: A }}>{c.a}</div>
          <div className="flex items-center justify-center rounded-[16px] px-2 py-2.5 text-center text-[15px] font-extrabold leading-6 text-white" style={{ background: B }}>{c.b}</div>
        </div>
      </div>

      <div className="mt-2 space-y-3">
        {c.rows.map((r) => (
          <section key={r.k} className="overflow-hidden rounded-[18px] border border-[var(--t075)] bg-white dark:border-border dark:bg-card">
            <h3 className="border-b border-[var(--t075)] bg-[#F1F8F6] px-4 py-2 text-[14px] font-extrabold text-foreground dark:border-border dark:bg-white/5">{r.k}</h3>
            <div className="grid grid-cols-2">
              <p className="border-t-[3px] px-3 py-3 text-[14px] leading-7 text-foreground" style={{ borderTopColor: A }}>{r.a}</p>
              <p className="border-r-2 border-t-[3px] border-r-[#C5E5DF] px-3 py-3 text-[14px] leading-7 text-foreground dark:border-r-border" style={{ borderTopColor: B }}>{r.b}</p>
            </div>
          </section>
        ))}
        <section className="rounded-[18px] border-r-[3px] border-r-[#D4A017] bg-[#FFF8E6] px-4 py-3 dark:bg-white/5">
          <h3 className="mb-1 flex items-center gap-1.5 text-[14px] font-extrabold text-[#8A6410]"><Lightbulb className="h-4 w-4" /> كيف تميّز بينهما</h3>
          <p className="text-[14.5px] leading-7 text-foreground">{c.tip}</p>
        </section>
      </div>
    </ScreenShell>
  );
}

export default function ComparisonsView({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<Comparison | null>(null);
  return (
    <>
      <ScreenShell title="المقارنات" onBack={onClose}>
        <div className="space-y-5">
          {COMPARISON_GROUPS.map((g) => {
            const list = COMPARISONS.filter((c) => c.group === g);
            if (!list.length) return null;
            return (
              <section key={g}>
                <h2 className="mb-2 px-1 text-[16px] font-extrabold text-[#168477]">{g}</h2>
                <div className="space-y-2">
                  {list.map((c) => (
                    <button key={c.slug} type="button" onClick={() => setOpen(c)} className="flex w-full items-center gap-2 rounded-[16px] border border-[var(--t075)] bg-white px-3 py-2.5 text-right active:scale-[0.99] dark:border-border dark:bg-card">
                      <span className="min-w-0 flex-1 text-[14.5px] font-bold leading-6 text-foreground">
                        <span className="text-[#111111] dark:text-foreground">{c.a}</span>{" "}
                        <span className="text-[12px] font-extrabold text-muted-foreground">مقابل</span>{" "}
                        <span style={{ color: B }}>{c.b}</span>
                      </span>
                      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </ScreenShell>
      {open && <Detail c={open} onBack={() => setOpen(null)} />}
    </>
  );
}
