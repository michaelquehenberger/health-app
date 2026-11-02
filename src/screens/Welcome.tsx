import { useState } from 'react';
import { Check, Wordmark } from '../components/ui';
import type { Consent } from '../types';
import { APP_LANGUAGE, APP_VERSION } from '../version';

export const CONSENT_VERSION = '2026-11-01-mvp';

export function Welcome({ onAccept }: { onAccept: (c: Consent) => void }) {
  const [info, setInfo] = useState(false);
  const [data, setData] = useState(false);
  return (
    <div className="app" style={{ paddingBottom: 32 }}>
      <div className="topbar"><Wordmark /><span className="badge-test">Testphase</span></div>
      <div className="card dark">
        <span className="label">Willkommen</span>
        <h1>Messen. Wiederholen. Fortschritt sehen.</h1>
        <p className="muted">
          Du machst ein paar einfache Tests zu Beweglichkeit, Balance, Kraft und Ausdauer. Nach 30 und 90 Tagen wiederholst du sie und siehst
          deinen persönlichen Verlauf.
        </p>
      </div>
      <div className="card">
        <h2>Bevor es losgeht</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
          <li><strong>Keine Diagnose.</strong> Die App ersetzt keine ärztliche Beratung.</li>
          <li><strong>Sicherheit zuerst.</strong> Vor den Tests füllst du den Fragebogen PAR-Q+ aus. Ohne Freigabe bleiben die Tests gesperrt.</li>
          <li><strong>Nur auf diesem Gerät.</strong> Es gibt keinen Server und kein Konto. Gespeichert wird eine Teilnehmer-ID, kein Name. Du kannst alles exportieren und löschen.</li>
        </ul>
        <Check checked={info} onChange={setInfo}>Ich habe verstanden, dass die App nur informiert und keine ärztliche Beratung ersetzt.</Check>
        <Check checked={data} onChange={setData}>
          Ich willige ein, dass meine Angaben (Profil, Fragebogen-Ergebnis, Testwerte) auf diesem Gerät gespeichert werden. Ich kann die
          Einwilligung jederzeit widerrufen, indem ich alle Daten lösche.
        </Check>
        <button className="btn primary block" disabled={!info || !data} onClick={() => onAccept({ acceptedAt: new Date().toISOString(), textVersion: CONSENT_VERSION, appVersion: APP_VERSION, language: APP_LANGUAGE })}>
          Weiter zum Profil
        </button>
      </div>
    </div>
  );
}
