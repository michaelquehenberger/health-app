# LIVION – MVP Fitnesstests (Testphase)

Web-App für das Handy: Sicherheitscheck (PAR-Q+), sieben Basis-Tests und der persönliche Verlauf
Baseline → Tag 30 → Tag 90. Grundlage: [`docs/health-app-mvp-uebergabe.md`](docs/health-app-mvp-uebergabe.md).

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
| Sicherheits-Gate | Offizielles PAR-Q+ wird extern ausgefüllt (eparmedx.com); die App fragt nur das Ergebnis ab. Ohne Freigabe sind die Tests gesperrt. Freigabe 12 Monate gültig. |
| Tests | T1, T5, T7, T4, T3, T8, T2 in der Reihenfolge des Testtags; Stoppuhr für T2, T3, T4; Abbruch mit Grund |
| Vergleichswerte | T2 Fitness-Index nur Männer 20–65; T4 Springer 2007 nur 40–59 J. ohne Streuung; T5 Hinweis ab 1,5 cm Seitendifferenz; sonst keine |
| Datenqualität | B (nach Anleitung) oder C (abgewichen oder geschätzt) |
| Verlauf | je Test Baseline, Tag 30, Tag 90 |
| Einstellungen | Profil, Einwilligung, Export (JSON und CSV mit den Pflichtfeldern), Import, alles löschen |

## Offen (nicht erfunden, bewusst ausgelassen)

- UKK-Formel für Frauen: Bei Frauen werden nur die Rohdaten gespeichert und die Gehzeit angezeigt.
- Liegestütz-Vergleich für Männer: Die Tabelle aus dem Konzept liegt noch nicht vor.
- Pausenlänge beim Einbeinstand.
- Sportmedizinische Freigabe der Abbruchregeln.
- Die Testanleitungen sind knapp gehalten und mit dem Konzept abzugleichen.
- Vorschlag des Messzeitpunkts (ab Tag 20 „Tag 30“, ab Tag 60 „Tag 90“) ist nur eine Voreinstellung; er lässt sich in der Testmappe ändern.

## Aufbau

- `src/calc.ts` – BMI, UKK-Index, Einbeinstand, Median (Tests in `src/calc.test.ts`)
- `src/tests.ts` – Testkatalog, Abbruchregeln, PAR-Q+-Hinweise
- `src/results.ts` – Zusammenfassung je Test und Messzeitpunkt
- `src/screens/` – Bildschirme
