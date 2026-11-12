"use client";
// طلب السماح بالإشعارات (للمسجَّلين فقط) يظهر وحده بعد فتح التطبيق، مثل التطبيقات العادية:
// نافذة صغيرة بزر «سماح» يفتح نافذة الإذن في الجوال. لا تظهر لمن سمح أو منع، ولمن أجّل تعود بعد ثلاثة أيام.
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { enablePush, usePushState } from "@/lib/push-client";
import { useAccount } from "@/lib/account-client";

const LATER_KEY = "turbawy-push-later";

export default function PushPrompt() {
  const state = usePushState();
  const { user } = useAccount();
  const signedIn = !!user;
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn || state !== "off" || typeof Notification === "undefined" || Notification.permission !== "default") return;
    let later = 0;
    try {
      later = Number(localStorage.getItem(LATER_KEY) || 0);
    } catch {}
    if (Date.now() - later < 3 * 86400000) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, [state, signedIn]);

  if (!show || !signedIn) return null;
  const close = () => {
    try {
      localStorage.setItem(LATER_KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };
  const allow = async () => {
    setBusy(true);
    await enablePush();
    setBusy(false);
    setShow(false);
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]" role="dialog" aria-label="السماح بالإشعارات">
      <div className="w-full max-w-md rounded-[22px] border-2 border-[#E8C766] bg-white p-4 text-right shadow-[0_10px_40px_rgba(14,59,50,0.25)] dark:bg-card">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--t100)] text-[var(--t700)]">
            <Bell className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-extrabold text-foreground">هل تريد تذكيرًا يوميًا؟</span>
            <span className="mt-0.5 block text-[13px] leading-6 text-muted-foreground">نذكّرك مرة في اليوم بمراجعة أخطائك وتدريبك، على شاشة جوالك.</span>
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={allow} disabled={busy} className="min-h-[46px] flex-[2] rounded-[16px] bg-[var(--t700)] font-extrabold text-white disabled:opacity-60">
            {busy ? "لحظة..." : "سماح"}
          </button>
          <button type="button" onClick={close} className="min-h-[46px] flex-1 rounded-[16px] bg-muted font-bold text-foreground">
            لاحقًا
          </button>
        </div>
      </div>
    </div>
  );
}
