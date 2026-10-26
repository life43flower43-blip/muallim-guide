"use client";

// احتفال إكمال هدف اليوم: نجوم ذهبية تتناثر من الشعلة مرة واحدة في اليوم
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const KEY = "turbawy-goal-celebrated";
const today = () => new Date().toDateString();

export function GoalBurst({ done }: { done: boolean }) {
  const [burst, setBurst] = useState(false);
  const was = useRef(done);
  useEffect(() => {
    // يحتفل فقط عند الانتقال إلى الاكتمال، لا عند فتح التطبيق والهدف مكتمل
    const reached = done && !was.current;
    was.current = done;
    if (!reached) return;
    try {
      if (localStorage.getItem(KEY) === today()) return;
      localStorage.setItem(KEY, today());
    } catch {}
    if ("vibrate" in navigator) navigator.vibrate([20, 40, 20]);
    const on = setTimeout(() => setBurst(true), 0);
    const off = setTimeout(() => setBurst(false), 1400);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [done]);
  return (
    <AnimatePresence>
      {burst && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-50" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r = 34 + (i % 3) * 10;
            return (
              <motion.svg
                key={i}
                viewBox="-6 -6 12 12"
                className="absolute -ml-[7px] -mt-[7px] h-[14px] w-[14px]"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, scale: 1, opacity: 0, rotate: 90 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              >
                <path d="M0 -6C.8 -1.2 1.2 -.8 6 0C1.2 .8 .8 1.2 0 6C-.8 1.2 -1.2 .8 -6 0C-1.2 -.8 -.8 -1.2 0 -6Z" fill={i % 2 ? "#F4C430" : "#FFE27A"} />
              </motion.svg>
            );
          })}
        </span>
      )}
    </AnimatePresence>
  );
}
