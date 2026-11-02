// Ernährungs- und Trinkhinweise. Jeder Hinweis trägt seine Quelle. Keine Diätpläne, keine Kalorienvorgaben.
// Allergien und Unverträglichkeiten sind ein harter Ausschluss: Ein Hinweis, der ein genanntes Lebensmittel
// erwähnt, wird nie gezeigt.

export interface Source { label: string; url: string }

export interface NutritionHint {
  id: string;
  text: string;
  source: Source;
  /** Lebensmittel, die der Hinweis nennt (klein geschrieben, als Wortstamm). */
  mentions: string[];
}

const VZ: Source = { label: 'Verbraucherzentrale NRW', url: 'https://www.verbraucherzentrale.nrw/node/24202' };
const DAK: Source = { label: 'DAK', url: 'https://www.dak.de/dak/gesundheit/essen-trinken/trinken/wie-viel-wasser-am-tag_168656' };
const NICE: Source = { label: 'NICE NG226', url: 'https://www.nice.org.uk/guidance/ng226/chapter/Recommendations' };

export const NUTRITION_HINTS: NutritionHint[] = [
  { id: 'wasser', text: 'Am besten trinkst du Leitungswasser, Mineralwasser oder ungesüßte Kräuter- und Früchtetees, über den Tag verteilt.', source: VZ, mentions: ['tee'] },
  { id: 'suess', text: 'Gesüßte Getränke wie Softdrinks sind keine empfohlenen Durstlöscher, weil sie viele unnötige Kalorien enthalten.', source: VZ, mentions: [] },
  { id: 'schorle', text: 'Eine Saftschorle im Verhältnis 1 Teil Saft zu 3 Teilen Wasser ist ein guter Durstlöscher.', source: VZ, mentions: ['saft', 'obst', 'frucht'] },
  { id: 'alkohol', text: 'Die DGE empfiehlt, auf alkoholische Getränke komplett zu verzichten.', source: DAK, mentions: ['alkohol'] },
  { id: 'lebensmittel', text: 'Auch Lebensmittel liefern Flüssigkeit. Zusammen mit etwa 1,5 Litern Getränken ergibt das rund 2 bis 2,5 Liter am Tag.', source: DAK, mentions: [] },
  { id: 'gewicht', text: 'Bei Arthrose gehören Übungen und, wenn angebracht, Gewichtsmanagement zu den Kernbehandlungen. Besprich Änderungen an deiner Ernährung ärztlich.', source: NICE, mentions: [] },
];

/** Zerlegt die Freitext-Angabe in einzelne Begriffe (Komma, Semikolon, Zeilenumbruch, „und“). */
export function allergyTerms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[,;\n]| und /)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

export function filterByAllergies(hints: NutritionHint[], allergies: string): NutritionHint[] {
  const terms = allergyTerms(allergies);
  if (terms.length === 0) return hints;
  return hints.filter((h) => !h.mentions.some((m) => terms.some((t) => t.includes(m) || m.includes(t))));
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Genau ein Hinweis pro Tag, je Tag wechselnd. Gibt null zurück, wenn alle ausgeschlossen sind. */
export function nutritionHintFor(date: string, allergies: string): NutritionHint | null {
  const pool = filterByAllergies(NUTRITION_HINTS, allergies);
  if (pool.length === 0) return null;
  return pool[dayNumber(date) % pool.length];
}
