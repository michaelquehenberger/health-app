import { describe, expect, it } from 'vitest';
import type { Complaint, Feedback, LabReport, LabValue, HealthProfile, RedFlagAnswers } from '../types';
import { evaluateValue, validateValue } from './labs';
import { blocksPlan, checkRedFlags } from './redFlags';
import { buildDayCard, computeProgression, judgeFeedback, START_LEVEL } from './plan';

const noFlags: RedFlagAnswers = {
  acuteHotJoint: false, fever: false, injury: false, systemic: false, neuro: false,
  suddenOnset: false, caudaEquina: false, chestPain: false, multipleSwollenJoints: false, longMorningStiffness: false,
};

const complaint = (over: Partial<Complaint> = {}): Complaint => ({
  id: 'c1', date: '2026-11-01', region: 'knie', type: 'steifigkeit', since: '3 Monate',
  intensity: 4, swellingOrWarmth: false, redFlags: { ...noFlags }, active: true, ...over,
});

const profile: HealthProfile = {
  age: 48, sex: 'weiblich', diet: 'Mischkost', allergies: '', medications: '',
  fluidRestriction: false, experience: 'mittel', minutesPerDay: 10, rhythm: 'taeglich',
};

const report: LabReport = { id: 'r1', date: '2026-10-20', lab: 'Testlabor' };
const val = (marker: string, value: number, refLow: number | null, refHigh: number | null): LabValue => ({
  id: marker, reportId: 'r1', marker, value, unit: 'x', refLow, refHigh,
});

const fb = (date: string, before: number, after: number, morning: number | null = null, swelling = false): Feedback => ({
  date, painBefore: before, painAfter: after, painMorning: morning, swelling, done: [],
});

describe('Blutwerte', () => {
  it('bewertet gegen den Laborbereich', () => {
    expect(evaluateValue(val('ferritin', 50, 15, 150)).status).toBe('imBereich');
    expect(evaluateValue(val('ferritin', 10, 15, 150))).toMatchObject({ status: 'ausserhalb', direction: 'niedrig' });
    expect(evaluateValue(val('crp', 12, null, 5))).toMatchObject({ status: 'ausserhalb', direction: 'hoch' });
  });
  it('schätzt nicht, wenn der Referenzbereich fehlt', () => {
    expect(evaluateValue(val('tsh', 2, null, null)).status).toBe('unvollstaendig');
    expect(validateValue({ marker: 'tsh', value: 2, unit: 'mU/L', refLow: null, refHigh: null })).not.toHaveLength(0);
  });
  it('deutet Hormone nicht', () => {
    expect(evaluateValue(val('fsh', 80, 1, 10)).status).toBe('nurAnzeige');
  });
});

describe('Rote Flaggen', () => {
  it('ohne Angaben kein Block', () => {
    expect(blocksPlan(checkRedFlags([complaint()], [], []))).toBe(false);
  });
  it('heißes Gelenk blockiert den Plan', () => {
    const flags = checkRedFlags([complaint({ redFlags: { ...noFlags, acuteHotJoint: true } })], [], []);
    expect(flags[0].level).toBe('notfall');
    expect(blocksPlan(flags)).toBe(true);
  });
  it('Cauda-Symptome zählen nur beim Rücken', () => {
    const r = { ...noFlags, caudaEquina: true };
    expect(blocksPlan(checkRedFlags([complaint({ region: 'ruecken', redFlags: r })], [], []))).toBe(true);
  });
  it('Morgensteifigkeit ist nur ein Hinweis', () => {
    const flags = checkRedFlags([complaint({ redFlags: { ...noFlags, longMorningStiffness: true } })], [], []);
    expect(flags).toHaveLength(1);
    expect(blocksPlan(flags)).toBe(false);
  });
  it('CRP außerhalb plus Schwellung blockiert', () => {
    const flags = checkRedFlags([complaint({ swellingOrWarmth: true })], [val('crp', 12, null, 5)], [report]);
    expect(blocksPlan(flags)).toBe(true);
  });
  it('CRP außerhalb ohne Schwellung blockiert nicht', () => {
    expect(blocksPlan(checkRedFlags([complaint()], [val('crp', 12, null, 5)], [report]))).toBe(false);
  });
  it('Harnsäure erhöht plus heißes Gelenk blockiert', () => {
    const flags = checkRedFlags([complaint({ swellingOrWarmth: true })], [val('harnsaeure', 9, 2.4, 5.7)], [report]);
    expect(flags.some((f) => f.text.includes('Harnsäure'))).toBe(true);
  });
});

