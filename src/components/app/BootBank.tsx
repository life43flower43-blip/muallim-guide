"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { markBootShown } from "./Splash";

// تحويل الأرقام إلى مشرقية للعرض
const east = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

/** شاشة تجهيز البنك التربوي — تظهر أثناء تحميل بيانات المفاهيم والأسئلة */
export default function BootBank({
  progress,
  failed,
  onRetry,
}: {
  progress: number;
  failed: boolean;
  onRetry: () => void;
}) {
  const pct = Math.floor(progress * 100);
  useEffect(markBootShown, []);
  return (
    // بنفس هيئة شاشة الترحيب، فيبدو الفتح شاشة واحدة متصلة
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#F3F9F6] to-[#E3F1EA] px-8 text-center">
      <div className="h-28 w-28 overflow-hidden rounded-[30px] bg-white p-2 ring-1 ring-[#F4C430]/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/logo-128.png" alt="" className="h-full w-full object-contain" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold text-[#174D41]">تربوي</h1>
        {failed ? (
          <>
            <p className="text-sm font-medium leading-6 text-foreground">
              تعذّر تحميل البنك التربوي
            </p>
            <p className="text-xs leading-6 text-muted-foreground">
              تأكد من الاتصال بالإنترنت ثم أعد المحاولة — تُحمَّل البيانات مرة
              واحدة وتُحفظ لاحقًا للعمل دون اتصال.
            </p>
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCcw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-[#DCEFE5]" role="progressbar" aria-valuenow={pct} aria-label={`جارٍ التجهيز ${east(pct)}٪`}>
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#F4C430] to-[#C99A06] transition-[width] duration-300"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
