import { useRef, useState } from 'react';
import type { AppData, Profile } from '../types';
import { exportCsv, exportJson, formatDate, parseData, todayIso } from '../store';
import { anamnesisValid, latestAnamnesis } from '../parq';
import { ProfileForm } from './ProfileForm';
import { Check } from '../components/ui';

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
  const [confirmExport, setConfirmExport] = useState(false);
  const current = latestAnamnesis(data.anamneses);
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
        <span className="label">Anamnese (PAR-Q+)</span>
        <p className="small">{anamnesisValid(current, todayIso()) && current ? `Gültig bis ${formatDate(current.validUntil)}.` : 'Keine gültige Freigabe.'}</p>
        <button className="btn ghost" onClick={openGate}>Anamnese ansehen oder erneuern</button>
      </div>

      <div className="card">
        <span className="label">Auswertung</span>
        <Check checked={data.settings?.womenIndex ?? false} onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, womenIndex: v } }))}>
          Frauenindex anzeigen (UKK-Gehtest). Die Formel für Frauen ist noch nicht am Original geprüft; der Index wird als „vorläufig“ markiert.
        </Check>
      </div>

      <div className="card">
        <span className="label">Einwilligung und Daten</span>
        {data.consent && <p className="small">Einwilligung am {formatDate(data.consent.acceptedAt.slice(0, 10))} (Textversion {data.consent.textVersion}).</p>}
        <p className="small">Alle Angaben liegen nur in diesem Browser auf diesem Gerät.</p>
        {!confirmExport ? (
          <button className="btn dark" onClick={() => setConfirmExport(true)}>Sicherung exportieren (Datei)</button>
        ) : (
          <div className="card note">
            <p className="small"><strong>Achtung, Gesundheitsdaten:</strong> Die Sicherung enthält deine Anamnese-Antworten und Freitexte. Bewahre die Datei sicher auf und gib sie nicht weiter.</p>
            <div className="row">
              <button className="btn dark" onClick={() => { exportJson(data); setConfirmExport(false); }}>Verstanden, exportieren</button>
              <button className="btn ghost" onClick={() => setConfirmExport(false)}>Abbrechen</button>
            </div>
          </div>
        )}
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
            <p className="small"><strong>Wirklich alles löschen?</strong> Profil, Anamnesen, alle Messungen und die Einwilligung werden unwiderruflich entfernt.</p>
            <div className="row">
              <button className="btn danger" onClick={reset}>Ja, alles löschen</button>
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
            </div>
          </div>
        )}
      </div>
      <p className="footer-note">LIVION MVP · keine Diagnose · PAR-Q+ © 2024 PAR-Q+ Collaboration | Hochschule für Gesundheit Bochum</p>
    </>
  );
}
