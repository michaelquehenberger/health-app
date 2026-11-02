import { useState } from 'react';
import { TESTS, TIMEPOINTS } from '../tests';
import { summarize } from '../results';
import type { AppData, Profile, TestRecord } from '../types';
import { ResultView } from './TestScreen';
import { formatDate } from '../store';

export function HistoryScreen({ data, profile }: { data: AppData; profile: Profile }) {
  const womenIndex = data.settings?.womenIndex ?? false;
  const [detail, setDetail] = useState<TestRecord | null>(null);

  if (detail) {
    return (
      <>
        <button className="btn ghost" style={{ alignSelf: 'flex-start', minHeight: 40 }} onClick={() => setDetail(null)}>← Verlauf</button>
        <ResultView record={detail} profile={profile} womenIndex={womenIndex} />
      </>
    );
  }

  return (
    <>
      <div className="card dark">
        <span className="label">Verlauf</span>
        <h1>Dein Vergleich ist dein eigener Startwert.</h1>
        <p className="muted">Je Test: Baseline, Tag 30 und Tag 90.</p>
      </div>

      {TESTS.map((t) => {
        const rows = TIMEPOINTS.map((tp) => ({ tp, s: summarize(data.records, t.id, tp.id) }));
        const records = rows.flatMap((r) => r.s.records);
        return (
          <div className="card" key={t.id}>
            <span className="label">{t.id} · {t.name}</span>
            <table className="table">
              <tbody>
                {rows.map(({ tp, s }) => (
                  <tr key={tp.id}>
                    <th scope="row" style={{ width: 90 }}>{tp.label}</th>
                    <td className="num">{s.text === 'offen' ? <span className="muted">–</span> : s.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length > 0 && (
              <details>
                <summary className="small" style={{ cursor: 'pointer' }}>Alle Messungen ({records.length})</summary>
                <div className="stack" style={{ marginTop: 8 }}>
                  {records.map((r) => (
                    <button key={r.id} className="btn ghost" style={{ justifyContent: 'space-between', minHeight: 40, fontWeight: 500 }} onClick={() => setDetail(r)} disabled={!!r.aborted}>
                      <span>{formatDate(r.date)} {r.time}</span>
                      <span>{r.aborted ? `abgebrochen: ${r.aborted}` : `Qualität ${r.quality}`}</span>
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}
    </>
  );
}
