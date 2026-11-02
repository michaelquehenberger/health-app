// Skizzen zu den Tests: zeigen Position, was gemessen wird und wann der Versuch endet.
// Inhalte nur aus den Testanleitungen in tests.ts, keine zusätzlichen Vorgaben.
import type { ReactNode } from 'react';
import type { TestId } from '../types';
import { KneeToWallGuide } from './KneeToWallGuide';

const INK = '#0A1B2E';
const MINT = '#00D6A2';
const MUTED = '#51606F';
const WALL = '#B8C6D1';
const font = { fontFamily: 'Inter, sans-serif', fontSize: 12, fill: INK } as const;

function Label({ x, y, children, anchor = 'start', bold = false, muted = false }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; bold?: boolean; muted?: boolean }) {
  return <text x={x} y={y} textAnchor={anchor} {...font} fill={muted ? MUTED : INK} fontWeight={bold ? 600 : 400}>{children}</text>;
}
const Limb = ({ points, w = 12 }: { points: string; w?: number }) => (
  <polyline points={points} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
const Head = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={13} fill={INK} />;
const Joint = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={7} fill={MINT} stroke={INK} strokeWidth={2} />;
const Floor = ({ y = 180 }: { y?: number }) => <line x1={10} y1={y} x2={350} y2={y} stroke={MUTED} strokeWidth={2} />;
function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g stroke={INK} strokeWidth={2.5} fill="none">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <polyline points={`${x1 + 8},${y - 5} ${x1},${y} ${x1 + 8},${y + 5}`} />
      <polyline points={`${x2 - 8},${y - 5} ${x2},${y} ${x2 - 8},${y + 5}`} />
    </g>
  );
}
function Stopwatch({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={24} fill="#fff" stroke={INK} strokeWidth={3} />
      <rect x={x - 5} y={y - 33} width={10} height={6} rx={2} fill={INK} />
      <line x1={x} y1={y} x2={x} y2={y - 15} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + 11} y2={y + 6} stroke={MINT} strokeWidth={3} strokeLinecap="round" />
      <Label x={x} y={y + 42} anchor="middle" bold>{text}</Label>
    </g>
  );
}

function Figure({ label, children, caption, h = 220 }: { label: string; children: ReactNode; caption: ReactNode; h?: number }) {
  return (
    <figure className="guide">
      <svg className="guide-side" viewBox={`0 0 360 ${h}`} role="img" aria-label={label}>{children}</svg>
      <figcaption className="small">{caption}</figcaption>
    </figure>
  );
}

/** T1 Ruhepuls: liegend in Ruhe, Puls am Handgelenk oder mit Gerät. */
function RestingPulse() {
  return (
    <Figure label="Ruhepuls: morgens ruhig liegen und den Puls zählen oder vom Gerät ablesen"
      caption={<>Morgens in Ruhe, immer in derselben Position und mit derselben Methode. Eingetragen werden die <strong>Schläge pro Minute (bpm)</strong>, an 5–7 Morgen.</>}>
      <rect x={30} y={130} width={250} height={22} rx={6} fill={WALL} />
      <line x1={36} y1={152} x2={36} y2={180} stroke={MUTED} strokeWidth={4} />
      <line x1={274} y1={152} x2={274} y2={180} stroke={MUTED} strokeWidth={4} />
      <Floor />
      <Head x={62} y={114} />
      <Limb points="78,118 240,122" w={16} />
      <Limb points="110,118 150,100 175,112" w={8} />
      <circle cx={175} cy={112} r={6} fill={MINT} stroke={INK} strokeWidth={2} />
      <Label x={120} y={74}>Puls am Handgelenk</Label>
      <Label x={120} y={88} muted>oder Pulsuhr / Ring</Label>
      <g transform="translate(316,64)">
        <path d="M0 10 C -14 -8 -34 6 0 32 C 34 6 14 -8 0 10 Z" fill={MINT} stroke={INK} strokeWidth={2.5} />
      </g>
      <Label x={316} y={116} anchor="middle" bold>bpm</Label>
      <Label x={30} y={36} bold>morgens, in Ruhe</Label>
      <Label x={30} y={52} muted>liegend oder sitzend, immer gleich</Label>
    </Figure>
  );
}

