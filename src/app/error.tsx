"use client";

import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";

// أخطاء تحميل أجزاء نسخة قديمة بعد تحديث التطبيق: تُعالج بإعادة تحميل تلقائية مرة واحدة
const STALE = /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i;

/** شبّاك أمان التطبيق — يظهر عند أي خطأ غير متوقع بدل الشاشة الفارغة */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (!STALE.test(`${error?.name} ${error?.message}`)) return;
    try {
      if (sessionStorage.getItem("turbawy-auto-reload")) return;
      sessionStorage.setItem("turbawy-auto-reload", "1");
    } catch {}
    window.location.reload();
  }, [error]);
  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col items-center justify-center gap-5 bg-background px-8 text-center shadow-xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl">
        ⚠
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-black text-foreground">
          حدث خلل غير متوقع
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          توقفت الشاشة لأسباب عابرة. أعد المحاولة — وإذا تكرر الأمر فحدّث
          الصفحة، وبيناتك تعمل بقية الشاشات التي تزورها بعد ذلك بشكل طبيعي.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow"
        >
          <RefreshCcw className="h-4 w-4" />
          إعادة المحاولة
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground"
        >
          تحديث الصفحة
        </button>
      </div>
      {/* نص الخطأ صغيرًا للتشخيص */}
      <p dir="ltr" className="max-w-full break-words text-[10px] leading-4 text-muted-foreground/70">{`${error?.name ?? ""}: ${error?.message ?? ""}`.slice(0, 200)}</p>
    </div>
  );
}
