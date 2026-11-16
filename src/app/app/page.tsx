import type { Viewport } from "next";
import AppShell from "@/components/app/AppShell";

// شريط حالة الهاتف بلون شريط العنوان في التطبيق
export const viewport: Viewport = { themeColor: "#228278" };

export default function Page() {
  return <AppShell />;
}
