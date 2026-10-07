"use client";

// المشاركة — مشاركة المفهوم أو التطبيق عبر واجهة المتصفح Web Share API
// ومع غيابها يُنسخ النص إلى الحافظة — بلا خدمات خارجية وبلا محتوى مؤلف

export type ShareResult = "shared" | "copied" | "failed";

export async function shareText(title: string, text: string): Promise<ShareResult> {
  const full = `${title}\n\n${text}`;
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title, text: full });
      return "shared";
    } catch (e) {
      // ألغى المستخدم نافذة المشاركة — لا فعل ولا رسالة
      if ((e as DOMException)?.name === "AbortError") return "failed";
    }
  }
  try {
    await navigator.clipboard.writeText(full);
    return "copied";
  } catch {
    return "failed";
  }
}
