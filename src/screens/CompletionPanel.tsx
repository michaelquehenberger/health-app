// Abschluss eines Messzeitpunkts: Ergebnisse auf einen Blick und klare nächste Schritte.
import { useState } from 'react';
import { TESTS, timepointLabel } from '../tests';
import { FOLLOW_UP_DAYS, baselineDate, summarize, type NextStep } from '../results';
import type { AppData, FeedbackEntry, TestId, Timepoint } from '../types';
import { addDaysIso, downloadCalendar, formatDate, todayIso, uid } from '../store';
import { Icon } from '../components/ui';

const ORDER: Timepoint[] = ['baseline', 'tag30', 'tag90'];

export function CompletionPanel({ data, update, timepoint, step, openTest, goHealth, goHistory, goSettings }: {
  goHealth: () => void;
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  timepoint: Timepoint;
  step: Extract<NextStep, { kind: 'fertig' | 'ruhepulsRest' }>;
  openTest: (id: TestId) => void;
  goHistory: () => void;
  goSettings: () => void;
}) {
  const base = baselineDate(data.records);
  const upcoming = ORDER.slice(ORDER.indexOf(timepoint) + 1).filter(() => !!base).map((tp) => ({ tp, date: addDaysIso(base!, FOLLOW_UP_DAYS[tp]) }));
  const pulseOpen = step.kind === 'ruhepulsRest';
  const given = (data.feedback ?? []).find((f) => f.timepoint === timepoint);

  return (
    <>
      <div className="card mint">
        <span className="label" style={{ color: 'var(--navy)' }}>{timepointLabel(timepoint)}</span>
        <h1>{pulseOpen ? 'Testtag geschafft.' : `${timepointLabel(timepoint)} abgeschlossen.`}</h1>
        <p className="small">
          {pulseOpen
            ? `Alle Tests sind eingetragen. Es fehlt nur noch der Ruhepuls an ${step.needed - step.measured} Morgen.`
            : 'Alle Werte sind gespeichert. Sie sind dein Startpunkt für die nächste Messung.'}
        </p>
      </div>

      <div className="card">
        <span className="label">Deine Ergebnisse</span>
        <table className="table">
          <tbody>
            {TESTS.map((t) => {
              const s = summarize(data.records, t.id, timepoint);
              return (
                <tr key={t.id}>
                  <th scope="row" style={{ width: '45%', textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--ink)' }}>{t.name}</th>
                  <td className="num">{s.text === 'offen' ? '–' : s.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="btn ghost" onClick={goHistory}>Im Verlauf ansehen</button>
      </div>

      <div className="card">
        <span className="label">So geht es weiter</span>
        <ol className="todo">
          {timepoint === 'baseline' && (
            <li>
              <strong>Weiter zum Gesundheitsmodul</strong>
              <span className="muted small">Das Herzstück: Blutwerte, Beschwerden und Oura. Daraus entsteht dein Übungsplan.</span>
              <button className="btn primary" onClick={goHealth}>Gesundheitsdaten eintragen</button>
            </li>
          )}
          {pulseOpen && (
            <li>
              <strong>Ruhepuls fertig messen</strong>
              <span className="muted small">
                Noch {step.needed - step.measured} Morgen, jeweils morgens in Ruhe. {step.doneToday ? 'Heute ist schon eingetragen, morgen früh weiter.' : ''}
              </span>
              {!step.doneToday && <button className="btn primary" onClick={() => openTest('T1')}>Ruhepuls eintragen</button>}
            </li>
          )}
          <li>
            <strong>Sicherung speichern</strong>
            <span className="muted small">Deine Daten liegen nur auf diesem Handy. Eine Sicherung schützt sie, falls der Browser-Speicher gelöscht wird.</span>
            <button className="btn ghost" onClick={goSettings}>Zur Sicherung</button>
          </li>
          <li className={given ? 'done' : ''}>
            <strong>{given ? <>Rückmeldung gegeben <Icon.check /></> : 'Kurz Rückmeldung geben'}</strong>
            <span className="muted small">Drei Fragen, damit die App besser wird.</span>
            {!given && <FeedbackForm onSave={(f) => update((d) => ({ ...d, feedback: [...(d.feedback ?? []), { ...f, id: uid(), timepoint, date: todayIso() }] }))} />}
          </li>
          {upcoming.length > 0 ? (
            <li>
              <strong>Nächste Messung: {timepointLabel(upcoming[0].tp)} ab {formatDate(upcoming[0].date)}</strong>
              <span className="muted small">
                Bis dahin musst du in der App nichts tun. Dann wiederholst du Ruhepuls und Tests in derselben Reihenfolge; die Testmappe schlägt den Zeitpunkt vor.
              </span>
              <button
                className="btn dark"
                onClick={() => downloadCalendar(upcoming.map((u) => ({
                  date: u.date,
                  title: `LIVION: ${timepointLabel(u.tp)} messen`,
                  description: `Ruhepuls an 5–7 Morgen und Testtag (${timepointLabel(u.tp)}). App öffnen: ${location.href}`,
                })))}
              >
                {upcoming.length > 1 ? `Termine in den Kalender (${upcoming.map((u) => timepointLabel(u.tp)).join(', ')})` : 'Termin in den Kalender'}
              </button>
            </li>
          ) : (
            <li>
              <strong>Alle Messzeitpunkte erledigt</strong>
              <span className="muted small">Deine Entwicklung von der Baseline bis Tag 90 findest du im Verlauf.</span>
            </li>
          )}
        </ol>
      </div>
    </>
  );
}

function FeedbackForm({ onSave }: { onSave: (f: Omit<FeedbackEntry, 'id' | 'timepoint' | 'date'>) => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  return (
    <div className="stack" style={{ marginTop: 6 }}>
      <label className="field">Habe ich die App so genutzt wie gedacht?
        <textarea value={a} onChange={(e) => setA(e.target.value)} />
      </label>
      <label className="field">Waren die Tests verständlich und machbar?
        <textarea value={b} onChange={(e) => setB(e.target.value)} />
      </label>
      <label className="field">Was fehlte?
        <textarea value={c} onChange={(e) => setC(e.target.value)} />
      </label>
      <button className="btn primary" disabled={!a.trim() && !b.trim() && !c.trim()} onClick={() => onSave({ usedAsIntended: a.trim(), understandable: b.trim(), missing: c.trim() })}>
        Rückmeldung speichern
      </button>
      <p className="muted small">Wird mit der Sicherung exportiert und bleibt sonst auf diesem Handy.</p>
    </div>
  );
}
