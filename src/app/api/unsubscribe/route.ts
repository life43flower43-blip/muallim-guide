// إلغاء الاشتراك في الملخص الأسبوعي برابط موقّع، دون دخول
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unsubValid } from '@/lib/digest'

export const dynamic = 'force-dynamic'

async function off(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? ''
  const t = req.nextUrl.searchParams.get('t') ?? ''
  if (!u || !unsubValid(u, t)) return false
  await db.user.update({ where: { id: u }, data: { emailOptIn: false } }).catch(() => {})
  return true
}

const page = (ok: boolean) =>
  new NextResponse(
    `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إلغاء الاشتراك</title>
<body style="font-family:Tahoma,Arial,sans-serif;background:#F6F8F7;padding:40px 16px;text-align:center;color:#14302A">
<h1 style="font-size:22px">${ok ? 'تم إلغاء اشتراكك في الملخص الأسبوعي' : 'الرابط غير صالح'}</h1>
<p>${ok ? 'لن تصلك رسائل الملخص بعد الآن. يمكنك تفعيله من جديد من «حسابي» في التطبيق.' : 'يمكنك إيقاف الملخص من «حسابي» في التطبيق.'}</p>
<p><a href="/app" style="color:#136F5C;font-weight:bold">العودة إلى تربوي</a></p></body></html>`,
    { status: ok ? 200 : 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
  )

export async function GET(req: NextRequest) {
  return page(await off(req))
}
// بريد Gmail يرسل POST عند «إلغاء الاشتراك» بضغطة واحدة
export async function POST(req: NextRequest) {
  return page(await off(req))
}
