'use client'
// تقرير تشخيص يرسله التطبيق عند كل فتح (بلا بيانات شخصية): نوع النسخة، الإشعارات، وحفظ الدخول.
// يظهر لصاحب الموقع في /connect ضمن «أعطال عند المستخدمين».
import { APP_VERSION } from './version'
import { pushDiag } from './push-client'
import { authDiag } from './account-client'

export async function sendDiag() {
  try {
    const mode = ['standalone', 'minimal-ui', 'browser'].find((m) => matchMedia(`(display-mode: ${m})`).matches) ?? 'other'
    let ls = 'ok'
    try {
      localStorage.setItem('turbawy-diag', '1')
    } catch {
      ls = 'blocked'
    }
    // طلب تخزين دائم: يمنع المتصفح من مسح بيانات التطبيق (ومنها الدخول) عند امتلاء الذاكرة
    const persisted = (await navigator.storage?.persisted?.().catch(() => false)) || (await navigator.storage?.persist?.().catch(() => false))
    const d = {
      mode,
      twa: document.referrer.startsWith('android-app://') ? 'yes' : 'no',
      first: localStorage.getItem('turbawy-diag-seen') ? 'no' : 'yes',
      ls,
      persisted: String(persisted),
      restoreSaved: String(!!localStorage.getItem('turbawy-restore')),
      cookie: authDiag.cookie,
      restore: authDiag.restore,
      ...(await pushDiag()),
    }
    localStorage.setItem('turbawy-diag-seen', '1')
    const message = 'diag ' + Object.entries(d).map(([k, v]) => `${k}=${v}`).join(' ')
    await fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, url: location.href, version: APP_VERSION }) })
  } catch {}
}
