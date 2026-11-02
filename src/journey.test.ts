import { describe, expect, it } from 'vitest';
import { computeJourney } from './journey';
import { EMPTY } from './store';
import { EMPTY_HEALTH } from './health/types';
import { newAnamnesis, PARQ } from './parq';
import type { AppData, TestRecord } from './types';
import { TESTS } from './tests';

const today = '2026-11-02';
const profile = { participantId: 'T01', age: 48, sex: 'weiblich' as const, heightCm: 168, weightKg: 64, goal: '' };
function released() {
  const a = newAnamnesis('a', 'T01', today);
  a.answersA = Object.fromEntries(PARQ.partA.questions.map((q) => [q.id, 'nein' as const]));
  a.consent = { given: true, date: today };
  return a;
}
const rec = (testId: TestRecord['testId'], metric: string, date = today): TestRecord => ({
  id: Math.random().toString(36), testId, timepoint: 'baseline', date, time: '07:00', method: '', quality: 'B', comment: '', aborted: null, inputs: {},
  measurements: [{ metric, unit: '', value: 10 }],
});
function allTests(pulseMornings: number): TestRecord[] {
  const m: Record<string, string[]> = { T2: ['gehzeit'], T3: ['wiederholungen_30s'], T4: ['bester_versuch_links', 'bester_versuch_rechts'], T5: ['abstand_links', 'abstand_rechts'], T7: ['abstand_links', 'abstand_rechts'], T8: ['wiederholungen'] };
  const out = TESTS.filter((t) => t.id !== 'T1').map((t) => { const r = rec(t.id, m[t.id][0]); r.measurements = m[t.id].map((x) => ({ metric: x, unit: '', value: 10 })); return r; });
  for (let i = 0; i < pulseMornings; i++) out.push(rec('T1', 'ruhepuls', today));
  return out;
}

describe('Gesamtablauf', () => {
  it('nach dem Profil: Anamnese ist dran, Tests und Gesundheit gesperrt', () => {
    const j = computeJourney({ ...EMPTY, profile }, today);
    expect(j.current?.id).toBe('anamnese');
    expect(j.steps.find((s) => s.id === 'testmappe')?.status).toBe('gesperrt');
    expect(j.steps.find((s) => s.id === 'gesundheit')?.status).toBe('gesperrt');
  });
  it('nach der Anamnese: Testmappe ist dran', () => {
    const j = computeJourney({ ...EMPTY, profile, anamneses: [released()] }, today);
    expect(j.current?.id).toBe('testmappe');
  });
  it('Testtag erledigt, Ruhepuls wartet bis morgen: Gesundheitsdaten sind dran', () => {
    const data: AppData = { ...EMPTY, profile, anamneses: [released()], records: allTests(1) };
    const j = computeJourney(data, today);
    expect(j.steps.find((s) => s.id === 'testmappe')?.status).toBe('wartet');
    expect(j.current?.id).toBe('gesundheit');
  });
  it('mit Einwilligung und Blutwerten: Auswertung wird frei', () => {
    const health = { ...EMPTY_HEALTH, consent: { acceptedAt: today, textVersion: 'x' }, values: [{ id: 'v', reportId: 'r', marker: 'crp', value: 1, unit: 'mg/L', refLow: null, refHigh: 5 }] };
    const data: AppData = { ...EMPTY, profile, anamneses: [released()], records: allTests(1), health };
    const j = computeJourney(data, today);
    expect(j.steps.find((s) => s.id === 'gesundheit')?.status).toBe('erledigt');
    expect(j.current?.id).toBe('auswertung');
  });
});
