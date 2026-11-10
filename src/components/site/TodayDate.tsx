"use client";

// تاريخ اليوم في الشريط العلوي، يُحسب في المتصفح حتى لا يبقى تاريخ يوم البناء
import { useClientValue } from "@/lib/use-client-value";

const today = () => {
  try {
    return new Intl.DateTimeFormat("ar-u-nu-arab", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  } catch {
    return "";
  }
};

export default function TodayDate() {
  const t = useClientValue(today, "");
  return <span className="truncate">{t}</span>;
}
