import { useEffect, useMemo } from 'react';
import { GENERAL_RULES, regionInfo } from '../data/exercises';
import { buildDayCard, judgeFeedback, PAIN_LIMIT, WEEK_PATTERN, dayOfWeek } from '../logic/plan';
import { blocksPlan, checkRedFlags } from '../logic/redFlags';
import { Icon, PainScale, Ring, Check } from '../components/ui';
import type { AppData, Feedback } from '../types';
import { addDays, formatDate, todayIso } from '../store';

const DRINK_TARGET_ML = 1500;
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function emptyFeedback(date: string): Feedback {
  return { date, painBefore: null, painAfter: null, painMorning: null, swelling: false, done: [], drinkMl: 0 };
}

export function TodayScreen({ data, update, goComplaint }: { data: AppData; update: (fn: (d: AppData) => AppData) => void; goComplaint: () => void }) {
  const today = todayIso();
  const yesterday = addDays(today, -1);
  const profile = data.profile!;
  const flags = useMemo(() => checkRedFlags(data.complaints, data.values, data.reports), [data.complaints, data.values, data.reports]);
  const blocked = blocksPlan(flags);
  const hasComplaint = data.complaints.some((c) => c.active);

  const card = useMemo(
    () => buildDayCard({ date: today, profile, complaints: data.complaints, feedback: data.feedback, values: data.values, reports: data.reports }),
    [today, profile, data.complaints, data.feedback, data.values, data.reports],
  );

  const fb = data.feedback.find((f) => f.date === today) ?? emptyFeedback(today);
  const fbYesterday = data.feedback.find((f) => f.date === yesterday);

  function setFeedback(date: string, patch: Partial<Feedback>) {
    update((d) => {
      const existing = d.feedback.find((f) => f.date === date) ?? emptyFeedback(date);
      const next = { ...existing, ...patch };
      return { ...d, feedback: [...d.feedback.filter((f) => f.date !== date), next] };
    });
  }

  // Tageskarte mit Regelversion speichern (Nachvollziehbarkeit).
  const ids = card.exercises.map((e) => e.id).join(',');
  useEffect(() => {
    if (blocked || !hasComplaint) return;
    update((d) => {
      const rec = d.dayCards.find((c) => c.date === today);
      if (rec && rec.exerciseIds.join(',') === ids && rec.level === card.level) return d;
      return {
        ...d,
        dayCards: [...d.dayCards.filter((c) => c.date !== today), { date: today, exerciseIds: card.exercises.map((e) => e.id), level: card.level, rulesVersion: card.rulesVersion }],
      };
    });
  }, [ids, card.level, card.rulesVersion, blocked, hasComplaint, today, update, card.exercises]);

  const doneCount = card.exercises.filter((e) => fb.done.includes(e.id)).length;
  const drink = fb.drinkMl ?? 0;
  const result = judgeFeedback(fb);

  return (
    <>
      <div className="row between">
        <div>
          <span className="label">{WEEKDAYS[dayOfWeek(today)]} · {formatDate(today)}</span>
          <h1>Hallo {profile.name}.</h1>
        </div>
      </div>

      {flags.filter((f) => f.level !== 'hinweis').map((f) => (
        <div key={f.text} className={`card alert ${f.level === 'notfall' ? 'notfall' : ''}`} role="alert">
          <span className="label" style={{ color: 'inherit' }}>{f.level === 'notfall' ? 'Sofort handeln' : 'Ärztlich abklären'}</span>
          <h2>{f.text}</h2>
          {f.source && <a href={f.source.url} target="_blank" rel="noreferrer" className="small" style={{ color: 'inherit' }}>Quelle: {f.source.label}</a>}
        </div>
      ))}

      {blocked && (
        <div className="card">
          <p>Solange diese Angaben zutreffen, zeigt die App keinen Übungsplan. Wenn sich die Lage geklärt hat, trag die Beschwerde neu ein.</p>
          <button className="btn dark" onClick={goComplaint}>Beschwerde neu eintragen</button>
        </div>
      )}

      {!blocked && !hasComplaint && (
        <div className="card dark">
          <span className="label">Start</span>
          <h2>Wo hast du Beschwerden?</h2>
          <p className="muted">Trag zuerst eine Beschwerde ein. Daraus entsteht dein Tagesplan.</p>
          <button className="btn primary" onClick={goComplaint}>Beschwerde eintragen</button>
        </div>
      )}

      {flags.filter((f) => f.level === 'hinweis').map((f) => (
        <div key={f.text} className="card note"><p className="small">{f.text}</p></div>
      ))}

      {!blocked && hasComplaint && (
        <>
          {card.notes.map((n) => <div key={n} className="card note"><p className="small">{n}</p></div>)}

          <div className="card dark">
            <div className="row between">
              <span className="label">Heute · {card.focusLabel}</span>
              <span className="muted num">{doneCount}/{card.exercises.length}</span>
            </div>
            {card.region && <h2>{regionInfo(card.region).label}</h2>}

            {card.exercises.length === 0 && card.endurance && <p>{card.endurance}</p>}

            {card.exercises.length > 0 && (
              <>
                <p className="muted small">Fang mit der Schmerzfrage unten an. Lesen ca. 1 Minute, Üben 5–10 Minuten.</p>
                {card.exercises.map((e) => {
                  const done = fb.done.includes(e.id);
                  return (
                    <div key={e.id} className="exercise">
                      <button className="tick" aria-pressed={done} aria-label={`${e.name} erledigt`}
                        onClick={() => setFeedback(today, { done: done ? fb.done.filter((x) => x !== e.id) : [...fb.done, e.id] })}>
                        {done && <Icon.check />}
                      </button>
                      <details style={{ flex: 1 }}>
                        <summary>
                          <div className="kind">{e.kind === 'kraeftigung' ? 'Kräftigung' : 'Beweglichkeit'}</div>
                          {e.name}
                          <div className="dose">{e.dose}</div>
                        </summary>
                        <p className="small">{e.instruction}</p>
                        <p className="small muted" style={{ marginTop: 6 }}><strong>Worauf achten:</strong> {e.watch}</p>
                      </details>
                    </div>
                  );
                })}
                {card.endurance && <p className="small" style={{ borderTop: '1px solid var(--navy-2)', paddingTop: 12 }}>{card.endurance}</p>}
                {card.region && (
                  <a className="btn primary" href={regionInfo(card.region).videoUrl} target="_blank" rel="noreferrer">
                    Video ansehen
                  </a>
                )}
                {card.region && <p className="muted" style={{ fontSize: 12 }}>{regionInfo(card.region).videoLabel}. Anleitung nach {regionInfo(card.region).sourceLabel}.</p>}
              </>
            )}
          </div>

          {card.exercises.length > 0 && (
            <div className="card">
              <span className="label">Rückfrage · Schmerzregel</span>
              <p className="small">Höchstens {PAIN_LIMIT} von 10 während der Übung, bis morgen früh zurück auf das Ausgangsniveau.</p>
              <PainScale label="Schmerz vor der Einheit" value={fb.painBefore} onChange={(v) => setFeedback(today, { painBefore: v })} />
              <PainScale label="Schmerz nach der Einheit" value={fb.painAfter} limit={PAIN_LIMIT} onChange={(v) => setFeedback(today, { painAfter: v })} />
              <Check checked={fb.swelling} onChange={(v) => setFeedback(today, { swelling: v })}>Das Gelenk ist danach geschwollen.</Check>
              {result === 'ok' && <p className="small"><span className="chip ok">Im Rahmen</span> Morgen früh fragen wir noch einmal nach.</p>}
              {result === 'ueberschritten' && <p className="small"><span className="chip out">Über der Grenze</span> Die nächste Einheit wird eine Stufe leichter.</p>}
            </div>
          )}

          {fbYesterday && fbYesterday.painAfter !== null && fbYesterday.painMorning === null && (
            <div className="card">
              <span className="label">Nachfrage zu gestern</span>
              <PainScale label="Wie stark ist der Schmerz heute Morgen?" value={null} onChange={(v) => setFeedback(yesterday, { painMorning: v })} />
              <p className="muted">Gestern vor der Einheit: {fbYesterday.painBefore ?? '–'}/10</p>
            </div>
          )}

          <div className="card dark">
            <span className="label">Trinken</span>
            {'text' in card.drink ? (
              <>
                <div className="ring-row">
                  <Ring value={drink / DRINK_TARGET_ML} label="Trinken" />
                  <div className="stack">
                    <span className="big-num">{(drink / 1000).toFixed(2).replace('.', ',')} / 1,5 l</span>
                    <div className="row">
                      <button className="btn primary" style={{ minHeight: 40 }} onClick={() => setFeedback(today, { drinkMl: drink + 250 })}>+ 0,25 l</button>
                      <button className="btn ghost" style={{ minHeight: 40, color: 'var(--offwhite)', borderColor: 'var(--offwhite)' }} disabled={drink === 0} onClick={() => setFeedback(today, { drinkMl: Math.max(0, drink - 250) })}>−</button>
                    </div>
                  </div>
                </div>
                <p className="muted small">{card.drink.text}</p>
              </>
            ) : (
              <p className="small">{card.drink.blocked}</p>
            )}
          </div>

          <div className="card">
            <span className="label">Ernährung</span>
            <p className="small">{card.nutrition}</p>
            <a className="small" href="https://www.nice.org.uk/guidance/ng226/chapter/Recommendations" target="_blank" rel="noreferrer">Warum? NICE-Leitlinie NG226</a>
          </div>

          <div className="card">
            <span className="label">Supplements</span>
            <p className="small">{card.supplements}</p>
          </div>

          {profile.rhythm === 'woechentlich' && (
            <div className="card">
              <span className="label">Diese Woche</span>
              <table className="table">
                <tbody>
                  {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((d) => (
                    <tr key={d}>
                      <td>{WEEKDAYS[dayOfWeek(d)]}</td>
                      <td>{WEEK_PATTERN[dayOfWeek(d)].label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details className="card">
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Allgemeine Ausführungsregeln</summary>
            <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
              {GENERAL_RULES.map((r) => <li key={r}>{r}</li>)}
            </ul>
            {card.region && (
              <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
                {regionInfo(card.region).notes.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
          </details>
          <p className="footer-note">Regeln {card.rulesVersion} · Stufe {card.level} · Entwurf, nicht fachlich freigegeben</p>
        </>
      )}
    </>
  );
}
