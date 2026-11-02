"use client";

// أزرار الهاتف في رأس الموقع: زر بحث يفتح شريط بحث بعرض الشاشة، وزر قائمة يفتح لوحة كاملة
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import SearchBox from "./SearchBox";

type L = { href: string; label: string };

export default function MobileBar({ nav, courses }: { nav: L[]; courses: L[] }) {
  const [panel, setPanel] = useState<"none" | "search" | "menu">("none");
  useEffect(() => {
    document.body.style.overflow = panel === "menu" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [panel]);
  const close = () => setPanel("none");
  const btn = "flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4E3DA] text-[#136F5C]";

  return (
    <div className="ms-auto flex items-center gap-2 md:hidden">
      <button type="button" aria-label="بحث" onClick={() => setPanel(panel === "search" ? "none" : "search")} className={`${btn} ${panel === "search" ? "bg-[#136F5C] text-white" : ""}`}>
        {panel === "search" ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
      </button>
      <button type="button" aria-label="القائمة" onClick={() => setPanel("menu")} className={btn}>
        <Menu className="h-6 w-6" />
      </button>

      {panel === "search" && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-[#E2ECE6] bg-white px-4 py-3">
          <SearchBox autoFocus onDone={close} />
        </div>
      )}

      {panel === "menu" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-[#E2ECE6] px-4 py-3">
            <span className="font-display text-[22px] font-extrabold text-[#136F5C]">تربوي</span>
            <button type="button" aria-label="إغلاق" onClick={close} className={btn}><X className="h-6 w-6" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <SearchBox onDone={close} />
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={close} className="flex h-14 items-center justify-center rounded-2xl bg-[#F4F8F6] px-2 text-center text-[15px] font-bold text-[#14302A]">{n.label}</Link>
                </li>
              ))}
            </ul>
            <p className="mb-2 mt-6 text-[13px] font-extrabold text-[#5B7268]">المحاور</p>
            <ul className="grid grid-cols-2 gap-2">
              {courses.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} onClick={close} className="block truncate rounded-xl border border-[#E2ECE6] px-3 py-3 text-[14px] font-bold text-[#1E3A32]">{c.label}</Link>
                </li>
              ))}
            </ul>
            <Link href="/app" onClick={close} className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-[#E8A317] font-bold text-[#2B1D00]">ابدأ التدريب مجانًا</Link>
          </div>
        </div>
      )}
    </div>
  );
}
