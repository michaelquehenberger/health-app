// Schritt 5: KI-Auswertung aller Daten. Rote Flaggen gehen vor, die KI wählt nur aus der Übungsdatenbank.
import { useMemo, useState } from 'react';
import { Check } from '../../components/ui';
import { EXERCISES } from '../data/exercises';
import { blocksPlan, checkRedFlags } from '../logic/redFlags';
import { analyzePlan, buildAnalysisContext, RULES_VERSION } from '../ai/planAnalysis';
import { LabExtractError } from '../ai/labExtract';
import { CLAUDE_APP_URL, useAiAvailable } from '../ai/useAi';
import type { AppData } from '../../types';
import type { HealthState } from '../types';
import { formatDate, todayIso, uid } from '../../store';
import { APP_LANGUAGE, APP_VERSION } from '../../version';

export const AI_ANALYSIS_CONSENT_VERSION = '2026-11-02-ki-auswertung-claude-konto';

export function AnalysisPanel({ data, update }: { data: AppData; update: (fn: (d: HealthState) => HealthState) => void }) {
  const h = data.health!;
  const today = todayIso();
  const [consentOk, setConsentOk] = useState(false);
  const ai = useAiAvailable();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = useMemo(() => blocksPlan(checkRedFlags(h.complaints, h.values, h.reports)), [h.complaints, h.values, h.reports]);
  const latest = h.analyses?.at(-1) ?? null;
  const chosen = h.planChoice && latest && h.planChoice.analysisId === latest.id;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const ctx = buildAnalysisContext(data, today);
      const result = await analyzePlan(ctx);
      const rec = { id: uid(), createdAt: new Date().toISOString(), model: 'Claude (claude.ai)', rulesVersion: RULES_VERSION, input: ctx.input, result };
      update((d) => ({ ...d, analyses: [...(d.analyses ?? []), rec].slice(-10) }));
    } catch (e) {
      setError(e instanceof LabExtractError ? e.message : 'Die Auswertung ist fehlgeschlagen. Dein Tagesplan nach den Regeln gilt weiter.');
    } finally {
      setBusy(false);
    }
  }

  if (blocked) {
    return (
      <div className="card alert">
        <span className="label">KI-Auswertung pausiert</span>
        <p className="small">Eine deiner Angaben braucht zuerst ärztliche Abklärung (siehe oben). Solange gibt es keine Auswertung und keinen Übungsplan.</p>
      </div>
    );
  }

  if (ai === null) return null;
  if (!ai) {
    return (
      <div className="card note">
        <span className="label">KI-Auswertung · Schritt 5</span>
        <p className="small">Die KI-Auswertung aller Daten gibt es in der <a href={CLAUDE_APP_URL} target="_blank" rel="noreferrer">LIVION-Version auf claude.ai</a>, dort über dein eigenes Claude-Konto. Dein Tagesplan unten entsteht hier nach den Regeln aus Anamnese, Beschwerden und Blutwerten.</p>
      </div>
    );
  }

  if (h.aiAnalysisConsent?.textVersion !== AI_ANALYSIS_CONSENT_VERSION) {
    return (
      <div className="card">
        <span className="label">KI-Auswertung · Schritt 5</span>
        <h3>Alle Daten zusammen auswerten</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
          <li>Claude (Anthropic) bekommt über dein eigenes Claude-Konto deine Testwerte, Blutwerte mit Laborbereich, Beschwerden und Oura-Mittelwerte. <strong>Ohne Namen und ohne Teilnehmer-ID;</strong> Medikamente und Allergien nur als „angegeben“.</li>
          <li>Sie fasst zusammen und wählt Übungen, aber nur aus der geprüften Übungsliste der App. Rote Flaggen und die Schmerzregel gehen immer vor.</li>
          <li>Das Ergebnis ist Information, keine Diagnose und keine Therapie.</li>
        </ul>
        <Check checked={consentOk} onChange={setConsentOk}>
          Ich willige ein, dass meine Gesundheitsdaten ohne Namen zur Auswertung an Claude geschickt werden. Ich kann das jederzeit widerrufen; der Tagesplan nach den Regeln funktioniert auch ohne KI.
        </Check>
        <button className="btn primary" disabled={!consentOk}
          onClick={() => update((d) => ({ ...d, aiAnalysisConsent: { acceptedAt: new Date().toISOString(), textVersion: AI_ANALYSIS_CONSENT_VERSION, appVersion: APP_VERSION, language: APP_LANGUAGE } }))}>
          Einwilligen
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <span className="label">KI-Auswertung · Schritt 5</span>
      {(
        <>
          {!latest && <h3>Deine Daten zusammen auswerten</h3>}
          {latest && (
            <>
              <h3>Deine Auswertung vom {formatDate(latest.createdAt.slice(0, 10))}</h3>
              <p>{latest.result.zusammenfassung}</p>
              {latest.result.schwerpunkte.map((s) => (
                <div key={s.titel} className="stack" style={{ gap: 4 }}>
                  <strong>{s.titel}</strong>
                  <p className="small">{s.begruendung}</p>
                  {s.bezug.length > 0 && <p className="muted small">Bezug: {s.bezug.join(' · ')}</p>}
                </div>
              ))}
              {latest.result.uebungen.length > 0 && (
                <div className="stack" style={{ gap: 8 }}>
                  <strong>Vorgeschlagene Übungen</strong>
                  {latest.result.uebungen.map((u) => {
                    const ex = EXERCISES.find((e) => e.id === u.id);
                    return ex ? (
                      <details key={u.id}>
                        <summary><strong>{ex.name}</strong> <span className="muted small">· {u.grund}</span></summary>
                        <p className="small">{ex.instruction}</p>
                        <p className="small"><strong>Dosis laut Quelle:</strong> {ex.dose} · <strong>Achte auf:</strong> {ex.watch}</p>
                      </details>
                    ) : null;
                  })}
                  {chosen ? (
                    <>
                      <p className="small"><strong>Im Tagesplan aktiv.</strong> Wochenmuster und Schmerzregel bestimmen weiter, welche davon heute drankommen.</p>
                      <button className="btn ghost" onClick={() => update((d) => ({ ...d, planChoice: null }))}>Zurück zum Plan nach den Regeln</button>
                    </>
                  ) : (
                    <button className="btn primary" onClick={() => update((d) => ({ ...d, planChoice: { analysisId: latest.id, exerciseIds: latest.result.uebungen.map((u) => u.id), date: today } }))}>
                      Übungen in meinen Tagesplan übernehmen
                    </button>
                  )}
                </div>
              )}
              {latest.result.aerztlich_besprechen.length > 0 && (
                <div className="card note">
                  <strong>Beim nächsten Arztbesuch ansprechen</strong>
                  <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>{latest.result.aerztlich_besprechen.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              )}
              {latest.result.fehlende_angaben.length > 0 && (
                <p className="muted small">Für eine genauere Auswertung fehlt: {latest.result.fehlende_angaben.join(', ')}</p>
              )}
              <details>
                <summary className="small">Was an die KI ging</summary>
                <pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{latest.input}</pre>
              </details>
            </>
          )}
          <button className={latest ? 'btn dark' : 'btn primary'} disabled={busy} onClick={run}>
            {busy ? 'Wird ausgewertet …' : latest ? 'Neu auswerten' : 'Auswertung erstellen'}
          </button>
          {busy && <p className="muted small" role="status">Das dauert meist unter einer Minute.</p>}
          {error && <div className="card alert" role="alert"><p className="small">{error}</p></div>}
          <p className="footer-note">KI-Auswertung, keine Diagnose · Regeln {RULES_VERSION} · Entwurf, nicht fachlich freigegeben</p>
          <button className="btn ghost" style={{ minHeight: 36, fontSize: 13 }} onClick={() => update((d) => ({ ...d, aiAnalysisConsent: null, planChoice: null }))}>KI-Einwilligung für die Auswertung widerrufen</button>
        </>
      )}
    </div>
  );
}
