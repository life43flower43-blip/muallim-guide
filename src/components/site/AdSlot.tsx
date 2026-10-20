"use client";

// مساحة إعلان Google AdSense — تظهر فقط إذا ضُبط NEXT_PUBLIC_ADSENSE_CLIENT،
// وفي صفحات المحتوى العامة وحدها، بعيدًا عن أزرار التطبيق (سياسة النقرات العرضية).
import { useEffect } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function AdSlot({ slot }: { slot?: string }) {
  useEffect(() => {
    if (!CLIENT) return;
    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle ||= []).push({});
    } catch {}
  }, []);
  if (!CLIENT) return null;
  return (
    <div className="my-8">
      <p className="mb-1 text-center text-[11px] text-muted-foreground">إعلان</p>
      <ins className="adsbygoogle block" style={{ display: "block" }} data-ad-client={CLIENT} data-ad-slot={slot ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
