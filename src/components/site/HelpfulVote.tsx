"use client";

// «هل كان المقال مفيدًا؟»: يُرسل الجواب حدثًا إلى التحليلات لمعرفة الصفحات الضعيفة، ويُحفظ في المتصفح حتى لا يتكرر السؤال
import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

export default function HelpfulVote({ id }: { id: string }) {
  const key = `helpful:${id}`;
  const saved = useSyncExternalStore(
    noop,
    () => {
      try {
        return !!localStorage.getItem(key);
      } catch {
        return false;
      }
    },
    () => false,
  );
  const [voted, setVoted] = useState(false);
  const done = saved || voted;
  const vote = (yes: boolean) => {
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "page_helpful", { page_id: id, helpful: yes ? "yes" : "no" });
    try {
      localStorage.setItem(key, yes ? "yes" : "no");
    } catch {}
    setVoted(true);
  };
  return (
    <div className="mt-8 rounded-2xl bg-[#F4F8F6] p-4 text-center">
      {done ? (
        <p className="font-bold text-[#168477]">شكرًا لك، رأيك يساعدنا على تحسين المحتوى.</p>
      ) : (
        <>
          <p className="font-display text-[17px] font-extrabold text-[#14302A]">هل كان المقال مفيدًا؟</p>
          <div className="mt-3 flex justify-center gap-3">
            <button onClick={() => vote(true)} className="rounded-full border-2 border-[#168477] px-6 py-1.5 font-bold text-[#168477] hover:bg-[#168477] hover:text-white">نعم</button>
            <button onClick={() => vote(false)} className="rounded-full border-2 border-[#9AA9A3] px-6 py-1.5 font-bold text-[#5B7268] hover:bg-[#5B7268] hover:text-white">لا</button>
          </div>
        </>
      )}
    </div>
  );
}
