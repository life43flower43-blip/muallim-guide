"use client";

import { RefreshCcw, GraduationCap } from "lucide-react";

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
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-background px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <GraduationCap className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold text-primary">تربوي</h1>
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
            <p className="text-sm font-medium leading-6 text-foreground">
              جارٍ تجهيز البنك التربوي…
            </p>
            <p className="text-xs text-muted-foreground">
              يُحمَّل مرة واحدة ثم يعمل التطبيق بسرعة ودون اتصال
            </p>
            <div className="mt-3 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
            <p className="pt-1 text-xs font-medium tabular-nums text-muted-foreground">
              {east(pct)}٪
            </p>
          </>
        )}
      </div>
    </div>
  );
}
