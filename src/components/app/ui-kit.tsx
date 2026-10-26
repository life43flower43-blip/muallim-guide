"use client";

// ============================================================================
// مكونات الواجهة الموحدة لهوية «تربوي»
// ============================================================================
// بطاقات بحد رفيع وظل خفيف، عناوين بالخط الكوفي، شرائط تقدم بلون واحد،
// وأهداف لمس لا تقل عن ٤٤ بكسل. كل الصفحات تُبنى منها كي تبقى متسقة.
// ============================================================================

import { ArrowRight, ChevronLeft, EyeOff, Flame, Gem, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ad } from "@/lib/arabic";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border-2 border-border bg-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageTitle({ title, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    // على الجوال يظهر العنوان في الشريط العلوي
    <div className="mb-5 hidden flex-wrap items-end justify-between gap-3 lg:flex">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-foreground lg:text-[28px]">{title}</h1>
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
        <span className="block truncate text-base font-medium text-foreground">{title}</span>
        {sub && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{sub}</span>}
        {children}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-destructive">{ad(badge)}</span>
      )}
      {meta && <span className="shrink-0 text-sm text-muted-foreground">{meta}</span>}
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
        "inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-primary-foreground shadow-[0_4px_0_color-mix(in_srgb,var(--primary)_65%,black)] transition active:translate-y-[4px] active:shadow-none hover:brightness-105 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
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
        "inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-border bg-card px-5 text-base font-bold text-secondary-foreground transition active:translate-y-[2px] active:border-b-2 hover:bg-muted disabled:opacity-50",
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

// ============================================================================
// الشاشات الكاملة (الأدوات والمختبرات): نمط «الحوار بملء الشاشة» في Material 3
// شريط علوي ثابت بزر إغلاق أو رجوع وعنوان، ومحتوى في عمود مقروء،
// وشريط إجراء سفلي اختياري للخطوة الرئيسية.
// ============================================================================

export function ScreenShell({
  title,
  onClose,
  onBack,
  actions,
  footer,
  children,
  wide = false,
}: {
  title: string;
  sub?: string;
  onClose?: () => void;
  onBack?: () => void;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="green-head safe-top relative shrink-0 px-2 pb-1.5">
        <HeaderArt />
        <div className={cn("mx-auto flex min-h-[56px] items-center gap-2 px-1", wide ? "max-w-5xl" : "max-w-3xl")}>
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="رجوع" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#174D41] hover:bg-black/5 dark:text-foreground">
              <ArrowRight className="h-6 w-6" strokeWidth={2.5} />
            </button>
          ) : onClose ? (
            <button type="button" onClick={onClose} aria-label="إغلاق" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#174D41] hover:bg-black/5 dark:text-foreground">
              <X className="h-6 w-6" strokeWidth={2.5} />
            </button>
          ) : null}
          <div className="min-w-0 flex-1 px-1">
            <h1 className="truncate text-center font-display text-xl font-extrabold leading-8">{title}</h1>
          </div>
          {actions}
          {/* موازنة زر الرجوع ليبقى العنوان في الوسط */}
          {!actions && !(onBack && onClose) && (onBack || onClose) && <span className="w-11 shrink-0" aria-hidden="true" />}
          {onBack && onClose && (
            <button type="button" onClick={onClose} aria-label="إغلاق" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#174D41]/70 hover:bg-black/5 dark:text-muted-foreground">
              <X className="h-6 w-6" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className={cn("mx-auto px-4 pb-10 pt-5", wide ? "max-w-5xl lg:px-8" : "max-w-3xl")}>{children}</div>
      </div>
      {footer && (
        <div className="safe-bottom shrink-0 border-t border-border bg-card">
          <div className={cn("mx-auto flex gap-3 px-4 py-3", wide ? "max-w-5xl" : "max-w-3xl")}>{footer}</div>
        </div>
      )}
    </div>
  );
}

