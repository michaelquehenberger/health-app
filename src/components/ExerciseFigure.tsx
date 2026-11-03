// Einfache Strichfiguren zu jeder Übung: Ausgangsstellung hell, Zielstellung dunkel, Bewegung als Pfeil.
// Sie zeigen nur die Grundidee; die Ausführung steht im Text und in der Anleitung der Quelle.
import { FIGURES, type Pose, type Prop } from '../health/data/exerciseFigures';

const INK = '#0A1B2E';
const FAR = '#7F93A3';
const GHOST = '#C9D4DC';
const MINT = '#00B88A';
const LINE = '#B8C6D1';

type Pt = [number, number];
const pts = (...p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(' ');

function Body({ p, color, far, w = 7 }: { p: Pose; color: string; far: string; w?: number }) {
  const sh1 = p.sh1 ?? p.neck, sh2 = p.sh2 ?? p.neck, hp1 = p.hp1 ?? p.hip, hp2 = p.hp2 ?? p.hip;
  const limb = (c: string, ...q: Pt[]) => <polyline points={pts(...q)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <g>
      {limb(far, sh2, ...p.a2)}
      {limb(far, hp2, ...p.l2)}
      {p.sh1 && limb(color, p.sh1, p.sh2!)}
      {p.hp1 && limb(color, p.hp1, p.hp2!)}
      {limb(color, p.neck, p.hip)}
      {limb(color, hp1, ...p.l1)}
      {limb(color, sh1, ...p.a1)}
      <circle cx={p.head[0]} cy={p.head[1]} r={9} fill={color} />
    </g>
  );
}

function PropShape({ prop }: { prop: Prop }) {
  switch (prop.kind) {
    case 'floor': return <line x1={4} y1={prop.y ?? 126} x2={196} y2={prop.y ?? 126} stroke={LINE} strokeWidth={2} />;
    case 'mat': return <rect x={prop.x} y={(prop.y ?? 126) - 3} width={prop.w ?? 160} height={5} rx={2} fill={LINE} />;
    case 'chair': {
      const x = prop.x;
      return <polyline points={pts([x + 26, 124], [x + 26, 90], [x - 6, 90], [x - 6, 124], [x - 6, 90], [x - 6, 54])} fill="none" stroke={LINE} strokeWidth={4} strokeLinejoin="round" />;
    }
    case 'step': return <rect x={prop.x} y={110} width={prop.w ?? 34} height={16} rx={2} fill={LINE} />;
    case 'towel': return <ellipse cx={prop.x} cy={prop.y ?? 120} rx={9} ry={5} fill={MINT} opacity={0.6} />;
    case 'wall': return <line x1={prop.x} y1={10} x2={prop.x} y2={126} stroke={LINE} strokeWidth={4} />;
    case 'table': return <polyline points={pts([prop.x, 124], [prop.x, 86], [prop.x + (prop.w ?? 80), 86], [prop.x + (prop.w ?? 80), 124])} fill="none" stroke={LINE} strokeWidth={4} />;
    case 'mirror': return <rect x={prop.x} y={14} width={6} height={100} rx={2} fill={LINE} />;
  }
}

function Arrow({ d }: { d: string }) {
  return (
    <g>
      <defs>
        <marker id="ex-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={MINT} />
        </marker>
      </defs>
      <path d={d} fill="none" stroke={MINT} strokeWidth={3} strokeLinecap="round" markerEnd="url(#ex-arrow)" />
    </g>
  );
}

/** Hand von oben bzw. von der Seite, für die Handübungen. */
function HandShape({ v }: { v: NonNullable<(typeof FIGURES)[string]['hand']> }) {
  const fingers = (x0: number, spread: number, curl: boolean, color: string) =>
    [0, 1, 2, 3].map((i) => {
      const x = x0 + i * (12 + spread);
      return curl
        ? <polyline key={i} points={pts([x, 74], [x, 56], [x + 8, 50], [x + 10, 60])} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        : <line key={i} x1={x} y1={74} x2={x + (i - 1.5) * spread * 0.8} y2={34} stroke={color} strokeWidth={7} strokeLinecap="round" />;
    });
  const palm = (x0: number, color: string) => <rect x={x0 - 6} y={70} width={50} height={40} rx={10} fill={color} />;
  const thumb = (x0: number, color: string, toFinger = false) =>
    <polyline points={toFinger ? pts([x0 - 4, 96], [x0 + 4, 72], [x0 + 30, 58]) : pts([x0 - 4, 96], [x0 - 18, 78], [x0 - 22, 66])} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
  switch (v) {
    case 'press':
      return <g><rect x={20} y={104} width={160} height={8} rx={3} fill={MINT} opacity={0.5} />{palm(70, INK)}{fingers(70, 4, false, INK)}{thumb(70, INK)}<Arrow d="M150 40 L150 90" /></g>;
    case 'curl':
      return <g>{palm(28, GHOST)}{fingers(28, 0, false, GHOST)}{palm(118, INK)}{fingers(118, 0, true, INK)}<Arrow d="M84 60 L108 60" /></g>;
    case 'fan':
      return <g>{palm(28, GHOST)}{fingers(28, 0, false, GHOST)}{thumb(28, GHOST)}{palm(118, INK)}{fingers(118, 8, false, INK)}{thumb(118, INK, true)}<Arrow d="M84 60 L108 60" /></g>;
    case 'lift':
    case 'wave': {
      const forearm = <line x1={20} y1={90} x2={110} y2={90} stroke={INK} strokeWidth={14} strokeLinecap="round" />;
      const table = <polyline points={pts([10, 98], [118, 98], [118, 126])} fill="none" stroke={LINE} strokeWidth={4} />;
      return (
        <g>
          {table}{forearm}
          <line x1={110} y1={90} x2={150} y2={v === 'lift' ? 110 : 100} stroke={GHOST} strokeWidth={14} strokeLinecap="round" />
          <line x1={110} y1={90} x2={146} y2={60} stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <Arrow d={v === 'lift' ? 'M162 106 Q172 84 158 62' : 'M164 96 Q174 80 160 62'} />
          {v === 'wave' && <Arrow d="M150 52 Q168 70 160 96" />}
        </g>
      );
    }
  }
}

const PROP_TOP: Record<Prop['kind'], number> = { floor: 126, mat: 120, chair: 54, step: 110, towel: 112, wall: 10, table: 86, mirror: 14 };

/** Oberkante des Bildes: höchster Punkt von Figur und Gegenständen, mit Rand. Liegende Übungen werden so nicht winzig. */
function topOf(f: (typeof FIGURES)[string]): number {
  if (f.hand) return 0;
  const ys: number[] = [];
  for (const p of [f.from, f.to]) if (p) ys.push(p.head[1] - 10, ...[p.neck, p.hip, ...p.a1, ...p.a2, ...p.l1, ...p.l2].map((q) => q[1]));
  for (const pr of f.props ?? []) ys.push(PROP_TOP[pr.kind]);
  if (f.arrow) ys.push(...(f.arrow.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 1));
  return Math.max(0, Math.min(...ys) - 14);
}

export function ExerciseFigure({ id, name }: { id: string; name: string }) {
  const f = FIGURES[id];
  if (!f) return null;
  const top = topOf(f);
  return (
    <figure className="ex-figure">
      <svg viewBox={`0 ${top} 200 ${132 - top}`} role="img" aria-label={`Skizze: ${name}`}>
        {f.props?.map((p, i) => <PropShape key={i} prop={p} />)}
        {f.hand ? <HandShape v={f.hand} /> : (
          <>
            {f.from && <Body p={f.from} color={GHOST} far={GHOST} />}
            {f.to && <Body p={f.to} color={INK} far={FAR} />}
            {f.arrow && <Arrow d={f.arrow} />}
          </>
        )}
      </svg>
      {f.caption && <figcaption className="small muted">{f.caption}</figcaption>}
    </figure>
  );
}
