// عودة لينكدإن بعد الموافقة: يتحقق من الحالة ويحفظ الرمز
import { NextRequest, NextResponse } from "next/server";
import { connectLinkedIn } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const back = (q: string) => {
    const r = NextResponse.redirect(new URL(`/connect?${q}`, req.url));
    r.cookies.delete("li_state");
    return r;
  };
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("li_state")?.value) return back("li=denied");
  try {
    const name = await connectLinkedIn(code);
    return back(`li=ok&name=${encodeURIComponent(name)}`);
  } catch (e) {
    return back(`li=error&msg=${encodeURIComponent((e as Error).message.slice(0, 200))}`);
  }
}
