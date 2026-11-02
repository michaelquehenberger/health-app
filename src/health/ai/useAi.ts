import { useEffect, useState } from 'react';
import { inClaude, sampleCap } from '../../platform';

/** null = wird geprüft, true = KI über das Claude-Konto verfügbar, false = keine KI (z. B. GitHub Pages). */
export function useAiAvailable(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(inClaude ? null : false);
  useEffect(() => {
    if (!inClaude) return;
    let alive = true;
    sampleCap().then((s) => { if (alive) setOk(!!s); });
    return () => { alive = false; };
  }, []);
  return ok;
}

/** LIVION-Version auf claude.ai: dort läuft die KI über das eigene Claude-Konto. */
export const CLAUDE_APP_URL = 'https://claude.ai/artifact/CcV5wLqF523Xz99WmMnobG';
