// حالة الإعداد للتشخيص (لصاحب الموقع فقط): أي المتغيرات موجودة وطولها فقط، دون أي قيمة
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const len = (k: string) => (process.env[k] ?? "").trim().length;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const bearer = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!bearer && !(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    env: process.env.VERCEL_ENV ?? null,
    CRON_SECRET: len("CRON_SECRET"),
    ADMIN_KEY: len("ADMIN_KEY"),
    JWT_SECRET: len("JWT_SECRET"),
    GMAIL: len("GMAIL_USER") > 0 && len("GMAIL_APP_PASSWORD") > 0,
    VAPID: len("VAPID_PRIVATE_KEY") > 0,
  });
}