/** T7 Chair Sit-and-Reach: Seitenansicht, Abstand Fingerspitzen zu Zehen. */
function SitAndReach() {
  return (
    <Figure label="Chair Sit-and-Reach: vorn auf dem Stuhl sitzen, ein Bein gestreckt, Hände Richtung Zehen; gemessen wird der Abstand Fingerspitzen zu Zehen"
      caption={<>Gemessen wird der Abstand <strong>Fingerspitzen – Zehen</strong> in cm. Erreichst du die Zehen nicht, ist der Wert negativ (Lücke), reichst du darüber hinaus, positiv. Beide Seiten messen.</>}>
      <Floor />
      {/* Stuhl */}
      <rect x={40} y={116} width={86} height={8} rx={3} fill={MUTED} />
      <line x1={46} y1={124} x2={46} y2={180} stroke={MUTED} strokeWidth={5} />
      <line x1={120} y1={124} x2={120} y2={180} stroke={MUTED} strokeWidth={5} />
      <line x1={44} y1={116} x2={44} y2={50} stroke={MUTED} strokeWidth={5} />
      {/* angewinkeltes Bein */}
      <Limb points="112,112 150,128 146,178" w={10} />
      {/* gestrecktes Bein, Ferse am Boden, Fuß aufgestellt */}
      <Limb points="112,112 196,140 270,172" />
      <Limb points="270,174 282,146" w={9} />
      <Joint x={196} y={140} />
      {/* Oberkörper nach vorn, Arme Richtung Zehen */}
      <Limb points="112,112 176,66" w={14} />
      <Head x={190} y={52} />
      <Limb points="172,72 248,126" w={8} />
      <circle cx={250} cy={128} r={5} fill={MINT} stroke={INK} strokeWidth={2} />
      {/* Messung */}
      <Arrow x1={250} x2={282} y={104} />
      <line x1={250} y1={110} x2={250} y2={124} stroke={INK} strokeDasharray="3 3" />
      <line x1={282} y1={110} x2={282} y2={142} stroke={INK} strokeDasharray="3 3" />
      <Label x={266} y={94} anchor="middle" bold>cm</Label>
      <Label x={348} y={198} anchor="end" muted>Bein gestreckt, Ferse am Boden</Label>
      <Label x={200} y={30}>Hände übereinander,</Label>
      <Label x={200} y={44}>langsam, nicht wippen</Label>
    </Figure>
  );
}

/** T4 Einbeinstand: auf einem Bein neben der Wand, Zeit stoppen. */
function SingleLegStance() {
  return (
    <Figure label="Einbeinstand: neben der Wand auf einem Bein stehen, Augen offen, Zeit stoppen, höchstens 45 Sekunden"
      caption={<>Gemessen wird die <strong>Zeit in Sekunden</strong>, bis der Fuß absetzt, du dich abstützt oder deutlich das Gleichgewicht verlierst. Höchstens 45 s, 3 Versuche je Bein mit 60 s Pause, die beste Zeit zählt.</>}>
      <rect x={60} y={10} width={14} height={170} fill={WALL} />
      <Label x={80} y={24} muted>Wand zum Abstützen</Label>
      <Label x={80} y={38} muted>nur bei Bedarf</Label>
      <Floor />
      <Head x={170} y={52} />
      <Limb points="170,66 170,118" w={16} />
      <Limb points="170,76 138,108" w={8} />
      <Limb points="170,76 202,108" w={8} />
      <Limb points="170,118 170,178" />
      <Limb points="170,118 190,146 172,156" />
      <Joint x={190} y={146} />
      <Label x={110} y={198} muted>Standbein</Label>
      <Label x={200} y={170}>Fuß in der Luft</Label>
      <Label x={190} y={48}>Augen offen</Label>
      <Stopwatch x={300} y={80} text="max. 45 s" />
    </Figure>
  );
}

/** T3 30-s-Sit-to-Stand: sitzen und stehen, Arme verschränkt. */
function SitToStand() {
  return (
    <Figure label="30-Sekunden-Sit-to-Stand: Arme vor der Brust verschränkt, 30 Sekunden lang ganz aufstehen und wieder hinsetzen, Wiederholungen zählen"
      caption={<>Gezählt werden <strong>vollständige Wiederholungen in 30 Sekunden</strong>: ganz aufstehen, ganz hinsetzen. Nimmst du die Arme zu Hilfe, zählt der Versuch als 0.</>}>
      <rect x={20} y={10} width={12} height={170} fill={WALL} />
      <Floor />
      {/* Stuhl an der Wand */}
      <rect x={34} y={116} width={80} height={8} rx={3} fill={MUTED} />
      <line x1={40} y1={124} x2={40} y2={180} stroke={MUTED} strokeWidth={5} />
      <line x1={108} y1={124} x2={108} y2={180} stroke={MUTED} strokeWidth={5} />
      {/* sitzend */}
      <Limb points="88,112 140,114 140,178" />
      <Limb points="88,112 88,60" w={16} />
      <Head x={88} y={44} />
      <Limb points="78,74 104,92" w={6} /><Limb points="104,74 78,92" w={6} />
      {/* stehend */}
      <g opacity={0.55}>
        <Limb points="214,108 214,178" />
        <Limb points="214,108 214,52" w={16} />
        <Head x={214} y={36} />
        <Limb points="202,66 228,84" w={6} /><Limb points="228,66 202,84" w={6} />
      </g>
      <path d="M 150 70 Q 175 40 196 58" fill="none" stroke={MINT} strokeWidth={4} markerEnd="url(#pfeil)" />
      <path d="M 196 92 Q 172 120 152 100" fill="none" stroke={MINT} strokeWidth={4} markerEnd="url(#pfeil)" />
      <defs>
        <marker id="pfeil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={MINT} />
        </marker>
      </defs>
      <Label x={60} y={198} muted>Arme vor der Brust verschränkt</Label>
      <Stopwatch x={300} y={74} text="30 s" />
    </Figure>
  );
}

