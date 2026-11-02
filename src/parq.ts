// Anamnese (PAR-Q+, deutsche Fassung 01.07.2024): Ablauflogik laut Übergabe v0.2, Abschnitt 5.1.
// Die Texte liegen unverändert in parq-de.json; hier steht nur die Logik.
import PARQ from './parq-de.json';
import { addMonths } from './store';

export { PARQ };
export const PARQ_VERSION = PARQ.version;
export const ANAMNESIS_VALID_MONTHS = 12;

export type Answer = 'ja' | 'nein' | null;

export type AnamnesisResult = 'freigegeben' | 'nicht_freigegeben' | 'freigegeben_nach_abklaerung';

export interface Anamnesis {
  id: string;
  participantId: string;
  formVersion: string; // „DE 01.07.2024“
  date: string; // Ausfülldatum
  validUntil: string; // Ausfülldatum + 12 Monate
  answersA: Record<string, Answer>; // "1".."7"
  textsA: Record<string, string>; // Freitexte zu 4, 5, 6
  answersB: Record<string, Answer>; // "1".."10" und "1a".."10c"
  medicationText: string; // Freitext am Ende von Teil B (nur bei Frage 10 = JA)
  /** Einverständnis per Häkchen: Datum, genauer Zeitstempel und Fassung des Einverständnistexts werden protokolliert. */
  consent: { given: boolean; date: string | null; at?: string; textVersion?: string };
  result: AnamnesisResult | null;
  clearance: { date: string; source: 'eparmedx' | 'fachperson' } | null;
  /** Ersetzt durch eine neuere Anamnese oder wegen Änderung des Gesundheitszustands beendet */
  endedAt: string | null;
}

export function newAnamnesis(id: string, participantId: string, date: string): Anamnesis {
  return {
    id, participantId, formVersion: PARQ_VERSION, date, validUntil: addMonths(date, ANAMNESIS_VALID_MONTHS),
    answersA: {}, textsA: {}, answersB: {}, medicationText: '', consent: { given: false, date: null },
    result: null, clearance: null, endedAt: null,
  };
}

export type Stage =
  | { step: 'teilA' } // noch nicht alle 7 beantwortet
  | { step: 'teilB' } // mindestens ein JA in Teil A, Teil B unvollständig
  | { step: 'einverstaendnis'; path: 'A' | 'B' } // freigabefähig, Einverständnis fehlt
  | { step: 'nicht_freigegeben' } // mindestens eine Unterfrage JA
  | { step: 'fertig' };

const A_IDS = PARQ.partA.questions.map((q) => q.id);

export function partAComplete(a: Anamnesis): boolean {
  return A_IDS.every((id) => a.answersA[id] === 'ja' || a.answersA[id] === 'nein');
}

export function partAAnyYes(a: Anamnesis): boolean {
  return A_IDS.some((id) => a.answersA[id] === 'ja');
}

/** Teil B vollständig: jede Hauptfrage beantwortet, bei JA alle Unterfragen beantwortet. */
export function partBComplete(a: Anamnesis): boolean {
  return PARQ.partB.questions.every((q) => {
    const main = a.answersB[q.id];
    if (main === 'nein') return true;
    if (main !== 'ja') return false;
    return q.sub.every((s) => a.answersB[s.id] === 'ja' || a.answersB[s.id] === 'nein');
  });
}

/** Mindestens eine ergänzende Unterfrage mit JA (nur Unterfragen unter einer Hauptfrage mit JA zählen). */
export function partBAnySubYes(a: Anamnesis): boolean {
  return PARQ.partB.questions.some((q) => a.answersB[q.id] === 'ja' && q.sub.some((s) => a.answersB[s.id] === 'ja'));
}

export function stage(a: Anamnesis): Stage {
  if (!partAComplete(a)) return { step: 'teilA' };
  if (!partAAnyYes(a)) return a.consent.given ? { step: 'fertig' } : { step: 'einverstaendnis', path: 'A' };
  if (!partBComplete(a)) return { step: 'teilB' };
  if (partBAnySubYes(a) && !a.clearance) return { step: 'nicht_freigegeben' };
  return a.consent.given ? { step: 'fertig' } : { step: 'einverstaendnis', path: 'B' };
}

/** Ergebnis, sobald die Anamnese abgeschlossen ist (sonst null). */
export function computeResult(a: Anamnesis): AnamnesisResult | null {
  const s = stage(a);
  if (s.step === 'nicht_freigegeben') return 'nicht_freigegeben';
  if (s.step !== 'fertig') return null;
  return a.clearance ? 'freigegeben_nach_abklaerung' : 'freigegeben';
}

/** Tests sind nur mit gültiger Freigabe (nicht abgelaufen, nicht beendet) möglich. */
export function anamnesisValid(a: Anamnesis | null | undefined, today: string): boolean {
  if (!a || a.endedAt) return false;
  const r = computeResult(a);
  if (r !== 'freigegeben' && r !== 'freigegeben_nach_abklaerung') return false;
  return today < a.validUntil;
}

/** Kurzer Hinweis, wie die App ausgewertet hat (eigener App-Text, nicht Teil des PAR-Q+). */
export function evaluationNote(a: Anamnesis): string {
  const r = computeResult(a);
  if (!partAAnyYes(a)) {
    return 'Auswertung: Alle sieben allgemeinen Fragen wurden mit NEIN beantwortet. Teil B entfällt. Nach dem Einverständnis sind die Tests freigegeben.';
  }
  if (r === 'nicht_freigegeben') {
    return 'Auswertung: Mindestens eine allgemeine Frage wurde mit JA beantwortet und mindestens eine ergänzende Frage in Teil B ebenfalls. Die Tests bleiben gesperrt, bis eine Abklärung über ePARmed-X+ oder eine Fachperson erfolgt ist.';
  }
  if (r === 'freigegeben_nach_abklaerung') {
    return 'Auswertung: In Teil B wurde mindestens eine ergänzende Frage mit JA beantwortet. Die Freigabe beruht auf der bestätigten Abklärung.';
  }
  return 'Auswertung: Mindestens eine allgemeine Frage wurde mit JA beantwortet, alle ergänzenden Fragen in Teil B mit NEIN. Nach dem Einverständnis sind die Tests freigegeben.';
}

export function latestAnamnesis(list: Anamnesis[]): Anamnesis | null {
  return [...list].sort((x, y) => x.date.localeCompare(y.date)).at(-1) ?? null;
}
