import { describe, expect, it } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
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
  it('schickt Text mit Schema und liest die Antwort', async () => {
    let body: Record<string, unknown> = {};
    const fetchFn = (async (_u: string, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        id: 'm', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', stop_sequence: null,
        content: [{ type: 'text', text: JSON.stringify(result) }], usage: { input_tokens: 1, output_tokens: 1 },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    const client = new Anthropic({ apiKey: 'x', dangerouslyAllowBrowser: true, fetch: fetchFn, maxRetries: 0 });
    const ctx = buildAnalysisContext(data(), today);
    const r = await analyzePlan(ctx, 'x', client);
    expect(body.model).toBe('claude-opus-5-5');
    expect((body.output_config as { format: { type: string } }).format.type).toBe('json_schema');
    expect(r.uebungen).toHaveLength(1);
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
