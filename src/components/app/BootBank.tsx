"use client";

import { RefreshCcw, School } from "lucide-react";

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
  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col items-center justify-center gap-6 bg-background px-8 text-center shadow-xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
        <School className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-black text-foreground">تُربَوي</h1>
        {failed ? (
          <>
            <p className="text-sm font-bold leading-6 text-foreground">
              تعذّر تحميل البنك التربوي
            </p>
            <p className="text-xs leading-6 text-muted-foreground">
              تأكد من الاتصال بالإنترنت ثم أعد المحاولة — تُحمَّل البيانات مرة
              واحدة وتُحفظ لاحقًا للعمل دون اتصال.
            </p>
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow"
            >
              <RefreshCcw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </>
        ) : (
          <>
            <p className="text-sm font-bold leading-6 text-foreground">
              جارٍ تجهيز البنك التربوي…
            </p>
            <p className="text-xs text-muted-foreground">
              يُحمَّل مرة واحدة ثم يعمل التطبيق بسرعة ودون اتصال
            </p>
            <div className="mt-3 h-2 w-64 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
            <p className="pt-1 text-xs font-bold tabular-nums text-amber-600">
              {east(pct)}٪
            </p>
          </>
        )}
      </div>
    </div>
  );
}
