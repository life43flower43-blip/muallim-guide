"use client";
// مشكلات صفية داخل التطبيق: قائمة بعناوين المواقف فقط، وكل موقف في صفحة كاملة مرتبة:
// الموقف ← المعالجة ← تصرّف تتجنبه. بلا مقدمات ولا نصوص فرعية.
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PROBLEMS, type Problem } from "@/lib/site-problems";
import { ScreenShell } from "./ui-kit";

const GROUPS = [
  { kind: "class", title: "إدارة الصف والتعامل مع الطلاب" },
  { kind: "skill", title: "مهارات التدريس" },
] as const;

function Block({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-[var(--t075)] border-r-[3px] bg-white px-4 py-3.5 dark:border-border dark:bg-card" style={{ borderRightColor: color }}>
      <h3 className="mb-1.5 text-[14px] font-extrabold" style={{ color }}>{label}</h3>
      {children}
    </section>
  );
}

function Detail({ p, onBack }: { p: Problem; onBack: () => void }) {
  const good = p.options.filter((o) => o.rating === "good");
  const poor = p.options.filter((o) => o.rating === "poor");
  return (
    <ScreenShell title="مشكلات صفية" onBack={onBack}>
      <div className="space-y-3">
        <h2 className="text-[21px] font-extrabold leading-9 text-foreground">{p.title}</h2>
        <Block label="الموقف" color="#168477">
          <p className="text-[15px] leading-8 text-foreground">{p.intro}</p>
        </Block>
        {good.map((o) => (
          <Block key={o.text} label="المعالجة" color="#168477">
            <p className="text-[15px] font-bold leading-8 text-foreground">{o.text}</p>
            <p className="mt-1 text-[14px] leading-7 text-muted-foreground">{o.insight || o.outcome}</p>
          </Block>
        ))}
        {poor.slice(0, 1).map((o) => (
          <Block key={o.text} label="تصرّف تتجنبه" color="#B4532A">
            <p className="text-[15px] font-bold leading-8 text-foreground">{o.text}</p>
            <p className="mt-1 text-[14px] leading-7 text-muted-foreground">{o.outcome}</p>
          </Block>
        ))}
      </div>
    </ScreenShell>
  );
}

export default function ProblemsView({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<Problem | null>(null);
  return (
    <>
      <ScreenShell title="مشكلات صفية" onBack={onClose}>
        <div className="space-y-5">
          {GROUPS.map((g) => (
            <section key={g.kind}>
              <h2 className="mb-2 px-1 text-[16px] font-extrabold text-[#168477]">{g.title}</h2>
              <div className="rounded-[18px] border border-[var(--t075)] bg-white px-3 dark:border-border dark:bg-card">
                {PROBLEMS.filter((p) => p.kind === g.kind).map((p) => (
                  <button key={p.id} type="button" onClick={() => setOpen(p)} className="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--t075)] px-1 text-right last:border-b-0 active:bg-[var(--t050)] dark:border-border">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-foreground">{p.title}</span>
                    <ChevronLeft className="h-4 w-4 shrink-0 text-[#168477]" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ScreenShell>
      {open && <Detail p={open} onBack={() => setOpen(null)} />}
    </>
  );
}
