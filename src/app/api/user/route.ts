import { NextResponse } from 'next/server'
import { getCurrentUser, clearAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { PUBLIC_USER_SELECT } from '@/lib/accounts'

export const dynamic = 'force-dynamic'

// GET /api/user — المستخدم الحالي، أو null للضيف
// 🛡️ المعرّف من كوكي الجلسة فقط، لا من الطلب
export async function GET() {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ user: null })
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: PUBLIC_USER_SELECT })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('GET /api/user error:', error)
    // لا يتحول المسجَّل إلى ضيف بصمت إن تعثرت قاعدة البيانات: الواجهة تعيد المحاولة
    return NextResponse.json({ error: 'user_unavailable' }, { status: 503 })
  }
}

// DELETE /api/user — حذف الحساب وكل بياناته نهائيًا
export async function DELETE() {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  try {
    await db.user.delete({ where: { id: userId } })
    await clearAuthCookie()
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/user error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
