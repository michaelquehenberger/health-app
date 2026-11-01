import { useState } from 'react';
import type { AppData, Profile } from '../types';
import { exportJson, formatDate } from '../store';
import { ProfileForm } from './ProfileForm';
import { RULES_VERSION } from '../logic/plan';

export function SettingsScreen({ data, update, reset }: { data: AppData; update: (fn: (d: AppData) => AppData) => void; reset: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <ProfileForm
        initial={data.profile}
        submitLabel={saved ? 'Gespeichert' : 'Profil speichern'}
        onSave={(p: Profile) => { update((d) => ({ ...d, profile: p })); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
      />
      <div className="card">
        <span className="label">Deine Daten</span>
        <p className="small">Alle Angaben liegen nur in diesem Browser auf diesem Gerät. Es gibt keinen Server und keine Weitergabe.</p>
        {data.consent && <p className="muted">Einwilligung am {formatDate(data.consent.acceptedAt.slice(0, 10))} (Textversion {data.consent.textVersion})</p>}
        <button className="btn dark" onClick={() => exportJson(data)}>Daten exportieren (JSON)</button>
        <button className="btn danger" onClick={() => { if (confirm('Alle Daten und die Einwilligung unwiderruflich löschen?')) reset(); }}>
          Alle Daten löschen
        </button>
      </div>
      <div className="card">
        <span className="label">Erinnerung</span>
        <p className="small">Erinnerungen per E-Mail oder Push kommen mit dem Server in einem späteren Schritt. Bis dahin hilft ein Wecker oder ein Kalendereintrag.</p>
      </div>
      <p className="footer-note">LIVION Testphase · Regeln {RULES_VERSION} · keine Diagnose, keine Therapieempfehlung</p>
    </>
  );
}
