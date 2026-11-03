// Teile des Coaches: LIVION-Score, heutige To-dos zum Abhaken, Wochenübersicht, Ziel in 12 Wochen.
import { useState } from 'react';
import type { AppData } from '../../types';
import type { HealthState, Feedback } from '../types';
import { EMPTY_HEALTH } from '../types';
import { Icon } from '../../components/ui';
import { ExerciseDetails } from '../../components/ExerciseDetails';
import { addDays, computeScore, todosFor, weekStart, WEEKDAYS_SHORT, type Score, type Todo } from '../logic/score';
import { WEEK_PATTERN, dayOfWeek } from '../logic/plan';
import { summarize } from '../../results';
import { TESTS } from '../../tests';
import { formatDate } from '../../store';

type Update = (fn: (d: HealthState) => HealthState) => void;

function Ring({ value }: { value: number }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <svg className="score-ring" viewBox="0 0 96 96" role="img" aria-label={`LIVION-Score ${value} von 100`}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--mint)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 48 48)" />
      <text x="48" y="54" textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--ink)" style={{ fontFamily: 'var(--font-head)' }}>{value}</text>
    </svg>
  );
}

export function ScoreCard({ score, today }: { score: Score; today: string }) {
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const msg = score.value >= 80 ? 'Stark, du bleibst dran.' : score.value >= 50 ? 'Gut unterwegs. Jedes Häkchen zählt.' : score.days.some((d) => d.done > 0) ? 'Kleine Schritte reichen. Hak heute ein, zwei Dinge ab.' : 'Hak deine ersten To-dos ab, dann wächst dein Score.';
  return (
    <div className="card">
      <span className="label">LIVION-Score · letzte 7 Tage</span>
      <div className="score">
        <Ring value={score.value} />
        <div className="stack" style={{ gap: 6 }}>
          <strong>{msg}</strong>
          <span className="small">{score.streak > 0 ? `${score.streak} ${score.streak === 1 ? 'Tag' : 'Tage'} in Folge drangeblieben` : 'Noch keine Serie'}</span>
        </div>
      </div>
      <div className="bars" aria-hidden="true">
        {last7.map((date) => {
          const d = score.days.find((x) => x.date === date);
          return <span key={date} className={d?.done ? '' : 'empty'} style={{ height: `${d?.planned ? Math.max(6, (100 * d.done) / d.planned) : 6}%` }} />;
        })}
      </div>
      <div className="bars-labels muted">{last7.map((date) => <span key={date}>{date === today ? 'heute' : WEEKDAYS_SHORT[dayOfWeek(date)]}</span>)}</div>
      <details>
        <summary className="small" style={{ cursor: 'pointer' }}>Wie der Score entsteht</summary>
        <p className="small">70 % zählt, wie viele deiner To-dos du in den letzten 7 Tagen abgehakt hast, 30 %, an wie vielen Tagen du überhaupt etwas abgehakt hast. Ein Tag gilt als geschafft, wenn mindestens zwei Drittel erledigt sind. Der Score misst dein Dranbleiben, nicht deine Gesundheit.</p>
      </details>
    </div>
  );
}

function emptyFeedback(date: string): Feedback {
  return { date, painBefore: null, painAfter: null, painMorning: null, swelling: false, done: [] };
}

export function TodayTodos({ h, today, blocked, update, goPlan, focusLabel }: { h: HealthState; today: string; blocked: boolean; update: Update; goPlan: () => void; focusLabel: string }) {
  const todos = todosFor(h, today, blocked);
  const [open, setOpen] = useState<string | null>(null);
  const done = todos.filter((t) => t.done).length;

  function toggle(t: Todo) {
    if (t.kind === 'rueckmeldung') { goPlan(); return; }
    update((d) => {
      if (t.kind === 'uebung' && t.exercise) {
        const id = t.exercise.id;
        const fb = d.feedback.find((f) => f.date === today) ?? emptyFeedback(today);
        const next = { ...fb, done: fb.done.includes(id) ? fb.done.filter((x) => x !== id) : [...fb.done, id] };
        return { ...d, feedback: [...d.feedback.filter((f) => f.date !== today), next] };
      }
      const cur = d.todoDone?.[today] ?? [];
      const next = cur.includes(t.id) ? cur.filter((x) => x !== t.id) : [...cur, t.id];
      return { ...d, todoDone: { ...(d.todoDone ?? {}), [today]: next } };
    });
  }

  return (
    <div className="card">
      <div className="row between">
        <span className="label">Heute abhaken · {focusLabel}</span>
        <span className="muted num">{done}/{todos.length}</span>
      </div>
      {todos.length === 0 && <p className="small">Heute steht nichts an. Ein Spaziergang ist willkommen.</p>}
      {todos.map((t) => (
        <div key={t.id} className={`todo${t.done ? ' done' : ''}`}>
          <button className="tick" aria-pressed={t.done} aria-label={`${t.text} ${t.done ? 'erledigt' : 'offen'}`} onClick={() => toggle(t)}>
            {t.done && <Icon.check />}
          </button>
          <div className="stack" style={{ gap: 4, flex: 1, minWidth: 0 }}>
            <span className="small muted">{t.kind === 'uebung' ? `Übung · ${t.exercise?.kind === 'kraeftigung' ? 'Kräftigung' : 'Beweglichkeit'} · ${t.exercise?.dose}` : t.kind === 'rueckmeldung' ? 'Rückmeldung' : t.bereich}</span>
            <span className="todo-text">{t.text}</span>
            {t.exercise && (
              <>
                <button type="button" className="btn ghost" style={{ minHeight: 32, fontSize: 13, justifySelf: 'start' }} aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? null : t.id)}>
                  {open === t.id ? 'Anleitung schließen' : 'So geht’s (mit Bild)'}
                </button>
                {open === t.id && <ExerciseDetails e={t.exercise} />}
              </>
            )}
          </div>
        </div>
      ))}
      {todos.some((t) => t.kind === 'uebung') && <button className="btn ghost" onClick={goPlan}>Zum Tagesplan mit Schmerzfrage</button>}
    </div>
  );
}

