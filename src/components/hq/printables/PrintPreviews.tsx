/**
 * Hand-drawn style miniature previews for the Print Studio cards.
 * Pure SVG (no state, server-safe); everything inherits currentColor so it themes with the card.
 */

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 160 112" role="img" aria-label={label} className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="pv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <path d="M0 0v5" strokeWidth="0.7" opacity="0.55" />
        </pattern>
      </defs>
      {children}
    </svg>
  );
}

const Page = ({ x = 46, w = 68 }: { x?: number; w?: number }) => <rect x={x} y="6" width={w} height="100" rx="1.5" fill="var(--color-paper-50, #fbf9f4)" />;
const Lines = ({ x, y, w, n, gap = 4 }: { x: number; y: number; w: number; n: number; gap?: number }) => (
  <g strokeWidth="0.8" opacity="0.7">
    {Array.from({ length: n }, (_, i) => (
      <path key={i} d={`M${x} ${y + i * gap}h${i === n - 1 ? w * 0.6 : w}`} />
    ))}
  </g>
);
const Tick = ({ x, y }: { x: number; y: number }) => <rect x={x} y={y} width="4" height="4" rx="0.6" />;
const Face = ({ cx, cy, mood }: { cx: number; cy: number; mood: -1 | 0 | 1 }) => (
  <g strokeWidth="0.8">
    <circle cx={cx} cy={cy} r="4" />
    <path d={`M${cx - 1.6} ${cy - 1}v0.1M${cx + 1.6} ${cy - 1}v0.1`} strokeWidth="1.1" />
    <path d={mood > 0 ? `M${cx - 2} ${cy + 1}q2 2.6 4 0` : mood < 0 ? `M${cx - 2} ${cy + 2.4}q2 -2.6 4 0` : `M${cx - 2} ${cy + 1.6}h4`} />
  </g>
);

/** An A3 landscape sheet with its fold line: back cover on the left half, front cover on the right. */
const Spread = () => (
  <>
    <rect x="12" y="8" width="136" height="96" rx="1.5" fill="var(--color-paper-50, #fbf9f4)" />
    <path d="M80 4v104" strokeDasharray="2.5 2" strokeWidth="0.7" opacity="0.5" />
  </>
);
const PAPER = "var(--color-paper, #f5f1e8)";

const previews: Record<string, () => React.ReactNode> = {
  "rate-card": () => (
    <Frame label="Brochure sketch: dark A3 sheet with a price table and a large price on the cover">
      <Spread />
      <rect x="12" y="8" width="136" height="96" rx="1.5" fill="currentColor" opacity="0.9" stroke="none" />
      <g stroke={PAPER}>
        <path d="M80 4v104" strokeDasharray="2.5 2" strokeWidth="0.7" opacity="0.5" />
        <path d="M20 20h22" strokeWidth="1.6" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} strokeWidth="0.8">
            <path d={`M20 ${34 + i * 11}h26`} opacity="0.75" />
            <path d={`M56 ${34 + i * 11}h14`} strokeWidth="1.6" />
            <path d={`M20 ${39 + i * 11}h50`} opacity="0.3" />
          </g>
        ))}
        <rect x="20" y="82" width="50" height="12" strokeWidth="0.8" opacity="0.7" />
        <path d="M90 20h16" strokeWidth="2" />
        <path d="M90 84h40M90 90h28" strokeWidth="0.9" opacity="0.7" />
      </g>
      <text x="90" y="68" fontSize="30" fontWeight="700" fontFamily="monospace" fill={PAPER} stroke="none">
        ₹
      </text>
      <path d="M112 50h26M112 60h20" stroke={PAPER} strokeWidth="2.6" />
    </Frame>
  ),
  "id-cards": () => (
    <Frame label="ID cards sketch: front and back of a CR80 card">
      <rect x="10" y="14" width="64" height="40" rx="3" fill="var(--color-paper-50, #fbf9f4)" />
      <rect x="10" y="14" width="64" height="12" rx="3" fill="currentColor" opacity="0.85" />
      <circle cx="26" cy="38" r="7" />
      <path d="M38 35h28M38 40h20M38 45h24" strokeWidth="0.9" />
      <rect x="86" y="14" width="64" height="40" rx="3" fill="var(--color-paper-50, #fbf9f4)" />
      <path d="M92 24h30M92 29h42M92 34h36" strokeWidth="0.8" opacity="0.7" />
      <rect x="132" y="40" width="12" height="9" fill="url(#pv-hatch)" />
      <rect x="10" y="62" width="64" height="40" rx="3" strokeDasharray="2 2" opacity="0.5" />
      <rect x="86" y="62" width="64" height="40" rx="3" strokeDasharray="2 2" opacity="0.5" />
    </Frame>
  ),
  "visiting-cards": () => (
    <Frame label="Visiting cards sketch: ten cards on a sheet">
      <Page />
      {Array.from({ length: 10 }, (_, i) => {
        const x = 49 + (i % 2) * 31;
        const y = 10 + Math.floor(i / 2) * 19;
        return (
          <g key={i} strokeWidth="0.8">
            <rect x={x} y={y} width="30" height="18" strokeDasharray="2 1.5" />
            <path d={`M${x + 3} ${y + 5}h12`} strokeWidth="1.3" />
            <path d={`M${x + 3} ${y + 9}h8M${x + 3} ${y + 12}h14M${x + 3} ${y + 15}h10`} opacity="0.6" />
          </g>
        );
      })}
    </Frame>
  ),
  letterhead: () => (
    <Frame label="Letterhead sketch: header and footer on a blank page">
      <Page />
      <path d="M52 12h18" strokeWidth="2" />
      <Lines x={92} y={12} w={16} n={3} gap={3} />
      <path d="M52 24h56" strokeWidth="1.3" />
      <circle cx="80" cy="62" r="14" strokeDasharray="1.5 2.5" opacity="0.45" />
      <path d="M52 94h56" strokeWidth="0.8" />
      <path d="M52 98h26M92 98h16" strokeWidth="0.8" opacity="0.6" />
    </Frame>
  ),
  certificate: () => (
    <Frame label="Certificate sketch: framed landscape certificate with seal and QR">
      <rect x="10" y="14" width="140" height="84" fill="var(--color-paper-50, #fbf9f4)" strokeWidth="1.6" />
      <rect x="15" y="19" width="130" height="74" strokeWidth="0.6" />
      <rect x="12.5" y="16.5" width="135" height="79" fill="url(#pv-hatch)" stroke="none" opacity="0.5" />
      <rect x="15" y="19" width="130" height="74" fill="var(--color-paper-50, #fbf9f4)" strokeWidth="0.6" />
      <path d="M62 27h36" strokeWidth="2" />
      <path d="M46 38h68" strokeWidth="1.6" />
      <path d="M58 52h44" strokeWidth="2.4" />
      <path d="M44 56h72" strokeWidth="0.8" />
      <Lines x={52} y={63} w={56} n={2} gap={3.5} />
      <path d="M26 83h30M104 83h30" />
      <rect x="71" y="72" width="18" height="18" fill="url(#pv-hatch)" />
      <rect x="71" y="72" width="18" height="18" />
    </Frame>
  ),
};

export function PrintPreview({ id }: { id: string }) {
  const render = previews[id];
  return <div className="h-full w-full text-graphite">{render ? render() : null}</div>;
}
