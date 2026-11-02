import { TESTS, TIMEPOINTS } from '../tests';
import { Icon, Seg } from '../components/ui';
import { baselineDate, summarize } from '../results';
import type { AppData, TestId, Timepoint } from '../types';
import { daysBetween, formatDate, todayIso } from '../store';
import { timepointLabel } from '../tests';

export function FolderScreen({ data, unlocked, timepoint, suggested, setTimepoint, openTest, openGate }: {
  data: AppData;
  unlocked: boolean;
  timepoint: Timepoint;
  suggested: Timepoint;
  setTimepoint: (t: Timepoint) => void;
  openTest: (id: TestId) => void;
  openGate: () => void;
}) {
  const base = baselineDate(data.records);
  const day = base ? daysBetween(base, todayIso()) : null;
  const doneCount = TESTS.filter((t) => summarize(data.records, t.id, timepoint).done).length;

  return (
    <>
      <div className="card dark">
        <span className="label">Testmappe</span>
        <h1>{doneCount} von {TESTS.length} Tests</h1>
        <p className="muted">
          {base ? `Baseline begonnen am ${formatDate(base)} · heute ist Tag ${day}` : 'Noch keine Messung. Starte mit der Baseline.'}
        </p>
        <Seg label="Messzeitpunkt" value={timepoint} onChange={setTimepoint} options={TIMEPOINTS.map((t) => ({ value: t.id, label: t.label }))} />
        <p className="muted small">
          {timepoint === suggested ? `Vorschlag der App: ${timepointLabel(suggested)}. Du kannst ihn jederzeit ändern.` : `Manuell gewählt (Vorschlag wäre ${timepointLabel(suggested)}). Das wird bei der Messung vermerkt.`}
        </p>
      </div>

      {!unlocked && (
        <div className="card alert">
          <span className="label">Gesperrt</span>
          <h2>Erst die Anamnese.</h2>
          <p className="small">Ohne gültige Freigabe aus dem Fragebogen PAR-Q+ bleiben die Tests gesperrt.</p>
          <button className="btn dark" onClick={openGate}>Zur Anamnese</button>
        </div>
      )}

      <div className="card">
        <span className="label">Reihenfolge am Testtag</span>
        <p className="muted">Ruhepuls am Morgen, dann Beweglichkeit, Balance, Kraft und den Gehtest zuletzt.</p>
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
      <p className="footer-note">Nicht im MVP: Back-Scratch-Test (T6), 6-Minuten-Gehtest, Handkraft.</p>
    </>
  );
}
