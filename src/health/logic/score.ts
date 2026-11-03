// Tägliche To-dos und LIVION-Score.
// Der Score misst das Dranbleiben (erledigte To-dos und regelmäßige Tage), nicht die Gesundheit. Eigene Definition, Entwurf.
import { buildDayCard, dayOfWeek } from './plan';
import type { HealthState } from '../types';
import type { Exercise } from '../data/exercises';

export type TodoKind = 'uebung' | 'aufgabe' | 'rueckmeldung';
export interface Todo {
  id: string;
  kind: TodoKind;
  text: string;
  bereich?: string;
  exercise?: Exercise;
  done: boolean;
}

/** Wochentage in der Reihenfolge des Coach-Plans (Mo … So) zu Date.getDay() */
export const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
/** Montag der Woche, in der `iso` liegt */
export function weekStart(iso: string): string {
  const dow = dayOfWeek(iso);
  return addDays(iso, -((dow + 6) % 7));
}

/** Alle To-dos eines Tages: Übungen aus dem Tagesplan (nach den Regeln), Aufgaben aus dem Coach-Plan oder nach den Regeln, Rückmeldung. */
export function todosFor(h: HealthState, date: string, blocked: boolean): Todo[] {
  const card = buildDayCard({ date, profile: h.profile, complaints: h.complaints, feedback: h.feedback, values: h.values, reports: h.reports, preferredIds: h.planChoice?.exerciseIds });
  const fb = h.feedback.find((f) => f.date === date);
  const doneExtra = new Set(h.todoDone?.[date] ?? []);
  const out: Todo[] = [];

  if (!blocked) {
    for (const e of card.exercises) out.push({ id: `ex:${e.id}`, kind: 'uebung', text: e.name, exercise: e, done: !!fb?.done.includes(e.id) });
  }

  const plan = h.coachPlan;
  const planDay = plan && date >= plan.weekStart && date < addDays(plan.weekStart, 7)
    ? plan.plan.woche.tage.find((t) => t.tag === WEEKDAYS_SHORT[dayOfWeek(date)])
    : undefined;
  if (planDay) {
    planDay.todos.forEach((t, i) => out.push({ id: `plan:${i}`, kind: 'aufgabe', text: t.text, bereich: t.bereich, done: doneExtra.has(`plan:${i}`) }));
  } else {
    if ('text' in card.drink) out.push({ id: 'trinken', kind: 'aufgabe', bereich: 'Trinken', text: 'Über den Tag verteilt trinken (Richtwert rund 1,5 Liter Getränke).', done: doneExtra.has('trinken') });
    if (card.focus === 'ausdauer') out.push({ id: 'ausdauer', kind: 'aufgabe', bereich: 'Bewegung', text: 'Ausdauer: zügig gehen, Rad fahren oder schwimmen, so dass du noch sprechen kannst.', done: doneExtra.has('ausdauer') });
    if (card.focus === 'ruhe' || card.focus === 'leicht') out.push({ id: 'spaziergang', kind: 'aufgabe', bereich: 'Bewegung', text: 'Ein Spaziergang an der frischen Luft.', done: doneExtra.has('spaziergang') });
  }

  if (!blocked && card.exercises.length > 0) {
    out.push({ id: 'rueckmeldung', kind: 'rueckmeldung', text: 'Schmerz vor und nach den Übungen eintragen (im Tagesplan).', done: fb?.painAfter !== null && fb?.painAfter !== undefined });
  }
  return out;
}

export interface DayStat { date: string; planned: number; done: number; complete: boolean }
export interface Score {
  /** 0–100 */
  value: number;
  /** Tage in Folge mit mindestens zwei Dritteln erledigt */
  streak: number;
  days: DayStat[];
  doneRate: number;
  activeRate: number;
}

export const COMPLETE_SHARE = 2 / 3;

/**
 * LIVION-Score der letzten 7 Tage: 70 % Anteil erledigter To-dos, 30 % Anteil der Tage mit mindestens einem Häkchen.
 * Gezählt wird ab dem ersten Tag der Nutzung; der heutige Tag zählt voll, kann den Score aber nicht senken.
 */
export function computeScore(h: HealthState, today: string, blocked: boolean, firstDay: string | null): Score {
  const days: DayStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    if (firstDay && date < firstDay) continue;
    const t = todosFor(h, date, blocked);
    const done = t.filter((x) => x.done).length;
    days.push({ date, planned: t.length, done, complete: t.length > 0 && done / t.length >= COMPLETE_SHARE });
  }
  const past = days.filter((d) => d.date < today && d.planned > 0);
  const todayStat = days.find((d) => d.date === today && d.planned > 0);
  const calc = (list: DayStat[]) => {
    const planned = list.reduce((a, d) => a + d.planned, 0);
    const done = list.reduce((a, d) => a + d.done, 0);
    const doneRate = planned ? done / planned : 0;
    const activeRate = list.length ? list.filter((d) => d.done > 0).length / list.length : 0;
    return { value: planned ? Math.round(100 * (0.7 * doneRate + 0.3 * activeRate)) : 0, doneRate, activeRate };
  };
  // Heute zählt voll mit, kann den Score aber nicht senken, solange der Tag noch läuft.
  const without = calc(past);
  const withToday = calc(todayStat ? [...past, todayStat] : past);
  const best = past.length === 0 || withToday.value >= without.value ? withToday : without;
  const { value, doneRate, activeRate } = best;

  let streak = 0;
  for (let i = todayStat?.complete ? 0 : 1; i < 365; i++) {
    const date = addDays(today, -i);
    if (firstDay && date < firstDay) break;
    const t = todosFor(h, date, blocked);
    const d = t.filter((x) => x.done).length;
    if (t.length === 0 || d / t.length < COMPLETE_SHARE) break;
    streak++;
  }
  return { value, streak, days, doneRate, activeRate };
}
