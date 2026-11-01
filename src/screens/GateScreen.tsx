// Sicherheits-Gate: Das offizielle PAR-Q+-Formular wird extern ausgefüllt (Text darf nicht verändert
// oder übersetzt werden). Die App fragt nur das Ergebnis ab. Ablauf laut Übergabe Abschnitt 5.
import { useState } from 'react';
import { GATE_VALID_MONTHS, PARQ_ATTRIBUTION, PARQ_URL } from '../tests';
import type { Gate } from '../types';
import { addMonths, formatDate, gateValid, todayIso } from '../store';

type Step = 'start' | 'folgefragen' | 'gesperrt';

export function GateScreen({ gate, onChange, onDone }: { gate: Gate | null; onChange: (g: Gate | null) => void; onDone: () => void }) {
  const [step, setStep] = useState<Step>(gate?.status === 'gesperrt' ? 'gesperrt' : 'start');
  const today = todayIso();

  const release = (via: Gate['via']) => {
    onChange({ status: 'freigegeben', via, date: today });
    onDone();
  };

  if (gateValid(gate) && gate) {
    return (
      <div className="card">
        <span className="label">Sicherheits-Gate</span>
        <h2>Du bist für die Tests freigegeben.</h2>
        <p className="small">Freigabe vom {formatDate(gate.date)}, gültig bis {formatDate(addMonths(gate.date, GATE_VALID_MONTHS))} oder bis sich dein Gesundheitszustand ändert.</p>
        <button className="btn ghost" onClick={() => { onChange(null); setStep('start'); }}>Mein Gesundheitszustand hat sich geändert</button>
        <p className="muted" style={{ fontSize: 12 }}>{PARQ_ATTRIBUTION}</p>
      </div>
    );
  }

  return (
    <>
      <div className="card dark">
        <span className="label">Sicherheits-Gate · PAR-Q+</span>
        <h2>Bevor du testest: der Fragebogen PAR-Q+.</h2>
        <p className="muted">
          Er klärt, ob du ohne ärztliche Rücksprache körperlich testen kannst. Fülle die offizielle Fassung aus und beantworte dann hier,
          wie es ausgegangen ist.
        </p>
        <a className="btn primary" href={PARQ_URL} target="_blank" rel="noreferrer">Offiziellen Fragebogen öffnen</a>
        {gate && !gateValid(gate) && gate.status === 'freigegeben' && <p className="small">Deine letzte Freigabe ist älter als {GATE_VALID_MONTHS} Monate. Bitte fülle den Fragebogen neu aus.</p>}
      </div>

      {step === 'start' && (
        <div className="card">
          <span className="label">Schritt 1 · Allgemeine Fragen</span>
          <h3>Hast du alle 7 allgemeinen Fragen mit Nein beantwortet?</h3>
          <button className="btn dark" onClick={() => release('parq-alle-nein')}>Ja, alle 7 mit Nein</button>
          <button className="btn ghost" onClick={() => setStep('folgefragen')}>Nein, mindestens ein Ja</button>
        </div>
      )}

      {step === 'folgefragen' && (
        <div className="card">
          <span className="label">Schritt 2 · Folgefragen</span>
          <h3>Bitte beantworte im Fragebogen auch die Folgefragen. Hast du alle Folgefragen mit Nein beantwortet?</h3>
          <button className="btn dark" onClick={() => release('folgefragen-alle-nein')}>Ja, alle Folgefragen mit Nein</button>
          <button className="btn ghost" onClick={() => { onChange({ status: 'gesperrt', via: null, date: today }); setStep('gesperrt'); }}>
            Nein, mindestens ein Ja
          </button>
          <button className="btn ghost" style={{ border: 0, textDecoration: 'underline' }} onClick={() => setStep('start')}>Zurück</button>
        </div>
      )}

      {step === 'gesperrt' && (
        <div className="card alert">
          <span className="label">Tests gesperrt</span>
          <h3>Bitte kläre zuerst ab, ob du testen kannst.</h3>
          <p className="small">
            Nutze dafür das Online-Werkzeug ePARmed-X+ oder sprich mit einer Fachperson, zum Beispiel deiner Ärztin oder deinem Arzt.
            Erst danach sind die Tests freigeschaltet.
          </p>
          <a className="btn dark" href={PARQ_URL} target="_blank" rel="noreferrer">ePARmed-X+ öffnen</a>
          <button className="btn ghost" onClick={() => release('eparmedx-oder-fachperson')}>Ich habe eine Freigabe über ePARmed-X+ oder eine Fachperson</button>
        </div>
      )}

      <p className="footer-note">{PARQ_ATTRIBUTION} Die Freigabe gilt {GATE_VALID_MONTHS} Monate oder bis sich dein Gesundheitszustand ändert.</p>
    </>
  );
}
