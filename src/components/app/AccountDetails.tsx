"use client";
// بيانات الحساب في «حسابي»: تأكيد البريد، وتعديل الاسم، وتغيير البريد
import { useEffect, useState } from "react";
import { BadgeCheck, MailWarning, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { USER_QUERY_KEY, type AccountUser } from "@/lib/account-client";

const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[15px] outline-none focus:border-[var(--t700)]";
const BTN = "min-h-[44px] rounded-xl bg-[var(--t700)] px-4 text-[14px] font-bold text-white disabled:opacity-60";

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string; user?: AccountUser }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok, error: j?.error, user: j?.user };
  } catch {
    return { ok: false, error: "تعذّر الاتصال، حاول مرة أخرى" };
  }
}

const VERIFY_MSG: Record<string, string> = {
  ok: "تم تأكيد بريدك ✅",
  changed: "تغيّر بريد حسابك ✅",
  expired: "الرابط منتهي أو غير صالح. اطلب رابطًا جديدًا.",
  taken: "هذا البريد صار مستخدمًا في حساب آخر.",
};

export default function AccountDetails({ user }: { user: AccountUser }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<"" | "name" | "email">("");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // نتيجة فتح رابط التأكيد من البريد
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("verify");
    if (!v || !VERIFY_MSG[v]) return;
    const t = setTimeout(() => {
      toast({ title: VERIFY_MSG[v] });
      qc.invalidateQueries({ queryKey: USER_QUERY_KEY });
      const u = new URL(location.href);
      u.searchParams.delete("verify");
      history.replaceState(null, "", u);
    }, 300);
    return () => clearTimeout(t);
  }, [qc]);

  const saveName = async () => {
    setBusy(true);
    const r = await call("/api/user", "PUT", { name });
    setBusy(false);
    if (!r.ok) return toast({ title: r.error ?? "تعذّر الحفظ" });
    if (r.user) qc.setQueryData(USER_QUERY_KEY, r.user);
    setEdit("");
    toast({ title: "حُفظ الاسم" });
  };
  const changeEmail = async () => {
    setBusy(true);
    const r = await call("/api/user/email", "POST", { email, password });
    setBusy(false);
    if (!r.ok) return toast({ title: r.error ?? "تعذّر الإرسال" });
    setEdit("");
    setPassword("");
    toast({ title: "أرسلنا رابط تأكيد إلى البريد الجديد", description: "لن يتغير بريدك حتى تضغط الرابط." });
  };
  const resend = async () => {
    setBusy(true);
    const r = await call("/api/auth/verify", "POST");
    setBusy(false);
    toast({ title: r.ok ? "أرسلنا رابط التأكيد إلى بريدك" : r.error ?? "تعذّر الإرسال" });
  };

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3 text-right">
      <div className="flex items-center gap-2 text-[13px]">
        {user.emailVerified ? <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--t700)]" /> : <MailWarning className="h-4 w-4 shrink-0 text-[#C9971C]" />}
        <span dir="ltr" className="min-w-0 flex-1 truncate text-left text-muted-foreground">{user.email}</span>
        {!user.emailVerified && (
          <button type="button" onClick={resend} disabled={busy} className="shrink-0 font-bold text-[#A87B12] underline">أكّد بريدك</button>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setEdit(edit === "name" ? "" : "name")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-[12.5px] font-bold text-foreground">
          <Pencil className="h-3.5 w-3.5" /> تعديل الاسم
        </button>
        <button type="button" onClick={() => setEdit(edit === "email" ? "" : "email")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-[12.5px] font-bold text-foreground">
          <Pencil className="h-3.5 w-3.5" /> تغيير البريد
        </button>
      </div>
      {edit === "name" && (
        <div className="space-y-2">
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="اسمك" />
          <button type="button" onClick={saveName} disabled={busy || name.trim().length < 2} className={BTN}>حفظ الاسم</button>
        </div>
      )}
      {edit === "email" && (
        <div className="space-y-2">
          <input className={INPUT} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الجديد" />
          <input className={INPUT} type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور الحالية" autoComplete="current-password" />
          <p className="text-[12px] leading-5 text-muted-foreground">نرسل رابط تأكيد إلى البريد الجديد، ولا يتغير بريدك حتى تضغطه. وتصل رسالة تنبيه إلى بريدك الحالي.</p>
          <button type="button" onClick={changeEmail} disabled={busy || !email.includes("@")} className={BTN}>أرسل رابط التأكيد</button>
        </div>
      )}
    </div>
  );
}
