"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** حلقة تقدم دائرية متحركة */
export function RingProgress({
  value,
  size = 64,
  stroke = 7,
  color = "#0E7C86",
  track = "#e0e7ff",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-bold text-stone-800">{title}</h2>
      {action}
    </div>
  );
}

export function StatCard({
  icon,
  value,
  label,
  color = "#0E7C86",
}: {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-soft p-3 flex flex-col items-center gap-1">
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-lg font-extrabold leading-none" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] text-stone-500 font-medium">{label}</span>
    </div>
  );
}

/** بطاقة أساسية موحدة */
export function AppCard({
  children,
  className,
  onClick,
  whileTap = true,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  whileTap?: boolean;
}) {
  if (!onClick)
    return <div className={cn("bg-white rounded-3xl shadow-soft", className)}>{children}</div>;
  return (
    <motion.div
      onClick={onClick}
      whileTap={whileTap ? { scale: 0.975 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("bg-white rounded-3xl shadow-soft cursor-pointer", className)}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-8">
      <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center text-3xl mb-4">
        {icon}
      </div>
      <p className="font-bold text-stone-700 mb-1">{title}</p>
      <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ---------- شارة «جديد» الموحدة — واحدة بالنمط، وتختفي بعد سبعة أيام من أول تشغيل ----------
const FIRST_RUN_KEY = "trb-first-run";

export function isNewWindow(): boolean {
  try {
    let t = Number(localStorage.getItem(FIRST_RUN_KEY) || "0");
    if (!t) {
      t = Date.now();
      localStorage.setItem(FIRST_RUN_KEY, String(t));
    }
    return Date.now() - t < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function NewBadge({ tone = "amber" }: { tone?: "amber" | "violet" }) {
  const show = isNewWindow();
  if (!show) return null;
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${
        tone === "amber"
          ? "bg-amber-400 text-amber-950"
          : "bg-cyan-600 text-white"
      }`}
    >
      <Sparkles className="h-3 w-3" /> جديد
    </span>
  );
}

// ---------- سطر أداة قياسي: أيقونة موحدة + عنوان + وصف سطر واحد + سهم ----------
export function ToolRow({
  icon: Icon,
  title,
  desc,
  onClick,
  badge,
  tone = "violet",
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  onClick: () => void;
  badge?: React.ReactNode;
  tone?: "violet" | "amber";
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-3xl border border-border bg-white p-4 text-right shadow-soft"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
          tone === "amber"
            ? "bg-gradient-to-br from-amber-500 to-orange-500"
            : "bg-gradient-to-br from-cyan-600 to-cyan-800"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-black text-gray-900">{title}</span>
          {badge}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-bold text-gray-500">
          {desc}
        </span>
      </span>
      <ChevronLeft className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
    </motion.button>
  );
}
