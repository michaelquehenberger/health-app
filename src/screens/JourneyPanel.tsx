// „Heute“: führt durch den Gesamtablauf Profil → Anamnese → Testmappe → Gesundheitsdaten → Auswertung.
import type { HealthItem, Journey, StepId } from '../journey';
import { Icon } from '../components/ui';

const ACTION: Record<StepId, string> = {
  profil: 'Profil ausfüllen',
  anamnese: 'Anamnese ausfüllen',
  testmappe: 'Zur Testmappe',
  gesundheit: 'Gesundheitsdaten eintragen',
  auswertung: 'Zu deinem Plan',
};

const WHY: Record<StepId, string> = {
  profil: 'Grunddaten für alle Berechnungen.',
  anamnese: 'Klärt einmal, ob du ohne Rücksprache testen und trainieren kannst. Danach sind Tests und Gesundheitsmodul freigeschaltet.',
  testmappe: 'Sieben einfache Tests ergeben deinen Startwert: Ruhepuls, Beweglichkeit, Balance, Kraft und Ausdauer.',
  gesundheit: 'Das Herzstück: Blutwerte, Beschwerden und deine Oura-Daten. Daraus entsteht dein Übungsplan.',
  auswertung: 'Aus Anamnese, Testwerten, Blutwerten, Beschwerden und Wearable-Daten entsteht dein Plan.',
};

export function JourneyPanel({ journey, go, compact = false }: { journey: Journey; go: (id: StepId) => void; compact?: boolean }) {
  const cur = journey.current;
  return (
    <>
      {cur && !compact && (
        <div className="card dark">
          <span className="label">Dein nächster Schritt · {journey.steps.findIndex((s) => s.id === cur.id) + 1} von 5</span>
          <h1>{cur.title}</h1>
          <p className="muted">{WHY[cur.id]}</p>
          {cur.id === 'gesundheit' && (
            <ul className="small" style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
              {journey.healthItems.map((i) => (
                <li key={i.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: i.done ? 'var(--mint)' : 'transparent', border: '2px solid var(--mint)', color: 'var(--navy)' }}>{i.done ? <Icon.check /> : null}</span>
                  <span>{i.label}{i.required ? '' : <span className="muted"> (empfohlen)</span>}</span>
                </li>
              ))}
            </ul>
          )}
          <button className="btn primary" onClick={() => go(cur.id)}>{ACTION[cur.id]}</button>
        </div>
      )}

      <div className="card">
        <span className="label">Dein Weg</span>
        <ol className="journey">
          {journey.steps.map((s, i) => (
            <li key={s.id} className={`journey-${s.status}`}>
              <span className="dot" aria-hidden="true">{s.status === 'erledigt' ? <Icon.check /> : i + 1}</span>
              <button type="button" className="journey-row" disabled={s.status === 'gesperrt'} onClick={() => go(s.id)}>
                <strong>{s.title}</strong>
                <span className="muted small">{s.status === 'wartet' ? `wartet · ${s.detail}` : s.detail}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

/** Kopf im Gesundheitsmodul: was für Schritt 4 nötig ist. */
export function HealthChecklist({ items }: { items: HealthItem[] }) {
  return (
    <div className="card dark">
      <span className="label">Schritt 4 von 5 · Gesundheitsdaten</span>
      <h2>Das Herzstück deines Plans</h2>
      <p className="muted small">Aus diesen Daten entsteht dein Übungsplan. Pflicht sind Einwilligung und Blutwerte; Oura und Beschwerden machen den Plan genauer.</p>
      <ul className="small" style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
        {items.map((i) => (
          <li key={i.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: i.done ? 'var(--mint)' : 'transparent', border: '2px solid var(--mint)', color: 'var(--navy)' }}>{i.done ? <Icon.check /> : null}</span>
            <span>{i.label}{i.required ? '' : <span className="muted"> (empfohlen)</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
