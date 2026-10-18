"use client";

// زر النطق — أيقونة صغيرة تقرأ النص بصوت عربي وتتحول لإيقاف أثناء القراءة

import { useEffect, useState, useSyncExternalStore } from "react";
import { Volume2, Square } from "lucide-react";
import { speak, stopSpeak, speechSupported } from "@/lib/speech";

const emptySubscribe = () => () => {};

export default function SpeakButton({
  text,
  label = "قراءة صوتية",
}: {
  text: string;
  label?: string;
  tone?: string;
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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {on ? <Square className="h-3.5 w-3.5" fill="currentColor" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}
