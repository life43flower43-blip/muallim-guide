"use client";
import { useState } from "react";

export default function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/auth/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) window.location.href = "/app";
    else setMsg(j.error ?? "حدث خطأ، حاول مرة أخرى");
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <input type="password" dir="ltr" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة مرور جديدة (٨ أحرف على الأقل)" className="h-12 w-full rounded-xl border border-[#D6E6DE] bg-white px-3 text-[16px]" />
      <button disabled={busy || !token} className="h-12 w-full rounded-xl bg-[#136F5C] font-bold text-white disabled:opacity-60">{busy ? "جارٍ الحفظ..." : "احفظ وادخل"}</button>
      {msg && <p className="text-[14px] text-[#B42318]">{msg}</p>}
    </form>
  );
}
