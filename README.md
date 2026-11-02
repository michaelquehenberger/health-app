# LIVION – Fitnesstests und Gesundheitsmodul (Testphase)

Web-App für das Handy: einmalige Anamnese (PAR-Q+), sieben Basis-Tests und der persönliche Verlauf
Baseline → Tag 30 → Tag 90. Grundlage: MVP-Übergabe v0.4 ([`docs/health-app-mvp-uebergabe-v0.4.md`](docs/health-app-mvp-uebergabe-v0.4.md)); erste Fassung v0.1 in [`docs/health-app-mvp-uebergabe.md`](docs/health-app-mvp-uebergabe.md).

Online: https://michaelquehenberger.github.io/health-app/ (wird bei jedem Push auf `main` neu veröffentlicht).

**Keine Diagnose.** Daten bleiben nur im Browser des Geräts, gespeichert wird eine Teilnehmer-ID, kein Name.

Seit Version 0.5 gibt es zusätzlich das **Gesundheitsmodul** (Beschwerden mit roten Flaggen, Blutwerte, Tageskarte mit Übungen und Videos, Ernährung, Trinkmenge, Supplement-Infokarten, Wearable-Daten). Grundlage: Konzept, Auswertungslogik und Übungsdatenbank im Claude-Projekt „Health App“.

## Ablauf der App

1. **Profil** (Teilnehmer-ID, Alter, Geschlecht, Größe, Gewicht)
2. **Anamnese** (PAR-Q+, einmalig, 12 Monate gültig)
3. **Testmappe** (Ruhepuls an 5–7 Morgen, Testtag mit sechs Tests)
4. **Gesundheitsmodul, das Herzstück** (Einwilligung und Blutwerte Pflicht; Oura mit Schlaf, HRV, Ruhepuls, VO2max sowie Beschwerden empfohlen)
5. **Auswertung und Übungsplan**: KI-Auswertung aller Daten (Tests, Blutwerte, Beschwerden, Oura) plus regelbasierter Tagesplan

„Heute“ zeigt den Weg und immer den nächsten Schritt (`src/journey.ts`, Tests in `src/journey.test.ts`).

## Zwei Versionen

