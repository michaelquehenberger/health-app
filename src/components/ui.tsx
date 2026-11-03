import type { ReactNode } from 'react';

export function Wordmark() {
  return (
    <span className="wordmark" aria-label="LIVION">
      <span aria-hidden="true">LIVI</span>
      <svg width="20" height="20" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r="30" fill="none" stroke="#00D6A2" strokeWidth="12" strokeDasharray="150 40" strokeLinecap="round" transform="rotate(-60 38 38)" />
        <circle cx="62" cy="14" r="7" fill="#D4F34A" />
      </svg>
      <span aria-hidden="true">N</span>
    </span>
  );
}

export function Ring({ value, label }: { value: number; label: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${label}: ${Math.round(v * 100)} Prozent`}>
      <circle cx="42" cy="42" r={r} fill="none" stroke="#1E3347" strokeWidth="10" />
      <circle
        cx="42" cy="42" r={r} fill="none" stroke="#00D6A2" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 42 42)"
        style={{ transition: 'stroke-dasharray 240ms ease-out' }}
      />
      <text x="42" y="48" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="17" fill="#F4F7F6">
        {Math.round(v * 100)}%
      </text>
    </svg>
  );
}

export function PainScale({ value, onChange, label, limit }: { value: number | null; onChange: (v: number) => void; label: string; limit?: number }) {
  return (
    <div className="stack" role="group" aria-label={label}>
      <span className="small" style={{ fontWeight: 500 }}>{label}</span>
      <div className="scale">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={value === i}
            className={limit !== undefined && i > limit ? 'over' : undefined}
            onClick={() => onChange(i)}
            aria-label={`${i} von 10`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="row between muted" style={{ fontSize: 12 }}>
        <span>0 kein Schmerz</span>
        <span>10 stärkster vorstellbarer</span>
      </div>
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="stack" role="group" aria-label={label}>
      <span className="small" style={{ fontWeight: 500 }}>{label}</span>
      <div className="seg">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const Icon = {
  today: () => (<svg {...iconProps}><path d="M13 3L5 14h6l-1 7 8-11h-6z" /></svg>),
  body: () => (<svg {...iconProps}><circle cx="12" cy="5" r="2.5" /><path d="M12 8v7M8 21l4-6 4 6M6 11h12" /></svg>),
  drop: () => (<svg {...iconProps}><path d="M12 3c3.5 4.2 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-5.8 6-10z" /></svg>),
  pulse: () => (<svg {...iconProps}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>),
  gear: () => (<svg {...iconProps}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>),
  chat: () => (<svg {...iconProps}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></svg>),
  leaf: () => (<svg {...iconProps}><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19c3-4 6-6 9-8" /></svg>),
  check: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>),
};
