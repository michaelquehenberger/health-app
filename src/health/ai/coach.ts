// Coach: täglicher Impuls und Gespräch, präventiv und alltagsnah, ohne medizinische Empfehlung.
// Läuft über das Claude-Konto der Person (LIVION-Version auf claude.ai). Ohne KI zeigt der Coach die Regeln des Tagesplans.
import { z } from 'zod';
import { evaluateValue, marker } from '../logic/labs';
import { blocksPlan, checkRedFlags, latestByMarker } from '../logic/redFlags';
import { buildDayCard } from '../logic/plan';
import { describe as describeComplaint } from '../logic/complaints';
import { regionInfo } from '../data/exercises';
import { summarizeWearables } from '../wearables/days';
import { latestAnamnesis } from '../../parq';
import { summarize } from '../../results';
import { TESTS } from '../../tests';
import type { AppData } from '../../types';
import { EMPTY_HEALTH } from '../types';
import { sampleCap, type SampleFn } from '../../platform';
import { LabExtractError, promptWithSchema, toAppError } from './labExtract';
import { stripDoses } from './planAnalysis';

export const AREAS = ['Bewegung', 'Erholung', 'Schlaf', 'Trinken', 'Ernährung', 'Alltag'] as const;

export const CoachImpulse = z.object({
  titel: z.string(),
  /** 2–3 Sätze: worauf es heute ankommt, mit Bezug auf die Daten */
  impuls: z.string(),
  schritte: z.array(z.object({ bereich: z.enum(AREAS), text: z.string() })),
  /** eine Frage zum Nachdenken oder für das Gespräch */
  frage: z.string(),
});
export type CoachImpulseResult = z.infer<typeof CoachImpulse>;

export interface ChatTurn { role: 'user' | 'assistant'; content: string; at: string }

const fmt = (n: number | null, d = 1) => (n === null ? '–' : String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ','));
const RESULT_TEXT = { freigegeben: 'freigegeben', nicht_freigegeben: 'nicht freigegeben, ärztliche Abklärung nötig', freigegeben_nach_abklaerung: 'nach ärztlicher Abklärung freigegeben' };

/** Kurzfassung aller Daten für den Coach. Ohne Namen und Kennung, Medikamente und Allergien nur als „angegeben“. */
export function buildCoachContext(data: AppData, today: string): string {
  const h = data.health ?? EMPTY_HEALTH;
  const p = data.profile;
  const out: string[] = [];
  out.push(`Heute: ${today}`);
  if (p) out.push(`Profil: ${p.age ?? '–'} Jahre, ${p.sex || '–'}${p.goal.trim() ? `, Ziel: ${p.goal.trim()}` : ''}`);
  out.push(`Bewegungserfahrung ${h.profile.experience}, ${h.profile.minutesPerDay} Minuten pro Tag; Allergien ${h.profile.allergies.trim() ? 'angegeben' : 'keine'}; Medikamente ${h.profile.medications.trim() ? 'angegeben' : 'keine'}${h.profile.fluidRestriction ? '; ärztliche Trinkvorgabe' : ''}`);

  const a = latestAnamnesis(data.anamneses);
  out.push(`Gesundheitsfragebogen (PAR-Q+): ${a?.result ? RESULT_TEXT[a.result] : 'nicht ausgefüllt'}`);

  const tests = TESTS.map((t) => `${t.name}: ${summarize(data.records, t.id, 'baseline').text}`);
  out.push(`Fitnesstests: ${tests.join('; ')}`);

  const latest = [...latestByMarker(h.values, h.reports).values()];
  const outside = latest.filter((v) => evaluateValue(v).status === 'ausserhalb').map((v) => `${marker(v.marker).label} ${evaluateValue(v).direction ?? 'außerhalb'}`);
  out.push(`Blutwerte: ${latest.length} erfasst; außerhalb des Laborbereichs: ${outside.length ? outside.join(', ') : 'keine'}`);

  const active = h.complaints.filter((c) => c.active);
  out.push(`Beschwerden: ${active.length ? active.map((c) => `${regionInfo(c.region).label} (${describeComplaint(c)}, Stärke ${c.intensity}/10)`).join('; ') : 'keine'}`);

  const flags = checkRedFlags(h.complaints, h.values, h.reports);
  if (blocksPlan(flags)) out.push('WICHTIG: Eine Angabe braucht ärztliche Abklärung. Bis dahin keine Übungen empfehlen, sondern auf die Abklärung hinweisen.');

  const w = summarizeWearables(h.wearables, today);
  if (w.nights) out.push(`Wearable (7 Tage): Schlaf ${fmt(w.avgSleepHours)} h, Ruhepuls ${fmt(w.avgRestingHr, 0)}, HRV ${fmt(w.avgHrv, 0)} ms, VO2max ${fmt(w.latestVo2max)}`);

  const card = buildDayCard({ date: today, profile: h.profile, complaints: h.complaints, feedback: h.feedback, values: h.values, reports: h.reports, preferredIds: h.planChoice?.exerciseIds });
  out.push(`Tagesplan heute: ${card.focusLabel}; Übungen: ${card.exercises.map((e) => e.name).join(', ') || 'keine'}${card.endurance ? `; ${card.endurance}` : ''}`);
  out.push(`Trinken: ${'text' in card.drink ? card.drink.text : 'keine Angabe (ärztliche Vorgabe oder auffällige Nierenwerte)'}`);
  const fb = [...h.feedback].sort((x, y) => y.date.localeCompare(x.date))[0];
  if (fb) out.push(`Letzte Rückmeldung (${fb.date}): Schmerz vorher ${fb.painBefore ?? '–'}, nachher ${fb.painAfter ?? '–'}, am Morgen ${fb.painMorning ?? '–'}${fb.swelling ? ', Schwellung' : ''}`);

  const an = h.analyses?.at(-1);
  if (an) out.push(`Letzte KI-Auswertung (${an.createdAt.slice(0, 10)}): ${an.result.zusammenfassung} Schwerpunkte: ${an.result.schwerpunkte.map((s) => s.titel).join(', ')}`);
  return out.join('\n');
}