- **Web-Version (GitHub Pages):** ohne KI, Daten nur im Browser.
- **LIVION auf claude.ai** (https://claude.ai/artifact/CcV5wLqF523Xz99WmMnobG): gleiche App mit KI über das Claude-Konto der Person, ohne API-Schlüssel; Daten im privaten Speicher der Seite (nur die Person selbst kann sie lesen). Befunde als Foto, Oura per Datei. Bauen mit `npm run build:claude` (ergibt `dist-claude/livion.html`).

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

## Definition of Done (Übergabe v0.4, Abschnitt 10)

| Punkt | Stand in der App |
| --- | --- |
| UKK-Formel gegen verifizierte Quelle geprüft und getestet | Männer: Testfall 109,4 automatisch getestet. Frauen: als geprüft übernommen (Entscheidung 02.11.2026), Testfall 108,8 automatisch getestet; Referenz der Prüfung noch nicht dokumentiert |
| UKK-Test auf 20–65 Jahre beschränkt | erledigt: Altersprüfung vor Teststart, außerhalb nur Gehzeit und Puls |
| PAR-Q+ unverändert | erledigt: automatischer Wortlaut-Test gegen `docs/health-app-mvp-uebergabe-v0.4.md` |
| Consent per Häkchen, protokolliert, ohne Name | erledigt: Text, Fassung, Zeitstempel, Ereignis, Teilnehmer-ID, App-Version, Sprache |
| Einbeinstand ohne SE/SD-Streuung | erledigt; 3 Versuche je Bein, 60 s Pause (entschieden, siehe `docs/entscheidungen.md`) |
| Kein Back-Scratch-Test | erledigt |
| Liegestütz Frauen ohne Normwert | erledigt |
| Abbruchregeln implementiert, getestet, verständlich | erledigt: zentrale Liste (7 Warnzeichen), Abbruch mit Grund, Zeitstempel, Test und Messzeitpunkt; **medizinischer Review offen** |
| Keine Supplement-Empfehlungen | erledigt |
| Vor Release: Intended Purpose, MDR, DSGVO Art. 9, DSFA | offen (nicht für Gabis privaten Test nötig) |

## Gesundheitsmodul (Version 0.5)

| Bereich | Stand |
| --- | --- |
| Heute | Tageskarte mit 3–4 Übungen je Körperregion, Schmerzregel (5/10 und Rückfrage am Morgen), Stufen, Wochenmuster, Trinkmenge-Zähler |
| Beschwerden | Körperkarte, Seite, Art (mehrere möglich: Steifigkeit, Schwäche, Schmerz bei Belastung/in Ruhe, Druck, Stechen, Ziehen, Brennen, Kribbeln), Wann, Was verstärkt es, Seit wann, Verlauf, Intensität; Kribbeln setzt die Rückfrage zu Nervenzeichen; rote Flaggen (Notfall, ärztlich abklären, Hinweis); bei Notfall oder ärztlicher Abklärung kein Übungsplan |
| Befunde | Upload als PDF oder Foto mit KI-Auslesung (Claude); jede erkannte Zeile wird vor dem Übernehmen geprüft und kann korrigiert oder abgewählt werden; die Datei wird nicht gespeichert. Daneben Eingabe von Hand. 24 Blutwerte mit Referenzbereich aus dem Befund; ohne Bereich bewertet die App nicht; Hormone nur anzeigen |
| Videos | Je Region deutsche (Apotheken Umschau, Rheuma-Liga) und englische Quellen (Arthritis UK) als gepflegte Liste, keine freie YouTube-Suche; alle mit „noch nicht fachlich gesichtet“. Einbettung per YouTube-ID ist vorbereitet, aber keine ID gesetzt |
| Ernährung | Ein Hinweis pro Tag mit Quelle; Allergien schließen Hinweise aus, die das Lebensmittel nennen; keine Diätpläne |
| Trinkmenge | Richtwert 1,5 Liter Getränke (DGE) mit Sperre bei Herz- oder Nierenvorgabe und auffälligen Nierenwerten |
| Supplements | Infokarten ohne Dosis nur nach niedrigem Laborwert (Vitamin D, Eisen, B12) mit PubMed-Belegen (PMID, DOI); Glucosamin als „nicht empfohlen“ (NICE); gesperrt bei Medikamenten im Profil oder auffälligen Leber- und Nierenwerten |
| Wearables | Oura per Client-Login (ohne Server, Zugang etwa 30 Tage), Datei-Import (CSV) für Garmin und andere; Durchschnitt der letzten 7 Tage, ohne Bewertung und ohne Einfluss auf den Plan |
| Sicherheit | Übungsplan nur mit gültiger PAR-Q+-Freigabe; eigene Einwilligung für Gesundheitsdaten (getrennt von der Grund-Einwilligung); Oura-Zugang steht nie in der Sicherungsdatei |

### Offen im Gesundheitsmodul

- **Oura nicht gegen echte Daten getestet.** Login-Art (Client-Login), Feldnamen und die Browser-Freigabe der Oura-Schnittstelle müssen mit Gabis Ring geprüft werden. Ohne eigene Oura-App (Client-ID und Weiterleitungsadresse) geht der Login nicht. Die API-Vereinbarung von Oura ist nicht gelesen.
- **Garmin:** kein direkter Zugang für Privatpersonen; das Exportformat aus dem Garmin-Konto ist nicht geprüft (die CSV-Vorlage ist unser eigenes Format).
- **Videos:** noch von keiner Fachperson gesichtet; YouTube-IDs für die Einbettung fehlen.
- **Fachprüfung** der roten Flaggen, der Schmerzgrenze, der Übungsauswahl und der Supplement-Karten (Claims-Liste) steht aus; rechtliche Prüfung vor jeder Weitergabe.
- Die Ernährungshinweise sind bewusst knapp (sechs Hinweise mit Quelle); mehr braucht belegte Quellen.
- Der Verlauf zeigt Wearable-Daten noch nicht als Kurve.

## Offen (nicht erfunden, bewusst ausgelassen)

- **KI-Auslesung der Befunde (nur privater Test):** Der Aufruf geht direkt aus dem Browser mit einem eigenen API-Schlüssel, der nur auf dem Gerät liegt (nie in der Sicherungsdatei). Eigene KI-Einwilligung, widerrufbar. Für jede Weitergabe: Server-Baustein (Proxy), Auftragsverarbeitungsvertrag mit Anthropic, Datenstandort klären. Nicht mit echten Befunden getestet.
- **KI-Auswertung (Schritt 5, nur privater Test):** eigene, widerrufbare Einwilligung; Eingabe ohne Namen und Kennung, Medikamente und Allergien nur als „angegeben“. Die KI wählt ausschließlich Übungs-IDs aus der Übungsdatenbank (feste Liste im Antwortschema); rote Flaggen sperren den Aufruf; Stufe und Wochenmuster der Schmerzregel begrenzen die Auswahl; Sätze mit Dosisangaben werden entfernt. Die Eingabe wird mit gespeichert („Was an die KI ging“). Server-Baustein, AV-Vertrag, Prüfung nach MDR/MDCG 2019-11 und ärztliche Fachprüfung erst, wenn die App verkauft werden soll (Entscheidung 02.11.2026).
- **Oura VO2max:** Endpunkt `vO2_max` eingebaut, mit echtem Ring noch nicht geprüft; fehlt er, laufen die übrigen Daten weiter.

- Liegestütz-Vergleich für Männer: Die Tabelle aus dem Konzept liegt noch nicht vor.
- PAR-Q+: Erlaubnis für kommerzielle Nutzung (PARQ@hs-gesundheit.de, Anfrageinhalt in Übergabe 5.7); Häkchen statt Unterschrift rechtlich prüfen.
- Sportmedizinische Freigabe der Abbruchregeln.
- Die Testanleitungen sind knapp gehalten und mit dem Konzept abzugleichen.
- Vorschlag des Messzeitpunkts: Tag 0–19 Baseline, Tag 20–59 „Tag 30“ (sobald dort alles erledigt ist „Tag 90“), ab Tag 60 „Tag 90“. Nur Voreinstellung, in der Testmappe änderbar.

## Aufbau

- `src/calc.ts` – BMI, UKK-Index, Einbeinstand, Median (Tests in `src/calc.test.ts`)
- `src/tests.ts` – Testkatalog mit Protokollversion, Abbruchregeln
- `src/parq-de.json`, `src/parq.ts` – PAR-Q+-Texte (unverändert) und Ablauflogik (Tests in `src/parq.test.ts`)
- `src/results.ts` – Zusammenfassung je Test und Messzeitpunkt
- `src/health/` – Gesundheitsmodul: `logic/` (Blutwerte, rote Flaggen, Tageskarte, Ernährung, Supplements), `data/exercises.ts` (Übungen und Videolisten), `wearables/` (Oura, Datei-Import, Zusammenfassung), `screens/`
- `src/screens/` – Bildschirme
