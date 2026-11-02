// Bewertung der Blutwerte. Es gilt immer der Referenzbereich des Labors im Befund.
// Die Spannen für „gelb“ und „rot“ legt eine Fachperson fest; bis dahin gibt es nur
// „im Bereich“ und „außerhalb“.
import type { LabValue } from '../types';

export interface Marker {
  key: string;
  label: string;
  stands: string;
  hint: string;
  defaultUnit: string;
  /** Hormone: nur anzeigen, nicht deuten */
  displayOnly?: boolean;
}

export const MARKERS: Marker[] = [
  { key: 'haemoglobin', label: 'Hämoglobin (Blutbild)', stands: 'Blutzellen', hint: 'ärztlich besprechen', defaultUnit: 'g/dL' },
  { key: 'leukozyten', label: 'Leukozyten (Blutbild)', stands: 'Blutzellen', hint: 'ärztlich besprechen', defaultUnit: 'G/L' },
  { key: 'ferritin', label: 'Ferritin', stands: 'Eisenspeicher', hint: 'bei niedrigem Wert Ursache ärztlich klären', defaultUnit: 'ng/mL' },
  { key: 'crp', label: 'CRP', stands: 'unspezifischer Entzündungsmarker', hint: 'mit Gelenkschwellung oder Fieber: rote Flagge', defaultUnit: 'mg/L' },
  { key: 'glukose', label: 'Glukose nüchtern', stands: 'Blutzucker kurzfristig', hint: 'ärztlich; Ernährung nur allgemein', defaultUnit: 'mg/dL' },
  { key: 'hba1c', label: 'HbA1c', stands: 'Blutzucker langfristig', hint: 'ärztlich; Ernährung nur allgemein', defaultUnit: '%' },
  { key: 'cholesterin', label: 'Cholesterin gesamt', stands: 'Fettstoffwechsel', hint: 'ärztlich; Lebensstil-Information', defaultUnit: 'mg/dL' },
  { key: 'hdl', label: 'HDL', stands: 'Fettstoffwechsel', hint: 'ärztlich; Lebensstil-Information', defaultUnit: 'mg/dL' },
  { key: 'ldl', label: 'LDL', stands: 'Fettstoffwechsel', hint: 'ärztlich; Lebensstil-Information', defaultUnit: 'mg/dL' },
  { key: 'triglyceride', label: 'Triglyceride', stands: 'Fettstoffwechsel', hint: 'ärztlich; Lebensstil-Information', defaultUnit: 'mg/dL' },
  { key: 'got', label: 'GOT', stands: 'Leberwert', hint: 'vor jedem Supplement-Hinweis beachten', defaultUnit: 'U/L' },
  { key: 'gpt', label: 'GPT', stands: 'Leberwert', hint: 'vor jedem Supplement-Hinweis beachten', defaultUnit: 'U/L' },
  { key: 'ggt', label: 'GGT', stands: 'Leberwert', hint: 'vor jedem Supplement-Hinweis beachten', defaultUnit: 'U/L' },
  { key: 'kreatinin', label: 'Kreatinin', stands: 'Nierenfunktion', hint: 'keine Trinkmengen- oder Supplement-Vorschläge', defaultUnit: 'mg/dL' },
  { key: 'harnstoff', label: 'Harnstoff', stands: 'Nierenfunktion', hint: 'keine Trinkmengen- oder Supplement-Vorschläge', defaultUnit: 'mg/dL' },
  { key: 'harnsaeure', label: 'Harnsäure', stands: 'Stoffwechselprodukt', hint: 'erhöht mit heißem Gelenk: rote Flagge (Gicht möglich)', defaultUnit: 'mg/dL' },
  { key: 'tsh', label: 'TSH', stands: 'Schilddrüse', hint: 'ärztlich; Schilddrüsenstörungen können Muskel- und Gelenkbeschwerden mitverursachen', defaultUnit: 'mU/L' },
  { key: 'vitd', label: 'Vitamin D (25-OH)', stands: 'Versorgung', hint: 'niedrig: ärztlich, Supplement nur nach Rücksprache', defaultUnit: 'ng/mL' },
  { key: 'b12', label: 'Vitamin B12', stands: 'Blutbildung, Nerven', hint: 'niedrig: ärztlich klären', defaultUnit: 'pg/mL' },
  { key: 'folsaeure', label: 'Folsäure', stands: 'Blutbildung, Nerven', hint: 'niedrig: ärztlich klären', defaultUnit: 'ng/mL' },
  { key: 'magnesium', label: 'Magnesium', stands: 'Mineralstoff', hint: 'ärztlich besprechen', defaultUnit: 'mmol/L' },
  { key: 'fsh', label: 'FSH', stands: 'Hormone', hint: 'nur anzeigen, nicht deuten; Besprechung bei der Gynäkologie', defaultUnit: 'U/L', displayOnly: true },
  { key: 'lh', label: 'LH', stands: 'Hormone', hint: 'nur anzeigen, nicht deuten; Besprechung bei der Gynäkologie', defaultUnit: 'U/L', displayOnly: true },
  { key: 'oestradiol', label: 'Östradiol', stands: 'Hormone', hint: 'nur anzeigen, nicht deuten; Besprechung bei der Gynäkologie', defaultUnit: 'pg/mL', displayOnly: true },
];

export function marker(key: string): Marker {
  return MARKERS.find((m) => m.key === key) ?? { key, label: key, stands: '', hint: 'ärztlich besprechen', defaultUnit: '' };
}

export type ValueStatus = 'imBereich' | 'ausserhalb' | 'nurAnzeige' | 'unvollstaendig';

export interface ValueEvaluation {
  status: ValueStatus;
  direction?: 'niedrig' | 'hoch';
  message: string;
}

export function evaluateValue(v: LabValue): ValueEvaluation {
  const m = marker(v.marker);
  if (m.displayOnly) return { status: 'nurAnzeige', message: m.hint };
  if (v.refLow === null && v.refHigh === null) {
    return { status: 'unvollstaendig', message: 'Referenzbereich fehlt. Bitte aus dem Befund ergänzen; die App schätzt nicht.' };
  }
  if (v.refLow !== null && v.value < v.refLow) return { status: 'ausserhalb', direction: 'niedrig', message: m.hint };
  if (v.refHigh !== null && v.value > v.refHigh) return { status: 'ausserhalb', direction: 'hoch', message: m.hint };
  return { status: 'imBereich', message: `Misst: ${m.stands}.` };
}

/** Plausibilitätsprüfung vor dem Speichern. Gibt Fehlermeldungen zurück (leer = ok). */
export function validateValue(v: Omit<LabValue, 'id' | 'reportId'>): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(v.value)) errors.push('Wert fehlt oder ist keine Zahl.');
  if (v.value < 0) errors.push('Wert darf nicht negativ sein.');
  if (!v.unit.trim()) errors.push('Einheit fehlt.');
  if (v.refLow === null && v.refHigh === null && !marker(v.marker).displayOnly) {
    errors.push('Referenzbereich fehlt. Er steht im Befund neben dem Wert.');
  }
  if (v.refLow !== null && v.refHigh !== null && v.refLow > v.refHigh) errors.push('Untere Grenze ist größer als die obere.');
  return errors;
}

/** Kombinationsregel 3: Nierenwerte außerhalb → keine Trinkmenge und keine Supplements. */
export function kidneyValuesOutside(latest: Map<string, LabValue>): boolean {
  return ['kreatinin', 'harnstoff'].some((k) => {
    const v = latest.get(k);
    return v ? evaluateValue(v).status === 'ausserhalb' : false;
  });
}
