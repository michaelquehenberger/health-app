import { useEffect, useMemo } from 'react';
import { GENERAL_RULES, regionInfo, type VideoLink } from '../data/exercises';
import { buildDayCard, judgeFeedback, PAIN_LIMIT, WEEK_PATTERN, dayOfWeek } from '../logic/plan';
import { blocksPlan, checkRedFlags } from '../logic/redFlags';
import { Icon, PainScale, Ring, Check } from '../../components/ui';
import type { HealthState, Feedback } from '../types';
import { addDays, formatDate, todayIso } from '../../store';
import { summarizeWearables } from '../wearables/days';

const DRINK_TARGET_ML = 1500;
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function emptyFeedback(date: string): Feedback {
  return { date, painBefore: null, painAfter: null, painMorning: null, swelling: false, done: [], drinkMl: 0 };
}

function VideoList({ videos }: { videos: VideoLink[] }) {
  return (
    <div className="stack">
      {videos.map((v) => (
        <div key={v.url} className="stack">
          {v.youtubeId ? (
            <iframe title={v.title} src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`} loading="lazy" allowFullScreen style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 12 }} />
          ) : null}
          <a className="btn primary" href={v.url} target="_blank" rel="noreferrer">{v.kind === 'video' ? 'Video ansehen' : 'Anleitung öffnen'} ({v.language === 'de' ? 'Deutsch' : 'Englisch'})</a>
          <p className="muted" style={{ fontSize: 12 }}>{v.title} · {v.provider}{v.reviewed ? '' : ' · noch nicht fachlich gesichtet'}</p>
        </div>
      ))}
    </div>
  );
}

export function TodayScreen({ data, update, goComplaint, unlocked, openGate, goWearables }: {
  data: HealthState;
  update: (fn: (d: HealthState) => HealthState) => void;
  goComplaint: () => void;
  /** PAR-Q+-Freigabe gültig? Ohne sie zeigt die App keine Übungen. */
  unlocked: boolean;
  openGate: () => void;
  goWearables: () => void;
}) {
  const today = todayIso();
  const yesterday = addDays(today, -1);
  const profile = data.profile;
  const flags = useMemo(() => checkRedFlags(data.complaints, data.values, data.reports), [data.complaints, data.values, data.reports]);
  const blocked = blocksPlan(flags);
  const hasComplaint = data.complaints.some((c) => c.active);
  const wearable = useMemo(() => summarizeWearables(data.wearables, today), [data.wearables, today]);

  const card = useMemo(
    () => buildDayCard({ date: today, profile, complaints: data.complaints, feedback: data.feedback, values: data.values, reports: data.reports, preferredIds: data.planChoice?.exerciseIds }),
    [today, profile, data.complaints, data.feedback, data.values, data.reports, data.planChoice],
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
          <h1>Dein Tag</h1>
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

      {!blocked && hasComplaint && !unlocked && (
        <div className="card note">
          <span className="label">Sicherheitscheck fehlt</span>
          <p className="small">Für Übungen braucht die App eine gültige Anamnese (PAR-Q+). Ohne sie zeigt sie keinen Übungsplan.</p>
          <button className="btn dark" onClick={openGate}>Zur Anamnese</button>
        </div>
      )}

      {!blocked && hasComplaint && unlocked && (
        <>
          {card.notes.map((n) => <div key={n} className="card note"><p className="small">{n}</p></div>)}

          <div className="card dark">
            <div className="row between">
              <span className="label">Heute · {card.focusLabel}</span>
              <span className="muted num">{doneCount}/{card.exercises.length}</span>
            </div>
            {card.regions.length > 0 && <h2>{card.regions.map((r) => regionInfo(r).label).join(' · ')}</h2>}

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
                          <div className="kind">{card.regions.length > 1 ? `${regionInfo(e.region).label} · ` : ''}{e.kind === 'kraeftigung' ? 'Kräftigung' : 'Beweglichkeit'}</div>
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
                {card.regions.map((r) => (
                  <div key={r} className="stack" style={{ gap: 6 }}>
                    {card.regions.length > 1 && <strong className="small">{regionInfo(r).label}</strong>}
                    <VideoList videos={regionInfo(r).videos} />
                    <p className="muted" style={{ fontSize: 12 }}>Anleitung nach {regionInfo(r).sourceLabel}.</p>
                  </div>
                ))}
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
            {card.nutrition ? (
              <>
                <p className="small">{card.nutrition.text}</p>
                <a className="small" href={card.nutrition.source.url} target="_blank" rel="noreferrer">Warum? Quelle: {card.nutrition.source.label}</a>
              </>
            ) : (
              <p className="small">Wegen deiner Angaben zu Allergien zeigt die App heute keinen Ernährungshinweis.</p>
            )}
          </div>

          <div className="card">
            <span className="label">Supplements · nur Information</span>
            {card.supplements.blocked.length > 0 ? (
              <p className="small">Keine Supplement-Hinweise ({card.supplements.blocked.join(', ')}). Frag bei Bedarf in der Arztpraxis oder Apotheke.</p>
            ) : card.supplements.cards.length === 0 ? (
              <p className="small">Heute keine Supplement-Information. Karten erscheinen nur, wenn ein Laborwert unter dem Bereich liegt. Keine Einnahme ohne Rücksprache.</p>
            ) : (
              card.supplements.cards.map((c) => (
                <details key={c.id} className="stack">
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{c.title}</summary>
                  <p className="small">{c.trigger} {c.summary}</p>
                  {c.evidence.map((e) => (
                    <p key={e.label} className="small muted">
                      <a href={e.url} target="_blank" rel="noreferrer">{e.label}</a>: {e.studyType}. {e.finding}{e.pmid ? ` (PubMed ${e.pmid})` : ''}
                    </p>
                  ))}
                  <p className="small muted">{c.note} Mit Arzt oder Apotheke besprechen; die App nennt keine Dosis.</p>
                </details>
              ))
            )}
          </div>

          <div className="card">
            <div className="row between">
              <span className="label">Wearable · letzte 7 Tage</span>
              <button className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={goWearables}>{data.wearables.length ? 'Daten' : 'Verbinden'}</button>
            </div>
            {wearable.nights === 0 ? (
              <p className="small muted">Noch keine Daten. Oura per Login oder Garmin und andere per Datei einlesen.</p>
            ) : (
              <>
                <p className="small">{wearable.nights} Nächte mit Daten · Schlaf {wearable.avgSleepHours === null ? '–' : wearable.avgSleepHours.toFixed(1).replace('.', ',')} h · Ruhepuls {wearable.avgRestingHr === null ? '–' : Math.round(wearable.avgRestingHr)} · HRV {wearable.avgHrv === null ? '–' : Math.round(wearable.avgHrv)}</p>
                <p className="muted" style={{ fontSize: 12 }}>Durchschnitt, keine Bewertung. Die Werte ändern den Plan nicht.</p>
              </>
            )}
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
            {card.regions.map((reg) => (
              <ul key={reg} className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
                {regionInfo(reg).notes.map((r) => <li key={r}>{r}</li>)}
              </ul>
            ))}
          </details>
          <p className="footer-note">Regeln {card.rulesVersion} · Stufe {card.level} · Entwurf, nicht fachlich freigegeben</p>
        </>
      )}
    </>
  );
}
