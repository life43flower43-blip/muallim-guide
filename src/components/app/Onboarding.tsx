"use client";

// ============================================================================
// شاشة البداية — سؤال واحد عن الهدف (كما تفعل Coursera وDuolingo)
// ثم موعد الاختبار اختياريًا. لا اسم ولا تحية: يدخل المتعلم إلى العمل مباشرة.
// ============================================================================

import { useState } from "react";
import { Briefcase, Check, GraduationCap, School } from "lucide-react";
import { useApp, type LearnerGoal } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, PrimaryButton } from "./ui-kit";
import AuthPanel from "./AuthPanel";

const GOALS: { id: LearnerGoal; title: string; sub: string; icon: React.ElementType }[] = [
  { id: "job", title: "الاستعداد لاختبار التوظيف", sub: "اختبارات محاكية ومراجعة للمحاور وجاهزية محسوبة", icon: Briefcase },
  { id: "university", title: "مقررات كلية التربية", sub: "المفاهيم فصلًا فصلًا مع تدريب بعد كل فصل", icon: GraduationCap },
  { id: "teacher", title: "تطوير ممارستي كمعلم", sub: "مواقف صفية وخطط دروس وأدوات تقويم", icon: School },
];

export default function Onboarding() {
  const setGoal = useApp((s) => s.setGoal);
  const setExamDate = useApp((s) => s.setExamDate);
  const setOnboarded = useApp((s) => s.setOnboarded);
  const [goal, pick] = useState<LearnerGoal | null>(null);
  const [date, setDate] = useState("");
  const [signIn, setSignIn] = useState(false);

  const finish = () => {
    if (goal) setGoal(goal);
    setExamDate(goal === "job" && date ? date : null);
    setOnboarded();
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="safe-top mx-auto flex max-w-xl flex-col gap-8 px-5 pb-10 pt-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white">
<img src="/icons/logo-128.png" alt="" className="h-full w-full object-contain p-0.5" />
          </span>
          <span className="font-display text-xl font-bold text-primary">تربوي</span>
        </div>

        {signIn ? (
          <Card className="p-5">
            <h1 className="mb-4 font-display text-xl font-bold">ادخل إلى حسابك</h1>
            <AuthPanel onDone={setOnboarded} />
            <button type="button" onClick={() => setSignIn(false)} className="mt-4 min-h-[44px] w-full text-sm font-medium text-primary">
              رجوع
            </button>
          </Card>
        ) : (
          <>
            <div>
              <h1 className="font-display text-[26px] font-bold leading-[1.6]">ما الذي تستعد له؟</h1>
              <p className="mt-2 text-base leading-7 text-muted-foreground">
                نرتّب لك خطة اليوم والتدريب بحسب هدفك. يمكنك تغييره لاحقًا من حسابك.
              </p>
            </div>

            <div role="radiogroup" aria-label="هدفك" className="space-y-3">
              {GOALS.map((g) => {
                const on = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pick(g.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-right transition-colors",
                      on ? "border-primary ring-2 ring-primary/15" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", on ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
                      <g.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">{g.title}</span>
                      <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{g.sub}</span>
                    </span>
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            {goal === "job" && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-secondary-foreground">موعد الاختبار (اختياري)</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="block text-xs text-muted-foreground">نحسب منه الأيام الباقية ونوزّع المراجعة عليها.</span>
              </label>
            )}

            <div className="space-y-3">
              <PrimaryButton disabled={!goal} onClick={finish} className="h-12 w-full">
                ابدأ
              </PrimaryButton>
              <button type="button" onClick={() => setSignIn(true)} className="min-h-[44px] w-full text-sm font-medium text-primary">
                لدي حساب — تسجيل الدخول
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
