import { useState } from 'react';
import { Check, Wordmark } from '../components/ui';
import type { Consent } from '../types';

export const CONSENT_VERSION = '2026-11-01-test';

export function Welcome({ onAccept }: { onAccept: (c: Consent) => void }) {
  const [info, setInfo] = useState(false);
  const [data, setData] = useState(false);
  return (
    <div className="app" style={{ paddingBottom: 32 }}>
      <div className="topbar"><Wordmark /><span className="badge-test">Testphase</span></div>
      <div className="card dark">
        <span className="label">Willkommen</span>
        <h1>Werte verstehen. In Bewegung kommen.</h1>
        <p className="muted">
          Die App macht aus deinen Beschwerden und Blutwerten einen kurzen Tagesplan: 3–5 Übungen, Trinken und ein Ernährungshinweis,
          jeweils mit Quelle.
        </p>
      </div>
      <div className="card">
        <h2>Bevor es losgeht</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
          <li><strong>Keine Diagnose.</strong> Die App ersetzt keine ärztliche Beratung und nennt keine Dosierungen.</li>
          <li><strong>Rote Flaggen zuerst.</strong> Bei bestimmten Angaben zeigt die App keinen Übungsplan, sondern den Hinweis auf ärztliche Abklärung.</li>
          <li><strong>Entwurf.</strong> Regeln und Übungen sind noch nicht fachlich freigegeben.</li>
          <li><strong>Deine Daten bleiben auf diesem Gerät.</strong> In der Testphase gibt es keinen Server. Du kannst alles exportieren und mit einem Klick löschen.</li>
        </ul>
        <Check checked={info} onChange={setInfo}>Ich habe verstanden, dass die App nur informiert und keine ärztliche Beratung ersetzt.</Check>
        <Check checked={data} onChange={setData}>
          Ich willige ein, dass meine Gesundheitsangaben (Beschwerden, Blutwerte, Profil) auf diesem Gerät gespeichert und ausgewertet werden
          (Art. 9 DSGVO). Ich kann die Einwilligung jederzeit widerrufen, indem ich alle Daten lösche.
        </Check>
        <button className="btn primary block" disabled={!info || !data} onClick={() => onAccept({ acceptedAt: new Date().toISOString(), textVersion: CONSENT_VERSION })}>
          Weiter zum Profil
        </button>
      </div>
    </div>
  );
}
