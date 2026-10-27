"use client";

// شاشة الترحيب: الشعار يظهر بلمعة ذهبية ثانية واحدة عند أول فتح للتطبيق في الجلسة
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const KEY = "turbawy-splash-seen";

/** تُضبط حين تظهر شاشة التجهيز، فتكمل شاشة الترحيب منها دون أن يقفز الشعار مرة ثانية */
let booted = false;
export const markBootShown = () => {
  booted = true;
};

export function Splash() {
  // تُرسم من الخادم أيضًا فتغطي لحظة تحميل التطبيق، ثم تختفي فورًا إن سبق عرضها في هذه الجلسة
  const [show, setShow] = useState(true);
  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(KEY);
      sessionStorage.setItem(KEY, "1");
    } catch {}
    const t = setTimeout(() => setShow(false), seen ? 0 : 1100);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#F3F9F6] to-[#E3F1EA]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          aria-hidden="true"
        >
          <motion.div
            className="relative h-28 w-28 overflow-hidden rounded-[30px] bg-white p-2 ring-1 ring-[#F4C430]/70"
            initial={booted ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-128.png" alt="" className="h-full w-full object-contain" />
            {/* لمعة ذهبية تعبر الشعار */}
            <motion.span
              className="absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-[#FFF3B0]/80 to-transparent"
              initial={{ left: "-60%" }}
              animate={{ left: "130%" }}
              transition={{ delay: 0.35, duration: 0.6, ease: "easeInOut" }}
            />
          </motion.div>
          <motion.span
            className="font-display text-3xl font-extrabold text-[#174D41]"
            initial={booted ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            تربوي
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
