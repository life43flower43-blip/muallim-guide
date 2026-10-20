"use client";

// زر النطق — أيقونة صغيرة تقرأ النص بصوت عربي وتتحول لإيقاف أثناء القراءة

import { useEffect, useState, useSyncExternalStore } from "react";
import { Volume2, Square } from "lucide-react";
import { speak, stopSpeak, speechSupported } from "@/lib/speech";

const emptySubscribe = () => () => {};

export default function SpeakButton({
  text,
  label = "قراءة صوتية",
  tone = "indigo",
}: {
  text: string;
  label?: string;
  tone?: "indigo" | "sky";
}) {
  // الكشف عن الترطيب بلا setState — نمط useSyncExternalStore القياسي
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [on, setOn] = useState(false);

  useEffect(() => () => stopSpeak(), []); // إسكات الصوت عند مغادرة الصفحة

  if (!mounted || !speechSupported()) return null;

  const toggle = () => {
    if (on) {
      stopSpeak();
      setOn(false);
      return;
    }
    const ok = speak(text, () => setOn(false));
    setOn(ok);
  };

  const idle =
    tone === "sky"
      ? "bg-sky-100 text-sky-700"
      : "bg-indigo-100 text-indigo-700";

  return (
    <button
      onClick={toggle}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
        on ? "bg-primary text-primary-foreground" : idle
      } ${tone === "sky" ? "dark:bg-sky-500/20 dark:text-sky-200" : "dark:bg-indigo-500/20 dark:text-indigo-200"}`}
    >
      {on ? (
        <Square className="h-3 w-3" fill="currentColor" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
}
