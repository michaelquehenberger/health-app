# LIVION – Updates einspielen und Dateiablage

Stand: 12.11.2026 · App-Version 0.7.0

## Wo was liegt

| Was | Ort | Bemerkung |
| --- | --- | --- |
| Programmcode und Dokumente | GitHub, `michaelquehenberger/health-app`, Zweig `main` | die verbindliche Ablage |
| Web-Version | https://michaelquehenberger.github.io/health-app/ | wird aus `main` automatisch gebaut |
| Claude-Version | https://claude.ai/artifact/CcV5wLqF523Xz99WmMnobG | eine Datei `livion.html`, aus demselben Code gebaut |
| Fertige Datei der Claude-Version | GitHub → Reiter „Actions“ → letzter Lauf „App online stellen“ → unten „Artifacts“ → `livion-claude` | 90 Tage abrufbar, bei jeder Freigabe neu |
| Anleitung für Gabi | https://claude.ai/artifact/KKnUPmhb7K413MHMbvH3n5 | |
| Konzept, Auswertungslogik, Übungsdatenbank | Claude-Projekt „Health App“ | Vorgaben, nicht Teil des Codes |
| Daten der Nutzerin | Web: Browser des Geräts · Claude: privater Speicher der Seite | nie auf GitHub; Sicherung als Datei unter „Mehr“ |

Ordner im Projekt: `src/` Programm · `docs/` Dokumente · `public/` Symbol und App-Angaben · `tools/` Hilfsskript für die Claude-Version · `.github/` Automatik (Prüfung, Veröffentlichung, Update-Vorschläge). `dist/` und `dist-claude/` entstehen beim Bauen und liegen nicht auf GitHub.

## So kommt eine Änderung in die App

1. Die Änderung liegt als **Pull Request** auf GitHub.
2. GitHub prüft sie automatisch („Prüfung vor der Freigabe“): Typprüfung, alle Tests, Bau beider Versionen, Sicherheitsmeldungen. **Grüner Haken = kann eingespielt werden.**
3. Du gibst frei („Merge pull request“).
4. Die **Web-Version** ist nach ein bis zwei Minuten aktuell, ohne weiteres Zutun.
5. Die **Claude-Version** wird in der Claude-Code-Sitzung neu veröffentlicht (ein Schritt, gleiche Adresse). Offene Seiten übernehmen die neue Fassung von selbst; die Daten bleiben erhalten.

## Updates der Bausteine

- Einmal im Monat schlägt GitHub (Dependabot) kleine Updates gebündelt als einen Pull Request vor. Ist der Haken grün, freigeben.
- Sicherheitsmeldungen prüft die automatische Prüfung bei jedem Pull Request mit.
- Große Versionssprünge kommen nicht automatisch, weil sie Umbauten brauchen. Stand 12.11.2026 bewusst zurückgestellt: React 19, Vite 8, TypeScript 7 (kein Sicherheitsgrund, kein Nutzen für die Testphase) und pdf.js 6.5 (erst wenige Tage alt).

## Von Hand prüfen (für Entwickler)

```bash
npm ci
npm run check        # Typprüfung, Tests, Web-Version, Claude-Version
```

## Daten bleiben bei Updates erhalten

- Neue Felder werden beim Laden ergänzt; ältere Sicherungsdateien lassen sich weiter einlesen (automatisch getestet).
- Claude-Version: Es gilt immer der Stand mit der jüngsten Änderung. Ist der Speicher auf claude.ai nicht erreichbar, zeigt die App einen Hinweis, speichert im Browser und trägt nach, sobald die Verbindung wieder steht. „Alles löschen“ leert auch den Speicher auf claude.ai, notfalls beim nächsten Verbinden.
