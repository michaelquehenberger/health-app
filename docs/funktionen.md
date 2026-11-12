# LIVION – Funktionsübersicht

Stand: 12.11.2026 · App-Version 0.7.0 · Testphase mit Teilnehmerin T01

Diese Übersicht beschreibt, was die App heute kann. Entscheidungen und ihre Gründe stehen in [`entscheidungen.md`](entscheidungen.md), die fachlichen Vorgaben in den Übergaben ([v0.4](health-app-mvp-uebergabe-v0.4.md)).

**Grundsatz:** Die App gibt Information und Anregungen zur Vorbeugung. Sie stellt keine Diagnosen, empfiehlt keine Medikamente oder Dosen und ersetzt keine ärztliche Beratung.

---

## 1. Zwei Versionen

| | Web-Version | LIVION auf claude.ai |
| --- | --- | --- |
| Adresse | https://michaelquehenberger.github.io/health-app/ | https://claude.ai/artifact/CcV5wLqF523Xz99WmMnobG |
| KI | keine | über das Claude-Konto der Person, **ohne API-Schlüssel** |
| Speicher | nur im Browser des Geräts | privater Speicher der Seite (nur die Person selbst kann ihn lesen), zusätzlich im Browser |
| Befund-Upload | Eingabe von Hand | PDF oder Foto, KI liest aus |
| Oura | direkte Verbindung (Client-Login) oder Datei | Datei-Import (die Seite darf keine anderen Dienste erreichen) |
| Coach | Tag nach den Regeln, Häkchen, Score | zusätzlich Plan, Tagesimpuls, Gespräch |
| Aktualisierung | automatisch bei jeder Freigabe auf `main` | `npm run build:claude`, dann veröffentlichen |

Beide Versionen nutzen denselben Code. Fehlt die KI, blendet die App die KI-Teile aus und verweist auf die Claude-Version.

## 2. Ablauf für die Nutzerin

Die Navigation unten hat sechs Bereiche: **Heute, Coach, Gesundheit, Tests, Verlauf, Mehr.** „Heute“ zeigt den Weg in fünf Schritten und immer den nächsten Schritt.

1. **Willkommen und Profil:** Einwilligung, Teilnehmer-ID (kein Name), Alter, Geschlecht, Größe, Gewicht, BMI automatisch, persönliches Ziel.
2. **Anamnese (PAR-Q+):** deutsche Fassung vom 01.07.2024 wörtlich; Teil A und Teil B, Ergebnis freigegeben / nicht freigegeben / freigegeben nach Abklärung, 12 Monate gültig. Ohne Freigabe sind Tests und Übungen gesperrt.
3. **Testmappe:** Ruhepuls an 5–7 Morgen und ein Testtag mit sechs Tests (siehe 3.).
4. **Gesundheitsmodul, Pflichtschritt:** Einwilligung für Gesundheitsdaten und Blutwerte; Beschwerden und Wearable-Daten empfohlen.
5. **Auswertung und Übungsplan:** KI-Auswertung aller Daten und Tagesplan nach Regeln; danach täglich im Coach.

## 3. Fitnesstests

- Sieben Tests: Ruhepuls, Knie-zur-Wand, Chair Sit-and-Reach, Einbeinstand (3 Versuche je Bein, 60 s Pause, max. 45 s), 30-s-Sit-to-Stand, Liegestütz, UKK-2-km-Gehtest (Fitness-Index für Männer und Frauen von 20–65 Jahren).
- Zu jedem Test eine Anleitung mit Skizze; Knie-zur-Wand zusätzlich mit Foto und eingezeichneter Messstrecke.
- Stoppuhr, Pausen-Timer, sieben Abbruchregeln mit Grund und Zeitpunkt, Datenqualität B oder C.
- Messzeitpunkte Baseline, Tag 30, Tag 90 mit Vorschlag; Termine als Kalenderdatei.
- Abschluss-Übersicht nach dem Testtag mit dem nächsten Schritt.

## 4. Gesundheitsmodul

