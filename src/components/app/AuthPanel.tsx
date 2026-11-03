"use client";

// ============================================================================
// الدخول بالبريد وكلمة المرور، أو بحساب Google إن كان مفعّلًا على الخادم
// ============================================================================
// الخادم يتولى كل شيء عبر /api/auth/google، ويُنشئ الحساب في أول دخول
// ومعه جواهر الترحيب، وينقل تقدم الضيف من هذا الجهاز تلقائيًا.
// ============================================================================

import { useEffect, useState } from "react";
import { FitText } from "./FitText";

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}


/** onDone يُستدعى قبل الدخول (مثلًا لإنهاء شاشة البداية فلا تعود بعد الدخول) */
export default function AuthPanel({ label = "المتابعة بحساب Google", onDone, initialMode = "signup" }: { label?: string; onDone?: () => void; initialMode?: "signup" | "login" }) {
  const [google, setGoogle] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // زر Google يظهر فقط إن كان مفعّلًا على الخادم، حتى لا يضغط المستخدم زرًا لا يعمل
  useEffect(() => {
    fetch("/api/auth/providers").then((r) => r.json()).then((j) => setGoogle(!!j.google)).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(mode === "signup" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "حدث خطأ، حاول مرة أخرى");
        setBusy(false);
        return;
      }
      onDone?.();
      // العودة نفسها التي تتبع دخول Google: رسالة، ثم نقل بيانات الجهاز إلى الحساب
      window.location.href = "/app?login=success";
    } catch {
      setError("تعذّر الاتصال، تحقق من الإنترنت");
      setBusy(false);
    }
  };

  const field = "min-h-[48px] w-full rounded-[16px] border border-[#E2DDF5] bg-white px-4 text-base outline-none focus:border-[var(--t700,#136F5C)] dark:bg-card";

  return (
    <div className="space-y-3">
      {google && (
        <>
          <a
            href="/api/auth/google"
            onClick={() => onDone?.()}
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-[20px] border border-[#E2DDF5] bg-white px-4 text-base font-bold text-[var(--t900)] transition-colors hover:bg-[#F7F4FF] dark:bg-card dark:text-foreground"
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            <FitText max={16} min={11} className="shrink">{label}</FitText>
          </a>
          <p className="text-center text-sm text-muted-foreground">أو بالبريد الإلكتروني</p>
        </>
      )}

      <div className="grid grid-cols-2 rounded-[16px] bg-muted p-1 text-sm font-bold">
        {(["signup", "login"] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(""); }} className={`min-h-[40px] rounded-[12px] ${mode === m ? "bg-white text-[var(--t900)] shadow-sm dark:bg-card dark:text-foreground" : "text-muted-foreground"}`}>
            {m === "signup" ? "حساب جديد" : "دخول"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-2.5">
        {mode === "signup" && (
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" autoComplete="name" required minLength={2} maxLength={60} />
        )}
        <input className={field} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" autoComplete="email" required />
        <input className={field} type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "كلمة مرور (٨ أحرف على الأقل)" : "كلمة المرور"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} />
        {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="min-h-[48px] w-full rounded-[20px] bg-[var(--t700,#136F5C)] px-4 text-base font-bold text-white disabled:opacity-60">
          {busy ? "لحظة..." : mode === "signup" ? "إنشاء الحساب" : "دخول"}
        </button>
      </form>
    </div>
  );
}
