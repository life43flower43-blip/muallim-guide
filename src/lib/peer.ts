// تحدّي الأقران — من بحث مشاكل الطلبة: غياب المساندة الاجتماعية (دراسات accountability).
// رابط يحمل التحدي كاملًا في معطياته (بلا سيرفر): أسئلة مختارة واسم المرسل ونتيجته،
// ومن يفتح الرابط يجيب عنها محليًا ثم يقارن. قواعد صارمة: النص المعروض بلا لاتيني وأرقامه مشرقية.

export interface PeerPayload {
  qids: string[]; // معرفات أسئلة التحدي
  sender: string; // اسم المرسل
  senderCorrect: number; // عدد إجابات المرسل الصحيحة
  total: number; // عدد أسئلة التحدي
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

// ترميز آمن للروابط: أساس ست وستين بصيغة ملائمة للمسارات (بلا جمع ولا شرطة مائلة ولا يساوي)
function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array | null {
  try {
    const norm = s.replace(/-/g, "+").replace(/_/g, "/");
    const padded = norm + "=".repeat((4 - (norm.length % 4)) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export function encodePeer(p: PeerPayload): string {
  const json = JSON.stringify({ q: p.qids, s: p.sender, c: p.senderCorrect, t: p.total });
  return b64urlEncode(new TextEncoder().encode(json));
}

export function decodePeer(code: string): PeerPayload | null {
  const bytes = b64urlDecode(code.trim());
  if (!bytes) return null;
  try {
    const raw = JSON.parse(new TextDecoder().decode(bytes)) as {
      q?: unknown;
      s?: unknown;
      c?: unknown;
      t?: unknown;
    };
    if (!Array.isArray(raw.q) || raw.q.length === 0) return null;
    const qids = raw.q.filter((x): x is string => typeof x === "string" && x.length > 0);
    if (qids.length === 0) return null;
    if (typeof raw.c !== "number" || typeof raw.t !== "number") return null;
    return {
      qids,
      sender: typeof raw.s === "string" ? raw.s.slice(0, 40) : "",
      senderCorrect: raw.c,
      total: raw.t,
    };
  } catch {
    return null;
  }
}

export const PEER_HASH_PREFIX = "#c=";

export function buildPeerLink(p: PeerPayload): string {
  const base =
    typeof window === "undefined"
      ? ""
      : window.location.origin + window.location.pathname;
  return `${base}${PEER_HASH_PREFIX}${encodePeer(p)}`;
}

/** يلتقط تحديًا واصلًا عبر معرف الرابط — يُستدعى مرة عند فتح التطبيق */
export function readPeerHash(): PeerPayload | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash;
  if (!h.startsWith(PEER_HASH_PREFIX)) return null;
  return decodePeer(decodeURIComponent(h.slice(PEER_HASH_PREFIX.length)));
}

/** تحويل الأرقام المشرقية في إدخال المستخدم إلى لاتينية للحساب الداخلي */
export function arDigitsToLatin(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}