/** شارة صغيرة: محايدة أو بلون دلالي */
export function Chip({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "primary" | "success" | "warning" | "danger"; className?: string }) {
  const tones = {
    neutral: "bg-muted text-secondary-foreground",
    primary: "bg-accent text-accent-foreground",
    success: "bg-success-soft text-success",
    warning: "bg-gem-soft text-gem",
    danger: "bg-danger-soft text-destructive",
  } as const;
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

/** فقرة مميزة: معلومة، أو نجاح، أو تنبيه، أو خطأ */
export function Callout({
  tone = "info",
  icon: Icon,
  title,
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
  icon?: React.ElementType;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: "bg-accent text-accent-foreground",
    success: "bg-success-soft text-success",
    warning: "bg-gem-soft text-gem",
    danger: "bg-danger-soft text-destructive",
    neutral: "bg-muted text-secondary-foreground",
  } as const;
  return (
    <div className={cn("rounded-xl p-4", tones[tone], className)}>
      {title && (
        <p className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {title}
        </p>
      )}
      {children && <div className={cn("text-sm leading-7 text-foreground/85", title && "mt-1.5")}>{children}</div>}
    </div>
  );
}

/** شريط كفاءة أو محور: الاسم، الحالة، والنسبة */
export function SkillBar({ label, value, status, tone = "primary" }: { label: string; value: number; status?: string; tone?: "primary" | "success" | "warning" | "danger" | "muted" }) {
  const colors = { primary: "var(--primary)", success: "var(--success)", warning: "var(--warning)", danger: "var(--destructive)", muted: "var(--input)" } as const;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="text-secondary-foreground">{label}</span>
        {status && <span className="text-xs font-medium text-muted-foreground">{status}</span>}
      </div>
      <ProgressBar value={value} color={colors[tone]} />
    </div>
  );
}

/** زر خيار في سؤال أو موقف: حرف، نص، وحالة بعد التقييم.
 *  onToggleStrike يضيف زر «استبعاد» يشطب الخيار (نمط UWorld) */
