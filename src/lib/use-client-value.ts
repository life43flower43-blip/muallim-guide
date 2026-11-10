"use client";
// قيمة تُحسب في المتصفح فقط (التاريخ، والتخزين المحلي، ونوع الجهاز)، وعلى الخادم قيمة بديلة؛ بلا عدم تطابق عند الترطيب
import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

export function useClientValue<T>(get: () => T, server: T): T {
  return useSyncExternalStore(noSubscribe, get, () => server);
}
