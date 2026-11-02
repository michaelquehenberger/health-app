// Zusammenfassung je Test und Messzeitpunkt (für Testmappe, Ergebnis und Verlauf).
import { RESTING_PULSE_MIN_MORNINGS, restingPulseBaseline } from './calc';
import type { TestId, TestRecord, Timepoint } from './types';
import { TESTS } from './tests';

export interface Summary {
  done: boolean;
  /** Kurzer Text für Testmappe und Verlauf */
  text: string;
  /** Hauptwert für den Verlauf */
  value: number | null;
  unit: string;
  records: TestRecord[];
}

export function recordsFor(records: TestRecord[], testId: TestId, tp: Timepoint): TestRecord[] {
  return records
    .filter((r) => r.testId === testId && r.timepoint === tp)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function m(r: TestRecord, metric: string): number | null {
  return r.measurements.find((x) => x.metric === metric)?.value ?? null;
}

const fmt = (n: number | null, d = 1) =>
  n === null ? '–' : n.toLocaleString('de-AT', { maximumFractionDigits: d });

export function summarize(records: TestRecord[], testId: TestId, tp: Timepoint): Summary {
  const all = recordsFor(records, testId, tp);
  const valid = all.filter((r) => !r.aborted);
  const empty: Summary = { done: false, text: all.length ? 'abgebrochen' : 'offen', value: null, unit: '', records: all };

  if (testId === 'T1') {
    const values = valid.map((r) => m(r, 'ruhepuls')).filter((v): v is number => v !== null);
    if (values.length === 0) return empty;
    const base = restingPulseBaseline(values);
    if (base === null) {
      return { done: false, text: `${values.length} von ${RESTING_PULSE_MIN_MORNINGS} Morgen`, value: null, unit: 'bpm', records: all };
    }
    return { done: true, text: `Median ${fmt(base)} bpm (${Math.min(values.length, 7)} Morgen)`, value: base, unit: 'bpm', records: all };
  }

  const last = valid.at(-1);
  if (!last) return empty;

  switch (testId) {
    case 'T2': {
      const idx = m(last, 'fitness_index');
      const sec = m(last, 'gehzeit');
      const time = sec === null ? '–' : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} min`;
      return idx !== null
        ? { done: true, text: `Index ${fmt(idx, 0)} · ${time}`, value: idx, unit: 'Index', records: all }
        : { done: true, text: `Gehzeit ${time}`, value: sec, unit: 's', records: all };
    }
    case 'T3': {
      const v = m(last, 'wiederholungen_30s');
      return { done: true, text: `${fmt(v, 0)} Wiederholungen`, value: v, unit: 'Wdh.', records: all };
    }
    case 'T4': {
      const l = m(last, 'bester_versuch_links');
      const r = m(last, 'bester_versuch_rechts');
      return { done: true, text: `L ${fmt(l)} s · R ${fmt(r)} s`, value: l !== null && r !== null ? Math.min(l, r) : l ?? r, unit: 's', records: all };
    }
    case 'T5':
    case 'T7': {
      const l = m(last, 'abstand_links');
      const r = m(last, 'abstand_rechts');
      return { done: true, text: `L ${fmt(l)} cm · R ${fmt(r)} cm`, value: null, unit: 'cm', records: all };
    }
    case 'T8': {
      const v = m(last, 'wiederholungen');
      return { done: true, text: `${fmt(v, 0)} Wdh. (${last.inputs.variante === 'knie' ? 'Knie' : 'Zehen'})`, value: v, unit: 'Wdh.', records: all };
    }
  }
}

/**
 * Vorschlag für den Messzeitpunkt (nur Voreinstellung, in der Testmappe jederzeit änderbar):
 * Tag 0–19 Baseline · Tag 20–59 „Tag 30“, sobald dort alle Tests erledigt sind „Tag 90“ · ab Tag 60 „Tag 90“.
 */
export function suggestTimepoint(records: TestRecord[], daysSinceBaseline: number | null): Timepoint {
  if (records.length === 0 || daysSinceBaseline === null || daysSinceBaseline < 20) return 'baseline';
  if (daysSinceBaseline < 60) return allDone(records, 'tag30') ? 'tag90' : 'tag30';
  return 'tag90';
}

export function allDone(records: TestRecord[], tp: Timepoint): boolean {
  return TESTS.every((t) => summarize(records, t.id, tp).done);
}

export function baselineDate(records: TestRecord[]): string | null {
  const b = records.filter((r) => r.timepoint === 'baseline').map((r) => r.date).sort();
  return b[0] ?? null;
}
