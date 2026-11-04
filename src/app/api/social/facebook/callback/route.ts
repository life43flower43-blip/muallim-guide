// عودة فيسبوك بعد الموافقة: يتحقق من الحالة ويحفظ رمز الصفحة
import { NextRequest, NextResponse } from "next/server";
import { connectFacebook } from "@/lib/facebook";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const back = (q: string) => {
    const r = NextResponse.redirect(new URL(`/connect?${q}`, req.url));
    r.cookies.delete("fb_state");
    return r;
  };
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("fb_state")?.value) return back("fb=denied");
  try {
    const name = await connectFacebook(code);
    return back(`fb=ok&name=${encodeURIComponent(name)}`);
  } catch (e) {
    return back(`fb=error&msg=${encodeURIComponent((e as Error).message.slice(0, 200))}`);
  }
}
