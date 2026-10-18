"use client";

// ============================================================================
// الدخول وإنشاء الحساب — بحساب Google (كما في أوريندو) أو بالبريد وكلمة المرور
// ============================================================================

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { afterSignIn, register, signIn } from "@/lib/account-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "./ui-kit";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AuthPanel({ onDone, initialMode = "register" }: { onDone?: () => void; initialMode?: "login" | "register" }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = mode === "login" ? await signIn(email, password) : await register(name, email, password);
    if (!res.ok) {
      setBusy(false);
      setError(res.error ?? "تعذّر الاتصال");
      return;
    }
    await afterSignIn(queryClient);
    setBusy(false);
    toast({ title: mode === "login" ? "تم تسجيل الدخول" : "أُنشئ حسابك — ومعه ٥٠ جوهرة ترحيب" });
    onDone?.();
  };

  return (
    <div className="space-y-5">
      <a
        href="/api/auth/google"
        className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-input bg-card text-[15px] font-semibold text-secondary-foreground transition-colors hover:bg-muted"
      >
        <GoogleIcon />
        المتابعة بحساب Google
      </a>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        أو بالبريد الإلكتروني
        <span className="h-px flex-1 bg-border" />
      </div>

      <div role="tablist" aria-label="نوع الدخول" className="grid grid-cols-2 rounded-xl bg-muted p-1">
        {(["register", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "min-h-[40px] rounded-lg text-sm font-medium transition-colors",
              mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {m === "register" ? "حساب جديد" : "لدي حساب"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-secondary-foreground">الاسم</span>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} />
          </label>
        )}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-secondary-foreground">البريد الإلكتروني</span>
          <input
            className={inputCls}
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-secondary-foreground">كلمة المرور</span>
          <input
            className={inputCls}
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 8 : undefined}
            required
          />
          {mode === "register" && <span className="block text-xs text-muted-foreground">ثمانية أحرف على الأقل</span>}
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <PrimaryButton type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
        </PrimaryButton>
      </form>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        يُنقل تقدمك وأخطاؤك وجواهرك من هذا الجهاز إلى حسابك تلقائيًا.
      </p>
    </div>
  );
}
