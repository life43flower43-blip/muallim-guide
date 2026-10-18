// إنشاء الحسابات وقراءتها على الخادم — مشترك بين التسجيل بالبريد وGoogle
import { db } from '@/lib/db'
import { WELCOME_GEMS } from '@/lib/auth'

/** ينشئ مستخدمًا جديدًا مع جواهر الترحيب وسطرها في الدفتر، في معاملة واحدة */
export async function createUserWithWelcome(data: { email: string; name: string; password?: string; avatar?: string }) {
  return db.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { ...data, gems: WELCOME_GEMS } })
    await tx.gemTransaction.create({
      data: {
        userId: created.id,
        amount: WELCOME_GEMS,
        type: 'award',
        reason: 'welcome_bonus',
        idempotencyKey: `welcome_${created.id}`,
        balanceAfter: WELCOME_GEMS,
      },
    })
    return created
  })
}

/** ما تراه الواجهة من المستخدم — بلا كلمة المرور */
export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  xp: true,
  streak: true,
  streakFreeze: true,
  gems: true,
  lastActive: true,
  createdAt: true,
} as const
