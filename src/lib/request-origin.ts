// عنوان الموقع كما وصل إليه الزائر، ليعود تسجيل الدخول بـ Google إلى الموقع نفسه
import type { NextRequest } from 'next/server'

export function requestOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  if (host) return `${proto}://${host}`
  return request.nextUrl.origin
}