describe('Schmerzregel', () => {
  it('über 5 nach der Einheit ist überschritten', () => {
    expect(judgeFeedback(fb('2026-11-02', 3, 6))).toBe('ueberschritten');
  });
  it('Morgen über Ausgangsniveau ist überschritten', () => {
    expect(judgeFeedback(fb('2026-11-02', 3, 4, 5))).toBe('ueberschritten');
  });
  it('innerhalb der Grenze ist ok', () => {
    expect(judgeFeedback(fb('2026-11-02', 3, 5, 3))).toBe('ok');
  });
  it('senkt die Stufe nach Überschreitung und empfiehlt nach zwei Mal Abklärung', () => {
    const p1 = computeProgression([fb('2026-11-02', 3, 7)]);
    expect(p1.level).toBe(START_LEVEL - 1);
    expect(p1.recommendDoctor).toBe(false);
    const p2 = computeProgression([fb('2026-11-02', 3, 7), fb('2026-11-03', 3, 7)]);
    expect(p2.recommendDoctor).toBe(true);
  });
  it('steigert nach drei regelkonformen Einheiten', () => {
    const p = computeProgression([fb('2026-11-02', 2, 3), fb('2026-11-03', 2, 3), fb('2026-11-04', 2, 3)]);
    expect(p.level).toBe(START_LEVEL + 1);
  });
});

describe('Tageskarte', () => {
  const base = { profile, feedback: [], values: [], reports: [] };
  it('Montag: Beweglichkeit plus Kräftigung, nur aus der Region', () => {
    const card = buildDayCard({ ...base, date: '2026-11-02', complaints: [complaint({ type: 'schwaeche' })] });
    expect(card.exercises.length).toBeGreaterThanOrEqual(3);
    expect(card.exercises.length).toBeLessThanOrEqual(4);
    expect(card.exercises.every((e) => e.region === 'knie')).toBe(true);
    expect(card.exercises.some((e) => e.kind === 'kraeftigung')).toBe(true);
  });
  it('Sonntag ist Ruhetag', () => {
    const card = buildDayCard({ ...base, date: '2026-11-01', complaints: [complaint()] });
    expect(card.exercises).toHaveLength(0);
    expect(card.endurance).toContain('Ruhetag');
  });
  it('Stechen startet mit dem mildesten Block', () => {
    const card = buildDayCard({ ...base, date: '2026-11-02', complaints: [complaint({ type: 'stechen' })] });
    expect(card.exercises.every((e) => e.kind === 'beweglichkeit')).toBe(true);
  });
  it('keine Trinkmenge bei Nierenwerten außerhalb', () => {
    const card = buildDayCard({ ...base, date: '2026-11-02', complaints: [complaint()], values: [val('kreatinin', 2, 0.5, 1.0)], reports: [report] });
    expect('blocked' in card.drink).toBe(true);
  });
  it('keine Supplement-Hinweise bei Medikamenten', () => {
    const card = buildDayCard({ ...base, profile: { ...profile, medications: 'L-Thyroxin' }, date: '2026-11-02', complaints: [complaint()] });
    expect(card.supplements.blocked).toContain('Medikamente im Profil');
    expect(card.supplements.cards).toHaveLength(0);
  });
});