export function OptionButton({
  letter,
  children,
  state = "idle",
  onClick,
  disabled,
  struck = false,
  onToggleStrike,
  shortcut,
}: {
  letter?: string;
  children: React.ReactNode;
  state?: "idle" | "selected" | "correct" | "wrong" | "dim";
  onClick?: () => void;
  disabled?: boolean;
  struck?: boolean;
  onToggleStrike?: () => void;
  shortcut?: string;
}) {
  const cls = {
    idle: "border-border bg-card hover:border-primary/50 hover:bg-accent/40",
    selected: "border-primary bg-accent ring-1 ring-primary",
    correct: "border-success bg-success-soft",
    wrong: "border-destructive bg-danger-soft",
    dim: "border-border bg-card opacity-60",
  }[state];
  const letterCls = {
    idle: "bg-muted text-secondary-foreground",
    selected: "bg-primary text-primary-foreground",
    correct: "bg-success text-white",
    wrong: "bg-destructive text-white",
    dim: "bg-muted text-muted-foreground",
  }[state];
  const isStruck = struck && (state === "idle" || state === "dim");
  return (
    <div className={cn("group relative flex w-full items-stretch rounded-xl border transition-colors", cls, isStruck && "opacity-50")}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-keyshortcuts={shortcut}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-xl p-4 text-right disabled:cursor-default"
      >
        {letter && <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold", letterCls)}>{letter}</span>}
        <span className={cn("flex-1 text-base leading-7", isStruck && "line-through decoration-2")}>{children}</span>
      </button>
      {onToggleStrike && !disabled && (
        <button
          type="button"
          onClick={onToggleStrike}
          aria-pressed={struck}
          aria-label={struck ? "أعد الخيار" : "استبعد الخيار"}
          title={struck ? "أعد الخيار" : "استبعد الخيار"}
          className="flex w-11 shrink-0 items-center justify-center rounded-l-xl text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ---------- الإتقان: أربعة مستويات بتدرج لون الهوية (نمط Khan Academy) ----------
export const MASTERY_COLORS = [
  "var(--muted)",
  "color-mix(in srgb, var(--primary) 30%, var(--card))",
  "color-mix(in srgb, var(--primary) 65%, var(--card))",
  "var(--primary)",
] as const;

/** شريط مقسّم يبيّن توزيع المفاهيم على مستويات الإتقان */
export function MasteryBar({ counts, height = 8, className }: { counts: Record<0 | 1 | 2 | 3, number>; height?: number; className?: string }) {
  const total = counts[0] + counts[1] + counts[2] + counts[3] || 1;
  return (
    <div className={cn("flex w-full gap-0.5 overflow-hidden rounded-full", className)} style={{ height }} role="img" aria-label="توزيع الإتقان">
      {([3, 2, 1, 0] as const).map((lv) =>
        counts[lv] > 0 ? <span key={lv} className="h-full first:rounded-r-full last:rounded-l-full" style={{ width: `${(counts[lv] / total) * 100}%`, background: MASTERY_COLORS[lv] }} /> : null
      )}
    </div>
  );
}

/** مفتاح ألوان الإتقان */
export function MasteryLegend({ labels, counts }: { labels: Record<0 | 1 | 2 | 3, string>; counts?: Record<0 | 1 | 2 | 3, number> }) {
  // لا معنى لمفتاح كل أرقامه أصفار
  if (counts && counts[1] + counts[2] + counts[3] === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {([3, 2, 1] as const).map((lv) => (
        <span key={lv} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MASTERY_COLORS[lv] }} />
          {labels[lv]}
          {counts && <span className="font-medium text-foreground">{ad(counts[lv])}</span>}
        </span>
      ))}
    </div>
  );
}

/** مربع مستوى الإتقان لعنصر واحد */
export function MasteryDot({ level, size = 14 }: { level: 0 | 1 | 2 | 3; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-[4px]"
      style={{ width: size, height: size, background: MASTERY_COLORS[level], outline: level === 0 ? "1px solid var(--border)" : undefined }}
      aria-hidden="true"
    />
  );
}

/** زخرفة شريط العنوان: موجات خضراء متراكبة تنساب من الزاوية، وخيطان ذهبيان، ونجوم ذهبية تومض */
export function HeaderArt() {
  const star = "M0 -6 C0.8 -1.2 1.2 -0.8 6 0 C1.2 0.8 0.8 1.2 0 6 C-0.8 1.2 -1.2 0.8 -6 0 C-1.2 -0.8 -0.8 -1.2 0 -6Z";
  return (
    <svg className="head-art pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 130" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="ha1" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0" stopColor="#1F6B57" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#4FA187" stopOpacity="0.35" />
          <stop offset="1" stopColor="#9FD6C0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ha2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8FCFB6" stopOpacity="0.8" />
          <stop offset="1" stopColor="#DFF1E8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ha3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#CDEBDD" />
          <stop offset="1" stopColor="#E6F4EC" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="hag" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F4C430" stopOpacity="0.2" />
          <stop offset="0.35" stopColor="#E3B23C" />
          <stop offset="0.75" stopColor="#FFE27A" />
          <stop offset="1" stopColor="#F4C430" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="w3" d="M-20 0H420V6C340 16 280 2 215 16C145 32 80 58 -20 118Z" fill="url(#ha3)" />
      <path className="w2" d="M-20 0H330C280 16 225 8 170 28C115 48 60 78 -20 104Z" fill="url(#ha2)" />
      <path className="w1" d="M-20 0H240C200 12 160 12 118 30C78 48 40 70 -20 90Z" fill="url(#ha1)" />
      <path className="w2" d="M-20 108C40 62 92 44 140 28C205 8 290 4 420 2" stroke="url(#hag)" strokeWidth="1.8" fill="none" />
      <path className="w1" d="M-20 98C38 58 88 40 132 25C190 6 270 2 420 -1" stroke="url(#hag)" strokeWidth="0.9" fill="none" opacity="0.7" />
      <g transform="translate(150 22) scale(1.6)"><path className="sp" d={star} fill="#F4C430" /></g>
      <g transform="translate(212 12) scale(1.1)"><path className="sp" style={{ animationDelay: "1s" }} d={star} fill="#FFE27A" /></g>
      <g transform="translate(96 46) scale(1.3)"><path className="sp" style={{ animationDelay: "2s" }} d={star} fill="#E3B23C" /></g>
    </svg>
  );
}
