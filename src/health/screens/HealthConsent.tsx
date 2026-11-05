import { inClaude } from '../../platform';
import { useState } from 'react';
import { Check } from '../../components/ui';
import type { Consent } from '../../types';
import { APP_LANGUAGE, APP_VERSION } from '../../version';

export const HEALTH_CONSENT_VERSION = inClaude ? '2026-11-05-gesundheit-claude' : '2026-11-02-gesundheit';

/** Eigene Einwilligung für das Gesundheitsmodul, getrennt von der Grund-Einwilligung (Übergabe 5.4: nicht bündeln). */
export function HealthConsent({ onAccept }: { onAccept: (c: Consent) => void }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="card">
      <span className="label">Einwilligung für Gesundheitsdaten</span>
      <h2>Bevor du Blutwerte, Beschwerden und Oura-Daten einträgst</h2>
      <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
        <li><strong>Keine Diagnose.</strong> Die Hinweise sind allgemeine Information und ersetzen keine ärztliche Beratung.</li>
        {inClaude ? (
          <li><strong>Privat in deinem Claude-Konto.</strong> Blutwerte, Beschwerden, Allergien, Medikamente und Wearable-Daten sind Gesundheitsdaten. Sie liegen im privaten Speicher dieser Seite auf claude.ai; nur du kannst sie lesen. An die KI gehen sie nur mit einer eigenen Einwilligung.</li>
        ) : (
          <li><strong>Nur auf diesem Gerät.</strong> Blutwerte, Beschwerden, Allergien, Medikamente und Wearable-Daten sind Gesundheitsdaten. Sie bleiben in diesem Browser; es gibt keinen Server.</li>
        )}
        <li><strong>Export und Löschen.</strong> Die Sicherungsdatei enthält diese Daten; bewahre sie sicher auf. Unter „Mehr“ löschst du alles.</li>
      </ul>
      <Check checked={ok} onChange={setOk}>
        Ich willige ein, dass meine Gesundheitsdaten (Befunde, Beschwerden, Profilangaben, Wearable-Daten) {inClaude ? 'im privaten Speicher dieser Seite' : 'auf diesem Gerät'} gespeichert werden. Ich kann die Einwilligung jederzeit widerrufen, indem ich alle Daten lösche.
      </Check>
      <button className="btn primary block" disabled={!ok} onClick={() => onAccept({ acceptedAt: new Date().toISOString(), textVersion: HEALTH_CONSENT_VERSION, appVersion: APP_VERSION, language: APP_LANGUAGE })}>
        Einwilligen und weiter
      </button>
    </div>
  );
}
