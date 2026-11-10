"use client";
import { installClientMonitor } from "@/lib/client-monitor";

// يُثبَّت مرة واحدة عند تحميل الواجهة، قبل أي طلب
if (typeof window !== "undefined") installClientMonitor();

export default function ClientMonitor() {
  return null;
}
