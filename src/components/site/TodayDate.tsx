"use client";

// تاريخ اليوم في الشريط العلوي، يُحسب في المتصفح حتى لا يبقى تاريخ يوم البناء
import { useEffect, useState } from "react";

export default function TodayDate() {
  const [t, setT] = useState("");
  useEffect(() => {
    try {
      setT(new Intl.DateTimeFormat("ar-u-nu-arab", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()));
    } catch {}
  }, []);
  return <span className="truncate">{t}</span>;
}
