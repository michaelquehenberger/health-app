import { useRef, useState } from 'react';
import type { AppData, Profile } from '../types';
import { exportCsv, exportJson, formatDate, parseData } from '../store';
import { ProfileForm } from './ProfileForm';
import { PARQ_ATTRIBUTION } from '../tests';

export function SettingsScreen({ data, update, replace, reset, openGate }: {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  replace: (d: AppData) => void;
  reset: () => void;
  openGate: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  async function onImport(f: File | undefined) {
    if (!f) return;
    const parsed = parseData(await f.text());
    if (!parsed) {
      setImportMsg('Die Datei ist kein gültiger Export dieser App.');
      return;
    }
    setImportMsg(null);
    setPendingImport(parsed);
  }

  return (
    <>
      <ProfileForm
        initial={data.profile}
        submitLabel={saved ? 'Gespeichert' : 'Profil speichern'}
        onSave={(p: Profile) => { update((d) => ({ ...d, profile: p })); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
      />

      <div className="card">
        <span className="label">Sicherheitscheck</span>
        <p className="small">{data.gate?.status === 'freigegeben' ? `Freigegeben am ${formatDate(data.gate.date)}.` : 'Noch nicht freigegeben.'}</p>
        <button className="btn ghost" onClick={openGate}>Sicherheitscheck öffnen</button>
      </div>

      <div className="card">
        <span className="label">Einwilligung und Daten</span>
        {data.consent && <p className="small">Einwilligung am {formatDate(data.consent.acceptedAt.slice(0, 10))} (Textversion {data.consent.textVersion}).</p>}
        <p className="small">Alle Angaben liegen nur in diesem Browser auf diesem Gerät.</p>
        <button className="btn dark" onClick={() => exportJson(data)}>Sicherung exportieren (Datei)</button>
        <button className="btn ghost" onClick={() => exportCsv(data)}>Messwerte als Tabelle (CSV)</button>
        <button className="btn ghost" onClick={() => file.current?.click()}>Sicherung importieren</button>
        <input ref={file} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
        {pendingImport && (
          <div className="card note">
            <p className="small">Die Datei enthält {pendingImport.records.length} Messungen. Der Import ersetzt alle Daten auf diesem Gerät.</p>
            <div className="row">
              <button className="btn dark" onClick={() => { replace(pendingImport); setImportMsg(`Importiert: ${pendingImport.records.length} Messungen.`); setPendingImport(null); }}>Ja, importieren</button>
              <button className="btn ghost" onClick={() => setPendingImport(null)}>Abbrechen</button>
            </div>
          </div>
        )}
        {importMsg && <p className="small" role="status">{importMsg}</p>}
        {!confirmDelete ? (
          <button className="btn danger" onClick={() => setConfirmDelete(true)}>Alle Daten löschen</button>
        ) : (
          <div className="card alert">
            <p className="small"><strong>Wirklich alles löschen?</strong> Profil, Freigabe, alle Messungen und die Einwilligung werden unwiderruflich entfernt.</p>
            <div className="row">
              <button className="btn danger" onClick={reset}>Ja, alles löschen</button>
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
            </div>
          </div>
        )}
      </div>
      <p className="footer-note">LIVION MVP · keine Diagnose · {PARQ_ATTRIBUTION}</p>
    </>
  );
}
