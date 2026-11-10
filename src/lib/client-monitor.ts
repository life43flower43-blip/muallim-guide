"use client";
// مراقبة الواجهة: (١) مهلة افتراضية لطلبات /api حتى لا ينتظر المستخدم بلا نهاية،
// (٢) إرسال الأعطال غير المتوقعة إلى /api/client-error (مرة لكل عطل في الجلسة، وبحد أقصى).
import { APP_VERSION } from "@/lib/version";

let installed = false;
const sent = new Set<string>();
const MAX_REPORTS = 10;

export function reportClientError(err: unknown, where = "") {
  try {
    const e = err as { message?: string; stack?: string; name?: string } | undefined;
    const message = `${where ? `[${where}] ` : ""}${e?.name && e?.message ? `${e.name}: ${e.message}` : String(e?.message ?? err)}`.slice(0, 500);
    // أعطال الشبكة وانقطاعها ليست أعطالًا في الكود
    if (!message || /Failed to fetch|NetworkError|Load failed|AbortError|TimeoutError|ResizeObserver/i.test(message)) return;
    if (sent.has(message) || sent.size >= MAX_REPORTS) return;
    sent.add(message);
    const body = JSON.stringify({ message, stack: e?.stack?.slice(0, 2000), url: location.href, version: APP_VERSION });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    else void origFetch("/api/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {}
}

let origFetch: typeof fetch = (input, init) => fetch(input, init);

export function installClientMonitor() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  origFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.startsWith("/") ? url : (() => { try { const u = new URL(url); return u.origin === location.origin ? u.pathname : ""; } catch { return ""; } })();
    if (path.startsWith("/api/") && !init?.signal && !(input instanceof Request && input.signal)) {
      // المساعد الذكي أبطأ بطبيعته، وباقي الطلبات قصيرة
      const ms = path.startsWith("/api/ai/") ? 90_000 : 20_000;
      return origFetch(input, { ...init, signal: AbortSignal.timeout(ms) });
    }
    return origFetch(input, init);
  };
  // عامل الخدمة في كل صفحات الموقع لا في التطبيق وحده (تشترطه أدوات التغليف للمتاجر)
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  }
  window.addEventListener("error", (e) => reportClientError(e.error ?? e.message, "error"));
  window.addEventListener("unhandledrejection", (e) => reportClientError(e.reason, "promise"));
}
