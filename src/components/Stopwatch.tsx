import { useEffect, useRef, useState } from 'react';

/**
 * Stoppuhr. mode 'up' zählt hoch (optional mit Höchstzeit), mode 'down' zählt von countdown herunter.
 * onStop liefert die gemessenen Sekunden.
 */
export function Stopwatch({ mode, maxSeconds, countdown, onStop, label }: {
  mode: 'up' | 'down';
  maxSeconds?: number;
  countdown?: number;
  onStop?: (seconds: number) => void;
  label?: string;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(0);
  const limit = mode === 'down' ? countdown ?? 30 : maxSeconds;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const e = (performance.now() - start.current) / 1000;
      if (limit !== undefined && e >= limit) {
        setElapsed(limit);
        setRunning(false);
        onStop?.(limit);
        try {
          navigator.vibrate?.(300);
        } catch {
          /* nicht verfügbar */
        }
      } else {
        setElapsed(e);
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, limit, onStop]);

  const shown = mode === 'down' ? Math.max(0, (countdown ?? 30) - elapsed) : elapsed;
  const mm = Math.floor(shown / 60);
  const ss = shown - mm * 60;
  const display = mode === 'down' || shown < 60 ? shown.toFixed(1).replace('.', ',') : `${mm}:${ss.toFixed(0).padStart(2, '0')}`;

  return (
    <div className="card dark" style={{ alignItems: 'center', textAlign: 'center' }}>
      {label && <span className="label">{label}</span>}
      <div className="stopwatch" aria-live="off">{display}<span className="muted"> s</span></div>
      <div className="row" style={{ justifyContent: 'center' }}>
        {!running ? (
          <button className="btn primary" onClick={() => { start.current = performance.now(); setElapsed(0); setRunning(true); }}>
            {elapsed > 0 ? 'Neu starten' : 'Start'}
          </button>
        ) : (
          <button className="btn primary" onClick={() => { const e = (performance.now() - start.current) / 1000; setRunning(false); setElapsed(e); onStop?.(Math.round(e * 10) / 10); }}>
            Stopp
          </button>
        )}
      </div>
      {mode === 'up' && maxSeconds !== undefined && <p className="muted small">Stoppt automatisch bei {maxSeconds} Sekunden.</p>}
    </div>
  );
}
