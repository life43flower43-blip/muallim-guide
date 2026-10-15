// وكيل المحادثة الذكية — يمرر الطلبات إلى واجهة «رادوكس» المتوافقة مع OpenAI
// المفتاح يُقرأ من ترويسة «x-ai-key» (المفتاح الذي حفظه المستخدم في جهازه)
// أو من متغير البيئة RADOX_API_KEY — ولا يُخزَّن المفتاح في الخادم إطلاقاً.
// https://radoxai.com/v1/chat/completions

import { NextRequest, NextResponse } from "next/server";

const RADOX_BASE = "https://radoxai.com/v1";
const DEFAULT_MODEL = "gemini-3.6-flash";
const TIMEOUT_MS = 60_000;
const MAX_MESSAGES = 40;
const MAX_CHARS = 24_000; // سقف حماية لتكلفة الرموز في الطلب الواحد

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** رسالة خطأ عربية موحّدة بحسب حالة الفشل */
function arabicError(status: number, body: string): { msg: string; status: number } {
  if (status === 401 || status === 403)
    return { msg: "المفتاح غير صالح أو منتهي الصلاحية — راجع إعدادات المساعد الذكي", status: 401 };
  if (status === 402)
    return { msg: "انتهى رصيد الرموز في حسابك على الموقع المزوّد — جدّد الرصيد ثم أعد المحاولة", status: 402 };
  if (status === 404)
    return { msg: "الطراز المطلوب غير متاح على الموقع المزوّد — اختر طرازاً آخر من الإعدادات", status: 404 };
  if (status === 429)
    return { msg: "تجاوزت حد الطلبات المسموح — انتظر قليلاً ثم أعد المحاولة", status: 429 };
  if (status >= 500)
    return { msg: "المزوّد يعاني ازدحاماً مؤقتاً — أعد المحاولة بعد لحظات", status: 502 };
  // محاولة استخراج رسالة المزوّد للعيوب الأخرى
  const m = body.match(/"message"\s*:\s*"([^"]+)"/);
  return { msg: m ? `تعذّر إتمام الطلب: ${m[1]}` : "تعذّر إتمام الطلب — تحقق من الاتصال ثم أعد المحاولة", status: 502 };
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-ai-key")?.trim() || process.env.RADOX_API_KEY?.trim() || "";
  if (!key)
    return NextResponse.json(
      { error: "لم يُضبط مفتاح المساعد الذكي بعد — افتح الإعدادات وألصق مفتاحك" },
      { status: 400 }
    );

  let body: { messages?: AiMessage[]; model?: string; temperature?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير مقروء — أعد المحاولة" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const clean: AiMessage[] = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim() &&
      ["system", "user", "assistant"].includes(m.role))
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);

  if (!clean.length)
    return NextResponse.json({ error: "لا توجد رسالة صالحة لإرسالها" }, { status: 400 });

  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
  const temperature = typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 2
    ? body.temperature
    : 0.6;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${RADOX_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model, temperature, messages: clean }),
      signal: ctrl.signal,
    });

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      const { msg, status } = arabicError(upstream.status, errBody);
      return NextResponse.json({ error: msg }, { status });
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      model?: string;
    };

    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content)
      return NextResponse.json({ error: "وصل الرد فارغاً من المزوّد — أعد المحاولة" }, { status: 502 });

    return NextResponse.json({
      content,
      model: data.model ?? model,
      usage: {
        prompt: data.usage?.prompt_tokens ?? 0,
        completion: data.usage?.completion_tokens ?? 0,
        total: data.usage?.total_tokens ?? 0,
      },
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "طال انتظار الرد أكثر من دقيقة — أعد المحاولة" : "انقطع الاتصال بالمزوّد — تحقق من الشبكة ثم أعد المحاولة" },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
