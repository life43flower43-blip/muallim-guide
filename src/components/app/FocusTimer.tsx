"use client";

// مؤقت التركيز — من بحث مشاكل الطلبة: كل مقاطعة تسرق حتى عشرين دقيقة من التركيز،
// والتسويف يمس تسعين بالمئة من الطلبة. جلسات قصيرة موقوتة بأسلوب بومودورو:
// اختر المدة، ابدأ المؤقت، واحسب جلستك عند اكتمالها. بلا أرقام لاتينية في النصوص.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { ad, arCount } from "@/lib/arabic";

const PRESETS = [
  { label: "قصيرة", desc: "خمس عشرة دقيقة", sec: 15 * 60 },
  { label: "المعتادة", desc: "خمس وعشرون دقيقة", sec: 25 * 60 },
  { label: "العميقة", desc: "خمسون دقيقة", sec: 50 * 60 },
] as const;

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${ad(m)}:${ad(String(ss).padStart(2, "0"))}`;
};

export default function FocusTimer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addFocusSession = useApp((s) => s.addFocusSession);
  const focusCount = useApp((s) => s.focusCount);
  const [preset, setPreset] = useState<number>(1); // فهرس المدة المختارة
  const [left, setLeft] = useState(PRESETS[1].sec);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const fired = useRef(false);

  // عدّ الثواني أثناء التشغيل — بلا تسريبات عند الإغلاق
  useEffect(() => {
    if (!open || !running || completed) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open, running, completed]);

  // لحظة الاكتمال — تسجيل الجلسة مرة واحدة
  useEffect(() => {
    if (open && running && left === 0 && !fired.current) {
      fired.current = true;
      setRunning(false);
      setCompleted(true);
      addFocusSession();
      toast({ title: "جلسة تركيز مكتملة — خذ استراحة تليق بها" });
    }
  }, [open, running, left, addFocusSession]);

  useEffect(() => {
    if (!open) {
      // تصفير عند الإغلاق مع الاحتفاظ بالعدّاد الكلي
      const id = setTimeout(() => {
        setRunning(false);
        setCompleted(false);
        setLeft(PRESETS[preset].sec);
        fired.current = false;
      }, 250);
      return () => clearTimeout(id);
    }
  }, [open, preset]);

  const choose = (i: number) => {
    if (running) return;
    setPreset(i);
    setLeft(PRESETS[i].sec);
    setCompleted(false);
    fired.current = false;
  };

  const phase = PRESETS[preset];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[420px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Timer className="h-5 w-5" /> جلسة تركيز
          </DialogTitle>
          <DialogDescription>
            ضع هاتفك بعيدًا، اختر مدة، ونغمس في مهمة واحدة — العقل يحتاج غوصًا لا وثباتًا فوق الماء.
          </DialogDescription>
        </DialogHeader>

        {/* اختيار المدة */}
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              disabled={running}
              onClick={() => choose(i)}
              className={`rounded-2xl border-2 p-3 text-center transition-colors ${
                preset === i
                  ? "border-primary bg-accent"
                  : "border-border bg-white disabled:opacity-50"
              }`}
            >
              <span className="block text-sm font-black text-primary">{p.label}</span>
              <span className="mt-0.5 block text-[11px] font-bold text-muted-foreground">{p.desc}</span>
            </button>
          ))}
        </div>

        {/* القرص العدّاد */}
        <div className="flex flex-col items-center gap-3 py-2">
          <motion.div
            animate={running ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={running ? { repeat: Infinity, duration: 2 } : {}}
            className={`flex h-40 w-40 items-center justify-center rounded-full border-4 ${
              completed
                ? "border-indigo-500 bg-indigo-50"
                : running
                  ? "border-primary bg-accent"
                  : "border-border bg-white"
            }`}
          >
            {completed ? (
              <CheckCircle2 className="h-16 w-16 text-indigo-600" />
            ) : (
              <span dir="ltr" className="text-4xl font-black tabular-nums text-primary">
                {fmt(left)}
              </span>
            )}
          </motion.div>
          <p className="text-xs font-bold text-muted-foreground">
            {completed
              ? "جلسة مكتملة — أنهيتها دون مقاطعة"
              : running
                ? "غوص عميق جارٍ — لا تلمس الهاتف"
                : "جاهز للانطلاق — أغلق كل ما يشغّلك"}
          </p>
        </div>

        {/* أزرار التحكم */}
        {!completed ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setRunning((r) => !r)}
              className="h-12 rounded-2xl bg-primary font-black text-primary-foreground"
            >
              {running ? <Pause className="ml-1 h-5 w-5" /> : <Play className="ml-1 h-5 w-5" fill="currentColor" />}
              {running ? "إيقاف مؤقت" : "ابدأ"}
            </Button>
            <Button
              variant="outline"
              disabled={running}
              onClick={() => choose(preset)}
              className="h-12 rounded-2xl border-2 font-black"
            >
              <RotateCcw className="ml-1 h-4 w-4" /> إعادة ضبط
            </Button>
          </div>
        ) : (
          <Button onClick={onClose} className="h-12 w-full rounded-2xl bg-indigo-600 font-black text-white hover:bg-indigo-700">
            استراحة قصيرة الآن
          </Button>
        )}

        <p className="text-center text-[11px] font-bold text-muted-foreground">
          جلساتك المكتملة حتى الآن: {arCount(focusCount, {
            one: "جلسة واحدة",
            two: "جلستان",
            few: "جلسات",
            many: "جلسة",
          })}
        </p>
      </DialogContent>
    </Dialog>
  );
}
