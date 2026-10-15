// جلب قائمة الطرز المتاحة من «رادوكس» — يُستعمل في شاشة الإعدادات
// لاختبار صلاحية المفتاح واختيار الطراز الافتراضي للمحادثة.

import { NextRequest, NextResponse } from "next/server";

const RADOX_BASE = "https://radoxai.com/v1";
const TIMEOUT_MS = 20_000;

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-ai-key")?.trim() || process.env.RADOX_API_KEY?.trim() || "";
  if (!key)
    return NextResponse.json(
      { error: "لم يُضبط مفتاح المساعد الذكي بعد — ألصق مفتاحك في الحقل أعلاه" },
      { status: 400 }
    );

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${RADOX_BASE}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
    });

    if (!upstream.ok) {
      if (upstream.status === 401 || upstream.status === 403)
        return NextResponse.json(
          { error: "المفتاح غير صالح — تأكد من نسخه كاملاً من صفحة المفاتيح في الموقع" },
          { status: 401 }
        );
      if (upstream.status === 429)
        return NextResponse.json({ error: "طلبات متكررة أكثر من اللازم — انتظر لحظات ثم أعد المحاولة" }, { status: 429 });
      return NextResponse.json({ error: "تعذّر جلب قائمة الطرز من المزوّد — أعد المحاولة" }, { status: 502 });
    }

    const data = (await upstream.json()) as { data?: { id?: string }[] };
    const ids = (data.data ?? [])
      .map((m) => (typeof m.id === "string" ? m.id : ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    if (!ids.length)
      return NextResponse.json({ error: "لم يُرجع المزوّد أي طرز — أعد المحاولة لاحقاً" }, { status: 502 });

    return NextResponse.json({ models: ids });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "طال انتظار الاتصال بالمزوّد — تحقق من شبكتك" : "انقطع الاتصال بالمزوّد — تحقق من الشبكة" },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
