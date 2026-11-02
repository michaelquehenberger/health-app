// Anamnese mit dem deutschen PAR-Q+ (Fassung 01.07.2024). Texte unverändert aus parq-de.json.
// Technische Umsetzung laut Übergabe v0.2: Ja/Nein-Schalter statt Ankreuzen, Textfelder statt Zeilen,
// Häkchen und automatisches Datum statt Unterschrift, kein Name.
import { useState, type ReactNode } from 'react';
import {
  PARQ, ANAMNESIS_VALID_MONTHS, anamnesisValid, computeResult, evaluationNote, latestAnamnesis, newAnamnesis, stage,
  partAComplete, partAAnyYes, partBComplete, partBAnySubYes, type Anamnesis, type Answer,
} from '../parq';
import { Check } from '../components/ui';
import type { AppData } from '../types';
import { formatDate, todayIso, uid } from '../store';

/** Text mit Zeilenumbrüchen als Absätze; www-Adressen werden zu Links. */
function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`stack ${className ?? ''}`} style={{ gap: 6 }}>
      {text.split('\n').map((line, i) => <p key={i} className="small">{linkify(line)}</p>)}
    </div>
  );
}

function linkify(line: string): ReactNode[] {
  return line.split(/(www\.[A-Za-z0-9.-]+\.[a-z]{2,}(?:\/[A-Za-z0-9]+)?)/g).map((part, i) =>
    part.startsWith('www.') ? <a key={i} href={`https://${part}`} target="_blank" rel="noreferrer">{part}</a> : part,
  );
}

function YesNo({ value, onChange, label }: { value: Answer; onChange: (v: Answer) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      <button type="button" aria-pressed={value === 'ja'} onClick={() => onChange('ja')}>JA</button>
      <button type="button" aria-pressed={value === 'nein'} onClick={() => onChange('nein')}>NEIN</button>
    </div>
  );
}

const RESULT_LABEL: Record<string, string> = {
  freigegeben: 'Freigegeben',
  nicht_freigegeben: 'Nicht freigegeben',
  freigegeben_nach_abklaerung: 'Freigegeben nach Abklärung',
};

function Source() {
  return (
    <div className="footer-note" style={{ textAlign: 'left', display: 'grid', gap: 4 }}>
      <span>{PARQ.source.title}</span>
      <span>{PARQ.source.copyright}</span>
      <span>{PARQ.source.translation}</span>
      <span>{linkify(PARQ.source.contact)}</span>
      <span>{PARQ.source.citation}</span>
    </div>
  );
}

