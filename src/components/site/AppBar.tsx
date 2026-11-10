"use client";

// شريط ثابت أسفل الشاشة في الهاتف يدعو إلى التطبيق، ويُغلق لمدة أسبوع
import { useClientValue } from "@/lib/use-client-value";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const KEY = "turbawy-appbar-closed";

export default function AppBar() {
  const [hidden, setHidden] = useState(false);
  const path = usePathname();
  const due = useClientValue(() => {
    let closed = 0;
    try { closed = Number(localStorage.getItem(KEY) || 0); } catch {}
    return Date.now() - closed > 7 * 86400000;
  }, false);
  const show = due && !hidden;
  if (!show || path === "/tatbeeq") return null;
  const close = () => {
    setHidden(true);
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4E3DA] bg-white/95 px-3 py-2.5 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <button type="button" onClick={close} aria-label="إغلاق" className="text-[#8AA095]"><X className="h-5 w-5" /></button>
        <img src="/icons/logo-128.png" alt="" className="h-10 w-10 rounded-xl border border-[#E2ECE6] object-contain" />
        <div className="min-w-0 flex-1 leading-5">
          <p className="truncate text-[14px] font-extrabold text-[#14302A]">تطبيق تربوي</p>
          <p className="truncate text-[12px] text-[#6B8077]">آلاف الأسئلة واختبارات محاكية، مجانًا</p>
        </div>
        <Link prefetch={false} href="/tatbeeq" className="shrink-0 rounded-full bg-[#136F5C] px-4 py-2 text-[13px] font-bold text-white">احصل عليه</Link>
      </div>
    </div>
  );
}
