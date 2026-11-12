"use client";
// مفتاح الملخص الأسبوعي بالبريد في «حسابي»
import { useState } from "react";
import { Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { USER_QUERY_KEY, type AccountUser } from "@/lib/account-client";

export default function EmailDigestToggle({ user }: { user: AccountUser }) {
  const qc = useQueryClient();
  const [on, setOn] = useState(!!user.emailOptIn);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    const next = !on;
    setOn(next);
    setBusy(true);
    const r = await fetch("/api/user/email-prefs", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ emailOptIn: next }) }).catch(() => null);
    if (!r?.ok) setOn(!next);
    else qc.setQueryData<AccountUser | null>(USER_QUERY_KEY, (u) => (u ? { ...u, emailOptIn: next } : u));
    setBusy(false);
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={toggle}
      className="mt-3 flex w-full items-center gap-3 border-t border-border pt-3 text-right"
    >
      <Mail className="h-5 w-5 shrink-0 text-[#C9971C]" />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-foreground">الملخص الأسبوعي بالبريد</span>
        <span className="block text-[12px] leading-5 text-muted-foreground">مقالات الأسبوع واختبار الأسبوع، مرة كل جمعة</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-[var(--t700)]" : "bg-muted"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "right-0.5" : "right-[22px]"}`} />
      </span>
    </button>
  );
}
