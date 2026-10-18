"use client";

// ============================================================================
// مكونات الواجهة الموحدة لهوية «تربوي»
// ============================================================================
// بطاقات بحد رفيع وظل خفيف، عناوين بالخط الكوفي، شرائط تقدم بلون واحد،
// وأهداف لمس لا تقل عن ٤٤ بكسل. كل الصفحات تُبنى منها كي تبقى متسقة.
// ============================================================================

import { ChevronLeft, Flame, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { ad } from "@/lib/arabic";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card card-soft", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-foreground lg:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-sm leading-6 text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, className, color, height = 6 }: { value: number; className?: string; color?: string; height?: number }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-muted", className)} style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color ?? "var(--primary)" }}
      />
    </div>
  );
}

/** حلقة نسبة (للجاهزية) */
export function Ring({ value, size = 88, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function GemBadge({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full bg-gem-soft px-3 py-1.5 text-sm font-semibold text-gem", className)}
      aria-label={`${ad(value)} جوهرة`}
    >
      <Gem className="h-4 w-4" strokeWidth={2} />
      {ad(value)}
    </span>
  );
}

export function StreakBadge({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
        value > 0 ? "bg-gem-soft text-gem" : "bg-muted text-muted-foreground",
        className
      )}
      aria-label={`سلسلة ${ad(value)} يوم`}
    >
      <Flame className="h-4 w-4" strokeWidth={2} />
      {ad(value)}
    </span>
  );
}

/** مربع أيقونة ملوّن بخفة */
export function IconTile({ icon: Icon, color = "var(--primary)", size = 40 }: { icon: React.ElementType; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      <Icon className="h-5 w-5" strokeWidth={1.9} />
    </span>
  );
}

/** صف قائمة قابل للضغط: أيقونة، عنوان، وصف، وقيمة اختيارية */
export function ListRow({
  icon,
  color,
  title,
  sub,
  meta,
  badge,
  onClick,
  disabled,
  children,
}: {
  icon?: React.ElementType;
  color?: string;
  title: string;
  sub?: string;
  meta?: React.ReactNode;
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60 disabled:cursor-default disabled:opacity-60"
    >
      {icon && <IconTile icon={icon} color={color} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-foreground">{title}</span>
        {sub && <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{sub}</span>}
        {children}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-destructive">{ad(badge)}</span>
      )}
      {meta && <span className="shrink-0 text-[13px] text-muted-foreground">{meta}</span>}
      {!disabled && <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />}
    </button>
  );
}

export function Divided({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Card className={cn("divide-y divide-border overflow-hidden", className)}>{children}</Card>;
}

export function PrimaryButton({ className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50",
        className
      )}
      {...rest}
    />
  );
}

export function SecondaryButton({ className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-input bg-card px-5 text-[15px] font-semibold text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50",
        className
      )}
      {...rest}
    />
  );
}

/** نجوم أفضل نتيجة (٠–٣) */
export function Stars({ count }: { count: number }) {
  return (
    <span className="tracking-tight text-gem" aria-label={`${ad(count)} من ٣ نجوم`}>
      {"★".repeat(count)}
      <span className="text-muted-foreground/40">{"★".repeat(3 - count)}</span>
    </span>
  );
}

export function EmptyState({ icon: Icon, title, sub, action }: { icon: React.ElementType; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <IconTile icon={Icon} size={52} />
      <p className="font-display text-base font-semibold">{title}</p>
      {sub && <p className="max-w-sm text-sm leading-6 text-muted-foreground">{sub}</p>}
      {action}
    </Card>
  );
}

export const pct = (v: number) => `${ad(Math.round(v))}٪`;
