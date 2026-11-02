import { useMemo, useState } from 'react';
import { MARKERS, evaluateValue, marker, validateValue, type ValueEvaluation } from '../logic/labs';
import type { HealthState, LabValue } from '../types';
import { formatDate, todayIso, uid } from '../../store';
import { LabUpload } from './LabUpload';

function StatusChip({ ev }: { ev: ValueEvaluation }) {
  if (ev.status === 'imBereich') return <span className="chip ok">Im Bereich</span>;
  if (ev.status === 'ausserhalb') return <span className="chip out">Außerhalb{ev.direction ? ` (${ev.direction})` : ''}</span>;
  if (ev.status === 'nurAnzeige') return <span className="chip neutral">Nur Anzeige</span>;
  return <span className="chip watch">Bereich fehlt</span>;
}

function parseNum(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function fmt(n: number | null): string {
  return n === null ? '–' : String(n).replace('.', ',');
}

export function LabsScreen({ data, update }: { data: HealthState; update: (fn: (d: HealthState) => HealthState) => void }) {
  const [reportId, setReportId] = useState<string | null>(data.reports.at(-1)?.id ?? null);
  const [rDate, setRDate] = useState(todayIso());
  const [rLab, setRLab] = useState('');

  const [mKey, setMKey] = useState(MARKERS[0].key);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(MARKERS[0].defaultUnit);
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const reports = useMemo(() => [...data.reports].sort((a, b) => b.date.localeCompare(a.date)), [data.reports]);
  const showHormoneNote = data.values.some((v) => marker(v.marker).displayOnly);

  function addReport() {
    const id = uid();
    update((d) => ({ ...d, reports: [...d.reports, { id, date: rDate, lab: rLab.trim() || 'Labor' }] }));
    setReportId(id);
    setRLab('');
  }

  function addValue() {
    if (!reportId) return;
    const n = parseNum(value);
    const candidate = { marker: mKey, value: n ?? NaN, unit: unit.trim(), refLow: parseNum(low), refHigh: parseNum(high) };
    const errs = validateValue(candidate);
    setErrors(errs);
    if (errs.length) return;
    const v: LabValue = { id: uid(), reportId, ...candidate };
    update((d) => ({ ...d, values: [...d.values, v] }));
    setValue('');
    setLow('');
    setHigh('');
  }

  return (
    <>
      <div className="card dark">
        <span className="label">Blutwerte</span>
        <h2>Bewertet wird nur gegen den Bereich deines Labors.</h2>
        <p className="muted">Normbereiche unterscheiden sich je Labor, Alter und Geschlecht. Trag deshalb den Referenzbereich aus dem Befund mit ein.</p>
      </div>

      <LabUpload data={data} update={update} onSaved={(id) => setReportId(id)} />

      <div className="card">
        <span className="label">Oder von Hand eintragen · 1 · Befund anlegen</span>
        <div className="grid2">
          <label className="field">Datum<input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} /></label>
          <label className="field">Labor<input type="text" placeholder="Name des Labors" value={rLab} onChange={(e) => setRLab(e.target.value)} /></label>
        </div>
        <button className="btn dark" onClick={addReport}>Befund anlegen</button>
        {reports.length > 0 && (
          <label className="field">Werte eintragen für
            <select value={reportId ?? ''} onChange={(e) => setReportId(e.target.value)}>
              {reports.map((r) => <option key={r.id} value={r.id}>{formatDate(r.date)} · {r.lab}</option>)}
            </select>
          </label>
        )}
      </div>

      {reportId && (
        <div className="card">
          <span className="label">2 · Wert eintragen</span>
          <label className="field">Wert
            <select value={mKey} onChange={(e) => { setMKey(e.target.value); setUnit(marker(e.target.value).defaultUnit); }}>
              {MARKERS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </label>
          <div className="grid2">
            <label className="field">Ergebnis<input type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} /></label>
            <label className="field">Einheit<input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} /></label>
            <label className="field">Referenz von<input type="text" inputMode="decimal" placeholder="untere Grenze" value={low} onChange={(e) => setLow(e.target.value)} /></label>
            <label className="field">Referenz bis<input type="text" inputMode="decimal" placeholder="obere Grenze" value={high} onChange={(e) => setHigh(e.target.value)} /></label>
          </div>
          <p className="muted">Steht im Befund nur „&lt; 5“, lass „von“ leer und trag 5 bei „bis“ ein.</p>
          {errors.length > 0 && <div className="card alert" role="alert">{errors.map((e) => <p key={e} className="small">{e}</p>)}</div>}
          <button className="btn primary" onClick={addValue}>Wert speichern</button>
        </div>
      )}

      {reports.map((r) => {
        const vals = data.values.filter((v) => v.reportId === r.id);
        return (
          <div className="card" key={r.id}>
            <div className="row between">
              <span className="label">{formatDate(r.date)} · {r.lab}</span>
              <button className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={() => setConfirmDel(r.id)}>
                Löschen
              </button>
            </div>
            {confirmDel === r.id && (
              <div className="card alert">
                <p className="small"><strong>Befund mit allen Werten löschen?</strong> Das lässt sich nicht rückgängig machen.</p>
                <div className="row">
                  <button className="btn danger" onClick={() => { update((d) => ({ ...d, reports: d.reports.filter((x) => x.id !== r.id), values: d.values.filter((v) => v.reportId !== r.id) })); setConfirmDel(null); }}>Ja, löschen</button>
                  <button className="btn ghost" onClick={() => setConfirmDel(null)}>Abbrechen</button>
                </div>
              </div>
            )}
            {vals.length === 0 ? <p className="muted">Noch keine Werte.</p> : (
              <div className="stack">
                {vals.map((v) => {
                  const ev = evaluateValue(v);
                  const m = marker(v.marker);
                  return (
                    <div key={v.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                      <div className="row between">
                        <strong>{m.label}</strong>
                        <StatusChip ev={ev} />
                      </div>
                      <div className="row between">
                        <span className="big-num">{fmt(v.value)} <span className="muted">{v.unit}</span></span>
                        <span className="muted num">Labor: {fmt(v.refLow)} – {fmt(v.refHigh)}</span>
                      </div>
                      <p className="muted">{ev.status === 'imBereich' ? ev.message : `Hinweis: ${ev.message}.`}</p>
                      <button className="btn ghost" style={{ minHeight: 32, fontSize: 12, padding: '0 10px', marginTop: 6 }}
                        onClick={() => update((d) => ({ ...d, values: d.values.filter((x) => x.id !== v.id) }))}>
                        Wert entfernen
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {showHormoneNote && (
        <div className="card">
          <span className="label">Zu den Hormonwerten</span>
          <p className="small">
            Hormonelle Veränderungen, etwa in den Wechseljahren, können Gelenkschmerzen mitverursachen. Andere Ursachen wie Arthrose kommen ebenso infrage.
            Die App ordnet Beschwerden deshalb nicht selbst zu; besprich die Werte bei deiner Gynäkologin oder deinem Gynäkologen.
          </p>
        </div>
      )}
      <p className="footer-note">Die Ampel zeigt nur „im Bereich“ oder „außerhalb“. Die Spannen für „beobachten“ legt noch eine Fachperson fest.</p>
    </>
  );
}
