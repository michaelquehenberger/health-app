// Befund hochladen (PDF oder Foto), per KI auslesen, Werte prüfen und übernehmen.
import { useRef, useState } from 'react';
import { Check } from '../../components/ui';
import { MARKERS, marker, validateValue } from '../logic/labs';
import { extractLabReport, isIsoDate, LabExtractError, markerKeyFor } from '../ai/labExtract';
import { CLAUDE_APP_URL, useAiAvailable } from '../ai/useAi';
import type { HealthState, LabValue } from '../types';
import { todayIso, uid } from '../../store';
import { APP_LANGUAGE, APP_VERSION } from '../../version';

export const AI_CONSENT_VERSION = '2026-11-02-ki-befund-claude-konto';

interface Row {
  include: boolean;
  name: string;
  marker: string;
  value: string;
  unit: string;
  low: string;
  high: string;
}

const num = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const str = (n: number | null) => (n === null ? '' : String(n).replace('.', ','));

export function LabUpload({ data, update, onSaved }: { data: HealthState; update: (fn: (d: HealthState) => HealthState) => void; onSaved: (reportId: string) => void }) {
  const [consentOk, setConsentOk] = useState(false);
  const ai = useAiAvailable();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [date, setDate] = useState(todayIso());
  const [lab, setLab] = useState('');
  const [notes, setNotes] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  if (ai === null) return null;
  if (!ai) {
    return (
      <div className="card note">
        <strong>Befund-Foto mit KI-Auslesung</strong>
        <p className="small">Das Auslesen per KI gibt es in der <a href={CLAUDE_APP_URL} target="_blank" rel="noreferrer">LIVION-Version auf claude.ai</a>, dort über dein eigenes Claude-Konto. Hier trägst du die Werte unten von Hand ein.</p>
      </div>
    );
  }

  if (data.aiConsent?.textVersion !== AI_CONSENT_VERSION) {
    return (
      <div className="card">
        <span className="label">Befund hochladen · KI-Auslesung</span>
        <h3>Foto statt Abtippen</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
          <li>Das Foto wird zur Auslesung an <strong>Claude (Anthropic)</strong> geschickt, über dein eigenes Claude-Konto. Dein Name wird von der App nicht mitgeschickt; steht er im Befund, ist er auf dem Foto.</li>
          <li>Die App speichert danach nur die Werte, nicht das Foto.</li>
          <li>Du prüfst jeden erkannten Wert, bevor er übernommen wird.</li>
        </ul>
        <Check checked={consentOk} onChange={setConsentOk}>
          Ich willige ein, dass Fotos meiner Befunde zur Auslesung an Claude geschickt werden. Ich kann das jederzeit widerrufen; Werte kann ich auch von Hand eintragen.
        </Check>
        <button className="btn primary" disabled={!consentOk}
          onClick={() => update((d) => ({ ...d, aiConsent: { acceptedAt: new Date().toISOString(), textVersion: AI_CONSENT_VERSION, appVersion: APP_VERSION, language: APP_LANGUAGE } }))}>
          Einwilligen
        </button>
      </div>
    );
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError(null);
    setBusy(true);
    try {
      const r = await extractLabReport(f);
      if (r.values.length === 0) throw new LabExtractError('antwort', 'Im Befund wurden keine Blutwerte gefunden.');
      setRows(r.values.map((v) => ({
        include: true, name: v.name, marker: markerKeyFor(v), value: str(v.value), unit: v.unit, low: str(v.ref_low), high: str(v.ref_high),
      })));
      setDate(isIsoDate(r.date) ? r.date : todayIso());
      setLab(r.lab ?? '');
      setNotes(r.notes);
    } catch (e) {
      setError(e instanceof LabExtractError ? e.message : 'Die Auslesung ist fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBusy(false);
    }
  }

  const rowErrors = (rows ?? []).map((r) => (r.include
    ? validateValue({ marker: r.marker, value: num(r.value) ?? NaN, unit: r.unit.trim(), refLow: num(r.low), refHigh: num(r.high) })
    : []));
  const chosen = (rows ?? []).filter((r) => r.include).length;
  const canSave = rows !== null && chosen > 0 && rowErrors.every((e) => e.length === 0) && isIsoDate(date);

  function save() {
    if (!rows || !canSave) return;
    const reportId = uid();
    const values: LabValue[] = rows.filter((r) => r.include).map((r) => ({
      id: uid(), reportId, marker: r.marker, value: num(r.value)!, unit: r.unit.trim(), refLow: num(r.low), refHigh: num(r.high),
    }));
    update((d) => ({ ...d, reports: [...d.reports, { id: reportId, date, lab: lab.trim() || 'Labor' }], values: [...d.values, ...values] }));
    setRows(null);
    setNotes(null);
    onSaved(reportId);
  }

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="card">
      <span className="label">Befund hochladen · KI-Auslesung</span>
      {rows === null ? (
        <>
          <h3>Befund als Foto</h3>
          <p className="small">Fotografiere den Befund gerade und gut beleuchtet, eine Seite pro Foto. Hast du ein PDF, mach einen Screenshot davon. Die erkannten Werte prüfst du danach.</p>
          <button className="btn primary" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Befund wird gelesen …' : 'Foto aufnehmen oder wählen'}</button>
          {busy && <p className="muted small" role="status">Das dauert meist unter einer Minute. Beim ersten Mal fragt Claude, ob die Seite die KI nutzen darf.</p>}
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          <button className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={() => update((d) => ({ ...d, aiConsent: null }))}>KI-Einwilligung widerrufen</button>
        </>      ) : (
        <>
          <h3>Erkannte Werte prüfen</h3>
          <p className="small">Vergleiche jede Zeile mit deinem Befund. Korrigiere, was nicht stimmt, und entferne das Häkchen bei Werten, die du nicht übernehmen willst.</p>
          {notes && <div className="card note"><p className="small"><strong>Hinweis der Auslesung:</strong> {notes}</p></div>}
          <div className="grid2">
            <label className="field">Datum<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="field">Labor<input type="text" value={lab} onChange={(e) => setLab(e.target.value)} /></label>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="stack" style={{ borderTop: '1px solid var(--line)', paddingTop: 10, opacity: r.include ? 1 : 0.5 }}>
              <Check checked={r.include} onChange={(v) => setRow(i, { include: v })}><strong>{r.name}</strong>{marker(r.marker).label !== r.name && MARKERS.some((m) => m.key === r.marker) ? <span className="muted"> · {marker(r.marker).label}</span> : null}</Check>
              {r.include && (
                <div className="grid2">
                  <label className="field">Ergebnis<input type="text" inputMode="decimal" value={r.value} onChange={(e) => setRow(i, { value: e.target.value })} /></label>
                  <label className="field">Einheit<input type="text" value={r.unit} onChange={(e) => setRow(i, { unit: e.target.value })} /></label>
                  <label className="field">Referenz von<input type="text" inputMode="decimal" value={r.low} onChange={(e) => setRow(i, { low: e.target.value })} /></label>
                  <label className="field">Referenz bis<input type="text" inputMode="decimal" value={r.high} onChange={(e) => setRow(i, { high: e.target.value })} /></label>
                </div>
              )}
              {rowErrors[i].length > 0 && <p className="small" style={{ color: '#b3261e' }}>{rowErrors[i].join(' ')}</p>}
            </div>
          ))}
          <button className="btn primary block" disabled={!canSave} onClick={save}>{chosen} {chosen === 1 ? 'Wert' : 'Werte'} übernehmen</button>
          <button className="btn ghost" onClick={() => { setRows(null); setNotes(null); }}>Verwerfen</button>
        </>
      )}
      {error && <div className="card alert" role="alert"><p className="small">{error}</p></div>}
    </div>
  );
}
