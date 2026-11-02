# LIVION – MVP Fitnesstests (Testphase)

Web-App für das Handy: einmalige Anamnese (PAR-Q+), sieben Basis-Tests und der persönliche Verlauf
Baseline → Tag 30 → Tag 90. Grundlage: MVP-Übergabe v0.1 ([`docs/health-app-mvp-uebergabe.md`](docs/health-app-mvp-uebergabe.md)) und v0.2.

Online: https://michaelquehenberger.github.io/health-app/ (wird bei jedem Push auf `main` neu veröffentlicht).

**Keine Diagnose.** Daten bleiben nur im Browser des Geräts, gespeichert wird eine Teilnehmer-ID, kein Name.

## Starten

```bash
npm install
npm run dev      # Entwicklung, http://localhost:5173
npm test         # automatische Tests der Berechnungen
npm run build    # fertige Web-App im Ordner dist/
```

## Umsetzung der Übergabe

| Bereich | Stand |
| --- | --- |
| Profil | Teilnehmer-ID (T01), Alter, Geschlecht, Größe, Gewicht, BMI automatisch, Ziel |
| Anamnese (PAR-Q+) | Deutsche Fassung 01.07.2024 wörtlich in `src/parq-de.json`; Teil A, Teil B mit Unterfragen, Einverständnis per Häkchen, Ergebnis freigegeben / nicht freigegeben / freigegeben nach Abklärung, 12 Monate gültig, frühere Anamnesen bleiben gespeichert. Ohne gültige Freigabe sind die Tests gesperrt. |
| Tests | T1, T5, T7, T4, T3, T8, T2 in der Reihenfolge des Testtags; Stoppuhr für T2, T3, T4; Abbruch mit Grund |
| Vergleichswerte | T2 Fitness-Index nur Männer 20–65; T4 Springer 2007 nur 40–59 J. ohne Streuung; T5 Hinweis ab 1,5 cm Seitendifferenz; sonst keine |
| Datenqualität | B (nach Anleitung) oder C (abgewichen oder geschätzt); jede Messung speichert die Protokollversion und ob der Messzeitpunkt vorgeschlagen oder manuell gewählt war |
| Verlauf | je Test Baseline, Tag 30, Tag 90 |
| Einstellungen | Profil, Einwilligung, Export (JSON und CSV mit den Pflichtfeldern), Import, alles löschen |

## Offen (nicht erfunden, bewusst ausgelassen)

- UKK-Formel für Frauen: Kandidatenformel hinter dem Schalter „Frauenindex“ in den Einstellungen (Standard aus, Anzeige „vorläufig“); Prüfung am Original fehlt.
- Liegestütz-Vergleich für Männer: Die Tabelle aus dem Konzept liegt noch nicht vor.
- PAR-Q+: Erlaubnis für kommerzielle Nutzung (PARQ@hs-gesundheit.de); Häkchen statt Unterschrift rechtlich prüfen.
- Sportmedizinische Freigabe der Abbruchregeln.
- Die Testanleitungen sind knapp gehalten und mit dem Konzept abzugleichen.
- Vorschlag des Messzeitpunkts: Tag 0–19 Baseline, Tag 20–59 „Tag 30“ (sobald dort alles erledigt ist „Tag 90“), ab Tag 60 „Tag 90“. Nur Voreinstellung, in der Testmappe änderbar.

## Aufbau

- `src/calc.ts` – BMI, UKK-Index, Einbeinstand, Median (Tests in `src/calc.test.ts`)
- `src/tests.ts` – Testkatalog mit Protokollversion, Abbruchregeln
- `src/parq-de.json`, `src/parq.ts` – PAR-Q+-Texte (unverändert) und Ablauflogik (Tests in `src/parq.test.ts`)
- `src/results.ts` – Zusammenfassung je Test und Messzeitpunkt
- `src/screens/` – Bildschirme
