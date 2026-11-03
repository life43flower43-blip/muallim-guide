"use client";

// صورة شخصية افتراضية: تدرّج حيوي يختلف بحسب الاسم، وشخصية مبسطة لمعلم يحمل كتابًا
const PALETTES = [
  ["#7C5CFF", "#FF5C8A"],
  ["#FF7A45", "#FF4D7E"],
  ["#0EA5E9", "#6366F1"],
  ["#10B981", "#0EA5E9"],
  ["#EC4899", "#8B5CF6"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function DefaultAvatar({ seed = "", className = "h-16 w-16" }: { seed?: string; className?: string }) {
  const [a, b] = PALETTES[hash(seed) % PALETTES.length];
  const id = `av-${hash(seed) % 1000}`;
  return (
    <svg viewBox="0 0 64 64" className={`${className} shrink-0 rounded-full`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <clipPath id={`${id}-c`}><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect width="64" height="64" fill={`url(#${id})`} />
        <circle cx="50" cy="13" r="9" fill="#fff" opacity=".14" />
        <circle cx="10" cy="52" r="12" fill="#fff" opacity=".1" />
        {/* الكتفان والجسم */}
        <path d="M12 64c0-12 9-20 20-20s20 8 20 20z" fill="#fff" opacity=".95" />
        {/* الرأس */}
        <circle cx="32" cy="27" r="11" fill="#fff" />
        {/* الكتاب */}
        <path d="M22 50.5 32 53l10-2.5V58l-10 2.5L22 58z" fill={b} />
        <path d="M32 53v7.5" stroke="#fff" strokeWidth="1.2" />
        {/* نجمة صغيرة */}
        <path d="m47 22 1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" fill="#fff" opacity=".9" />
      </g>
    </svg>
  );
}
