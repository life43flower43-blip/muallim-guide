"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CAT_MAP } from "@/lib/content";
import type { CategoryId } from "@/lib/types";

/** حلقة تقدم دائرية متحركة */
export function RingProgress({
  value,
  size = 64,
  stroke = 7,
  color = "#0f766e",
  track = "#e6efec",
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

/** شارة فئة المفهوم */
export function CategoryChip({ id, small }: { id: CategoryId; small?: boolean }) {
  const cat = CAT_MAP[id];
  if (!cat) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      )}
      style={{ backgroundColor: cat.soft, color: cat.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
      {cat.short}
    </span>
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
  color = "#0f766e",
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
