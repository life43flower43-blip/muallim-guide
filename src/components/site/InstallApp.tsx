"use client";

// زر تثبيت التطبيق: يستعمل نافذة التثبيت في أندرويد إن توفرت، وإلا يعرض خطوات الآيفون، أو يفتح التطبيق
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Share, SquarePlus, Smartphone } from "lucide-react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIP | null = null;
if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIP; });
}

export default function InstallApp({ className = "" }: { className?: string }) {
  const [can, setCan] = useState(false);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const t = setInterval(() => setCan(!!deferred), 700);
    setCan(!!deferred);
    return () => clearInterval(t);
  }, []);

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      deferred = null;
      setCan(false);
    } else setHelp(true);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={install} className="inline-flex items-center gap-2 rounded-xl bg-[#E8A317] px-5 py-3 font-bold text-[#2B1D00]">
          <Download className="h-5 w-5" /> {can ? "ثبّت التطبيق على هاتفك" : "كيف أثبّت التطبيق؟"}
        </button>
        <Link href="/app" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-5 py-3 font-bold text-white">
          <Smartphone className="h-5 w-5" /> افتحه الآن
        </Link>
      </div>
      {help && (
        <div className="mt-3 rounded-xl bg-white p-4 text-[14px] leading-7 text-[#24403A]">
          {ios ? (
            <ol className="space-y-1.5">
              <li className="flex items-center gap-2">١. افتح الموقع في Safari، واضغط زر المشاركة <Share className="h-4 w-4 text-[#136F5C]" /></li>
              <li className="flex items-center gap-2">٢. اختر «إضافة إلى الشاشة الرئيسية» <SquarePlus className="h-4 w-4 text-[#136F5C]" /></li>
              <li>٣. اضغط «إضافة»، فتظهر أيقونة تربوي مثل أي تطبيق.</li>
            </ol>
          ) : (
            <ol className="space-y-1.5">
              <li>١. افتح الموقع في Chrome.</li>
              <li>٢. من القائمة ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li>
              <li>٣. اضغط «تثبيت»، فتظهر أيقونة تربوي مثل أي تطبيق.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