export function WeekView({ h, today, blocked }: { h: HealthState; today: string; blocked: boolean }) {
  const start = weekStart(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const plan = h.coachPlan && h.coachPlan.weekStart === start ? h.coachPlan.plan : null;
  return (
    <div className="card">
      <span className="label">Diese Woche</span>
      {plan && <p className="small"><strong>Schwerpunkt:</strong> {plan.woche.schwerpunkt}</p>}
      <div className="week">
        {days.map((d) => {
          const t = todosFor(h, d, blocked);
          const ex = t.filter((x) => x.kind === 'uebung').length;
          const tasks = t.filter((x) => x.kind === 'aufgabe');
          const done = t.filter((x) => x.done).length;
          return (
            <div key={d} className={`week-day${d === today ? ' today' : ''}`}>
              <strong>{WEEKDAYS_SHORT[dayOfWeek(d)]}<br /><span className="muted small">{formatDate(d).slice(0, 6)}</span></strong>
              <div className="small" style={{ minWidth: 0 }}>
                <div>{WEEK_PATTERN[dayOfWeek(d)].label}{ex ? ` · ${ex} Übungen` : ''}</div>
                {tasks.map((x) => <div key={x.id} className="muted">{x.text}</div>)}
              </div>
              <span className="muted num small">{d <= today && t.length ? `${done}/${t.length}` : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GoalCard({ data, today }: { data: AppData; today: string }) {
  const h = data.health ?? EMPTY_HEALTH;
  const cp = h.coachPlan;
  const week = cp ? Math.min(12, Math.floor((Date.parse(today) - Date.parse(cp.startDate)) / (7 * 86_400_000)) + 1) : null;
  return (
    <div className="card">
      <span className="label">Ziel in 12 Wochen{week ? ` · Woche ${week} von 12` : ''}</span>
      {cp ? (
        <>
          <h3>{cp.plan.ziel.titel}</h3>
          <p className="small">{cp.plan.ziel.beschreibung}</p>
          {week && <div className="progress" aria-hidden="true"><span style={{ width: `${(100 * week) / 12}%` }} /></div>}
          {cp.plan.ziel.messgroessen.length > 0 && (
            <ul className="goal-list">
              {cp.plan.ziel.messgroessen.map((m) => (
                <li key={m.name}>
                  <strong>{m.name}</strong>
                  <span className="small">Start: {m.ausgangswert} → Ziel: <strong>{m.ziel}</strong></span>
                  <span className="small muted">{m.wie_messen}</span>
                </li>
              ))}
            </ul>
          )}
          {cp.plan.phasen.map((p) => <p key={p.wochen} className="small"><strong>Woche {p.wochen}: {p.schwerpunkt}.</strong> {p.inhalt}</p>)}
          {cp.plan.hinweise.length > 0 && (
            <div className="card note"><strong>Beim nächsten Arztbesuch ansprechen</strong><ul className="small" style={{ margin: 0, paddingLeft: 20 }}>{cp.plan.hinweise.map((x) => <li key={x}>{x}</li>)}</ul></div>
          )}
        </>
      ) : (
        <p className="small">Dein Ziel: die Tests an Tag 30 und Tag 90 mit deinen Ausgangswerten vergleichen und dazwischen dranbleiben. Mit dem Coach-Plan auf claude.ai bekommst du ein persönliches Ziel aus all deinen Daten.</p>
      )}
      <strong className="small">Deine Tests: Start · Tag 30 · Tag 90</strong>
      <ul className="goal-list">
        {TESTS.map((t) => (
          <li key={t.id}>
            <span className="small"><strong>{t.name}</strong></span>
            <span className="small">{(['baseline', 'tag30', 'tag90'] as const).map((tp) => summarize(data.records, t.id, tp).text).join(' · ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { computeScore };
