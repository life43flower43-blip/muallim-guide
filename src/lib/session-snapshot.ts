"use client";

// لقطة الجلسة المقطوعة — أعلى ميزة مطلوبة في تقرير المنافسين: «استئناف الجلسة المكثفة»
// تُحفظ تلقائيًا بعد كل سؤال، وتُمسح عند الإنهاء أو الخروج الصريح

import type { QuizConfig } from "./ui-store";

const KEY = "turbawy-active-session";
export const RESUME_FLAG = "turbawy-resume-pending";
const MAX_AGE = 7 * 86400000; // أسبوع واحد ثم تُهمل اللقطة

export interface SessionSnapshot {
  config: QuizConfig;
  idx: number;
  review: { qid: string; ok: boolean; answer?: string }[];
  sessionXp: number;
  savedAt: number;
}

export function saveSnapshot(s: Omit<SessionSnapshot, "savedAt">) {
  try {
    if (!s.config?.qids?.length) return;
    localStorage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() }));
  } catch {}
}

export function loadSnapshot(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.config?.qids?.length || !Array.isArray(s.review)) return null;
    if (typeof s.idx !== "number" || s.idx < 0 || s.idx >= s.config.qids.length) {
      clearSnapshot();
      return null;
    }
    if (Date.now() - (s.savedAt ?? 0) > MAX_AGE) {
      clearSnapshot();
      return null;
    }
    return s as SessionSnapshot;
  } catch {
    return null;
  }
}

export function clearSnapshot() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
