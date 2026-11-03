// /api/version — رقم النسخة المنشورة الآن، يقارنه التطبيق بنسخته ليعيد التحميل حين يصدر تحديث
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    { v: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_ID || '' },
    { headers: { 'cache-control': 'no-store' } }
  )
}
