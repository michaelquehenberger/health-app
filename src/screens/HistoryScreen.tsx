import { useMemo } from 'react';
import { regionInfo } from '../data/exercises';
import { evaluateValue, marker } from '../logic/labs';
import { PAIN_LIMIT } from '../logic/plan';
import type { AppData } from '../types';
import { formatDate } from '../store';

function PainChart({ points }: { points: { date: string; before: number | null; after: number | null }[] }) {
  const W = 320, H = 160, L = 28, R = 8, T = 10, B = 26;
  const n = points.length;
  const x = (i: number) => (n <= 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + ((10 - v) * (H - T - B)) / 10;
  const line = (key: 'before' | 'after') =>
    points.map((p, i) => (p[key] === null ? null : `${x(i)},${y(p[key]!)}`)).filter(Boolean).join(' ');

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Schmerzverlauf über ${n} Tage, vor und nach der Einheit`}>
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#D5DDE2" strokeDasharray={v === PAIN_LIMIT ? '4 4' : undefined} />
            <text x={L - 6} y={y(v) + 4} fontSize="11" textAnchor="end" fill="#51606F">{v}</text>
          </g>
        ))}
        <text x={W - R} y={y(PAIN_LIMIT) - 4} fontSize="10" textAnchor="end" fill="#51606F">Grenze {PAIN_LIMIT}</text>
        <polyline points={line('before')} fill="none" stroke="#0A1B2E" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={line('after')} fill="none" stroke="#00B386" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.date}>
            {p.before !== null && <circle cx={x(i)} cy={y(p.before)} r="3.5" fill="#0A1B2E" />}
            {p.after !== null && <rect x={x(i) - 3.5} y={y(p.after) - 3.5} width="7" height="7" fill="#00B386" />}
          </g>
        ))}
        {points.length > 0 && (
          <>
            <text x={x(0)} y={H - 8} fontSize="11" fill="#51606F" textAnchor={n > 1 ? 'start' : 'middle'}>{formatDate(points[0].date).slice(0, 5)}</text>
            {n > 1 && <text x={x(n - 1)} y={H - 8} fontSize="11" fill="#51606F" textAnchor="end">{formatDate(points[n - 1].date).slice(0, 5)}</text>}
          </>
        )}
      </svg>
      <div className="legend">
        <span><i style={{ background: '#0A1B2E' }} />vorher (Kreis)</span>
        <span><i style={{ background: '#00B386' }} />nachher (Quadrat)</span>
      </div>
    </div>
  );
}

export function HistoryScreen({ data }: { data: AppData }) {
  const points = useMemo(
    () => [...data.feedback]
      .filter((f) => f.painBefore !== null || f.painAfter !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-28)
      .map((f) => ({ date: f.date, before: f.painBefore, after: f.painAfter })),
    [data.feedback],
  );

  const doneDays = data.feedback.filter((f) => f.done.length > 0).length;
  const reportDate = new Map(data.reports.map((r) => [r.id, r.date]));
  const byMarker = new Map<string, typeof data.values>();
  for (const v of data.values) byMarker.set(v.marker, [...(byMarker.get(v.marker) ?? []), v]);
  const complaints = [...data.complaints].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="card">
        <span className="label">Schmerz · letzte 4 Wochen</span>
        {points.length === 0 ? <p className="muted">Noch keine Einträge. Sie entstehen über die Rückfrage auf der Tageskarte.</p> : <PainChart points={points} />}
        <p className="muted">Tage mit mindestens einer erledigten Übung: <strong className="num">{doneDays}</strong></p>
      </div>

      <div className="card">
        <span className="label">Blutwerte im Verlauf</span>
        {byMarker.size === 0 ? <p className="muted">Noch keine Werte.</p> : (
          <table className="table">
            <thead><tr><th>Wert</th><th>Datum</th><th>Ergebnis</th></tr></thead>
            <tbody>
              {[...byMarker.entries()].flatMap(([k, vals]) =>
                [...vals].sort((a, b) => (reportDate.get(b.reportId) ?? '').localeCompare(reportDate.get(a.reportId) ?? '')).map((v, i) => {
                  const st = evaluateValue(v).status;
                  return (
                    <tr key={v.id}>
                      <td>{i === 0 ? marker(k).label : ''}</td>
                      <td className="num">{formatDate(reportDate.get(v.reportId) ?? '')}</td>
                      <td className="num">
                        {String(v.value).replace('.', ',')} {v.unit}{' '}
                        {st === 'ausserhalb' && <span className="chip out">außerhalb</span>}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <span className="label">Beschwerden</span>
        {complaints.length === 0 ? <p className="muted">Noch keine Einträge.</p> : (
          <table className="table">
            <thead><tr><th>Datum</th><th>Region</th><th>Stärke</th></tr></thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="num">{formatDate(c.date)}</td>
                  <td>{regionInfo(c.region).label}{c.active ? '' : ' (abgeschlossen)'}</td>
                  <td className="num">{c.intensity}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
