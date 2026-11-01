# Health App × LIVION – MVP-Übergabe für Claude Code (v0.1)

Stand: 1. November 2026 | Basis: `health-app-livion-konzept.md` (Projekt-Doc) + Prüfung der offenen Punkte

## 0. Hinweise an Claude Code

- Der Nutzer (Michael) hat **keine Programmierkenntnisse**. Jeden Schritt einzeln und in einfachen Worten erklären, Befehle zum Kopieren anbieten, nach jedem Schritt prüfen lassen, ob es funktioniert.
- Sprache der App und der Erklärungen: **Deutsch** (Österreich).
- Keine Diagnosen, keine Heilversprechen, keine Formulierungen wie „Sturzrisiko erhöht" oder „Herz-Kreislauf-Risiko".
- Fakten und Zahlen nicht aus dem Gedächtnis ergänzen. Was hier als **[OFFEN]** steht, nicht erfinden, sondern nachfragen.

## 1. Ziel des MVP

Eine Web-App (PWA, läuft auf dem Handy wie eine App, ohne App-Store), mit der eine Person Sicherheits-Gate und Basis-Tests durchführt, die Ergebnisse speichert und den **persönlichen Verlauf** (Baseline → Tag 30 → Tag 90) sieht. Erste Nutzerin: Gabi (privater, nicht-kommerzieller Test).

**Nicht im MVP:** Gesamtscore, Blutwerte, Ernährungs-/Supplement-Empfehlungen, Wearable-Anbindung (Oura/Garmin), Konto/Login, Server.

## 2. Technische Vorgaben (Vorschlag, bitte mit dem Nutzer bestätigen)

- Einfache PWA (HTML/CSS/JavaScript, z. B. mit Vite), mobil zuerst.
- Daten **nur lokal im Gerät** speichern (kein Server, keine Cloud). Export/Import als Datei und „Alle Daten löschen" einbauen.
- Pseudonym: keine Namen speichern, nur Teilnehmer-ID.
- Berechnungen (BMI, UKK-Index) als eigene, getestete Funktionen mit automatischen Tests.

## 3. Screens

1. Profil: Alter, Geschlecht, Größe, Gewicht (BMI automatisch), Ziel
2. Sicherheits-Gate (PAR-Q+, siehe 5)
3. Testmappe: Liste der Tests mit Status, Reihenfolge am Testtag: Ruhepuls → Beweglichkeit → Balance → Kraft → Gehtest zuletzt
4. Test-Screen (ein Muster für alle Tests): Anleitung in Schritten, Eingabefelder, ggf. Stoppuhr, Abbruch-Hinweis
5. Ergebnis je Test: Wert, Datenqualität (A/B/C), Vergleichswert nur dort, wo erlaubt (siehe 4)
6. Verlauf: je Test Baseline, Tag 30, Tag 90
7. Einstellungen: Einwilligung, Export, Daten löschen

Ohne abgeschlossenes Gate sind Tests gesperrt.

## 4. Tests im MVP

Pflichtfelder je Messwert: Teilnehmer-ID, Metrik, Einheit, Wert, Datum (ggf. Tageszeit), Methode, Datenqualität (A/B/C), Kommentar. Qualität B = Feldtest nach Protokoll, C = abweichend oder Selbstauskunft.

| Test | Eingabe | Vergleichswert anzeigen? |
|---|---|---|
| T1 Ruhepuls | bpm, Position, Uhrzeit, Methode, Rhythmus unregelmäßig? Baseline = Median von 5–7 Morgen | nein, nur Trend |
| T2 UKK-2-km-Gehtest | Min, Sek, Puls am Ende, Streckenart, Größe, Gewicht | Fitness-Index mit Bewertung (siehe 6) |
| T3 30-s-Sit-to-Stand | Anzahl, Armeinsatz ja/nein → dann 0 | nein (Normen nur ab 60) |
| T4 Einbeinstand | 3 Versuche je Bein (s), beste Zeit zählt, max. 45 s, nur Augen offen | ja, nur Mittelwerte Springer 2007 (40–49: 41,9 s bester Versuch; 50–59: 41,2 s), **ohne** Streuung |
| T5 Knie-zur-Wand | Abstand links/rechts (cm), Ferse abgehoben, Schmerz | Seitendifferenz ab ca. 1,5 cm als Hinweis, keine Bewertung |
| T7 Chair Sit-and-Reach | Abstand je Seite (cm, negativ bei Lücke), Schmerz | nein |
| T8 Liegestütz | Wiederholungen, Variante (Zehen/Knie), Abbruchgrund | Männer (Zehen) 40–49 und 50–59 laut Tabelle im Konzept; **Frauen: nicht anzeigen** (Tabelle unvollständig) |

**Nicht im MVP:** T6 Back-Scratch (Messdetails nicht bestätigt), T2b 6-Minuten-Gehtest, Handkraft.

Normen ab 60 (Sit-to-Stand usw.) bei unter 60-Jährigen nie anzeigen. Hauptaussage der App ist der persönliche Verlauf.

## 5. Sicherheits-Gate (PAR-Q+)

