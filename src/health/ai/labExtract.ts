// KI-Auslesung von Laborbefunden (Foto) mit Claude.
// Läuft nur, wenn die App als Seite auf claude.ai geöffnet ist: dann über das Claude-Konto der Person,
// ohne API-Schlüssel. Auf GitHub Pages gibt es keine KI; Werte werden dort von Hand eingetragen.
import { z } from 'zod';
import { MARKERS } from '../logic/labs';
import { isSampleError, sampleCap, sampleErrorText, type SampleFn } from '../../platform';

const ExtractedValue = z.object({
  /** Name wie im Befund, z. B. „Ferritin“ */
  name: z.string(),
  /** passender Schlüssel aus der App-Liste oder "andere" */
  marker_key: z.string(),
  value: z.number(),
  unit: z.string(),
  ref_low: z.number().nullable(),
  ref_high: z.number().nullable(),
});

export const LabExtraction = z.object({
  lab: z.string().nullable(),
  /** Datum der Probe bzw. des Befunds im Format JJJJ-MM-TT */
  date: z.string().nullable(),
  values: z.array(ExtractedValue),
  /** Hinweise, z. B. unleserliche Stellen */
  notes: z.string().nullable(),
});
export type LabExtractionResult = z.infer<typeof LabExtraction>;

const SYSTEM = `Du liest deutschsprachige Laborbefunde aus (Blutwerte).
Regeln:
- Übernimm nur Werte, die im Befund tatsächlich stehen. Nichts schätzen, nichts ergänzen, nichts bewerten oder deuten.
- Wert und Einheit genau wie im Befund; Dezimalkomma als Zahl ausgeben (5,2 → 5.2).
- Referenzbereich genau aus dem Befund: „3,5–5,0“ → ref_low 3.5, ref_high 5.0; „< 5“ → ref_low null, ref_high 5; „> 40“ → ref_low 40, ref_high null; fehlt er, beide null.
- Ist ein Wert als „<0,5“ angegeben, nimm 0.5 als Wert und schreibe das in notes.
- marker_key: wähle den passenden Schlüssel aus dieser Liste, sonst "andere": ${MARKERS.map((m) => `${m.key} (${m.label})`).join(', ')}.
- date: Datum der Probenentnahme, sonst des Befunds, als JJJJ-MM-TT; lab: Name des Labors.
- Unleserliche oder abgeschnittene Stellen in notes nennen, nicht raten.`;

export class LabExtractError extends Error {
  constructor(public kind: 'nicht_verfuegbar' | 'format' | 'abgelehnt' | 'netz' | 'antwort', message: string) {
    super(message);
  }
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Anweisung, Daten und Antwortformat in einem Text: Claude sieht auf der Seite nur, was wir schicken. */
export function promptWithSchema(instructions: string, schema: z.ZodType, task: string): string {
  return `${instructions}\n\nAntworte ausschließlich mit einem JSON-Objekt nach diesem JSON-Schema, ohne weiteren Text:\n${JSON.stringify(z.toJSONSchema(schema))}\n\n${task}`;
}

/** Fehler der Plattform in einen verständlichen Fehler der App übersetzen. */
export function toAppError(e: unknown, fallback: string): LabExtractError {
  if (e instanceof LabExtractError) return e;
  if (isSampleError(e)) {
    const kind = e.code === 'refused' ? 'abgelehnt' : e.code === 'invalid_json' ? 'antwort' : ['not_granted', 'sampling_disabled', 'images_unavailable'].includes(e.code) ? 'nicht_verfuegbar' : 'netz';
    return new LabExtractError(kind, sampleErrorText(e));
  }
  return new LabExtractError('netz', fallback);
}

/** Liest einen Befund (Foto) aus. Die Werte werden danach von der Nutzerin geprüft, nie direkt gespeichert. */
export async function extractLabReport(file: File, sample?: SampleFn | null): Promise<LabExtractionResult> {
  const fn = sample === undefined ? await sampleCap() : sample;
  if (!fn) throw new LabExtractError('nicht_verfuegbar', 'Die KI-Auslesung gibt es nur in der LIVION-Version auf claude.ai.');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) throw new LabExtractError('format', 'Bitte ein Foto des Befunds wählen (JPG oder PNG). Ein PDF kann hier nicht gelesen werden; mach einfach ein Foto oder einen Screenshot davon.');
  if (!IMAGE_TYPES.includes(file.type)) throw new LabExtractError('format', 'Bitte ein Foto (JPG, PNG, WEBP) wählen.');
  if (file.size > 20 * 1024 * 1024) throw new LabExtractError('format', 'Das Foto ist größer als 20 MB.');

  let json: unknown;
  try {
    json = await fn.json(promptWithSchema(SYSTEM, LabExtraction, 'Das Bild zeigt einen Laborbefund. Lies alle Blutwerte aus.'), { images: [file] });
  } catch (e) {
    throw toAppError(e, 'Keine Verbindung zur Auslesung.');
  }
  const parsed = LabExtraction.safeParse(json);
  if (!parsed.success) throw new LabExtractError('antwort', 'Die Antwort hatte nicht das erwartete Format. Bitte erneut versuchen.');
  return parsed.data;
}

/** Schlüssel aus der Liste, sonst der Name aus dem Befund (dann zeigt die App ihn unter diesem Namen). */
export function markerKeyFor(v: { name: string; marker_key: string }): string {
  return MARKERS.some((m) => m.key === v.marker_key) ? v.marker_key : v.name.trim();
}

export function isIsoDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
