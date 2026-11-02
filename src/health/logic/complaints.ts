// Genauere Beschreibung von Beschwerden. Der Übungsplan arbeitet weiter mit einer Hauptart (ComplaintType),
// die hier aus der Mehrfachauswahl abgeleitet wird.
import type { ComplaintType } from '../types';

export type Quality =
  | 'steifigkeit' | 'schwaeche' | 'belastungsschmerz' | 'ruheschmerz'
  | 'druck' | 'stechen' | 'ziehen' | 'brennen' | 'kribbeln' | 'unklar';

export const QUALITIES: { value: Quality; label: string }[] = [
  { value: 'steifigkeit', label: 'Steifigkeit' },
  { value: 'schwaeche', label: 'Schwäche, Unsicherheit' },
  { value: 'belastungsschmerz', label: 'Schmerz bei Belastung' },
  { value: 'ruheschmerz', label: 'Schmerz in Ruhe' },
  { value: 'druck', label: 'Druck' },
  { value: 'stechen', label: 'Stechen' },
  { value: 'ziehen', label: 'Ziehen' },
  { value: 'brennen', label: 'Brennen' },
  { value: 'kribbeln', label: 'Kribbeln oder Taubheit' },
  { value: 'unklar', label: 'schwer zu beschreiben' },
];

export type Side = 'links' | 'rechts' | 'beidseits' | 'mittig';
export const SIDES: { value: Side; label: string }[] = [
  { value: 'links', label: 'links' }, { value: 'rechts', label: 'rechts' },
  { value: 'beidseits', label: 'beidseits' }, { value: 'mittig', label: 'mittig' },
];

export const TIMINGS = [
  { value: 'morgens', label: 'morgens nach dem Aufstehen' },
  { value: 'belastung', label: 'während Belastung' },
  { value: 'nach_belastung', label: 'nach Belastung' },
  { value: 'ruhe', label: 'in Ruhe' },
  { value: 'nachts', label: 'nachts' },
] as const;

export const TRIGGERS = [
  { value: 'gehen', label: 'Gehen' },
  { value: 'treppen', label: 'Treppen' },
  { value: 'sitzen', label: 'langes Sitzen' },
  { value: 'stehen', label: 'langes Stehen' },
  { value: 'buecken', label: 'Bücken, Heben' },
  { value: 'ueberkopf', label: 'Arm über Kopf' },
  { value: 'greifen', label: 'Greifen, Halten' },
  { value: 'liegen', label: 'Liegen' },
] as const;

export type DurationKey = 'unter2w' | '2bis6w' | '6wbis3m' | 'ueber3m';
export const DURATIONS: { value: DurationKey; label: string }[] = [
  { value: 'unter2w', label: 'unter 2 Wochen' },
  { value: '2bis6w', label: '2–6 Wochen' },
  { value: '6wbis3m', label: '6 Wochen bis 3 Monate' },
  { value: 'ueber3m', label: 'über 3 Monate' },
];

export type Course = 'besser' | 'gleich' | 'schlechter';
export const COURSES: { value: Course; label: string }[] = [
  { value: 'besser', label: 'wird besser' }, { value: 'gleich', label: 'bleibt gleich' }, { value: 'schlechter', label: 'wird schlechter' },
];

const UNSPECIFIC: Quality[] = ['druck', 'stechen', 'ziehen', 'brennen', 'kribbeln', 'unklar', 'ruheschmerz'];

/**
 * Hauptart für den Übungsplan (vorsichtigste Deutung gewinnt):
 * unspezifische oder Ruheschmerzen → mildester Block; sonst Belastungsschmerz → Dosis senken;
 * sonst Schwäche → Kräftigung; sonst Steifigkeit → Beweglichkeit.
 */
export function primaryType(q: Quality[]): ComplaintType {
  const unspecific = q.filter((x) => UNSPECIFIC.includes(x));
  if (unspecific.length > 1) return 'misch';
  if (unspecific.length === 1) {
    const u = unspecific[0];
    return u === 'druck' ? 'druck' : u === 'stechen' ? 'stechen' : 'misch';
  }
  if (q.includes('belastungsschmerz')) return 'belastungsschmerz';
  if (q.includes('schwaeche')) return 'schwaeche';
  return 'steifigkeit';
}

/** Kurzbeschreibung für Listen, z. B. „links · Steifigkeit, Ziehen · über 3 Monate“. */
export function describe(c: { side?: Side; qualities?: Quality[]; duration?: DurationKey; course?: Course }): string {
  const parts: string[] = [];
  if (c.side) parts.push(c.side);
  if (c.qualities?.length) parts.push(c.qualities.map((v) => QUALITIES.find((x) => x.value === v)?.label ?? v).join(', '));
  if (c.duration) parts.push(DURATIONS.find((x) => x.value === c.duration)?.label ?? '');
  if (c.course) parts.push(COURSES.find((x) => x.value === c.course)?.label ?? '');
  return parts.filter(Boolean).join(' · ');
}
