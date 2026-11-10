"use client";
// زر «احفظها PDF»: يفتح نافذة الطباعة، ومنها يختار الزائر الحفظ بصيغة PDF
import { Printer } from "lucide-react";

export default function PrintButton({ label = "احفظ الأسئلة PDF أو اطبعها" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border-2 border-[#136F5C] px-4 py-2 text-[14px] font-extrabold text-[#136F5C] print:hidden">
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
