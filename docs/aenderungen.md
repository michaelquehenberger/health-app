# LIVION – Änderungsprotokoll

Neueste Version oben. Einzelheiten zu Entscheidungen in [`entscheidungen.md`](entscheidungen.md), alle Funktionen in [`funktionen.md`](funktionen.md).

## 0.7.0 · 12.11.2026 – Gesamtprüfung

**Behoben**
- Claude-Version: War der private Speicher nicht erreichbar, speicherte die App ohne Hinweis nur im Browser; ein älterer Stand im Speicher konnte später den neueren überschreiben. Jetzt gilt der Stand mit der jüngsten Änderung, es gibt einen Hinweis mit „Erneut verbinden“, und beim Verlassen der Seite wird sofort gespeichert.
- „Alles löschen“ ohne Verbindung ließ die Daten im Claude-Speicher stehen; sie werden jetzt beim nächsten Verbinden entfernt.
- LIVION-Score: Ein neuer Wochenplan oder eine geänderte Beschwerde rechnete vergangene Tage nachträglich um. Der Tagesstand wird jetzt festgehalten.
- Nach „Woche neu planen“ galten alte Häkchen für die neuen Aufgaben an derselben Stelle.
- Der Coach-Plan ließ sich trotz roter Flagge erstellen; jetzt gesperrt wie die Auswertung.

**Verbessert**
- PDF-Befunde: Bei ein oder zwei Seiten geht jede Seite in zwei Hälften an die KI, damit kleine Schrift lesbar bleibt.
- Text bei „Alles löschen“ nennt auch Auswertungen, Coach-Plan, Gespräch und Häkchen.

**Updates und Automatik**
- zod 4.6.7 (Sicherheitsmeldung), vitest 5.1.0 (Sicherheitsmeldungen im Testwerkzeug), vite 6.4.6, Schriften 5.3.0. Keine offenen Sicherheitsmeldungen.
- Automatische Prüfung jedes Pull Requests, monatliche Update-Vorschläge, Datei der Claude-Version als Ablage bei jeder Freigabe (siehe [`updates.md`](updates.md)).
- 138 automatische Tests (neu: Speicher-Abgleich, Sicherung, Tagesstand, PDF-Seitenplan).

## 0.6.0 · 05.11.2026
- Texte zum Speicherort je Version richtig; neue Textfassungen der Einwilligungen für die Claude-Version.

## 03.11.2026
- Coach: Plan für 12 Wochen und die aktuelle Woche, Tagesimpuls, Gespräch, LIVION-Score, tägliche Häkchen.
- Skizzen und Video-Suchbegriffe zu allen 35 Übungen.
- Befunde als PDF. Kompletter Durchlauf mit Beispielperson.

## 02.11.2026
- Geführter Ablauf in fünf Schritten, Gesundheitsmodul als Pflichtschritt, VO2max aus Oura.
- Beschwerden mit Seite und Mehrfachauswahl, mehrere Beschwerden gleichzeitig.
- KI-Auswertung; KI ohne API-Schlüssel über die Version auf claude.ai mit privatem Speicher.

## 0.5.0 · 02.11.2026
- Gesundheitsmodul: Beschwerden, Blutwerte, Tageskarte, Videos, Ernährung, Supplement-Infokarten, Wearables.

## 01.–02.11.2026
- Fitnesstests mit PAR-Q+, Anleitungen und Skizzen, Verlauf Baseline, Tag 30, Tag 90.
