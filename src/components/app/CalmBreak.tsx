"use client";

// تمرين الهدوء قبل الاختبار — من بحث مشاكل الطلبة: قلق الاختبارات يؤثر على ٤٠-٦٠٪ منهم.
// مرحلتان قصيرتان: تنفّس صندوقي موجّه (شهيق، احتفاظ، زفير، احتفاظ) ثم تأريض حسي ٥-٤-٣-٢-١.
// بلا أرقام لاتينية ولا إيموجي — العد بالكلمات والأيقونات من lucide فقط.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Eye, Hand, Ear, Wind, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PHASES = [
  { label: "شهيق من الأنف", hint: "املأ صدرك بهدوء", dur: 4, scale: 1.18 },
  { label: "احتفاظ", hint: "أمسك أنفاسك برفق", dur: 4, scale: 1.18 },
  { label: "زفير من الفم", hint: "أفرغ رئتيك تمامًا", dur: 6, scale: 0.82 },
  { label: "احتفاظ", hint: "استرح لحظة", dur: 2, scale: 0.82 },
] as const;

const GROUNDING = [
  { icon: Eye, label: "خمسة أشياء تراها حولك الآن" },
  { icon: Hand, label: "أربعة أشياء تشعر بملامستها" },
  { icon: Ear, label: "ثلاثة أصوات تسمعها" },
  { icon: Wind, label: "رائحتان تشمهما" },
  { icon: CheckCircle2, label: "شيء واحد تتذوقه أو تنتبه لتنفسك" },
];

export default function CalmBreak({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"breath" | "ground" | "done">("breath");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [groundIdx, setGroundIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // آلة حالة التنفس — كل طور يعدّ ثوانيه ثم ينتقل
  useEffect(() => {
    if (!open || stage !== "breath") return;
    const phase = PHASES[phaseIdx];
    if (tick < phase.dur) {
      timer.current = setTimeout(() => setTick((t) => t + 1), 1000);
      return () => {
        if (timer.current !== null) clearTimeout(timer.current);
      };
    }
    setTick(0);
    if (phaseIdx + 1 >= PHASES.length) {
      setGroundIdx(0);
      setStage("ground");
    } else setPhaseIdx((i) => i + 1);
  }, [open, stage, phaseIdx, tick]);

  useEffect(() => {
    if (!open) {
      // تصفير الحالة عند الإغلاق — جاهز للجلسة القادمة
      const id = setTimeout(() => {
        setStage("breath");
        setPhaseIdx(0);
        setTick(0);
        setGroundIdx(0);
      }, 250);
      return () => clearTimeout(id);
    }
  }, [open]);

  const phase = PHASES[phaseIdx];
  const rounds = Math.floor((phaseIdx + (tick < phase.dur ? 0 : 1)) / PHASES.length) + 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[420px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <HeartPulse className="h-5 w-5" />
            {stage === "breath" ? "تنفّس معي — صفّي ذهنك" : stage === "ground" ? "تأريض حسي — عُد إلى هنا والآن" : "أنت جاهز"}
          </DialogTitle>
          <DialogDescription>
            {stage === "breath"
              ? "ثلاث جولات قصيرة كفيلة بإهدئة نبضك قبل الاختبار — اتبع الدائرة بعينك"
              : stage === "ground"
                ? "أنجز كل بند في ذهنك ثم انتقل إلى التالي"
                : "صفاء الذهن أول سلاح النجاح — ابدأ اختبارك الآن بثقة"}
          </DialogDescription>
        </DialogHeader>

        {stage === "breath" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex h-56 w-56 items-center justify-center">
              <motion.div
                animate={{ scale: phase.scale }}
                transition={{ duration: phase.dur, ease: "easeInOut" }}
                className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-b from-[#2D6A4F] to-[#1B4332] shadow-lg"
              >
                <span className="text-center text-lg font-black text-white">{phase.label}</span>
              </motion.div>
            </div>
            <p className="text-sm font-bold text-muted-foreground">{phase.hint}</p>
            <p className="rounded-full bg-accent px-4 py-1 text-xs font-black text-primary">
              جولة {["الأولى", "الثانية", "الثالثة"][Math.min(rounds - 1, 2)]} من ثلاث
            </p>
          </div>
        )}

        {stage === "ground" && (
          <div className="space-y-2 py-1">
            {GROUNDING.map((g, i) => {
              const Icon = g.icon;
              const active = i === groundIdx;
              const passed = i < groundIdx;
              return (
                <button
                  key={g.label}
                  disabled={!active}
                  onClick={() => {
                    if (i + 1 >= GROUNDING.length) setStage("done");
                    else setGroundIdx((x) => x + 1);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-right transition-colors ${
                    passed
                      ? "border-emerald-200 bg-emerald-50 opacity-70"
                      : active
                        ? "border-primary bg-accent"
                        : "border-border bg-white opacity-50"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      passed ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`text-sm font-bold ${passed ? "line-through" : ""}`}>{g.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {stage === "done" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </motion.div>
            <p className="text-center text-sm font-bold leading-7 text-muted-foreground">
              تنفسك منتظم وذهنك حاضر — القلق ضيف عابر وأنت صاحب المكان.
            </p>
          </div>
        )}

        <Button
          onClick={() => {
            if (stage === "breath") setStage("ground");
            else onClose();
          }}
          className="h-12 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground"
        >
          {stage === "done" ? "ابدأ الاختبار بثقة" : stage === "breath" ? "تخطي إلى التأريض" : "إغلاق"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
