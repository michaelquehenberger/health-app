// Übung im Detail: Skizze, Anleitung, Dosis laut Quelle, worauf achten, Suchbegriffe für ein Physio-Video.
import { useState } from 'react';
import type { Exercise } from '../health/data/exercises';
import { VIDEO_KEYWORDS } from '../health/data/exerciseFigures';
import { ExerciseFigure } from './ExerciseFigure';

function Keywords({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="kw">
      <code>{text}</code>
      <div className="row">
        <button type="button" className="btn ghost" style={{ minHeight: 34, fontSize: 13 }}
          onClick={() => {
            navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => setCopied(false));
          }}>
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
        <a className="btn ghost" style={{ minHeight: 34, fontSize: 13 }} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Auf YouTube suchen</a>
      </div>
    </div>
  );
}

export function ExerciseDetails({ e }: { e: Exercise }) {
  const kw = VIDEO_KEYWORDS[e.id];
  return (
    <div className="stack" style={{ gap: 8 }}>
      <ExerciseFigure id={e.id} name={e.name} />
      <p className="small">{e.instruction}</p>
      <p className="small"><strong>Dosis laut Quelle:</strong> {e.dose}</p>
      <p className="small muted"><strong>Worauf achten:</strong> {e.watch}</p>
      {kw && (
        <details className="kw-box">
          <summary className="small">Video gesucht? Suchbegriffe für eine Anleitung von Physiotherapeut:innen</summary>
          <Keywords text={kw.de} />
          <Keywords text={kw.en} />
          <p className="small muted">Achte auf den Absender: Physiotherapie-Praxis, Klinik oder Patientenorganisation (z. B. Rheuma-Liga, Arthritis UK). Die App prüft die Suchergebnisse nicht.</p>
        </details>
      )}
    </div>
  );
}
