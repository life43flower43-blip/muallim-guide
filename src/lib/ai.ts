// مكتبة المساعد الذكي — الاتصال بوكيل الخادم «/api/ai»
// المفتاح يُحفظ في متصفح المستخدم فقط (localStorage) ويُرسل مع كل طلب
// عبر ترويسة «x-ai-key» — لا يمر بأي تخزين دائم في الخادم.

"use client";

export interface AiSettings {
  key: string;
  model: string;
}

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiReply {
  content: string;
  model: string;
  usage: { prompt: number; completion: number; total: number };
}

const LS_KEY = "ai_settings_v1";
export const AI_DEFAULT_MODEL = "gemini-3.6-flash";

/** قراءة الإعدادات المحفوظة محلياً — بلا وصول للشبكة */
export function getAiSettings(): AiSettings {
  if (typeof window === "undefined") return { key: "", model: AI_DEFAULT_MODEL };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { key: "", model: AI_DEFAULT_MODEL };
    const p = JSON.parse(raw) as Partial<AiSettings>;
    return {
      key: typeof p.key === "string" ? p.key : "",
      model: typeof p.model === "string" && p.model ? p.model : AI_DEFAULT_MODEL,
    };
  } catch {
    return { key: "", model: AI_DEFAULT_MODEL };
  }
}

/** حفظ الإعدادات محلياً في جهاز المستخدم */
export function saveAiSettings(s: AiSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify({ key: s.key.trim(), model: s.model.trim() || AI_DEFAULT_MODEL }));
}

/** إرسال محادثة إلى الوكيل — يرمي خطأً عربياً واضحاً عند الفشل */
export async function askAi(messages: AiChatMessage[], opts?: { model?: string; signal?: AbortSignal }): Promise<AiReply> {
  const { key, model } = getAiSettings();
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "x-ai-key": key } : {}),
    },
    body: JSON.stringify({
      messages,
      model: opts?.model || model,
    }),
    signal: opts?.signal,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<AiReply>;
  if (!res.ok) throw new Error(data.error || "تعذّر إتمام الطلب — أعد المحاولة");
  if (!data.content) throw new Error("وصل الرد فارغاً — أعد المحاولة");
  return {
    content: data.content,
    model: data.model || model,
    usage: data.usage ?? { prompt: 0, completion: 0, total: 0 },
  };
}

/** جلب قائمة الطرز المتاحة للمفتاح — يفيد في اختبار صلاحية المفتاح */
export async function listAiModels(signal?: AbortSignal): Promise<string[]> {
  const { key } = getAiSettings();
  const res = await fetch("/api/ai/models", {
    headers: key ? { "x-ai-key": key } : {},
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; models?: string[] };
  if (!res.ok) throw new Error(data.error || "تعذّر جلب قائمة الطرز — أعد المحاولة");
  return data.models ?? [];
}
