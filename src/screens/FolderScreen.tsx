import { TESTS, TIMEPOINTS, testDef, timepointLabel } from '../tests';
import { Icon, Seg } from '../components/ui';
import { MATERIAL, baselineDate, nextStep, recordsFor, summarize } from '../results';
import type { AppData, TestId, Timepoint } from '../types';
import { daysBetween, formatDate, todayIso } from '../store';
import { RESTING_PULSE_MIN_MORNINGS } from '../calc';
import { CompletionPanel } from './CompletionPanel';

/** Drei Etappen je Messzeitpunkt: Anamnese, Ruhepuls an 5–7 Morgen, Testtag. */
function Stepper({ unlocked, pulseDone, pulseCount, testsDone, testsTotal }: {
  unlocked: boolean; pulseDone: boolean; pulseCount: number; testsDone: number; testsTotal: number;
}) {
  const steps = [
    { label: 'Anamnese', detail: unlocked ? 'freigegeben' : 'offen', done: unlocked },
    { label: 'Ruhepuls', detail: pulseDone ? 'erledigt' : `${pulseCount} von ${RESTING_PULSE_MIN_MORNINGS} Morgen`, done: pulseDone },
    { label: 'Testtag', detail: `${testsDone} von ${testsTotal} Tests`, done: testsDone === testsTotal },
  ];
  return (
    <ol className="stepper" aria-label="Fortschritt">
      {steps.map((s, i) => (
        <li key={s.label} className={s.done ? 'done' : ''}>
          <span className="dot" aria-hidden="true">{s.done ? <Icon.check /> : i + 1}</span>
          <span><strong>{s.label}</strong><span className="muted small" style={{ display: 'block' }}>{s.detail}</span></span>
        </li>
      ))}
    </ol>
  );
}

export function FolderScreen({ data, update, unlocked, timepoint, suggested, setTimepoint, openTest, openGate, goHistory, goSettings }: {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  goHistory: () => void;
  goSettings: () => void;
  unlocked: boolean;
  timepoint: Timepoint;
  suggested: Timepoint;
  setTimepoint: (t: Timepoint) => void;
  openTest: (id: TestId) => void;
  openGate: () => void;
}) {
  const today = todayIso();
  const base = baselineDate(data.records);
  const day = base ? daysBetween(base, today) : null;
  const others = TESTS.filter((t) => t.id !== 'T1');
  const testsDone = others.filter((t) => summarize(data.records, t.id, timepoint).done).length;
  const pulseSummary = summarize(data.records, 'T1', timepoint);
  const pulseCount = recordsFor(data.records, 'T1', timepoint).filter((r) => !r.aborted).length;
  const step = nextStep(data.records, timepoint, today);
  const firstOpenTest = others.find((t) => !summarize(data.records, t.id, timepoint).done);

  return (
    <>
      {!unlocked ? (
        <div className="card dark">
          <span className="label">Dein nächster Schritt</span>
          <h1>Anamnese ausfüllen</h1>
          <p className="muted">Einmal den Fragebogen PAR-Q+ beantworten, etwa 5 Minuten. Danach sind die Tests freigeschaltet.</p>
          <button className="btn primary" onClick={openGate}>Zur Anamnese</button>
        </div>
      ) : step.kind === 'fertig' || step.kind === 'ruhepulsRest' ? (
        <CompletionPanel data={data} update={update} timepoint={timepoint} step={step} openTest={openTest} goHistory={goHistory} goSettings={goSettings} />
      ) : (
        <div className="card dark">
          <span className="label">Dein nächster Schritt · {timepointLabel(timepoint)}</span>
          {step.kind === 'ruhepuls' && (
            <>
              <h1>Ruhepuls messen</h1>
              <p className="muted">
                Morgens in Ruhe, bevor du aufstehst oder dich bewegst. An {RESTING_PULSE_MIN_MORNINGS} bis 7 Morgen, immer gleich.
                Bisher: {step.measured} von {step.needed}.
              </p>
              <button className="btn primary" onClick={() => openTest('T1')}>Ruhepuls eintragen</button>
              {firstOpenTest && (
                <button className="btn ghost" style={{ color: 'var(--offwhite)', borderColor: 'var(--offwhite)' }} onClick={() => openTest(firstOpenTest.id)}>
                  Oder gleich mit dem Testtag beginnen
                </button>
              )}
            </>
          )}
          {step.kind === 'test' && (
            <>
              <h1>{testDef(step.testId).name}</h1>
              <p className="muted">
                {step.remaining === others.length ? 'Testtag: Plane etwa eine Stunde ein und leg das Material bereit (unten).' : `Noch ${step.remaining} von ${others.length} Tests am Testtag.`}
                {' '}{testDef(step.testId).short}.
              </p>
              <button className="btn primary" onClick={() => openTest(step.testId)}>Test starten</button>
              {!pulseSummary.done && (
                <p className="muted small">Ruhepuls heute schon eingetragen ({pulseCount} von {RESTING_PULSE_MIN_MORNINGS}). Morgen früh weiter.</p>
              )}
            </>
          )}
        </div>
      )}

      {unlocked && (
        <div className="card">
          <Stepper unlocked={unlocked} pulseDone={pulseSummary.done} pulseCount={pulseCount} testsDone={testsDone} testsTotal={others.length} />
        </div>
      )}

      {unlocked && step.kind !== 'fertig' && step.kind !== 'ruhepulsRest' && (
        <details className="card" open={testsDone === 0}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Was du für den Testtag brauchst</summary>
          <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
            {MATERIAL.map((m) => <li key={m}>{m}</li>)}
          </ul>
          <p className="muted small">Reihenfolge: Beweglichkeit, Balance, Kraft, den Gehtest zuletzt. Bei einem Warnzeichen sofort aufhören.</p>
        </details>
      )}

      <div className="card">
        <span className="label">Alle Tests</span>
        {TESTS.map((t) => {
          const s = summarize(data.records, t.id, timepoint);
          return (
            <button key={t.id} className={`test-row ${s.done ? 'done' : ''}`} disabled={!unlocked} onClick={() => openTest(t.id)}>
              <span className="test-code">{s.done ? <Icon.check /> : t.id}</span>
              <span style={{ flex: 1 }}>
                <strong>{t.name}</strong>
                <span className="muted" style={{ display: 'block' }}>{s.done || s.text !== 'offen' ? s.text : t.short}</span>
              </span>
              <span aria-hidden="true" className="muted">›</span>
            </button>
          );
        })}
      </div>

      <div className="card">
        <Seg label="Messzeitpunkt" value={timepoint} onChange={setTimepoint} options={TIMEPOINTS.map((t) => ({ value: t.id, label: t.label }))} />
        <p className="muted small">
          {base ? `Baseline begonnen am ${formatDate(base)}, heute ist Tag ${day}. ` : ''}
          {timepoint === suggested ? `Vorschlag der App: ${timepointLabel(suggested)}.` : `Manuell gewählt (Vorschlag wäre ${timepointLabel(suggested)}). Das wird bei der Messung vermerkt.`}
        </p>
      </div>
    </>
  );
}
