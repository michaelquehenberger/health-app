import { describe, expect, it } from 'vitest';
import { suggestTimepoint, summarize } from './results';
import { TESTS } from './tests';
import type { TestRecord, Timepoint } from './types';

const rec = (testId: TestRecord['testId'], tp: Timepoint, metric: string, value: number, date = '2026-11-02'): TestRecord => ({
  id: Math.random().toString(36), testId, timepoint: tp, date, time: '07:00', method: '', quality: 'B', comment: '', aborted: null,
  inputs: {}, measurements: [{ metric, unit: '', value }],
});

/** Für jeden Test eine gültige Messung (Ruhepuls: 5 Morgen). */
function fullSet(tp: Timepoint): TestRecord[] {
  const metric: Record<string, string[]> = {
    T1: ['ruhepuls'], T2: ['gehzeit'], T3: ['wiederholungen_30s'], T4: ['bester_versuch_links', 'bester_versuch_rechts'],
    T5: ['abstand_links', 'abstand_rechts'], T7: ['abstand_links', 'abstand_rechts'], T8: ['wiederholungen'],
  };
  return TESTS.flatMap((t) => {
    const n = t.id === 'T1' ? 5 : 1;
    return Array.from({ length: n }, () => {
      const r = rec(t.id, tp, metric[t.id][0], 60);
      r.measurements = metric[t.id].map((m) => ({ metric: m, unit: '', value: 10 }));
      return r;
    });
  });
}

describe('Ruhepuls-Zusammenfassung', () => {
  it('zählt Morgen bis zur Baseline', () => {
    const r = [rec('T1', 'baseline', 'ruhepuls', 60), rec('T1', 'baseline', 'ruhepuls', 62)];
    expect(summarize(r, 'T1', 'baseline')).toMatchObject({ done: false, text: '2 von 5 Morgen' });
  });
  it('abgebrochene Messungen zählen nicht', () => {
    const r = rec('T3', 'baseline', 'wiederholungen_30s', 12);
    r.aborted = 'Schwindel';
    expect(summarize([r], 'T3', 'baseline').done).toBe(false);
  });
});

describe('Vorschlag Messzeitpunkt', () => {
  const base = fullSet('baseline');
  it('ohne Messungen: Baseline', () => expect(suggestTimepoint([], null)).toBe('baseline'));
  it('Tag 0–19: Baseline', () => expect(suggestTimepoint(base, 19)).toBe('baseline'));
  it('Tag 20–59: Tag 30, solange nicht alles erledigt', () => expect(suggestTimepoint(base, 25)).toBe('tag30'));
  it('Tag 20–59 mit erledigtem Tag 30: Tag 90', () => expect(suggestTimepoint([...base, ...fullSet('tag30')], 40)).toBe('tag90'));
  it('ab Tag 60: Tag 90', () => expect(suggestTimepoint(base, 60)).toBe('tag90'));
});
