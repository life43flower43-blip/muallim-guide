"use client";

// قائمة اليوم الأول في المدرسة — من ميزة «ط» في بحث مشاكل الطلبة:
// قلق أول دخول للمدرسة موثق في دراسات عربية عدة. خمسة أقسام تُشطّط بندًا بندًا
// وتُشارك كنص جاهز. تعرض داخل تبويب في سجل التدريب الميداني.
// قواعد صارمة: صفر أرقام لاتينية ولا إيموجي، والتنصيص بعلامات «».

import { useMemo } from "react";
import { Share2, MessageSquareQuote, Check } from "lucide-react";
import {
  FIRST_DAY_SECTIONS,
  firstDayReadinessWord,
  composeFirstDayText,
} from "@/lib/firstday";
import { useApp } from "@/lib/store";
import { shareText } from "@/lib/share";
import { toast } from "@/hooks/use-toast";
import { Callout, Card, Chip, ProgressBar, SecondaryButton } from "./ui-kit";

export default function FirstDayList() {
  const firstdayChecked = useApp((s) => s.firstdayChecked);
  const toggleFirstday = useApp((s) => s.toggleFirstday);

  const progress = useMemo(() => firstdayChecked.length, [firstdayChecked]);
  const total = useMemo(
    () => FIRST_DAY_SECTIONS.reduce((a, s) => a + s.items.length, 0),
    []
  );

  const shareList = async () => {
    const res = await shareText("قائمة اليوم الأول في المدرسة", composeFirstDayText(firstdayChecked));
    if (res === "failed") toast({ title: "المشاركة غير متاحة — انسخ القائمة يدويًا" });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[15px] leading-7 text-secondary-foreground">
          أول دخول للمدرسة يقلق كل معلم متدرب. هذه القائمة تحوّل القلق إلى خطوات: علّم كل بند تنجزه.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={total > 0 ? (progress / total) * 100 : 0} className="flex-1" />
          <span className="shrink-0 text-[13px] text-muted-foreground">{firstDayReadinessWord(firstdayChecked)}</span>
        </div>
      </div>

      {FIRST_DAY_SECTIONS.map((section) => {
        const doneInSection = section.items.filter((i) => firstdayChecked.includes(i.id)).length;
        const allDone = doneInSection === section.items.length;
        return (
          <Card key={section.id} className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold">{section.title}</h3>
                <p className="mt-0.5 text-[13px] leading-6 text-muted-foreground">{section.guide}</p>
              </div>
              {allDone && <Chip tone="success">اكتمل</Chip>}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const on = firstdayChecked.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleFirstday(item.id)}
                      className="flex min-h-[44px] w-full items-start gap-3 rounded-lg px-1 py-2 text-right hover:bg-muted/60"
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className={`text-[15px] leading-6 ${on ? "text-muted-foreground line-through" : ""}`}>{item.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {section.scripts && (
              <Callout tone="info" icon={MessageSquareQuote} title="جمل جاهزة تقولها كما هي" className="mt-4">
                <ul className="space-y-2">
                  {section.scripts.map((x, i) => (
                    <li key={i}>«{x}»</li>
                  ))}
                </ul>
              </Callout>
            )}
          </Card>
        );
      })}

      <SecondaryButton onClick={shareList} className="w-full">
        <Share2 className="h-4 w-4" /> انسخ قائمتي أو شاركها
      </SecondaryButton>
    </div>
  );
}
