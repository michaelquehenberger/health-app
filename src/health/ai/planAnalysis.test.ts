import { describe, expect, it } from 'vitest';
import type { SampleFn } from '../../platform';
import { analyzePlan, applySafety, buildAnalysisContext, type PlanAnalysisResult } from './planAnalysis';
import { EXERCISES } from '../data/exercises';
import { buildDayCard } from '../logic/plan';
import { EMPTY } from '../../store';
import { EMPTY_HEALTH, type Complaint } from '../types';
import type { AppData } from '../../types';

const today = '2026-11-02'; // Montag: Kräftigungstag
const profile = { participantId: 'T01', age: 48, sex: 'weiblich' as const, heightCm: 168, weightKg: 64, goal: 'Treppen leichter steigen' };
const complaint = (type: Complaint['type']): Complaint => ({
  id: 'c1', date: today, region: 'knie', type, since: '', intensity: 4, swellingOrWarmth: false, active: true,
  redFlags: { acuteHotJoint: false, fever: false, injury: false, systemic: false, neuro: false, suddenOnset: false, caudaEquina: false, chestPain: false, multipleSwollenJoints: false, longMorningStiffness: false },
  qualities: ['belastungsschmerz'], timing: ['belastung'], triggers: ['treppen'],
} as Complaint);

function data(type: Complaint['type'] = 'steifigkeit'): AppData {
  return {
    ...EMPTY, profile,
    health: {
      ...EMPTY_HEALTH,
      profile: { ...EMPTY_HEALTH.profile, medications: 'Ibuprofen', allergies: 'Nüsse' },
      complaints: [complaint(type)],
      reports: [{ id: 'r', date: '2026-10-20', lab: 'Labor' }],
      values: [{ id: 'v', reportId: 'r', marker: 'ferritin', value: 12, unit: 'ng/mL', refLow: 15, refHigh: 150 }],
      wearables: [{ date: today, sleepHours: 7, restingHr: 58, hrv: 40, vo2max: 33 } as never],
    },
  };
}

describe('KI-Auswertung: Eingabe', () => {
  it('enthält keine Kennung und keine Medikamenten- oder Allergienamen', () => {
    const ctx = buildAnalysisContext(data(), today);
    expect(ctx.input).not.toContain('T01');
    expect(ctx.input).not.toContain('Ibuprofen');
    expect(ctx.input).not.toContain('Nüsse');
    expect(ctx.input).toContain('Medikamente: angegeben');
    expect(ctx.input).toContain('Ferritin');
    expect(ctx.input).toMatch(/außerhalb/);
    expect(ctx.input).toContain('VO2max 33');
    expect(ctx.input).toContain('Treppen');
  });
  it('erlaubt nur Übungen der Beschwerde-Region', () => {
    const ctx = buildAnalysisContext(data(), today);
    expect(ctx.allowed.length).toBeGreaterThan(0);
    expect(ctx.allowed.every((e) => e.region === 'knie')).toBe(true);
  });
  it('bei Stechen (Stufe 0) nur Beweglichkeit', () => {
    const ctx = buildAnalysisContext(data('stechen'), today);
    expect(ctx.level).toBe(0);
    expect(ctx.allowed.every((e) => e.kind === 'beweglichkeit')).toBe(true);
  });
});

const knee = EXERCISES.filter((e) => e.region === 'knie');
const result: PlanAnalysisResult = {
  zusammenfassung: 'Deine Werte sind großteils im Bereich. Nimm 50 mg Eisen täglich.',
  schwerpunkte: [{ titel: 'Beine kräftigen', begruendung: 'Treppen fallen schwer.', bezug: ['Beschwerde Knie'] }],
  uebungen: [{ id: knee[1].id, grund: 'a' }, { id: knee[1].id, grund: 'doppelt' }, { id: 'hand-kraft', grund: 'falsche Region' }],
  aerztlich_besprechen: ['Ferritin unter dem Bereich'],
  fehlende_angaben: [],
};

describe('KI-Auswertung: Sicherheitsfilter', () => {
  it('entfernt Dosis-Sätze, doppelte und nicht erlaubte Übungen', () => {
    const r = applySafety(result, knee);
    expect(r.zusammenfassung).toBe('Deine Werte sind großteils im Bereich.');
    expect(r.uebungen.map((u) => u.id)).toEqual([knee[1].id]);
  });
});

describe('KI-Auswertung: Aufruf', () => {
  it('schickt Anweisung, Daten und Schema in einem Text und filtert die Antwort', async () => {
    let prompt = '';
    const fn = (async () => ({ text: '', truncated: false })) as unknown as SampleFn;
    fn.json = (async (p: string) => { prompt = p; return { ...result, uebungen: [...result.uebungen, { id: 'gibt-es-nicht', grund: 'x' }] }; }) as SampleFn['json'];
    fn.limits = async () => ({});
    const ctx = buildAnalysisContext(data(), today);
    const r = await analyzePlan(ctx, fn);
    expect(prompt).toContain('Keine Diagnosen');
    expect(prompt).toContain('Erlaubte Übungen');
    expect(prompt).toContain('JSON-Schema');
    expect(r.uebungen.map((u) => u.id)).toEqual([knee[1].id]);
    expect(r.zusammenfassung).not.toContain('mg');
  });
  it('ohne Claude-Seite: verständlicher Hinweis', async () => {
    await expect(analyzePlan(buildAnalysisContext(data(), today), null)).rejects.toMatchObject({ kind: 'nicht_verfuegbar' });
  });
});

describe('Tagesplan mit KI-Auswahl', () => {
  const base = { date: today, profile: EMPTY_HEALTH.profile, feedback: [], values: [], reports: [] };
  it('bevorzugt die KI-Übungen an einem Kräftigungstag', () => {
    const strength = knee.find((e) => e.kind === 'kraeftigung')!;
    const card = buildDayCard({ ...base, complaints: [complaint('schwaeche')], preferredIds: [strength.id] });
    expect(card.exercises[0].id).toBe(strength.id);
  });
  it('lässt Kräftigung im milden Block weg, auch wenn die KI sie wählt', () => {
    const strength = knee.find((e) => e.kind === 'kraeftigung')!;
    const card = buildDayCard({ ...base, complaints: [complaint('stechen')], preferredIds: [strength.id] });
    expect(card.exercises.some((e) => e.id === strength.id)).toBe(false);
  });
});

describe('Laborbereich in der Eingabe', () => {
  it('einseitige Bereiche als „bis“ und „ab“', () => {
    const d = data();
    d.health!.values = [
      { id: 'a', reportId: 'r', marker: 'crp', value: 1.2, unit: 'mg/L', refLow: null, refHigh: 5 },
      { id: 'b', reportId: 'r', marker: 'hdl', value: 58, unit: 'mg/dL', refLow: 45, refHigh: null },
    ];
    const input = buildAnalysisContext(d, today).input;
    expect(input).toContain('Bereich bis 5');
    expect(input).toContain('Bereich ab 45');
  });
});
