"use client";

// النطق الصوتي — قراءة الشرح والأمثلة بصوت عربي (ميزة من تقرير المنافسين)
// واجهة المتصفح Web Speech API فقط — بلا خدمات خارجية وبلا محتوى مؤلف

export const speechSupported = (): boolean =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, onEnd?: () => void): boolean {
  if (!speechSupported() || !text.trim()) return false;
  stopSpeak();
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const ar = voices.find((v) => v.lang?.toLowerCase().startsWith("ar"));
    if (ar) u.voice = ar;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeak() {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {}
}
