// رسوم أيقونات الرئيسية: رسم مسطح هادئ بالأخضر المائي والأصفر، وفي كل رسم حركة بطيئة تعطيه حياة
// (عقرب يدور، علامات صح تُكتب، صفحة تتقلب، مصباح يتوهج، إبرة بوصلة تتأرجح...). الحركة في globals.css تحت .hi-*
const T = "#14857B"; // الأخضر المائي
const TD = "#0E6B63";
const TL = "#BFE6DF";
const Y = "#F2C14E";
const YL = "#FCE7B0";
const W = "#FFFFFF";

function Blob() {
  return (
    <g aria-hidden="true">
      <path d="M10 40c-4-12 6-24 18-26 10-2 22 2 26 12 4 11-2 24-14 28-12 3-26-3-30-14Z" fill="#E1F3EF" />
      <path d="M38 50c4-6 14-8 18-2 3 5-2 11-9 11-6 0-11-4-9-9Z" fill="#FDF1D6" />
    </g>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  today: (
    <>
      <Blob />
      <g>
        <rect x="7" y="13" width="38" height="34" rx="5" fill={W} stroke={T} strokeWidth="3" />
        <path d="M7 18a5 5 0 0 1 5-5h28a5 5 0 0 1 5 5v5H7Z" fill={T} />
        <rect x="14" y="8" width="3.5" height="9" rx="1.75" fill={TD} />
        <rect x="34.5" y="8" width="3.5" height="9" rx="1.75" fill={TD} />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} className={r === 1 && c === 1 ? "hi-cell" : undefined} x={13 + c * 9} y={27 + r * 6.5} width="6" height="4.5" rx="1.2" fill={TL} />
        )))}
      </g>
      <g>
        <circle cx="45" cy="45" r="12" fill={W} stroke={T} strokeWidth="3" />
        <path d="M45 45v-6" stroke={TD} strokeWidth="2.6" strokeLinecap="round" />
        <path className="hi-hand" d="M45 45h6" stroke={TD} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="45" cy="45" r="1.6" fill={TD} />
      </g>
    </>
  ),
  test: (
    <>
      <Blob />
      <rect x="10" y="10" width="34" height="44" rx="4" fill={W} stroke={T} strokeWidth="3" />
      <rect x="19" y="6" width="16" height="8" rx="3" fill={T} />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <path className="hi-check" style={{ animationDelay: `${k * 0.6}s` }} d={`M15 ${23 + k * 9}l3 3 5-6`} stroke={k === 1 ? "#5B9A4B" : T} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
          <rect x="27" y={22.5 + k * 9} width="12" height="3" rx="1.5" fill={TL} />
        </g>
      ))}
      <g>
        <circle cx="46" cy="46" r="11" fill={W} stroke={T} strokeWidth="3" />
        <circle cx="46" cy="46" r="6" fill={TL} stroke={T} strokeWidth="2" />
        <circle cx="46" cy="46" r="2.2" fill={Y} />
        <g className="hi-dart">
          <path d="M46 46l9-9" stroke={TD} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M55 37l1-4 3 3-4 1Z" fill={Y} />
        </g>
      </g>
    </>
  ),
  situations: (
    <>
      <Blob />
      <rect x="26" y="8" width="32" height="22" rx="3" fill={W} stroke={T} strokeWidth="3" />
      <path className="hi-draw" d="M31 24l6-6 5 4 10-9" stroke={T} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      <circle cx="15" cy="13" r="5" fill={T} />
      <path d="M8 34c0-8 3-13 7-13s7 5 7 13Z" fill={T} />
      <path className="hi-point" d="M19 24l9-5" stroke={T} strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2].map((k) => (
        <g key={k} className="hi-bob" style={{ animationDelay: `${k * 0.45}s` }}>
          <circle cx={16 + k * 16} cy="42" r="5" fill={T} />
          <path d={`M${8 + k * 16} 56c0-6 4-8 8-8s8 2 8 8Z`} fill={TD} />
        </g>
      ))}
    </>
  ),
  plan: (
    <>
      <Blob />
      <path d="M6 18c8-3 18-3 26 2v34c-8-5-18-5-26-2Z" fill={W} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M58 18c-8-3-18-3-26 2v34c8-5 18-5 26-2Z" fill={W} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M6 18c8-3 18-3 26 2" stroke={Y} strokeWidth="3" fill="none" />
      {[0, 1, 2, 3].map((k) => (
        <path key={k} className="hi-line" style={{ animationDelay: `${k * 0.5}s` }} d={`M11 ${27 + k * 6}h16`} stroke={k % 2 ? YL : Y} strokeWidth="2.4" strokeLinecap="round" pathLength={1} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={`M37 ${27 + k * 6}h16`} stroke={TL} strokeWidth="2.4" strokeLinecap="round" />
      ))}
      <path className="hi-page" d="M32 20c6-4 14-5 22-3v33c-8-2-16-1-22 3Z" fill="#F4FBF9" stroke={T} strokeWidth="1.6" />
      <path d="M4 52c9-3 19-3 28 2 9-5 19-5 28-2" stroke={TD} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  skills: (
    <>
      <Blob />
      <path d="M21 18c0-6 4-10 9-10s9 4 9 10v8H21Z" fill={TD} />
      <circle cx="30" cy="19" r="6.5" fill={Y} />
      <path d="M18 40c0-8 5-13 12-13s12 5 12 13Z" fill={T} />
      <rect x="34" y="28" width="16" height="10" rx="1.5" fill={TD} transform="rotate(-8 42 33)" />
      <rect className="hi-glow" x="36" y="30" width="12" height="6" rx="1" fill={TL} transform="rotate(-8 42 33)" />
      <path className="hi-type" d="M24 38h10" stroke={Y} strokeWidth="3" strokeLinecap="round" />
      <path d="M14 39h36l-3 5H17Z" fill={T} />
      <rect x="19" y="44" width="26" height="14" rx="1.5" fill={TD} />
      <rect x="23" y="47" width="18" height="2" rx="1" fill={T} />
    </>
  ),
  methods: (
    <>
      <Blob />
      <rect x="6" y="8" width="36" height="28" rx="3" fill={W} stroke={T} strokeWidth="3" />
      {[0, 1, 2].map((k) => (
        <path key={k} className="hi-line" style={{ animationDelay: `${k * 0.55}s` }} d={`M11 ${16 + k * 6}h${[20, 24, 14][k]}`} stroke={k === 1 ? T : TL} strokeWidth="2.6" strokeLinecap="round" pathLength={1} />
      ))}
      <circle cx="51" cy="13" r="5" fill={T} />
      <path d="M45 44V27c0-5 3-8 6-8s6 3 6 8v17Z" fill={T} />
      <path d="M47 46v10M55 46v10" stroke={T} strokeWidth="3.6" strokeLinecap="round" />
      <path className="hi-point2" d="M46 26l-7 4" stroke={T} strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2].map((k) => (
        <g key={k} className="hi-bob" style={{ animationDelay: `${k * 0.45}s` }}>
          <circle cx={11 + k * 10} cy="46" r="3.6" fill={TD} />
          <path d={`M${5.5 + k * 10} 56c0-4 2.5-6 5.5-6s5.5 2 5.5 6Z`} fill={TD} />
        </g>
      ))}
    </>
  ),
  concepts: (
    <>
      <Blob />
      <g className="hi-rays" stroke={Y} strokeWidth="2.6" strokeLinecap="round">
        <path d="M32 3v5M18 9l3 4M46 9l-3 4M12 21h5M47 21h5" />
      </g>
      <circle className="hi-halo" cx="32" cy="22" r="13" fill={YL} opacity="0.5" />
      <path d="M32 11a11 11 0 0 0-6 20c1.5 1 2 2.5 2 4h8c0-1.5.5-3 2-4a11 11 0 0 0-6-20Z" fill={Y} />
      <path d="M29 26l3 4 3-4M32 30v5" stroke="#B8860B" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="28" y="35" width="8" height="5" rx="1.5" fill={TD} />
      <path d="M6 46c9-3 18-3 26 1 8-4 17-4 26-1v8c-9-3-18-3-26 1-8-4-17-4-26-1Z" fill={T} />
      <path d="M8 46c8-2 16-2 24 2 8-4 16-4 24-2" stroke={Y} strokeWidth="2" fill="none" />
      <path d="M32 47v8" stroke={TD} strokeWidth="2" />
    </>
  ),
  compass: (
    <>
      <Blob />
      <circle cx="32" cy="7" r="3" fill="none" stroke="#B8860B" strokeWidth="2" />
      <circle cx="32" cy="34" r="23" fill={T} />
      <circle cx="32" cy="34" r="18" fill="#FFF8EC" />
      <path d="M32 18v4M32 46v4M16 34h4M44 34h4" stroke={Y} strokeWidth="2.4" strokeLinecap="round" />
      <g className="hi-needle">
        <path d="M32 17l4.5 17h-9Z" fill={TD} />
        <path d="M32 51l4.5-17h-9Z" fill={Y} />
      </g>
      <circle cx="32" cy="34" r="2.6" fill={W} stroke={TD} strokeWidth="1.4" />
    </>
  ),
};

export default function HomeIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 64 64" className="home-ill h-full w-full" aria-hidden="true">
      {ICONS[name] ?? ICONS.today}
    </svg>
  );
}