- Ablauf: 7 allgemeine Fragen. Nein auf alle = freigegeben. Ja bei mindestens einer → Folgefragen. Ja bei Folgefragen → erst ePARmed-X+ (eparmedx.com) oder Fachperson, dann Tests. Freigabe gilt 12 Monate oder bis sich der Gesundheitszustand ändert.
- Abbruchregeln bei jedem Test: sofort stoppen bei Brustschmerz, Schwindel/Ohnmachtsgefühl, neu auftretender starker Atemnot, ungeklärten Herzsymptomen. Hinweis auf ärztliche Abklärung, keine Diagnose. **[OFFEN]** sportmedizinische Freigabe der Abbruchregeln.
- **Lizenz (geprüft):** Die offizielle PAR-Q+-Fassung 2023 steht unter CC BY-NC-ND 4.0 (Namensnennung, nicht kommerziell, keine Bearbeitung). Das heißt: Text **unverändert** übernehmen, Urheber nennen. Für den privaten Test mit Gabi ist das in Ordnung. **Vor jeder kommerziellen Nutzung der App muss die Erlaubnis der PAR-Q+ Collaboration eingeholt werden** (keine Rechtsberatung, im Zweifel rechtlich prüfen lassen). **[OFFEN]** deutsche Originalfassung beschaffen. Nicht selbst übersetzen oder umformulieren.

## 6. UKK-Fitness-Index

BMI = kg ÷ m². Zeit in Min und Sek getrennt.

**Männer (in mehreren Quellen übereinstimmend):**
`Index = 420 − (11,6 × Min + 0,2 × Sek + 0,56 × Puls + 2,6 × BMI − 0,2 × Alter)`

**Frauen: [OFFEN], noch nicht programmieren.** Zwei abweichende Versionen:
- A: `305 − (8,1·Min + 0,14·Sek + 0,36·Puls + 1,0·BMI − 0,3·Alter)` (jumk.de, TK-Testkarte)
- B: `304 − (8,5·Min + 0,14·Sek + 0,32·Puls + 1,1·BMI − 0,4·Alter)` (Uni Karlsruhe/KIT-Skript, hpcosmos; in sich stimmig, plausibler)

Das Original (Oja et al. 1991, Int J Sports Med 12:356–362) war nicht frei zugänglich, das UKK-Institut veröffentlicht die Formel nicht im Tester's Guide (nur in seiner Software). **Übergangslösung:** Bei Frauen Rohdaten speichern (Zeit, Puls, BMI, Alter) und im Verlauf die Gehzeit zeigen. Den Index erst berechnen, wenn die Formel am Original bestätigt ist. Die Rohdaten reichen dann für eine nachträgliche Berechnung.

**Bewertung:** über 130 sehr gut, 111–130 gut, 90–110 mittel, 70–89 schwach, unter 70 sehr schwach. In der App „Fitness-Index", nicht „dein VO2max". Der Test eignet sich besser für Veränderungen als für Absolutwerte (Schätzfehler etwa 4 ml/kg/min).

**Altersbereich:** 20–65 Jahre (Angabe des UKK-Instituts). Außerhalb davon keinen Index berechnen.

**Testfall (Mann):** 50 J., BMI 25, 15:30 min, Puls 135 → 420 − 310,6 = **109,4** (mittel). Als automatischen Test einbauen. Ein Frauen-Testfall folgt nach Klärung der Formel.

## 7. Offene Punkte (Stand heute)

| # | Punkt | Status |
|---|---|---|
| 1 | UKK-Frauenformel | **offen**, siehe 6. Optionen: Original beschaffen (Bibliothek/Thieme im Browser, UKK-Software) oder UKK-Institut anschreiben |
| 2 | UKK-Altersbereich | geklärt: 20–65 |
| 3 | PAR-Q+ Lizenz | geklärt: CC BY-NC-ND, kommerziell nur mit Erlaubnis. Deutsche Fassung noch beschaffen |
| 4 | Einbeinstand: SE oder SD, Pausenlänge | offen. MVP umgeht es (keine Streuung anzeigen). Pause als Produktentscheidung festlegen |
| 5 | Back-Scratch-Details | offen, T6 aus dem MVP genommen |
| 6 | Liegestütz Frauentabelle | offen, im MVP keine Norm für Frauen |
| 7 | Abbruchregeln sportmedizinisch | offen |
| 8 | Supplement-Empfehlungen (Health App) vs. LIVION-Claims | Entscheidung des Nutzers, nicht im MVP |
| 9 | Medizinprodukte-Software (EU/MDCG), Datenschutz (DSGVO Art. 9, DSFA) | vor Blutwerte-Modul und vor Veröffentlichung klären |
| 10 | Garmin-/Oura-Zugang | Phase 3 |

## 8. Startablauf in Claude Code

1. Dieses Dokument einfügen. Claude Code fasst zusammen, was es verstanden hat, und stellt Rückfragen.
2. Projektordner anlegen und Grundgerüst der PWA bauen (Profil + Navigation).
3. Berechnungsfunktionen (BMI, Index Männer) mit Tests.
4. Testmappe und Test-Screens, Speichern lokal.
5. Verlaufsansicht, Export, Löschen.
6. Probelauf mit Gabi, Rückmeldungen sammeln.
