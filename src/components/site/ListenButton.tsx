"use client";
// «استمع»: قراءة صوتية للنص بصوت الجهاز نفسه (مجانية، بلا خدمة خارجية). يختفي إن لم يدعم المتصفح القراءة.
import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";

export default function ListenButton({ targetId }: { targetId: string }) {
  const [ok, setOk] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const t = setTimeout(() => setOk(true), 0);
    const stop = () => window.speechSynthesis.cancel();
    window.addEventListener("pagehide", stop);
    return () => { clearTimeout(t); stop(); window.removeEventListener("pagehide", stop); };
  }, []);
  if (!ok) return null;
  const toggle = () => {
    const s = window.speechSynthesis;
    if (on) { s.cancel(); setOn(false); return; }
    const el = document.getElementById(targetId);
    const text = (el?.innerText ?? "").replace(/\s+/g, " ").trim();
    if (!text) return;
    // المتصفح يقطع الجمل الطويلة جدًا، فيُقرأ النص جملة جملة
    const parts = text.match(/[^.؟!\n]+[.؟!]?/g) ?? [text];
    const voice = s.getVoices().find((v) => v.lang.startsWith("ar"));
    s.cancel();
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = voice?.lang ?? "ar-SA";
      if (voice) u.voice = voice;
      u.rate = 0.95;
      if (i === parts.length - 1) u.onend = () => setOn(false);
      s.speak(u);
    });
    setOn(true);
  };
  return (
    <button type="button" onClick={toggle} className="inline-flex items-center gap-1.5 rounded-full border border-[#C5E5DF] bg-white px-3 py-1 text-[13px] font-bold text-[#136F5C] print:hidden">
      {on ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-4 w-4" />}
      {on ? "إيقاف" : "استمع"}
    </button>
  );
}
