// حالة الإعداد للتشخيص: أي المتغيرات موجودة وطولها فقط، دون أي قيمة
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const len = (k: string) => (process.env[k] ?? "").trim().length;

export function GET() {
  return NextResponse.json({
    env: process.env.VERCEL_ENV ?? null,
    CRON_SECRET: len("CRON_SECRET"),
    ADMIN_KEY: len("ADMIN_KEY"),
    GMAIL: len("GMAIL_USER") > 0 && len("GMAIL_APP_PASSWORD") > 0,
    VAPID: len("VAPID_PRIVATE_KEY") > 0,
  });
}
