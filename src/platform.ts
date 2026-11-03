// Läuft die App als Seite auf claude.ai, stellt die Plattform Fähigkeiten bereit:
// KI über das Claude-Konto der Person (sample), privater Speicher (db), Dateien speichern (downloads).
// Auf GitHub Pages gibt es das nicht; dann arbeitet die App lokal und ohne KI.

export type SampleInput = string | { role: 'user' | 'assistant'; content: string }[];
export interface SampleFn {
  (input: SampleInput, options?: Record<string, unknown>): Promise<{ text: string; truncated: boolean }>;
  json<T = unknown>(input: string, options?: Record<string, unknown>): Promise<T>;
  limits(): Promise<{ images?: { maxCount: number; maxInputBytes: number; mediaTypes: string[] } }>;
}
export interface SampleError { code: string; message: string; text?: string }

interface DocSnap { id: string; exists: boolean; data(): Record<string, unknown> | undefined }
interface DocRef { get(): Promise<DocSnap>; set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> }
export interface Db {
  doc(path: string): DocRef;
  collection(path: string): { get(): Promise<{ docs: DocSnap[] }>; doc(id: string): DocRef };
}
export interface UserCap { id(): Promise<string | null> }
export interface Downloads { save(f: { filename: string; data: string | Blob }): Promise<unknown> }

type ClaudeWindow = { claude?: { use(name: string): Promise<unknown> } };

/** Wird die Seite von claude.ai angezeigt? */
export const inClaude: boolean = typeof window !== 'undefined' && typeof (window as unknown as ClaudeWindow).claude?.use === 'function';

const cache = new Map<string, Promise<unknown>>();
export function useCapability<T>(name: 'sample' | 'db' | 'user' | 'downloads'): Promise<T | null> {
  if (!inClaude) return Promise.resolve(null);
  if (!cache.has(name)) cache.set(name, (window as unknown as ClaudeWindow).claude!.use(name).catch(() => null));
  return cache.get(name) as Promise<T | null>;
}

export const sampleCap = () => useCapability<SampleFn>('sample');

export function isSampleError(e: unknown): e is SampleError {
  return typeof e === 'object' && e !== null && 'code' in e && typeof (e as SampleError).code === 'string';
}

/** Verständlicher Text zu einem Fehler der Claude-Plattform. */
export function sampleErrorText(e: SampleError): string {
  switch (e.code) {
    case 'not_granted': return 'Die KI wurde für diese Seite nicht erlaubt. Werte kannst du von Hand eintragen, der Tagesplan nach den Regeln gilt weiter.';
    case 'sampling_disabled': return 'Claude ist für dieses Konto nicht verfügbar.';
    case 'rate_limited': return 'Gerade zu viele Anfragen oder dein Claude-Kontingent ist aufgebraucht. Bitte später erneut versuchen.';
    case 'session_expired': return 'Bitte bei Claude neu anmelden.';
    case 'image_rejected': return 'Das Foto konnte nicht verwendet werden. Bitte ein anderes Foto (JPG oder PNG) wählen.';
    case 'images_unavailable': return 'Fotos können hier nicht an die KI geschickt werden.';
    case 'refused': return 'Die KI hat die Anfrage abgelehnt. Bitte von Hand eintragen.';
    case 'invalid_json': return 'Die Antwort konnte nicht gelesen werden. Bitte erneut versuchen.';
    case 'cancelled': return 'Abgebrochen.';
    default: return 'Die KI ist gerade nicht erreichbar. Bitte später erneut versuchen.';
  }
}

/** Datei speichern: auf claude.ai über die Plattform (mit Rückfrage), sonst als Download-Link. */
export async function saveFile(name: string, content: string, type: string): Promise<void> {
  const dl = await useCapability<Downloads>('downloads');
  if (dl) {
    try {
      await dl.save({ filename: name, data: new Blob([content], { type }) });
    } catch {
      /* abgelehnt oder nicht möglich */
    }
    return;
  }
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