**Beschwerden**
- Körperkarte mit Seite: Antippen von z. B. „Hüfte links“ setzt Stelle und Seite; bei Knie, Hüfte, Schulter und Hand ist die Seite Pflicht.
- Mehrere Beschwerden gleichzeitig („Speichern und weitere Beschwerde eintragen“); nur dieselbe Stelle ersetzt einen alten Eintrag.
- Mehrfachauswahl: Art (Steifigkeit, Schwäche, Schmerz bei Belastung oder in Ruhe, Druck, Stechen, Ziehen, Brennen, Kribbeln …), wann, was verstärkt es; dazu seit wann, Verlauf, Stärke 0–10.
- Sicherheitsfragen (rote Flaggen): Notfall oder ärztliche Abklärung sperren den Übungsplan.

**Blutwerte**
- Auf claude.ai: Befund als **PDF** (Seiten werden im Browser zu Bildern, bei ein bis zwei Seiten in je zwei Hälften für kleine Schrift, dazu der Text zur Kontrolle; höchstens 5 Seiten pro Upload) oder **Foto**; die KI liest Werte, Einheiten, Referenzbereiche, Datum und Labor aus.
- Jede erkannte Zeile wird vor dem Übernehmen geprüft, kann korrigiert oder abgewählt werden. Die Datei selbst wird nicht gespeichert.
- Eingabe von Hand bleibt. 24 Blutwerte; bewertet wird nur gegen den Bereich des Labors (im Bereich / außerhalb), Hormone nur anzeigen.

**Wearables**
- Oura (Schlaf, Bereitschaft, Ruhepuls, HRV, VO2max) per Client-Login in der Web-Version; Datei-Import (CSV) für Garmin, Oura und andere in beiden Versionen.
- Mittelwerte über 7 und 28 Tage fließen in Auswertung und Coach-Plan ein.

**Weitere Inhalte:** Ernährungshinweis des Tages mit Quelle (Allergien schließen Hinweise aus), Trinkmenge mit Sperre bei ärztlicher Vorgabe oder auffälligen Nierenwerten, Supplement-Infokarten ohne Dosis nur nach niedrigem Laborwert, gepflegte Videoliste je Körperregion.

## 5. Tagesplan nach Regeln (Heute)

- 3–4 Übungen aus der Übungsdatenbank (35 Übungen für Knie, Hüfte, Schulter, Nacken, Rücken, Hand) für **alle** Regionen mit aktiver Beschwerde.
- Wochenmuster (Kräftigung, Ausdauer, leichte Tage, Ruhetag), Stufen 0–2.
- Schmerzregel: höchstens 5 von 10, am nächsten Morgen wieder wie vorher; sonst eine Stufe leichter, nach mehrmaligem Überschreiten Hinweis auf ärztliche Abklärung. Die vorsichtigste Beschwerde bestimmt die Stufe.
- Jede Übung mit **Skizze** (Ausgangs- und Zielstellung, Bewegung als Pfeil), Anleitung, Dosis laut Quelle, worauf achten und **Suchbegriffen** (deutsch und englisch) für ein Video von Physiotherapeut:innen.

## 6. KI-Auswertung (Schritt 5, claude.ai)

- Fasst Testwerte, Blutwerte, Beschwerden und Wearable-Daten zusammen: Zusammenfassung, Schwerpunkte mit Bezug auf die Daten, 3–5 Übungen, „beim Arzt ansprechen“, fehlende Angaben.
- Übungen nur aus der Datenbank und der betroffenen Region; Stufe 0 nur Beweglichkeit; rote Flaggen sperren den Aufruf.
- „In meinen Tagesplan übernehmen“ setzt die Übungen bevorzugt ein, Regeln gelten weiter.
- Unter „Was an die KI ging“ ist die gesendete Eingabe sichtbar.

## 7. Coach

**Ohne KI (beide Versionen)**
- **LIVION-Score** (0–100, letzte 7 Tage): 70 % erledigte To-dos, 30 % Tage mit mindestens einem Häkchen; Serie „Tage in Folge drangeblieben“ ab zwei Drittel erledigt; Balken je Tag. Heute zählt voll, senkt den Score aber nicht. Vergangene Tage behalten ihren festgehaltenen Stand. Misst das Dranbleiben, nicht die Gesundheit (Entwurf, eigene Definition).
- **Heute abhaken:** Übungen des Tagesplans, Aufgaben (z. B. Trinken, Ausdauer, Spaziergang) und die Schmerz-Rückmeldung; Übungshäkchen sind dieselben wie im Tagesplan. Zu jeder Übung „So geht's“ mit Bild.
- **Diese Woche:** sieben Tage mit Schwerpunkt, Übungsanzahl, Aufgaben und Erledigt-Stand.
- **Ziel in 12 Wochen:** ohne Coach-Plan der Vergleich der Tests Start, Tag 30, Tag 90.

