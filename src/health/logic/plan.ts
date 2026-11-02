// Tageskarte, Wochenmuster und Schmerzregel laut „Auswertungslogik – Testphase Gabi“.
// Entwurf: Verteilung der Wochentage, Stufen und die 5/10-Grenze prüft die Fachperson.
import { EXERCISES, type Exercise, type Region } from '../data/exercises';
import type { Complaint, Feedback, LabValue, LabReport, HealthProfile } from '../types';
import { kidneyValuesOutside } from './labs';
import { latestByMarker } from './redFlags';
import { nutritionHintFor, type Source } from './nutrition';
import { supplementInfo, type SupplementInfo } from './supplements';

export const RULES_VERSION = 'v0.1-entwurf';
export const PAIN_LIMIT = 5;

export type DayFocus = 'kraeftigung' | 'ausdauer' | 'leicht' | 'ruhe';

// Index = Date.getDay(): 0 Sonntag … 6 Samstag
export const WEEK_PATTERN: Record<number, { focus: DayFocus; label: string }> = {
  1: { focus: 'kraeftigung', label: 'Kräftigung, Beweglichkeit' },
  2: { focus: 'ausdauer', label: 'Ausdauer, Beweglichkeit' },
  3: { focus: 'leicht', label: 'Beweglichkeit leicht' },
  4: { focus: 'kraeftigung', label: 'Kräftigung, Beweglichkeit' },
  5: { focus: 'ausdauer', label: 'Ausdauer, Beweglichkeit' },
  6: { focus: 'leicht', label: 'Beweglichkeit leicht oder Pause' },
  0: { focus: 'ruhe', label: 'Ruhetag oder Spaziergang' },
};

/** Stufe 0 = leicht, 1 = Start, 2 = gesteigert */
export const MAX_LEVEL = 2;
export const START_LEVEL = 1;
/** So viele regelkonforme Einheiten hintereinander, bevor die Stufe steigt (Entwurf). */
export const STEPS_TO_PROGRESS = 3;
/** So oft hintereinander über der Grenze, bevor die App ärztliche Abklärung empfiehlt (Entwurf). */
export const VIOLATIONS_FOR_DOCTOR = 2;

export type FeedbackResult = 'ok' | 'ueberschritten' | 'offen';

/** Schmerzregel: höchstens 5/10 nach der Einheit und am Morgen zurück auf das Ausgangsniveau. */
export function judgeFeedback(f: Feedback): FeedbackResult {
  if (f.swelling) return 'ueberschritten';
  if (f.painAfter !== null && f.painAfter > PAIN_LIMIT) return 'ueberschritten';
  if (f.painMorning !== null && f.painBefore !== null && f.painMorning > f.painBefore) return 'ueberschritten';
  if (f.painAfter === null) return 'offen';
  return 'ok';
}

export interface Progression {
  level: number;
  consecutiveViolations: number;
  recommendDoctor: boolean;
  lastResult: FeedbackResult | null;
}

export function computeProgression(feedback: Feedback[], beforeDate?: string): Progression {
  const sorted = [...feedback]
    .filter((f) => (beforeDate ? f.date < beforeDate : true))
    .sort((a, b) => a.date.localeCompare(b.date));
  let level = START_LEVEL;
  let okStreak = 0;
  let violations = 0;
  let last: FeedbackResult | null = null;
  for (const f of sorted) {
    const r = judgeFeedback(f);
    if (r === 'offen') continue;
    last = r;
    if (r === 'ueberschritten') {
      level = Math.max(0, level - 1);
      okStreak = 0;
      violations += 1;
    } else {
      violations = 0;
      okStreak += 1;
      if (okStreak >= STEPS_TO_PROGRESS && level < MAX_LEVEL) {
        level += 1;
        okStreak = 0;
      }
    }
  }
  return { level, consecutiveViolations: violations, recommendDoctor: violations >= VIOLATIONS_FOR_DOCTOR, lastResult: last };
}

export interface DayCard {
  date: string;
  focus: DayFocus;
  focusLabel: string;
  region: Region | null;
  exercises: Exercise[];
  level: number;
  endurance: string | null;
  drink: { text: string } | { blocked: string };
  nutrition: { text: string; source: Source } | null;
  supplements: SupplementInfo;
  notes: string[];
  rulesVersion: string;
}

