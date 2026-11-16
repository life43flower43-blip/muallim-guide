import type { Viewport } from "next";
import AppShell from "@/components/app/AppShell";

// شريط حالة الهاتف بلون شريط العنوان في التطبيق
// مثل أوريندو: بلا viewport-fit=cover، فيرسم كروم شريط الهاتف السفلي بلون خلفية الصفحة الجذرية (لون الشريط المتنقل)
export const viewport: Viewport = { themeColor: "#228278", viewportFit: "auto" };

export default function Page() {
  return <AppShell />;
}