**Mit KI (claude.ai)**
- **Coach-Plan aus allen Daten** (Anamnese, Tests, Blutwerte, Beschwerden, Oura bzw. Garmin, VO2max, letzte Auswertung):
  - Ziel in 12 Wochen mit Messgrößen (nur Tests, Wearable, Gewohnheiten; keine Ziele für Blutwerte, Gewicht oder Medikamente), drei Phasen (Woche 1–4, 5–8, 9–12), Kontrollpunkte Tag 30 und Tag 90, Fortschritt „Woche X von 12“.
  - Aufgaben für jeden Tag der aktuellen Woche; jeden Montag neu planbar, das 12-Wochen-Ziel bleibt.
  - Bevorzugte Übungen für den Tagesplan (nur aus der Datenbank).
- **Tagesimpuls:** drei kleine Schritte für heute und eine Frage.
- **Gespräch:** Fragen zu Bewegung im Alltag, Schlaf, Erholung, Trinken, Motivation; konkrete, vorbeugende Tipps. Vorschläge zum Antippen, Stopp-Knopf, Verlauf löschbar.
- **Grenzen in jeder Antwort:** keine Diagnosen, nichts den Wechseljahren zuordnen, keine Medikamente, Supplements oder Dosen, keine Übungen außerhalb des Tagesplans; bei Warnzeichen Verweis auf ärztliche Hilfe bzw. Notruf 144. Sätze mit Dosisangaben entfernt die App zusätzlich.

## 8. Datenschutz und Einwilligungen

- Keine Namen, nur Teilnehmer-ID. An die KI gehen weder Name noch Kennung; Medikamente und Allergien nur als „angegeben“.
- Getrennte, protokollierte Einwilligungen (Text, Fassung, Zeitpunkt, App-Version, Sprache): Grund-Einwilligung, Gesundheitsdaten, KI-Auslesung der Befunde, KI-Auswertung und Coach. Die KI-Einwilligungen sind in der App widerrufbar.
- Sicherung als Datei (JSON), Messwerte als CSV, Import und „alle Daten löschen“ unter „Mehr“. Der Oura-Zugang steht nie in der Sicherung.
- Claude-Version: Es gilt der Stand mit der jüngsten Änderung. Ist der private Speicher nicht erreichbar, zeigt die App einen Hinweis, speichert im Browser und trägt später nach; „Alles löschen“ leert auch den Speicher auf claude.ai.

## 9. Bewusst offen

- Mit der echten KI auf claude.ai noch nicht durchgeklickt; Durchlauf mit Beispielperson und nachgestellter KI am 03.11.2026 ohne Fehler.
- Oura-Verbindung und Garmin-Export nicht mit echten Geräten geprüft.
- Skizzen und Video-Suchbegriffe noch von keiner Fachperson gesichtet; die App prüft Suchergebnisse nicht.
- Für einen Verkauf (laut Entscheidung erst dann): eigener Server, AV-Vertrag mit Anthropic, MDR-Prüfung, ärztliche Fachprüfung der Regeln, PAR-Q+-Nutzungserlaubnis.

## 10. Technik in Kürze

- Vite, React, TypeScript; 138 automatische Tests (`npm test`); `npm run check` prüft und baut alles. Jeder Pull Request wird automatisch geprüft, Updates siehe [`updates.md`](updates.md).
- `npm run build` baut die Web-Version (`dist/`), `npm run build:claude` die Claude-Version als eine Datei (`dist-claude/livion.html`).
- Wichtige Ordner: `src/health/ai/` (Auslesung, Auswertung, Coach), `src/health/logic/` (Regeln, Score), `src/health/data/` (Übungen, Skizzen, Suchbegriffe), `src/platform.ts` (Anbindung an claude.ai).
