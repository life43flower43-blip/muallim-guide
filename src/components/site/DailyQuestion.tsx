"use client";

// سؤال اليوم: يتغير كل يوم من مجموعة أسئلة، ويصحح فورًا
import { useClientValue } from "@/lib/use-client-value";
import { useEffect, useState } from "react";
import type { SiteQ } from "@/lib/site-nav";
import QuizRunner from "./QuizRunner";

export default function DailyQuestion({ pool }: { pool: SiteQ[] }) {
  // سؤال اليوم بحسب تاريخ الجهاز
  const idx = useClientValue(() => Math.floor(Date.now() / 86400000) % pool.length, -1);
  const q = idx >= 0 ? pool[idx] : null;
  if (!q) return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  return <QuizRunner key={q.id} questions={[q]} title="سؤال اليوم" />;
}
