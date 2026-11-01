# LIVION – Health App (Testphase)

Klickbarer Prototyp für die Testphase mit Gabi. Grundlage sind die Projektdokumente
„Health App – Konzept“, „Auswertungslogik – Testphase Gabi“, „Übungsdatenbank“ (alle Entwurf v0.1)
und das „Moodboard Health App – Entwurf 1“.

**Keine Diagnose, keine Therapieempfehlung.** Regeln und Übungen sind Entwurf und brauchen die fachliche Prüfung.

## Starten

```bash
npm install
npm run dev      # Entwicklung, http://localhost:5173
npm test         # Tests der Auswertungslogik
npm run build    # fertige Web-App in dist/
```

## Was der Prototyp kann

| Bildschirm | Inhalt |
| --- | --- |
| Willkommen | Zweck, Hinweis „keine Diagnose“, Einwilligung (Art. 9 DSGVO) |
| Profil | Alter, Geschlecht, Ernährung, Allergien, Medikamente, Trinkvorgabe, Zeit, Rhythmus |
| Beschwerde | Körperkarte, Art, Beginn, Stärke 0–10, Sicherheitsfragen (rote Flaggen) |
| Heute | Tageskarte: 3–4 Übungen nach Wochenmuster und Stufe, Video-Link, Trinken, Ernährung, Schmerzregel |
| Werte | Blutwerte von Hand mit Laborbereich, Ampel „im Bereich / außerhalb“, Plausibilitätsprüfung |
| Verlauf | Schmerz vorher/nachher, Blutwerte über die Zeit, Beschwerden |
| Einstellungen | Profil, Export (JSON), alles löschen |

Daten liegen nur im Browser des Geräts (localStorage). Kein Server, keine Weitergabe.
Schriften (Sora, Inter) sind lokal eingebunden, nicht von Google nachgeladen.

## Aufbau

- `src/data/exercises.ts` – Übungsdatenbank mit Quellen
- `src/logic/redFlags.ts` – rote Flaggen und Kombinationsregeln mit Blutwerten
- `src/logic/labs.ts` – Marker, Bewertung gegen den Laborbereich, Plausibilität
- `src/logic/plan.ts` – Wochenmuster, Stufen, Schmerzregel, Tageskarte (`RULES_VERSION`)
- `src/logic/logic.test.ts` – Tests der Regeln

## Annahmen, die die Fachprüfung bestätigen muss

- Schmerzgrenze 5/10; Stufe sinkt nach einer Überschreitung, steigt nach 3 regelkonformen Einheiten.
- Ärztliche Abklärung nach 2 Überschreitungen in Folge.
- „Lange Morgensteifigkeit“ als länger als 30 Minuten formuliert.
- Spannen für „beobachten“ und „deutlich außerhalb“ je Blutwert fehlen noch.
- Verteilung des Wochenmusters auf Wochentage.

## Noch nicht enthalten (nächste Schritte)

- Befund-Upload mit KI-Auslesung (braucht Server in der EU und AV-Vertrag)
- PubMed-Anbindung für Supplement- und Ernährungshinweise mit Studienquelle
- Erinnerungen per E-Mail oder Push, Login und Sync
- Eingebettete, fachlich geprüfte Videos (derzeit Links zu Arthritis UK, Englisch)