/** T8 Liegestütz: Seitenansicht, Variante Zehen oder Knie. */
function PushUp() {
  return (
    <Figure label="Liegestütz: Hände etwa schulterbreit, Körper in gerader Linie, auf den Zehen oder auf den Knien, korrekt ausgeführte Wiederholungen zählen"
      caption={<>Gezählt werden <strong>korrekt ausgeführte Wiederholungen</strong> ohne Pause, auf den Zehen oder auf den Knien. Der Körper bildet eine gerade Linie.</>}>
      <Floor />
      <Head x={78} y={98} />
      <Limb points="96,108 96,178" w={8} />
      <Limb points="96,108 300,170" w={14} />
      <Joint x={96} y={108} />
      <line x1={96} y1={108} x2={226} y2={176} stroke={INK} strokeWidth={4} strokeDasharray="6 6" />
      <Label x={300} y={198} anchor="middle">auf den Zehen</Label>
      <Label x={20} y={46} muted>gestrichelt: Variante auf den Knien</Label>
      <g stroke={MINT} strokeWidth={4} fill="none" strokeLinecap="round">
        <line x1={140} y1={62} x2={140} y2={92} />
        <polyline points="132,84 140,94 148,84" />
        <polyline points="132,70 140,60 148,70" />
      </g>
      <Label x={154} y={70}>Brust kontrolliert senken</Label>
      <Label x={154} y={84}>und wieder hochdrücken</Label>
      <Label x={20} y={30} bold>Körper als gerade Linie</Label>
    </Figure>
  );
}

/** T2 UKK-Gehtest: 2 km zügig gehen, Zeit und Puls am Ende. */
function WalkTest() {
  return (
    <Figure h={200} label="UKK-2-km-Gehtest: flache Strecke von 2 km so zügig wie gleichmäßig möglich gehen, Zeit stoppen, direkt danach Puls messen"
      caption={<>Gemessen werden die <strong>Gehzeit</strong> für 2 km (Minuten und Sekunden) und der <strong>Puls direkt am Ende</strong>. Gehen, nicht laufen.</>}>
      <path d="M 30 150 C 110 110, 200 170, 330 120" fill="none" stroke={WALL} strokeWidth={14} strokeLinecap="round" />
      <path d="M 30 150 C 110 110, 200 170, 330 120" fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="8 8" />
      <circle cx={30} cy={150} r={9} fill={MINT} stroke={INK} strokeWidth={2} />
      <line x1={330} y1={120} x2={330} y2={78} stroke={INK} strokeWidth={3} />
      <path d="M 330 78 L 352 86 L 330 94 Z" fill={MINT} stroke={INK} strokeWidth={2} />
      <Label x={20} y={180} bold>Start</Label>
      <Label x={20} y={194} muted>Stoppuhr an</Label>
      <Label x={348} y={172} anchor="end" bold>Ziel nach 2 km</Label>
      <Label x={348} y={186} anchor="end" muted>Zeit stoppen, Puls messen</Label>
      {/* gehende Figur */}
      <Head x={170} y={52} />
      <Limb points="170,66 166,108" w={14} />
      <Limb points="166,108 150,140" w={10} /><Limb points="166,108 184,138" w={10} />
      <Limb points="168,76 150,98" w={7} /><Limb points="168,76 188,94" w={7} />
      <Label x={20} y={60} bold>zügig gehen,</Label>
      <Label x={20} y={74} bold>nicht laufen</Label>
      <Label x={20} y={30} muted>flache, abgemessene Strecke</Label>
    </Figure>
  );
}

export function TestGuide({ testId }: { testId: TestId }) {
  switch (testId) {
    case 'T1': return <RestingPulse />;
    case 'T2': return <WalkTest />;
    case 'T3': return <SitToStand />;
    case 'T4': return <SingleLegStance />;
    case 'T5': return <KneeToWallGuide />;
    case 'T7': return <SitAndReach />;
    case 'T8': return <PushUp />;
  }
}
