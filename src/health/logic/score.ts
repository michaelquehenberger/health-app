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
    // Die Plan-ID steckt im Häkchen: Nach „Woche neu planen“ gelten alte Häkchen nicht für andere Aufgaben.
    planDay.todos.forEach((t, i) => { const id = `plan:${plan!.id}:${i}`; out.push({ id, kind: 'aufgabe', text: t.text, bereich: t.bereich, done: doneExtra.has(id) }); });
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
 * Vergangene Tage zählen mit ihrem festgehaltenen Stand.
 * Gezählt wird ab dem ersten Tag der Nutzung; der heutige Tag zählt voll, kann den Score aber nicht senken.
 */
/**
 * Stand eines Tages. Für vergangene Tage gilt der festgehaltene Stand (dayStats), damit ein neuer Wochenplan
 * oder eine geänderte Beschwerde frühere Tage nicht nachträglich umrechnet; sonst wird aus den Daten gerechnet.
 */
export function dayStat(h: HealthState, date: string, today: string, blocked: boolean): DayStat {
  const kept = date < today ? h.dayStats?.[date] : undefined;
  const t = kept ? null : todosFor(h, date, blocked);
  const planned = kept ? kept.planned : t!.length;
  const done = kept ? kept.done : t!.filter((x) => x.done).length;
  return { date, planned, done, complete: planned > 0 && done / planned >= COMPLETE_SHARE };
}

/** Hält den heutigen Stand fest und räumt Einträge auf, die älter als 120 Tage sind. Gibt denselben Stand zurück, wenn nichts zu tun ist. */
export function withTodayStat(h: HealthState, today: string, blocked: boolean): HealthState {
  const t = todosFor(h, today, blocked);
  const next = { planned: t.length, done: t.filter((x) => x.done).length };
  const cur = h.dayStats?.[today];
  const limit = addDays(today, -120);
  const stale = Object.keys(h.dayStats ?? {}).some((d) => d < limit) || Object.keys(h.todoDone ?? {}).some((d) => d < limit);
  if (cur && cur.planned === next.planned && cur.done === next.done && !stale) return h;
  const keep = <T,>(o: Record<string, T> | undefined) => Object.fromEntries(Object.entries(o ?? {}).filter(([d]) => d >= limit));
  return { ...h, dayStats: { ...keep(h.dayStats), [today]: next }, todoDone: keep(h.todoDone) };
}

export function computeScore(h: HealthState, today: string, blocked: boolean, firstDay: string | null): Score {
  const days: DayStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    if (firstDay && date < firstDay) continue;
    days.push(dayStat(h, date, today, blocked));
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
    if (!dayStat(h, date, today, blocked).complete) break;
    streak++;
  }
  return { value, streak, days, doneRate, activeRate };
}
