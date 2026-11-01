// Rote Flaggen laut „Auswertungslogik – Testphase Gabi“. Entwurf, braucht ärztliche Ergänzung.
import type { Complaint, LabReport, LabValue } from '../types';
import { evaluateValue } from './labs';

export type FlagLevel = 'notfall' | 'arzt' | 'hinweis';

export interface Flag {
  level: FlagLevel;
  text: string;
  source?: { label: string; url: string };
}

const NHS = { label: 'NHS', url: 'https://www.nhs.uk/conditions/septic-arthritis/' };
const MAYO = { label: 'Mayo Clinic', url: 'https://mayoclinic.elsevierpure.com/en/publications/joint-pain' };
const PZ = { label: 'Pharmazeutische Zeitung', url: 'https://www.pharmazeutische-zeitung.de/index.php?id=72349' };

/** Liefert alle zutreffenden Flaggen; bei notfall oder arzt entfällt der Übungsplan. */
export function checkRedFlags(complaints: Complaint[], values: LabValue[], reports: LabReport[]): Flag[] {
  const flags: Flag[] = [];
  const active = complaints.filter((c) => c.active);

  for (const c of active) {
    const f = c.redFlags;
    if (f.chestPain) {
      flags.push({ level: 'notfall', text: 'Brustschmerz oder Atemnot bei Belastung: Training stoppen, Notruf 144 wählen.' });
    }
    if (c.region === 'ruecken' && f.caudaEquina) {
      flags.push({ level: 'notfall', text: 'Lähmung oder Blasen- bzw. Darmstörung: Das ist ein Notfall. Sofort ärztlich abklären.', source: PZ });
    }
    if (f.acuteHotJoint) {
      flags.push({
        level: 'notfall',
        text: f.fever
          ? 'Heißes, geschwollenes Gelenk mit Fieber: sofort ärztlich abklären oder Notaufnahme.'
          : 'Gelenk plötzlich stark schmerzhaft, heiß, geschwollen oder nicht belastbar: sofort ärztlich abklären.',
        source: NHS,
      });
    }
    if (f.injury || f.fever || f.systemic || f.neuro || f.suddenOnset) {
      flags.push({ level: 'arzt', text: 'Deine Angaben (z. B. Verletzung, Fieber, Taubheit oder plötzlicher Beginn) sollten vor jeder Übung ärztlich abgeklärt werden.', source: MAYO });
    }
    if (f.multipleSwollenJoints || f.longMorningStiffness) {
      flags.push({ level: 'hinweis', text: 'Mehrere geschwollene Gelenke oder lange Morgensteifigkeit: Sprich das bei deinem nächsten Arzttermin an.' });
    }
  }

  // Kombinationsregeln 1 und 2 mit Blutwerten
  const swellingOrFever = active.some((c) => c.swellingOrWarmth || c.redFlags.fever);
  const hotJoint = active.some((c) => c.redFlags.acuteHotJoint || c.swellingOrWarmth);
  const latest = latestByMarker(values, reports);
  const crp = latest.get('crp');
  if (crp && evaluateValue(crp).status === 'ausserhalb' && swellingOrFever) {
    flags.push({ level: 'arzt', text: 'CRP außerhalb des Laborbereichs und Schwellung, Wärme oder Fieber: bitte ärztlich abklären, bevor du übst.' });
  }
  const uric = latest.get('harnsaeure');
  if (uric && uric.refHigh !== null && uric.value > uric.refHigh && hotJoint) {
    flags.push({ level: 'arzt', text: 'Harnsäure erhöht und heißes oder geschwollenes Gelenk: bitte ärztlich abklären, bevor du übst.' });
  }

  return dedupe(flags);
}

export function blocksPlan(flags: Flag[]): boolean {
  return flags.some((f) => f.level === 'notfall' || f.level === 'arzt');
}

/** Jüngster Wert je Marker, nach Befunddatum; bei gleichem Datum gewinnt der zuletzt eingegebene. */
export function latestByMarker(values: LabValue[], reports: LabReport[]): Map<string, LabValue> {
  const dates = new Map(reports.map((r) => [r.id, r.date]));
  const m = new Map<string, LabValue>();
  for (const v of values) {
    const prev = m.get(v.marker);
    if (!prev || (dates.get(v.reportId) ?? '') >= (dates.get(prev.reportId) ?? '')) m.set(v.marker, v);
  }
  return m;
}

function dedupe(flags: Flag[]): Flag[] {
  const seen = new Set<string>();
  return flags.filter((f) => (seen.has(f.text) ? false : (seen.add(f.text), true)));
}
