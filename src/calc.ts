// Berechnungen laut „Health App × LIVION – MVP-Übergabe v0.1“, Abschnitte 4 und 6.
// Nichts hier aus dem Gedächtnis ergänzen; offene Punkte stehen als [OFFEN] im Kommentar.

export type Sex = 'weiblich' | 'maennlich' | 'divers' | '';

/** BMI = kg ÷ m² (Größe in cm). */
export function bmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export const UKK_MIN_AGE = 20;
export const UKK_MAX_AGE = 65;

export type UkkResult =
  | { kind: 'index'; value: number; rating: UkkRating; provisional: boolean }
  | { kind: 'nichtBerechnet'; reason: string };

export type UkkRating = 'sehr gut' | 'gut' | 'mittel' | 'schwach' | 'sehr schwach';

/** Männer: Index = 420 − (11,6 × Min + 0,2 × Sek + 0,56 × Puls + 2,6 × BMI − 0,2 × Alter) */
export function ukkIndexMale(age: number, minutes: number, seconds: number, pulse: number, bmiValue: number): number {
  return 420 - (11.6 * minutes + 0.2 * seconds + 0.56 * pulse + 2.6 * bmiValue - 0.2 * age);
}

/**
 * Frauen, Kandidatenformel (KIT-Skript, hpcosmos), NICHT am Original geprüft (Übergabe v0.3, Abschnitt 6):
 * Index = 304 + 0,4 × Alter − (0,1417 × Zeit_in_Sekunden + 0,32 × Puls + 1,1 × BMI)
 * Rechnerisch gleich „Version B“, da 8,5 pro Minute 0,1417 pro Sekunde entspricht.
 */
export function ukkIndexFemaleCandidate(age: number, totalSeconds: number, pulse: number, bmiValue: number): number {
  return 304 + 0.4 * age - (0.1417 * totalSeconds + 0.32 * pulse + 1.1 * bmiValue);
}

/**
 * UKK-Fitness-Index, 20–65 Jahre. Männer immer; Frauen nur mit eingeschaltetem Schalter „Frauenindex“
 * (Standard: aus), dann als vorläufig markiert.
 */
export function ukkIndex(
  args: { sex: Sex; age: number; minutes: number; seconds: number; pulse: number; bmi: number },
  options: { womenIndex?: boolean } = {},
): UkkResult {
  const { sex, age, minutes, seconds, pulse } = args;
  if (age < UKK_MIN_AGE || age > UKK_MAX_AGE) {
    return { kind: 'nichtBerechnet', reason: `Der Fitness-Index gilt nur von ${UKK_MIN_AGE} bis ${UKK_MAX_AGE} Jahren.` };
  }
  if (sex === 'maennlich') {
    const value = ukkIndexMale(age, minutes, seconds, pulse, args.bmi);
    return { kind: 'index', value, rating: ukkRating(value), provisional: false };
  }
  if (sex === 'weiblich' && options.womenIndex) {
    const value = ukkIndexFemaleCandidate(age, minutes * 60 + seconds, pulse, args.bmi);
    return { kind: 'index', value, rating: ukkRating(value), provisional: true };
  }
  if (sex === 'weiblich') {
    return {
      kind: 'nichtBerechnet',
      reason: 'Die Formel für Frauen wird noch am Original geprüft. Gespeichert sind Gehzeit, Puls, BMI und Alter; der Index lässt sich später nachberechnen.',
    };
  }
  return { kind: 'nichtBerechnet', reason: 'Für diese Angabe zum Geschlecht gibt es keine geprüfte Formel. Gespeichert sind Gehzeit, Puls, BMI und Alter.' };
}

/** Bewertung: über 130 sehr gut, 111–130 gut, 90–110 mittel, 70–89 schwach, unter 70 sehr schwach. */
export function ukkRating(index: number): UkkRating {
  const i = Math.round(index);
  if (i > 130) return 'sehr gut';
  if (i >= 111) return 'gut';
  if (i >= 90) return 'mittel';
  if (i >= 70) return 'schwach';
  return 'sehr schwach';
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Ruhepuls-Baseline = Median von 5–7 Morgen. */
export const RESTING_PULSE_MIN_MORNINGS = 5;
export const RESTING_PULSE_MAX_MORNINGS = 7;

export function restingPulseBaseline(values: number[]): number | null {
  if (values.length < RESTING_PULSE_MIN_MORNINGS) return null;
  return median(values.slice(0, RESTING_PULSE_MAX_MORNINGS));
}

/** Einbeinstand: beste von 3 Zeiten zählt, höchstens 45 s, 60 s Pause zwischen den Versuchen (Produktentscheidung, v0.3). */
export const BALANCE_MAX_SECONDS = 45;
export const BALANCE_PAUSE_SECONDS = 60;

export function bestBalance(trials: (number | null)[]): number | null {
  const valid = trials.filter((t): t is number => t !== null && t >= 0).map((t) => Math.min(t, BALANCE_MAX_SECONDS));
  return valid.length ? Math.max(...valid) : null;
}

/** Vergleichswert Einbeinstand, Augen offen: nur Mittelwert des besten Versuchs, Springer 2007, ohne Streuung. */
export function balanceReference(age: number): { mean: number; group: string } | null {
  if (age >= 40 && age <= 49) return { mean: 41.9, group: '40–49 Jahren' };
  if (age >= 50 && age <= 59) return { mean: 41.2, group: '50–59 Jahren' };
  return null;
}

/** Knie-zur-Wand: Seitendifferenz ab ca. 1,5 cm als Hinweis, keine Bewertung. */
export const KNEE_WALL_SIDE_DIFF_CM = 1.5;

export function sideDifference(left: number | null, right: number | null): number | null {
  if (left === null || right === null) return null;
  return Math.abs(left - right);
}

/** Sit-to-Stand: Armeinsatz → Wert 0. */
export function sitToStandValue(count: number, armsUsed: boolean): number {
  return armsUsed ? 0 : count;
}

export function formatNum(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '–';
  return n.toLocaleString('de-AT', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
