# Testdaten „Michael Muster“

**Frei erfundene Testperson.** Keine echten Gesundheitsdaten. Erstellt am 15.11.2026 mit der App selbst (Version 0.7.0).

| Datei | Inhalt |
| --- | --- |
| `livion-testdaten-michael-muster.json` | komplette Sicherungsdatei: Profil, Anamnese, alle Tests, Gesundheitsdaten, Blutwerte, Beschwerden, 28 Tage Wearable-Daten. **Ohne** Auswertung und Coach-Plan, damit diese mit der echten KI entstehen. |
| `musterbefund-michael-muster.pdf` | derselbe Blutbefund als PDF, nur um den PDF-Upload zu testen |
| `wearable-michael-muster.csv` | dieselben Wearable-Daten als Datei, nur um den Datei-Import zu testen |

## Die Testperson

- **Profil:** Teilnehmer-ID „Michael Muster“, 52 Jahre, männlich, 182 cm, 88 kg (BMI 26,6), Bewegungserfahrung mittel, 15 Minuten pro Tag, Mischkost, keine Allergien, keine Medikamente. Ziel: wieder schmerzfrei wandern und Treppen steigen, fitter werden, Rücken stärken.
- **Anamnese (PAR-Q+):** alle Fragen mit Nein, freigegeben.
- **Tests (Baseline, 11.–15.11.2026):** Ruhepuls Median 66 bpm (5 Morgen) · Knie-zur-Wand L 7 / R 10 cm · Chair Sit-and-Reach L −11 / R −9 cm · Einbeinstand L 26 / R 19 s · 30-s-Sit-to-Stand 13 · Liegestütz 14 (Knie) · UKK-Gehtest 18:30 min, Puls 142, Index 67.
- **Blutwerte (Musterlabor, 10.11.2026), 15 Werte;** außerhalb des Laborbereichs: HbA1c 5,8 % (bis 5,6), Cholesterin 238 mg/dL (bis 200), LDL 172 mg/dL (bis 160), Triglyceride 165 mg/dL (bis 150), Vitamin D 21 ng/mL (30–100). Alle anderen im Bereich.
- **Beschwerden:** Knie links, Schmerz bei Belastung und Steifigkeit, Treppen und Gehen, 6 Wochen bis 3 Monate, 4/10 · Rücken, Steifigkeit morgens, langes Sitzen, Bücken und Heben, über 3 Monate, 3/10. Keine roten Flaggen.
- **Wearable (17.10.–14.11.2026):** Schlaf um 6,3 h, Ruhepuls um 64, HRV um 34 ms, VO2max 36 bis 37.

## So testest du

1. LIVION auf claude.ai öffnen. Bei einer neuen Nutzung: Willkommen und Profil kurz ausfüllen (wird durch den Import ersetzt).
2. **Mehr → Sicherung importieren →** `livion-testdaten-michael-muster.json` wählen → „Ja, importieren“.
3. **Heute:** Einwilligung für die KI-Auswertung → „Auswertung erstellen“.
4. **Coach:** „Plan erstellen“, dann Tagesimpuls und eine Frage im Gespräch.
5. Optional: unter Gesundheit → Befunde das PDF hochladen, um die Auslesung zu testen (die Werte sind dann doppelt; zum Zurücksetzen die Sicherung erneut importieren).

**Was zu erwarten ist:** Wegen „Schmerz bei Belastung“ startet der Plan auf der leichtesten Stufe, also nur mit Beweglichkeitsübungen für Knie und Rücken. Die fünf Werte außerhalb des Laborbereichs sollten unter „beim Arzt ansprechen“ stehen, ohne Deutung und ohne Dosis.

**Hinweis zum Datum:** Die Wearable-Durchschnitte der App beziehen sich auf die letzten 7 Tage ab heute. Am aussagekräftigsten ist der Test bis etwa 20.11.2026; danach fehlen in den 7 Tagen Werte (die 28-Tage-Werte für den Plan bleiben). Neue Daten mit aktuellem Datum lassen sich jederzeit erzeugen.
