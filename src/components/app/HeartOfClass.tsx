"use client";

// قلب الصف — سلّم المشاعر التربوي وشرارة المبدع
// طبقة ملء شاشة من دليل المعلم: تبويبان —
// «سلّم المشاعر»: ست عائلات من مشاعر الصف، ولكل شخصية بطاقة قراءة مريحة قابلة للفتح
// «شرارة المبدع»: فكرة إبداعية تقلب الدرس، وزر «شرارة أخرى» يعطي فكرة جديدة
// قواعد صارمة: صفر أرقام لاتينية ولا لاتيني، التنصيص ب«»، بنفسجي×عنبري فقط.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  Lightbulb,
  ChevronDown,
  RefreshCw,
  Eye,
  HeartHandshake,
  Footprints,
  MessageCircleHeart,
  ShieldAlert,
} from "lucide-react";
import { HEART_FAMILIES, SPARKS } from "@/lib/personas";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Callout, Card, Divided, PrimaryButton, ScreenShell, SectionHeader } from "./ui-kit";

type Tab = "ladder" | "spark";

const SIGNALS_LABEL = "علامات تلاحظها في الصف";
const INSIDE_LABEL = "ما يدور في داخله";
const NEED_LABEL = "ما يحتاجه منك";
const STEPS_LABEL = "خطوات عملية";
const PHRASE_LABEL = "عبارة تقولها له";
const AVOID_LABEL = "تجنّب";

export default function HeartOfClass() {
  const clearHeart = useUi((s) => s.clearHeart);
  const [tab, setTab] = useState<Tab>("ladder");
  const [openPersona, setOpenPersona] = useState<string | null>(null);

  // شرارة المبدع — فكرة عشوائية تتغير بكل ضغطة
  const [sparkIdx, setSparkIdx] = useState(() => Math.floor(Math.random() * SPARKS.length));
  const spark = SPARKS[sparkIdx % SPARKS.length];
  const nextSpark = () => {
    setSparkIdx((i) => {
      let n = i;
      while (n === i) n = Math.floor(Math.random() * SPARKS.length);
      return n;
    });
  };

  return (
    <ScreenShell title="قلب الصف" sub="مشاعر الطلاب خلف تصرفاتهم، وأفكار تقلب الحصة" onClose={clearHeart}>
      <div role="tablist" aria-label="أقسام قلب الصف" className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
        {(
          [
            { id: "ladder", label: "سلّم المشاعر" },
            { id: "spark", label: "شرارة المبدع" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-[40px] rounded-lg text-sm transition-colors ${tab === t.id ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ladder" ? (
        <div className="space-y-6">
          <p className="text-[15px] leading-7 text-secondary-foreground">
            ست عائلات من المشاعر تشرح كثيرًا من تصرفات الطلاب. اختر شخصية لترى علاماتها، وما تحتاجه منك، وخطوات عملية للتعامل معها.
          </p>
          {HEART_FAMILIES.map((f) => (
            <section key={f.id}>
              <SectionHeader title={f.name} sub={f.hint} />
              <Divided>
                {f.personas.map((p) => {
                  const isOpen = openPersona === p.id;
                  return (
                    <div key={p.id}>
                      <button
                        type="button"
                        onClick={() => setOpenPersona(isOpen ? null : p.id)}
                        aria-expanded={isOpen}
                        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium">{p.name}</span>
                          <span className="mt-0.5 block text-[13px] text-muted-foreground">{p.tag}</span>
                        </span>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="space-y-5 border-t border-border bg-muted/30 px-4 py-5 text-[15px] leading-7">
                          <div>
                            <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                              <Eye className="h-4 w-4 text-primary" /> {SIGNALS_LABEL}
                            </p>
                            <ul className="space-y-1 text-secondary-foreground">
                              {p.signals.map((x, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                  {x}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                              <HeartHandshake className="h-4 w-4 text-primary" /> {INSIDE_LABEL}
                            </p>
                            <p className="text-secondary-foreground">{p.inside}</p>
                          </div>
                          <Callout tone="info" icon={Heart} title={NEED_LABEL}>
                            {p.need}
                          </Callout>
                          <div>
                            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                              <Footprints className="h-4 w-4 text-primary" /> {STEPS_LABEL}
                            </p>
                            <ol className="space-y-2 text-secondary-foreground">
                              {p.steps.map((x, i) => (
                                <li key={i} className="flex gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                    {ad(i + 1)}
                                  </span>
                                  {x}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <Callout tone="warning" icon={MessageCircleHeart} title={PHRASE_LABEL}>
                            «{p.phrase}»
                          </Callout>
                          <div>
                            <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-destructive">
                              <ShieldAlert className="h-4 w-4" /> {AVOID_LABEL}
                            </p>
                            <ul className="space-y-1 text-secondary-foreground">
                              {p.avoid.map((x, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                                  {x}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Divided>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-[15px] leading-7 text-secondary-foreground">فكرة واحدة تكفي لتغيّر حصة كاملة. اطلب شرارة جديدة كلما احتجت فكرة لدرسك.</p>
          <AnimatePresence mode="wait">
            <motion.div key={sparkIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Card className="p-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gem-soft text-gem">
                  <Lightbulb className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{spark.title}</h3>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-8 text-secondary-foreground">{spark.body}</p>
              </Card>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center">
            <PrimaryButton onClick={nextSpark}>
              <RefreshCw className="h-4 w-4" /> شرارة أخرى
            </PrimaryButton>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}
