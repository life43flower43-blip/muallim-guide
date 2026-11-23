"use client";

// شريط علوي مختصر يظهر عند النزول في الصفحة: الشعار والبحث والقائمة، ثابت أعلى الشاشة
import { useEffect, useState } from "react";

export default function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 260);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 border-b border-[#E2ECE6] bg-white/95 shadow-sm backdrop-blur transition-transform duration-200 ${show ? "translate-y-0" : "-translate-y-full"}`}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">{children}</div>
    </div>
  );
}
