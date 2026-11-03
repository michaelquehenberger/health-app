import { describe, expect, it } from 'vitest';
import { computeScore, todosFor, weekStart, addDays } from './score';
import { EMPTY_HEALTH, type Complaint, type HealthState } from '../types';

const NO = { acuteHotJoint: false, fever: false, injury: false, systemic: false, neuro: false, suddenOnset: false, caudaEquina: false, chestPain: false, multipleSwollenJoints: false, longMorningStiffness: false };
const knee: Complaint = { id: 'c', date: '2026-10-01', region: 'knie', side: 'rechts', type: 'steifigkeit', since: '', intensity: 4, swellingOrWarmth: false, redFlags: NO, active: true };
const base: HealthState = { ...EMPTY_HEALTH, complaints: [knee] };
const today = '2026-11-03'; // Dienstag

/** Hakt an einem Tag alles ab */
function doAll(h: HealthState, date: string): HealthState {
  const t = todosFor(h, date, false);
  const ex = t.filter((x) => x.kind === 'uebung').map((x) => x.exercise!.id);
  const extra = t.filter((x) => x.kind === 'aufgabe').map((x) => x.id);
  return {
    ...h,
    feedback: [...h.feedback.filter((f) => f.date !== date), { date, painBefore: 2, painAfter: 2, painMorning: null, swelling: false, done: ex }],
    todoDone: { ...(h.todoDone ?? {}), [date]: extra },
  };
}

describe('To-dos und LIVION-Score', () => {
  it('Wochenstart ist Montag', () => {
    expect(weekStart(today)).toBe('2026-11-02');
    expect(weekStart('2026-11-08')).toBe('2026-11-02');
  });
  it('ein Tag hat Übungen, Aufgaben und die Rückmeldung', () => {
    const t = todosFor(base, today, false);
    expect(t.some((x) => x.kind === 'uebung')).toBe(true);
    expect(t.some((x) => x.id === 'ausdauer')).toBe(true);
    expect(t.some((x) => x.kind === 'rueckmeldung')).toBe(true);
  });
  it('bei roter Flagge keine Übungen', () => {
    expect(todosFor(base, today, true).some((x) => x.kind === 'uebung')).toBe(false);
  });
  it('alles erledigt ergibt 100 und eine Serie', () => {
    let h = base;
    for (let i = 6; i >= 0; i--) h = doAll(h, addDays(today, -i));
    const s = computeScore(h, today, false, '2026-10-01');
    expect(s.value).toBe(100);
    expect(s.streak).toBe(7);
  });
  it('nichts erledigt ergibt 0; heute abhaken hebt den Score', () => {
    const s0 = computeScore(base, today, false, '2026-10-01');
    expect(s0.value).toBe(0);
    const s1 = computeScore(doAll(base, today), today, false, '2026-10-01');
    expect(s1.value).toBeGreaterThan(0);
    expect(s1.streak).toBe(1);
  });
  it('Tage vor dem Start zählen nicht', () => {
    const s = computeScore(doAll(base, today), today, false, today);
    expect(s.days).toHaveLength(1);
    expect(s.value).toBe(100);
  });
  it('Aufgaben aus dem Coach-Plan gelten in der Planwoche', () => {
    const h: HealthState = { ...base, coachPlan: { id: 'p', createdAt: '', startDate: '2026-11-02', weekStart: '2026-11-02', plan: {
      ziel: { titel: 'x', beschreibung: '', messgroessen: [] }, phasen: [], uebungen: [], hinweise: [],
      woche: { schwerpunkt: '', tage: [{ tag: 'Di', todos: [{ bereich: 'Schlaf', text: 'Um 22 Uhr Bildschirm aus.' }] }] },
    } } };
    expect(todosFor(h, today, false).some((x) => x.text === 'Um 22 Uhr Bildschirm aus.')).toBe(true);
    expect(todosFor(h, '2026-11-10', false).some((x) => x.id === 'ausdauer')).toBe(true);
  });
});

describe('Score am ersten Tag', () => {
  it('ein einzelnes Häkchen ergibt nicht gleich 100', () => {
    const t = todosFor(base, today, false);
    const h: HealthState = { ...base, todoDone: { [today]: [t.find((x) => x.kind === 'aufgabe')!.id] } };
    const s = computeScore(h, today, false, today);
    expect(s.value).toBeGreaterThan(30);
    expect(s.value).toBeLessThan(60);
  });
});
