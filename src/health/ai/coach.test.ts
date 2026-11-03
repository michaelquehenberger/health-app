import { describe, expect, it } from 'vitest';
import { buildCoachContext, cleanReply, coachReply, dailyImpulse } from './coach';
import { EMPTY } from '../../store';
import { EMPTY_HEALTH, type Complaint } from '../types';
import type { AppData } from '../../types';
import type { SampleFn } from '../../platform';

const today = '2026-11-03';
const NO = { acuteHotJoint: false, fever: false, injury: false, systemic: false, neuro: false, suddenOnset: false, caudaEquina: false, chestPain: false, multipleSwollenJoints: false, longMorningStiffness: false };
const data = (flags = NO): AppData => ({
  ...EMPTY,
  profile: { participantId: 'T01', age: 48, sex: 'weiblich', heightCm: 168, weightKg: 64, goal: 'fitter werden' },
  health: {
    ...EMPTY_HEALTH,
    profile: { ...EMPTY_HEALTH.profile, medications: 'Ibuprofen' },
    complaints: [{ id: 'c', date: today, region: 'knie', side: 'rechts', type: 'steifigkeit', since: '', intensity: 4, swellingOrWarmth: false, redFlags: flags, active: true, qualities: ['steifigkeit'] } as Complaint],
  },
});

function fake(answer: unknown, seen: { input?: unknown } = {}): SampleFn {
  const fn = (async (input: unknown, opts?: { onText?: (u: { text: string }) => void }) => {
    seen.input = input;
    opts?.onText?.({ text: String(answer) });
    return { text: String(answer), truncated: false };
  }) as unknown as SampleFn;
  fn.json = (async (input: string) => { seen.input = input; return answer; }) as SampleFn['json'];
  fn.limits = async () => ({});
  return fn;
}

describe('Coach', () => {
  it('Kontext ohne Kennung und Medikamentennamen, mit Tagesplan', () => {
    const c = buildCoachContext(data(), today);
    expect(c).not.toContain('T01');
    expect(c).not.toContain('Ibuprofen');
    expect(c).toContain('Medikamente angegeben');
    expect(c).toContain('Knie');
    expect(c).toContain('Tagesplan heute');
  });
  it('bei roter Flagge steht der Hinweis im Kontext', () => {
    expect(buildCoachContext(data({ ...NO, chestPain: true }), today)).toContain('ärztliche Abklärung');
  });
  it('Antworten verlieren Dosis-Sätze, Zeilen bleiben', () => {
    expect(cleanReply('Trink über den Tag verteilt.\n- Nimm 1000 IE Vitamin D. Geh kurz spazieren.\n- Mach Pausen.')).toBe('Trink über den Tag verteilt.\n- Geh kurz spazieren.\n- Mach Pausen.');
  });
  it('Gespräch: Regeln und Daten stehen vor dem Verlauf', async () => {
    const seen: { input?: unknown } = {};
    const r = await coachReply([{ role: 'user', content: 'Wie bleibe ich aktiv?', at: '' }], 'Daten X', {}, fake('Steh jede Stunde kurz auf.', seen));
    const turns = seen.input as { role: string; content: string }[];
    expect(turns[0].role).toBe('user');
    expect(turns[0].content).toContain('Keine Diagnosen');
    expect(turns[0].content).toContain('Daten X');
    expect(turns.at(-1)?.content).toBe('Wie bleibe ich aktiv?');
    expect(r).toBe('Steh jede Stunde kurz auf.');
  });
  it('Tagesimpuls wird geprüft und gefiltert', async () => {
    const r = await dailyImpulse('ctx', fake({ titel: 'Beweglich starten', impuls: 'Heute zählt jede kleine Bewegung.', schritte: [{ bereich: 'Bewegung', text: '3 Übungen vor dem Frühstück.' }, { bereich: 'Ernährung', text: 'Nimm 500 mg Magnesium.' }], frage: 'Wann passt es dir heute?' }));
    expect(r.schritte).toHaveLength(1);
    await expect(dailyImpulse('ctx', fake({ foo: 1 }))).rejects.toMatchObject({ kind: 'antwort' });
    await expect(dailyImpulse('ctx', null)).rejects.toMatchObject({ kind: 'nicht_verfuegbar' });
  });
});

describe('Coach-Plan', () => {
  it('filtert Übungen, Dosen und ordnet die Tage', async () => {
    const { createCoachPlan } = await import('./coach');
    const plan = await createCoachPlan('ctx', ['knie-beugen'], fake({
      ziel: { titel: 'Treppen leichter', beschreibung: 'Schritt für Schritt.', messgroessen: [{ name: 'Aufstehtest', ausgangswert: '12', ziel: 'mehr als 12', wie_messen: 'Tag 30 und Tag 90' }] },
      phasen: [{ wochen: '1–4', schwerpunkt: 'Start', inhalt: 'Ruhig beginnen.' }],
      woche: { schwerpunkt: 'Routine', tage: [{ tag: 'Mi', todos: [{ bereich: 'Ernährung', text: 'Nimm 2000 IE Vitamin D.' }, { bereich: 'Schlaf', text: 'Früher ins Bett.' }] }] },
      uebungen: [{ id: 'knie-beugen', grund: 'a' }, { id: 'erfunden', grund: 'b' }],
      hinweise: [],
    }));
    expect(plan.woche.tage).toHaveLength(7);
    expect(plan.woche.tage.find((t) => t.tag === 'Mi')?.todos.map((t) => t.text)).toEqual(['Früher ins Bett.']);
    expect(plan.uebungen.map((u) => u.id)).toEqual(['knie-beugen']);
  });
});
