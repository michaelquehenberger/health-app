import { useRef, useState } from 'react';
import { formatDate, todayIso, addDays } from '../../store';
import type { HealthState } from '../types';
import { CSV_TEMPLATE, parseWearableCsv } from '../wearables/csv';
import { mergeWearableDays } from '../wearables/days';
import { OURA_TOKEN_DAYS, OuraError, buildAuthUrl, connectionExpired, fetchOuraDays } from '../wearables/oura';

export const OURA_CLIENT_KEY = 'livion-oura-client';
export const OURA_STATE_KEY = 'livion-oura-state';

function redirectUri(): string {
  return window.location.origin + window.location.pathname;
}

function fmt(n: number | null, digits = 0): string {
  return n === null ? '–' : n.toFixed(digits).replace('.', ',');
}

export function WearablesPanel({ data, update }: { data: HealthState; update: (fn: (d: HealthState) => HealthState) => void }) {
  const [clientId, setClientId] = useState(() => data.oura?.clientId ?? localStorage.getItem(OURA_CLIENT_KEY) ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const oura = data.oura;
  const expired = oura ? connectionExpired(oura) : false;

  function connect() {
    const id = clientId.trim();
    if (!id) return;
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
      localStorage.setItem(OURA_CLIENT_KEY, id);
      sessionStorage.setItem(OURA_STATE_KEY, state);
    } catch {
      setStatus('Der Browser blockiert das Speichern. Bitte kein privates Fenster verwenden.');
      return;
    }
    window.location.href = buildAuthUrl(id, redirectUri(), state);
  }

  async function sync() {
    if (!oura) return;
    setBusy(true);
    setStatus(null);
    const end = todayIso();
    try {
      const days = await fetchOuraDays(oura.accessToken, addDays(end, -29), end);
      update((d) => ({ ...d, wearables: mergeWearableDays(d.wearables, days), oura: d.oura ? { ...d.oura, lastSync: new Date().toISOString() } : d.oura }));
      setStatus(`${days.length} Tage von Oura geladen.`);
    } catch (e) {
      setStatus(e instanceof OuraError ? e.message : 'Unbekannter Fehler beim Abruf.');
    } finally {
      setBusy(false);
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    const { days, errors } = parseWearableCsv(await f.text());
    if (days.length) update((d) => ({ ...d, wearables: mergeWearableDays(d.wearables, days) }));
    setStatus(
      [days.length ? `${days.length} Tage importiert.` : 'Nichts importiert.', ...errors.slice(0, 3), errors.length > 3 ? `… und ${errors.length - 3} weitere Hinweise.` : ''].filter(Boolean).join(' '),
    );
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wearable-vorlage.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const recent = [...data.wearables].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  return (
    <>
      <div className="card">
        <span className="label">Oura</span>
        {!oura && (
          <>
            <p className="small">Der Login läuft direkt zwischen deinem Browser und Oura, ohne eigenen Server. Er gilt etwa {OURA_TOKEN_DAYS} Tage; danach verbindest du neu. Du brauchst eine eigene App in Ouras Entwicklerbereich.</p>
            <label className="field">Client-ID deiner Oura-App
              <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} autoComplete="off" />
            </label>
            <p className="small muted">Tippe in der Oura-App-Verwaltung als Weiterleitungsadresse exakt ein: <strong style={{ wordBreak: 'break-all' }}>{redirectUri()}</strong></p>
            <button className="btn dark" disabled={!clientId.trim()} onClick={connect}>Mit Oura verbinden</button>
          </>
        )}
        {oura && (
          <>
            <p className="small">
              {expired ? <span className="chip out">Abgelaufen</span> : <span className="chip ok">Verbunden</span>}{' '}
              {expired ? 'Bitte neu verbinden.' : `Gültig bis ${formatDate(oura.expiresAt.slice(0, 10))}.`}
              {oura.lastSync ? ` Letzter Abruf: ${formatDate(oura.lastSync.slice(0, 10))}.` : ''}
            </p>
            <div className="row">
              <button className="btn primary" disabled={busy || expired} onClick={sync}>{busy ? 'Lade …' : 'Letzte 30 Tage abrufen'}</button>
              {expired && <button className="btn dark" onClick={connect}>Neu verbinden</button>}
            </div>
            {!confirmDisconnect ? (
              <button className="btn ghost" onClick={() => setConfirmDisconnect(true)}>Verbindung trennen</button>
            ) : (
              <div className="card note">
                <p className="small">Die App löscht den Zugang auf diesem Gerät. Entziehe den Zugriff zusätzlich in deinem Oura-Konto. Bereits geladene Tage bleiben, bis du alle Daten löschst.</p>
                <div className="row">
                  <button className="btn danger" onClick={() => { update((d) => ({ ...d, oura: null })); setConfirmDisconnect(false); }}>Ja, trennen</button>
                  <button className="btn ghost" onClick={() => setConfirmDisconnect(false)}>Abbrechen</button>
                </div>
              </div>
            )}
          </>
        )}
        <p className="muted" style={{ fontSize: 12 }}>Schlafdaten erscheinen erst, wenn der Ring in der Oura-App synchronisiert wurde. Die App wertet nichts mit KI aus; sie rechnet nur lokal Durchschnitte.</p>
      </div>

      <div className="card">
        <span className="label">Garmin und andere: Datei einlesen</span>
        <p className="small">Garmin gibt privaten Entwicklern derzeit keinen direkten Zugang. Ersatz: Tabelle mit Datum, Schlaf, Ruhepuls und HRV einlesen. Wie der Export aus dem Garmin-Konto in dieses Format kommt, ist noch nicht geprüft.</p>
        <div className="row">
          <button className="btn ghost" onClick={downloadTemplate}>Vorlage laden</button>
          <button className="btn dark" onClick={() => file.current?.click()}>Datei einlesen (CSV)</button>
        </div>
        <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>

      {status && <p className="small" role="status">{status}</p>}

      {recent.length > 0 && (
        <div className="card">
          <span className="label">Letzte Tage</span>
          <table className="table">
            <thead><tr><th>Tag</th><th>Schlaf h</th><th>Ruhepuls</th><th>HRV</th><th>Quelle</th></tr></thead>
            <tbody>
              {recent.map((d) => (
                <tr key={d.date + d.source}>
                  <td className="num">{formatDate(d.date)}</td>
                  <td className="num">{fmt(d.sleepHours, 1)}</td>
                  <td className="num">{fmt(d.restingHr)}</td>
                  <td className="num">{fmt(d.hrv)}</td>
                  <td>{d.source === 'oura' ? 'Oura' : 'Datei'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
