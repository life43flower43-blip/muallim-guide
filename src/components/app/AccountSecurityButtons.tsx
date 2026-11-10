"use client";
// أزرار أمان الحساب في «حسابي»: تغيير كلمة المرور، والخروج من كل الأجهزة الأخرى
import { useState } from "react";
import { KeyRound, MonitorSmartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BTN =
  "flex min-h-[76px] w-full flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[var(--t075)] bg-white px-1 text-center text-[12.5px] font-bold leading-5 dark:border-border dark:bg-card";
const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[15px] outline-none focus:border-[var(--t700)]";

async function post(url: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok, error: j?.error };
  } catch {
    return { ok: false, error: "تعذّر الاتصال، حاول مرة أخرى" };
  }
}

export default function AccountSecurityButtons() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async () => {
    if (busy) return;
    setBusy(true);
    const r = await post("/api/user/password", { current, password: next });
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      setCurrent("");
      setNext("");
      toast({ title: "غُيّرت كلمة المرور، وخرجت الأجهزة الأخرى" });
    } else toast({ title: r.error || "تعذّر تغيير كلمة المرور" });
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button type="button" className={BTN}>
            <KeyRound className="h-5 w-5 text-foreground" /> كلمة المرور
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>تغيير كلمة المرور</AlertDialogTitle>
            <AlertDialogDescription>إذا دخلت بحساب Google ولا كلمة مرور لك، اترك الحالية فارغة.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2.5">
            <input type="password" autoComplete="current-password" placeholder="كلمة المرور الحالية" value={current} onChange={(e) => setCurrent(e.target.value)} className={INPUT} />
            <input type="password" autoComplete="new-password" placeholder="كلمة المرور الجديدة (٨ أحرف على الأقل)" value={next} onChange={(e) => setNext(e.target.value)} className={INPUT} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <button type="button" disabled={busy || next.length < 8} onClick={change} className="rounded-xl bg-[var(--t800)] px-4 py-2.5 text-[15px] font-bold text-white disabled:opacity-50">
              {busy ? "جارٍ الحفظ…" : "احفظ"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className={BTN}>
            <MonitorSmartphone className="h-5 w-5 text-foreground" /> خروج الأجهزة الأخرى
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>الخروج من كل الأجهزة الأخرى؟</AlertDialogTitle>
            <AlertDialogDescription>يبقى هذا الجهاز داخل الحساب، وتخرج كل الأجهزة الأخرى.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const r = await post("/api/auth/logout-all");
                toast({ title: r.ok ? "خرجت كل الأجهزة الأخرى" : r.error || "تعذّر ذلك" });
              }}
            >
              أخرجها
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
