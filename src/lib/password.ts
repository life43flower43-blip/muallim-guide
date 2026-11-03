// تجزئة كلمات المرور بـ scrypt المدمج في Node (بلا مكتبات إضافية)
// الصيغة المخزنة: scrypt$<N>$<salt-hex>$<hash-hex>
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto'

const N = 16384
const KEYLEN = 64

function scrypt(password: string, salt: Buffer, n: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    _scrypt(password, salt, KEYLEN, { N: n, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key)))
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, N)
  return `scrypt$${N}$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false
  const [algo, n, saltHex, hashHex] = stored.split('$')
  if (algo !== 'scrypt' || !n || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), Number(n))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