const RULES = `Du bist der LIVION-Coach in einer Bewegungs- und Präventions-App. Du begleitest eine erwachsene Person im Alltag.
Deine Aufgabe: konkrete, kleine, machbare Schritte zur Vorbeugung und für das Wohlbefinden: Bewegung im Alltag, Pausen, Erholung, Schlafgewohnheiten, Trinken, allgemeine ausgewogene Ernährung, Umgang mit Stress, Motivation. Beziehe dich auf die Daten der Person.
Grenzen, immer:
- Keine Diagnosen oder Vermutungen über Krankheiten, nichts den Wechseljahren zuordnen.
- Keine Empfehlungen zu Medikamenten, Supplements, Dosierungen oder Therapien; keine Diät- oder Kalorienvorgaben. Dafür auf Ärztin, Arzt oder Apotheke verweisen.
- Übungen nur aus dem Tagesplan der App nennen; keine neuen Übungen erfinden. Schmerzregel: höchstens 5 von 10, am nächsten Morgen wieder wie vorher, sonst leichter.
- Bei Warnzeichen (Brustschmerz, Atemnot, Lähmung, Taubheit, Fieber mit heißem geschwollenem Gelenk, plötzlicher starker Schmerz, Probleme bei Blase oder Darm) sofort zu ärztlicher Hilfe raten, im Notfall Notruf 144.
- Was du nicht weißt, sag ehrlich.
Stil: Deutsch (Österreich), Du-Form, warm und klar, ohne Fachjargon, ohne Emojis. Kurz: höchstens etwa 120 Wörter, gern mit 2–4 konkreten Schritten.`;

/** Wie stripDoses, aber Zeilen bleiben erhalten (Listen im Gespräch). */
export function cleanReply(s: string): string {
  return s
    .split('\n')
    .map((line) => {
      const m = /^(\s*(?:[-*•]|\d+[.)])\s+)?(.*)$/.exec(line)!;
      if (!m[2].trim()) return line;
      const rest = stripDoses(m[2]);
      return rest ? (m[1] ?? '') + rest : null;
    })
    .filter((l): l is string => l !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function dailyImpulse(context: string, sample?: SampleFn | null): Promise<CoachImpulseResult> {
  const fn = sample === undefined ? await sampleCap() : sample;
  if (!fn) throw new LabExtractError('nicht_verfuegbar', 'Der Coach mit KI läuft in der LIVION-Version auf claude.ai.');
  let json: unknown;
  try {
    json = await fn.json(promptWithSchema(RULES, CoachImpulse, `Gib den Impuls für heute: genau 3 Schritte aus verschiedenen Bereichen, passend zum Tagesplan und zu den Daten.\n\nDaten:\n${context}`), { cache: false });
  } catch (e) {
    throw toAppError(e, 'Keine Verbindung zum Coach.');
  }
  const parsed = CoachImpulse.safeParse(json);
  if (!parsed.success) throw new LabExtractError('antwort', 'Die Antwort hatte nicht das erwartete Format. Bitte erneut versuchen.');
  const r = parsed.data;
  return { titel: r.titel, impuls: stripDoses(r.impuls), schritte: r.schritte.slice(0, 4).map((x) => ({ ...x, text: stripDoses(x.text) })).filter((x) => x.text), frage: r.frage };
}

/** Eine Antwort im Gespräch. Die Anweisungen und Daten stehen als erste Nachricht vor dem Verlauf. */
export async function coachReply(
  turns: ChatTurn[],
  context: string,
  opts: { onText?: (text: string) => void; signal?: AbortSignal } = {},
  sample?: SampleFn | null,
): Promise<string> {
  const fn = sample === undefined ? await sampleCap() : sample;
  if (!fn) throw new LabExtractError('nicht_verfuegbar', 'Der Coach mit KI läuft in der LIVION-Version auf claude.ai.');
  const recent = turns.slice(-16).map((t) => ({ role: t.role, content: t.content }));
  const input = [{ role: 'user' as const, content: `${RULES}\n\nDaten der Person:\n${context}\n\nAntworte ab jetzt auf ihre Nachrichten.` }, ...recent];
  try {
    const r = await fn(input, {
      cache: false,
      signal: opts.signal,
      onText: opts.onText ? ({ text }: { text: string }) => opts.onText!(text) : undefined,
    });
    return cleanReply(r.text);
  } catch (e) {
    throw toAppError(e, 'Keine Verbindung zum Coach.');
  }
}
