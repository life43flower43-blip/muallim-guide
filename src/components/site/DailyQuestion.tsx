"use client";

// سؤال اليوم: يتغير كل يوم من مجموعة أسئلة، ويصحح فورًا
import { useEffect, useState } from "react";
import type { SiteQ } from "@/lib/site-nav";
import QuizRunner from "./QuizRunner";

export default function DailyQuestion({ pool }: { pool: SiteQ[] }) {
  const [q, setQ] = useState<SiteQ | null>(null);
  useEffect(() => {
    const day = Math.floor(Date.now() / 86400000);
    setQ(pool[day % pool.length]);
  }, [pool]);
  if (!q) return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  return <QuizRunner key={q.id} questions={[q]} title="سؤال اليوم" />;
}