export function AnamnesisScreen({ data, update, onDone }: {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  onDone: () => void;
}) {
  const today = todayIso();
  const current = latestAnamnesis(data.anamneses);
  const draft = current && !current.endedAt && computeResult(current) === null ? current : null;
  const [showAnswers, setShowAnswers] = useState(false);

  const patch = (fn: (a: Anamnesis) => Anamnesis) =>
    update((d) => {
      const latest = latestAnamnesis(d.anamneses);
      if (!latest) return d;
      return {
        ...d,
        anamneses: d.anamneses.map((x) => {
          if (x.id !== latest.id) return x;
          const next = fn(x);
          return { ...next, result: computeResult(next) };
        }),
      };
    });

  const start = () =>
    update((d) => {
      const ended = d.anamneses.map((x) => (x.endedAt ? x : { ...x, endedAt: today }));
      return { ...d, anamneses: [...ended, newAnamnesis(uid(), d.profile?.participantId ?? '', today)] };
    });

  // ---------- Übersicht (abgeschlossen oder noch keine) ----------
  if (!draft && (!current || current.endedAt || computeResult(current) !== 'nicht_freigegeben')) {
    const valid = anamnesisValid(current, today);
    const expired = current && !current.endedAt && today >= current.validUntil;
    const history = [...data.anamneses].sort((x, y) => y.date.localeCompare(x.date));
    return (
      <>
        <div className="card dark">
          <span className="label">Anamnese · PAR-Q+</span>
          {valid && current ? (
            <>
              <h2>{RESULT_LABEL[computeResult(current)!]}</h2>
              <p className="muted">Ausgefüllt am {formatDate(current.date)} · gültig bis {formatDate(current.validUntil)} oder bis sich dein Gesundheitszustand ändert.</p>
            </>
          ) : (
            <>
              <h2>{expired ? 'Deine Anamnese ist abgelaufen.' : 'Einmal ausfüllen, dann gilt sie für alle Tests.'}</h2>
              <p className="muted">
                Der Fragebogen PAR-Q+ klärt, ob du vor mehr Bewegung Rücksprache halten solltest. Er gilt höchstens {ANAMNESIS_VALID_MONTHS} Monate.
                Ohne gültige Freigabe bleiben die Tests gesperrt.
              </p>
            </>
          )}
          <button className={valid ? 'btn ghost' : 'btn primary'} style={valid ? { color: 'var(--offwhite)', borderColor: 'var(--offwhite)' } : undefined} onClick={start}>
            {valid ? 'Mein Gesundheitszustand hat sich geändert – neu ausfüllen' : 'Anamnese ausfüllen'}
          </button>
        </div>

        {valid && current && (
          <div className="card">
            <p className="small">{evaluationNote(current)}</p>
            <button className="btn ghost" onClick={() => setShowAnswers((v) => !v)}>{showAnswers ? 'Antworten ausblenden' : 'Antworten ansehen'}</button>
            {showAnswers && <AnswersView a={current} />}
          </div>
        )}

        {history.length > 0 && (
          <div className="card">
            <span className="label">Frühere Anamnesen</span>
            <table className="table">
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="num">{formatDate(h.date)}</td>
                    <td>{RESULT_LABEL[computeResult(h) ?? ''] ?? 'nicht abgeschlossen'}</td>
                    <td className="muted">{h.endedAt ? `beendet ${formatDate(h.endedAt)}` : today >= h.validUntil ? 'abgelaufen' : 'aktuell'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Source />
      </>
    );
  }

  const a = (draft ?? current)!;
  const st = stage(a);
  const setA = (id: string, v: Answer) => patch((x) => ({ ...x, answersA: { ...x.answersA, [id]: v } }));
  const setB = (id: string, v: Answer) => patch((x) => ({ ...x, answersB: { ...x.answersB, [id]: v } }));

  return (
    <>
      <div className="card dark">
        <span className="label">Anamnese · PAR-Q+ · {formatDate(a.date)}</span>
        <Paragraphs text={PARQ.intro} />
      </div>

      <div className="card note">
        <Paragraphs text={PARQ.waitPage1} />
      </div>

      {/* Teil A */}
      <div className="card">
        <span className="label">Seite 1</span>
        <h2>{PARQ.partA.title}</h2>
        <p className="small">{PARQ.partA.lead}</p>
        {PARQ.partA.questions.map((q) => {
          const ans = a.answersA[q.id] ?? null;
          const hint = 'hint' in q ? q.hint : undefined;
          const free = 'freeText' in q ? q.freeText : undefined;
          return (
            <div key={q.id} className="stack" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <p><strong>{q.id}.</strong> {q.text}</p>
              {hint && <p className="small muted">{hint}</p>}
              <YesNo label={`Frage ${q.id}`} value={ans} onChange={(v) => setA(q.id, v)} />
              {free !== undefined && ans === 'ja' && (
                <label className="field">{free || <span className="sr-only">Freitext zu Frage {q.id}</span>}
                  <textarea value={a.textsA[q.id] ?? ''} onChange={(e) => { const t = e.target.value; patch((x) => ({ ...x, textsA: { ...x.textsA, [q.id]: t } })); }} />
                </label>
              )}
            </div>
          );
        })}
        {partAComplete(a) && (
          <div className="card mint" style={{ marginTop: 8 }}>
            <Paragraphs text={partAAnyYes(a) ? PARQ.partA.anyYes : PARQ.partA.allNo} />
          </div>
        )}
      </div>

      {/* Teil B */}
      {partAComplete(a) && partAAnyYes(a) && (
        <div className="card">
          <span className="label">Seiten 2 und 3</span>
          <h2>{PARQ.partB.title}</h2>
          {PARQ.partB.questions.map((q) => {
            const ans = a.answersB[q.id] ?? null;
            return (
              <div key={q.id} className="stack" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <p><strong>{q.id}.</strong> {q.text}</p>
                <p className="small muted">{q.ifYes} {q.ifNo}</p>
                <YesNo label={`Ergänzende Frage ${q.id}`} value={ans} onChange={(v) => setB(q.id, v)} />
                {ans === 'ja' && q.sub.map((s) => (
                  <div key={s.id} className="stack" style={{ paddingLeft: 12, borderLeft: '3px solid var(--mint)' }}>
                    <p className="small"><strong>{s.id}.</strong> {s.text}</p>
                    <YesNo label={`Frage ${s.id}`} value={a.answersB[s.id] ?? null} onChange={(v) => setB(s.id, v)} />
                  </div>
                ))}
              </div>
            );
          })}
          {a.answersB['10'] === 'ja' && (
            <label className="field">{PARQ.partB.medicationPrompt}
              <textarea value={a.medicationText} onChange={(e) => { const t = e.target.value; patch((x) => ({ ...x, medicationText: t })); }} />
            </label>
          )}
          {partBComplete(a) && (
            <div className={`card ${partBAnySubYes(a) ? 'alert' : 'mint'}`} style={{ marginTop: 8 }}>
              <span className="label" style={{ color: 'inherit' }}>Seite 4</span>
              <Paragraphs text={partBAnySubYes(a) ? PARQ.resultAnyYes : PARQ.resultAllNo} />
            </div>
          )}
        </div>
      )}

      {/* Nicht freigegeben: Abklärung */}
      {st.step === 'nicht_freigegeben' && <ClearanceForm onConfirm={(source) => patch((x) => ({ ...x, clearance: { date: today, source } }))} />}

      {/* Einverständnis */}
      {st.step === 'einverstaendnis' && (
        <ConsentForm
          onConfirm={() => {
            patch((x) => ({ ...x, consent: { given: true, date: today, at: new Date().toISOString(), textVersion: `PAR-Q+ ${PARQ.version}, Einverständniserklärung` } }));
            onDone();
          }}
        />
      )}

      {st.step !== 'teilA' && st.step !== 'teilB' && (
        <div className="card">
          <span className="label">Hinweis zur Auswertung</span>
          <p className="small">{evaluationNote(a)}</p>
        </div>
      )}

      <div className="card note"><Paragraphs text={PARQ.waitPage4} /></div>
      <div className="card"><Paragraphs text={PARQ.closing} /></div>
      <Source />
    </>
  );
}

function ConsentForm({ onConfirm }: { onConfirm: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="card">
      <span className="label">Einverständniserklärung</span>
      <Paragraphs text={PARQ.consent} />
      <p className="muted">Datum: {formatDate(todayIso())} (wird automatisch gesetzt). Statt Name und Unterschrift genügt in dieser App ein Häkchen.</p>
      <Check checked={ok} onChange={setOk}>Ich bestätige das.</Check>
      <button className="btn primary block" disabled={!ok} onClick={onConfirm}>Anamnese abschließen</button>
    </div>
  );
}

function ClearanceForm({ onConfirm }: { onConfirm: (s: 'eparmedx' | 'fachperson') => void }) {
  const [src, setSrc] = useState<'eparmedx' | 'fachperson' | null>(null);
  return (
    <div className="card alert">
      <span className="label">Tests gesperrt</span>
      <p className="small">Die Tests bleiben gesperrt, bis die Abklärung erfolgt ist. Wenn du eine Freigabe hast, wähle hier, woher sie stammt.</p>
      <a className="btn dark" href="https://www.eparmedx.com" target="_blank" rel="noreferrer">ePARmed-X+ öffnen</a>
      <div className="seg" role="group" aria-label="Quelle der Freigabe">
        <button type="button" aria-pressed={src === 'eparmedx'} onClick={() => setSrc('eparmedx')}>Freigabe über ePARmed-X+</button>
        <button type="button" aria-pressed={src === 'fachperson'} onClick={() => setSrc('fachperson')}>Freigabe durch eine Fachperson</button>
      </div>
      <button className="btn primary" disabled={!src} onClick={() => src && onConfirm(src)}>Abklärung ist erfolgt</button>
    </div>
  );
}

function AnswersView({ a }: { a: Anamnesis }) {
  const yes = (v: Answer | undefined) => (v === 'ja' ? 'JA' : v === 'nein' ? 'NEIN' : '–');
  return (
    <div className="stack">
      <strong className="small">Teil A</strong>
      {PARQ.partA.questions.map((q) => (
        <p key={q.id} className="small">{q.id}. {yes(a.answersA[q.id])}{a.textsA[q.id] ? ` · ${a.textsA[q.id]}` : ''}</p>
      ))}
      {partAAnyYes(a) && (
        <>
          <strong className="small">Teil B</strong>
          {PARQ.partB.questions.map((q) => (
            <p key={q.id} className="small">
              {q.id}. {yes(a.answersB[q.id])}
              {a.answersB[q.id] === 'ja' && ` (${q.sub.map((s) => `${s.id}: ${yes(a.answersB[s.id])}`).join(', ')})`}
            </p>
          ))}
          {a.medicationText && <p className="small">Erkrankungen und Medikation: {a.medicationText}</p>}
        </>
      )}
      {a.clearance && <p className="small">Abklärung am {formatDate(a.clearance.date)}: {a.clearance.source === 'eparmedx' ? 'ePARmed-X+' : 'Fachperson'}</p>}
      <p className="small muted">Fassung {a.formVersion} · Einverständnis {a.consent.at ? new Date(a.consent.at).toLocaleString('de-AT') : a.consent.date ? formatDate(a.consent.date) : '–'}</p>
    </div>
  );
}
