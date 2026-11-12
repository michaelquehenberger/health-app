// KI-Auslesung von Laborbefunden (Foto) mit Claude.
// Läuft nur, wenn die App als Seite auf claude.ai geöffnet ist: dann über das Claude-Konto der Person,
// ohne API-Schlüssel. Auf GitHub Pages gibt es keine KI; Werte werden dort von Hand eingetragen.
import { z } from 'zod';
import { MARKERS } from '../logic/labs';
import { pdfToImages, type PdfPages } from './pdfPages';
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

/** Liest einen Befund (Foto oder PDF) aus. Die Werte werden danach von der Nutzerin geprüft, nie direkt gespeichert. */
export async function extractLabReport(
  file: File,
  sample?: SampleFn | null,
  convertPdf: (f: Blob, maxPages: number) => Promise<PdfPages> = pdfToImages,
): Promise<LabExtractionResult> {
  const fn = sample === undefined ? await sampleCap() : sample;
  if (!fn) throw new LabExtractError('nicht_verfuegbar', 'Die KI-Auslesung gibt es nur in der LIVION-Version auf claude.ai.');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf && !IMAGE_TYPES.includes(file.type)) throw new LabExtractError('format', 'Bitte ein PDF oder ein Foto (JPG, PNG, WEBP) wählen.');
  if (file.size > 20 * 1024 * 1024) throw new LabExtractError('format', 'Die Datei ist größer als 20 MB.');

  let images: Blob[] = [file];
  let task = 'Das Bild zeigt einen Laborbefund. Lies alle Blutwerte aus.';
  let skipped = 0;
  let read = 0;
  if (isPdf) {
    const maxPages = (await fn.limits().catch(() => null))?.images?.maxCount ?? 5;
    let pages: PdfPages;
    try {
      pages = await convertPdf(file, maxPages);
    } catch {
      throw new LabExtractError('format', 'Das PDF konnte nicht geöffnet werden. Ist es passwortgeschützt? Sonst mach einen Screenshot und lade das Foto hoch.');
    }
    if (pages.images.length === 0) throw new LabExtractError('format', 'Das PDF hat keine lesbaren Seiten.');
    images = pages.images;
    skipped = Math.max(0, pages.pageCount - pages.pagesRead);
    read = pages.pagesRead;
    task = `Die ${images.length} Bilder zeigen ${pages.pagesRead === 1 ? 'eine Seite' : `${pages.pagesRead} Seiten`} eines Laborbefunds (PDF), in Lesereihenfolge${images.length > pages.pagesRead ? '; jede Seite ist in eine obere und eine untere Hälfte geteilt, die sich leicht überlappen. Nenne jeden Wert nur einmal' : ''}. Lies alle Blutwerte aus.`;
    if (pages.text) task += `\n\nText aus dem PDF, zur Kontrolle beim Lesen (die Anordnung kann durcheinander sein; maßgeblich sind die Bilder):\n${pages.text.slice(0, 40_000)}`;
  }

  let json: unknown;
  try {
    json = await fn.json(promptWithSchema(SYSTEM, LabExtraction, task), { images });
  } catch (e) {
    throw toAppError(e, 'Keine Verbindung zur Auslesung.');
  }
  const parsed = LabExtraction.safeParse(json);
  if (!parsed.success) throw new LabExtractError('antwort', 'Die Antwort hatte nicht das erwartete Format. Bitte erneut versuchen.');
  if (skipped > 0) {
    const note = `Nur die ersten ${read} Seiten wurden gelesen; ${skipped} weitere Seiten bitte einzeln als Foto hochladen.`;
    return { ...parsed.data, notes: parsed.data.notes ? `${parsed.data.notes} ${note}` : note };
  }
  return parsed.data;
}

/** Schlüssel aus der Liste, sonst der Name aus dem Befund (dann zeigt die App ihn unter diesem Namen). */
export function markerKeyFor(v: { name: string; marker_key: string }): string {
  return MARKERS.some((m) => m.key === v.marker_key) ? v.marker_key : v.name.trim();
}

export function isIsoDate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