export function dayOfWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function dayNumber(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Wählt n Einträge, je Tag versetzt, damit nicht jeden Tag dieselben Übungen kommen. */
function rotate<T>(items: T[], n: number, seed: number): T[] {
  if (items.length <= n) return items;
  const start = seed % items.length;
  return Array.from({ length: n }, (_, i) => items[(start + i) % items.length]);
}

export function primaryComplaint(complaints: Complaint[]): Complaint | null {
  const active = complaints.filter((c) => c.active).sort((a, b) => b.date.localeCompare(a.date));
  return active[0] ?? null;
}

export function buildDayCard(args: {
  date: string;
  profile: HealthProfile;
  complaints: Complaint[];
  feedback: Feedback[];
  values: LabValue[];
  reports: LabReport[];
  /** Übungen aus der KI-Auswertung; werden bevorzugt, aber nur im Rahmen der Regeln des Tages */
  preferredIds?: string[];
}): DayCard {
  const { date, profile, complaints, feedback, values, reports, preferredIds } = args;
  const pattern = WEEK_PATTERN[dayOfWeek(date)];
  const complaint = primaryComplaint(complaints);
  const prog = computeProgression(feedback, date);
  const notes: string[] = [];

  let level = prog.level;
  let focus = pattern.focus;
  const mildTypes = ['druck', 'stechen', 'misch'];

  if (complaint?.type === 'belastungsschmerz') {
    level = Math.max(0, level - 1);
    notes.push('Belastungsschmerz: Die Dosis ist eine Stufe niedriger. Teile Aktivitäten im Alltag in Etappen ein.');
  }
  if (complaint && mildTypes.includes(complaint.type)) {
    level = 0;
    notes.push('Bei Druck, Stechen oder gemischten Beschwerden startet der Plan mit dem mildesten Block. Beschreibe die Beschwerde bei Gelegenheit genauer.');
  }

  let exercises: Exercise[] = [];
  const seed = dayNumber(date);
  if (complaint && focus !== 'ruhe') {
    const pool = EXERCISES.filter((e) => e.region === complaint.region);
    const mobility = pool.filter((e) => e.kind === 'beweglichkeit');
    const strength = pool.filter((e) => e.kind === 'kraeftigung');
    const maxCount = profile.minutesPerDay < 10 ? 3 : 4;

    let nMob = 3;
    let nStr = 0;
    if (focus === 'kraeftigung' && level >= 1) {
      nMob = 2;
      nStr = level === 1 ? 1 : 2;
      if (complaint.type === 'schwaeche') nStr = Math.min(2, nStr + 1);
    }
    if (complaint.type === 'steifigkeit' && nStr > 1) nStr = 1;
    const mild = focus === 'leicht' || level === 0;
    if (mild) {
      nMob = 3;
      nStr = 0;
    }
    const mob = rotate(mobility, Math.min(nMob, mobility.length), seed);
    // Hat eine Region zu wenige Beweglichkeitsübungen, wird mit Kräftigung aufgefüllt, außer im milden Block.
    const fill = mild ? 0 : nMob - mob.length;
    const str = rotate(strength, Math.min(nStr + fill, strength.length), seed);
    exercises = [...mob, ...str].slice(0, maxCount);
    if (preferredIds?.length) {
      const strengthToday = !mild && nStr + fill > 0;
      const pref = preferredIds
        .map((id) => pool.find((e) => e.id === id))
        .filter((e): e is Exercise => !!e && (e.kind === 'beweglichkeit' || strengthToday));
      if (pref.length) {
        const ids = new Set(pref.map((e) => e.id));
        exercises = [...pref, ...exercises.filter((e) => !ids.has(e.id))].slice(0, maxCount);
        notes.push('Die Übungen sind nach deiner KI-Auswertung ausgewählt, im Rahmen von Wochenmuster und Schmerzregel.');
      }
    }
  }

  const endurance =
    focus === 'ausdauer'
      ? 'Ausdauer: zügig gehen, Rad fahren oder schwimmen. Richtwert 2 Stunden 30 Minuten pro Woche, verteilbar; so, dass du noch sprechen kannst.'
      : focus === 'ruhe'
        ? 'Ruhetag. Ein Spaziergang ist willkommen.'
        : null;

  const latest = latestByMarker(values, reports);
  let drink: DayCard['drink'];
  if (profile.fluidRestriction) {
    drink = { blocked: 'Du hast eine ärztliche Trinkvorgabe oder Herz- bzw. Nierenerkrankung angegeben. Halte dich an die ärztliche Vorgabe.' };
  } else if (kidneyValuesOutside(latest)) {
    drink = { blocked: 'Deine Nierenwerte liegen außerhalb des Laborbereichs. Die App nennt deshalb keine Trinkmenge; bitte ärztlich besprechen.' };
  } else {
    drink = { text: 'Richtwert rund 1,5 Liter Getränke pro Tag (DGE). Bei Hitze, Sport oder anstrengender Arbeit mehr.' };
  }

  const hint = nutritionHintFor(date, profile.allergies);
  const nutrition = hint ? { text: hint.text, source: hint.source } : null;
  const supplements = supplementInfo(latest, profile, complaints.filter((c) => c.active).map((c) => c.region));

  if (prog.recommendDoctor) {
    notes.unshift('Der Schmerz lag mehrmals hintereinander über der Grenze. Bitte lass die Beschwerden ärztlich abklären, bevor du weiter steigerst.');
  } else if (prog.lastResult === 'ueberschritten') {
    notes.unshift('Gestern lag der Schmerz über der Grenze oder hielt bis zum Morgen an. Heute ist die Einheit eine Stufe leichter.');
  }

  return {
    date,
    focus,
    focusLabel: pattern.label,
    region: complaint?.region ?? null,
    exercises,
    level,
    endurance,
    drink,
    nutrition,
    supplements,
    notes,
    rulesVersion: RULES_VERSION,
  };
}
