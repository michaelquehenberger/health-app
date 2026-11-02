# Health App × LIVION – MVP-Übergabe für Claude Code (v0.4)

Stand: 2. November 2026 | Basis: `health-app-livion-konzept.md` (Projekt-Doc) + Prüfung der offenen Punkte + konsolidierte Punktliste „LIVION Health & Fitness App – Offene Punkte, Validierung und Weiterarbeit“ (Stand 02.11.2026, 08:39)

> **Stand der Umsetzung im Repo (Stand v0.3, 2. November 2026):** Der deutsche PAR-Q+ (Fassung 01.07.2024) ist als einmalige Anamnese
> in der App umgesetzt. Die Texte liegen wörtlich in `src/parq-de.json`, die Ablauflogik in `src/parq.ts`.
> Umgesetzt sind außerdem: Einbeinstand mit 3 Versuchen und 60 s Pause (Countdown); UKK-Kandidatenformel für Frauen hinter dem Schalter
> „Frauenindex“ (Standard aus, Anzeige „vorläufig“, Rechentest 108,8); Consent-Log mit Text, Fassung, Zeitstempel, Ereignis und Teilnehmer-ID;
> Abbruchzeichen laut 5.6; Springer-Streuung (SD) wird nie angezeigt.
> **Noch nicht in der App geprüft oder umgesetzt (neu in v0.4):** Altersprüfung 20–65 vor dem UKK-Test, Consent-Log um App-Version und Sprache,
> vollständige Abbruchliste (5.6) mit Protokollierung jedes Abbruchs, Abgleich der App mit Abschnitt 10 (Definition of Done).
> Diese Zeilen bitte nach jeder Umsetzung in der App aktualisieren.

**Änderungen in v0.4:** Altersprüfung 20–65 vor dem UKK-Test, Prüfplan und Akzeptanzkriterium für die Frauenformel, Anfrageinhalt für die PAR-Q+-Erlaubnis, Consent-Log um App-Version und Sprache erweitert, Abbruchliste vervollständigt (zentrale Konstante, Protokollierung des Abbruchs), Claims-Liste als To-do, Arbeitsplan (Abschnitt 9), Definition of Done (Abschnitt 10), offene Entscheidungen (Abschnitt 11).
**Änderungen in v0.3:** UKK-Frauenformel als Kandidat, Einbeinstand-Pause, Consent-Log, Statusliste.
**Änderungen in v0.2:** Abschnitt 5 enthält den vollständigen deutschen PAR-Q+ (Version 01.07.2024, Hochschule für Gesundheit Bochum) im Originalwortlaut als **einmalige Anamnese**.

## 0. Hinweise an Claude Code

- Der Nutzer (Michael) hat **keine Programmierkenntnisse**. Jeden Schritt einzeln und in einfachen Worten erklären, Befehle zum Kopieren anbieten, nach jedem Schritt prüfen lassen, ob es funktioniert.
- Sprache der App und der Erklärungen: **Deutsch** (Österreich).
- Keine Diagnosen, keine Heilversprechen, keine Formulierungen wie „Sturzrisiko erhöht“ oder „Herz-Kreislauf-Risiko“.
- Fakten und Zahlen nicht aus dem Gedächtnis ergänzen. Was hier als **[OFFEN]** steht, nicht erfinden, sondern nachfragen.
- **PAR-Q+-Fragetexte dürfen nicht verändert, gekürzt oder umformuliert werden** (siehe Abschnitt 5). Sie werden wörtlich aus diesem Dokument übernommen.

## 1. Ziel des MVP

Eine Web-App (PWA, läuft auf dem Handy wie eine App, ohne App-Store), mit der eine Person die Anamnese (PAR-Q+) einmalig ausfüllt, Basis-Tests durchführt, die Ergebnisse speichert und den **persönlichen Verlauf** (Baseline → Tag 30 → Tag 90) sieht. Erste Nutzerin: Gabi (privater, nicht-kommerzieller Test).

**Nicht im MVP:** Gesamtscore, Blutwerte, Ernährungs-/Supplement-Empfehlungen, Wearable-Anbindung (Oura/Garmin), Konto/Login, Server.

## 2. Technische Vorgaben (Vorschlag, bitte mit dem Nutzer bestätigen)

- Einfache PWA (HTML/CSS/JavaScript, z. B. mit Vite), mobil zuerst.
- Daten **nur lokal im Gerät** speichern (kein Server, keine Cloud). Export/Import als Datei und „Alle Daten löschen“ einbauen.
- Pseudonym: keine Namen speichern, nur Teilnehmer-ID.
- Berechnungen (BMI, UKK-Index) als eigene, getestete Funktionen mit automatischen Tests.
- Die PAR-Q+-Texte liegen unverändert in einer eigenen Datei (z. B. `parq-de.json`), getrennt vom Programmcode.

## 3. Screens

1. Profil: Alter, Geschlecht, Größe, Gewicht (BMI automatisch), Ziel
2. **Anamnese (PAR-Q+), einmalig** – siehe Abschnitt 5. Wird beim ersten Start ausgefüllt, nicht vor jedem Test
3. Testmappe: Liste der Tests mit Status, Reihenfolge am Testtag: Ruhepuls → Beweglichkeit → Balance → Kraft → Gehtest zuletzt
4. Test-Screen (ein Muster für alle Tests): Anleitung in Schritten, Eingabefelder, ggf. Stoppuhr, Abbruch-Hinweis
5. Ergebnis je Test: Wert, Datenqualität (A/B/C), Vergleichswert nur dort, wo erlaubt (siehe 4)
6. Verlauf: je Test Baseline, Tag 30, Tag 90
7. Einstellungen: Einwilligung, Export, Daten löschen, Anamnese ansehen/erneuern

Ohne gültige Anamnese-Freigabe (Abschnitt 5, Ergebnis „freigegeben“) sind Tests gesperrt.

## 4. Tests im MVP

Pflichtfelder je Messwert: Teilnehmer-ID, Metrik, Einheit, Wert, Datum (ggf. Tageszeit), Methode, Datenqualität (A/B/C), Kommentar. Qualität B = Feldtest nach Protokoll, C = abweichend oder Selbstauskunft.

| Test | Eingabe | Vergleichswert anzeigen? |
|---|---|---|
| T1 Ruhepuls | bpm, Position, Uhrzeit, Methode, Rhythmus unregelmäßig? Baseline = Median von 5–7 Morgen | nein, nur Trend |
| T2 UKK-2-km-Gehtest | Min, Sek, Puls am Ende, Streckenart, Größe, Gewicht. **Vor Teststart Altersprüfung 20–65** (siehe unten) | Männer: Fitness-Index mit Bewertung (siehe 6). Frauen: vorerst nur Zeit und Puls als Verlauf |
| T3 30-s-Sit-to-Stand | Anzahl, Armeinsatz ja/nein → dann 0 | nein (Normen nur ab 60) |
| T4 Einbeinstand | 3 Versuche je Bein (s), **60 Sekunden Pause** zwischen den Versuchen, beste Zeit zählt, max. 45 s, nur Augen offen | angezeigt: Haltezeit je Versuch, bester Versuch, persönliche Entwicklung. Optional als reiner Vergleich die Mittelwerte Springer 2007 (40–49: 41,9 s bester Versuch; 50–59: 41,2 s). **Streuung (SE/SD) nie anzeigen**, keine Normwert-Einordnung |
| T5 Knie-zur-Wand | Abstand links/rechts (cm), Ferse abgehoben, Schmerz | Seitendifferenz ab ca. 1,5 cm als Hinweis, keine Bewertung |
| T7 Chair Sit-and-Reach | Abstand je Seite (cm, negativ bei Lücke), Schmerz | nein |
| T8 Liegestütz | Wiederholungen, Variante (Zehen/Knie), Abbruchgrund | Männer (Zehen) 40–49 und 50–59 laut Tabelle im Konzept. **Frauen: keine Norm und keine Kategorie** (z. B. „unterdurchschnittlich“), nur Wiederholungen und Verlauf |

**Nicht im MVP:** T6 Back-Scratch (später nur mit validierter Primärquelle, exaktem Protokoll und klarer Nicht-Diagnose-Aussage), T2b 6-Minuten-Gehtest, Handkraft.

Normen ab 60 (Sit-to-Stand usw.) bei unter 60-Jährigen nie anzeigen. Hauptaussage der App ist der persönliche Verlauf.

**Altersprüfung UKK (Produktregel):** Der UKK-2-km-Gehtest gilt für gesunde Erwachsene von 20 bis 65 Jahren. Vor Teststart wird das Alter geprüft. Liegt es außerhalb des Bereichs, wird keine UKK-Bewertung angezeigt und stattdessen eine nicht-normative Aktivitätsdokumentation angeboten (z. B. Gehzeit und Puls als reiner Verlauf). Das Gleiche gilt für Personen, deren zügiges Gehen durch Erkrankung oder Behinderung eingeschränkt ist: nicht ohne weitere Prüfung bewerten.

**Einbeinstand, Entscheidungen:** Die Streuungswerte der Springer-Tabelle sind Standardabweichungen (SD), keine Standardfehler. Für eine individuelle Einordnung sind sie nicht belastbar genug und werden deshalb nicht angezeigt. Die Pause von 60 Sekunden ist eine Produktentscheidung (die Studie legt nur die Pause zwischen Serien fest). **Versuchszahl [OFFEN]:** Dieses Dokument bleibt bei **3 je Bein**, weil die Springer-Vergleichswerte auf „beste von 3“ beruhen. Die konsolidierte Punktliste schlägt 2 Versuche vor („oder nach finaler Produktentscheidung“). Bei 2 Versuchen darf der Springer-Vergleich nicht mehr angezeigt werden. Die Entscheidung steht in Abschnitt 11. Das Protokoll (Versuche, Pause, Abbruchgründe) in Anleitung, UI-Text und Datenmodell festschreiben.

## 5. Anamnese und Sicherheits-Gate (PAR-Q+, einmalig)

**Quelle:** PAR-Q+ „Physical Activity Readiness Questionnaire for Everyone“, deutsche Fassung, Version 01.07.2024, Copyright © 2024 PAR-Q+ Collaboration | Hochschule für Gesundheit Bochum. Übersetzung: Tobias Braun, Alina Rieckmann, Annika Glöckl, Cheyenne Hanna Haugwitz-Mayall, Christian Thiel. Kontakt: www.eparmedx.com | www.hs-gesundheit.de/PARQ | PARQ@hs-gesundheit.de.
Zitation: Warburton DER, Jamnik VK, Bredin SSD, Gledhill N on behalf of the PAR-Q+ Collaboration. The Physical Activity Readiness Questionnaire for Everyone (PAR-Q+) and Electronic Physical Activity Readiness Medical Examination (ePARmed-X+). Health & Fitness Journal of Canada 4(2):3-23, 2011. Die Quellenangabe (Copyright-Zeile und Zitation) steht in der App sichtbar im Anamnese-Screen.

**„Einmalig“ heißt:**
- Die Anamnese wird **einmal** beim ersten Start ausgefüllt und gilt für alle Tests. Sie wird nicht vor jedem Test wiederholt.
- Gültigkeit laut Formular: **maximal 12 Monate** ab Ausfülldatum, ungültig, falls sich der Gesundheitszustand ändert. Danach (oder bei Änderung) muss sie erneuert werden. Die App zeigt das Ablaufdatum an und sperrt Tests nach Ablauf.
- Frühere Antworten bleiben im Verlauf gespeichert (mit Datum).

**Wichtig – keine Änderungen am Text:** Der Fragebogen darf kopiert werden, aber **nur vollständig und ohne Änderungen** (Hinweis im Formular selbst). Also: Wortlaut, Reihenfolge, Nummerierung und Hinweise exakt übernehmen. Nicht kürzen, nicht „einfacher“ formulieren, nicht übersetzen. Erlaubt ist nur die technische Umsetzung (Ja/Nein-Schalter statt Ankreuzen, Textfelder statt Zeilen).

### 5.1 Ablauf (Logik)

1. **Teil A: Allgemeine Gesundheitsfragen (Seite 1), Fragen 1–7.** Jede mit JA/NEIN. Pflichtangabe je Frage.
   - **Alle sieben NEIN** → Einverständniserklärung (5.4) → Ergebnis „freigegeben“ (Hinweis „Fangen Sie an, sich mehr zu bewegen …“ anzeigen). Teil B entfällt.
   - **Mindestens eine JA** → Teil B (Seiten 2 und 3).
2. **Teil B: Ergänzende Fragen zu Ihrem Gesundheitszustand, Fragen 1–10 mit Unterfragen.** Jede Hauptfrage mit JA/NEIN. Bei NEIN weiter zur nächsten Hauptfrage, bei JA werden die zugehörigen Unterfragen (a, b, c …) angezeigt und beantwortet. Frage 10 erscheint immer, die Unterfragen 10a–10c nur bei JA.
3. **Ergebnis nach Teil B:**
   - **Alle Unterfragen NEIN** (und keine JA, die zu offenen Unterfragen führt) → „freigegeben“ mit den Empfehlungen von Seite 4 (Text in 5.3).
   - **Mindestens eine ergänzende Unterfrage JA** → **nicht freigegeben**. Tests bleiben gesperrt. Angezeigt wird der Text aus 5.3 („… sollten Sie weitere Informationen einholen …“ mit ePARmed-X+). Erst wenn der Nutzer bestätigt, dass die Abklärung erfolgt ist und eine Freigabe vorliegt, wird die Anamnese als „freigegeben nach Abklärung“ markiert (Datum, Quelle der Freigabe: ePARmed-X+ oder Fachperson). Keine Diagnose, kein Bewerten durch die App.
4. Zu jeder Zeit sichtbar (Warnhinweis, wörtlich aus 5.3): „Bitte warten Sie damit, sich mehr zu bewegen, wenn …“ (krank/Fieber, schwanger, Gesundheitszustand ändert sich).

### 5.2 Fragetexte (Originalwortlaut, nicht ändern)

**Einleitung (oben im Screen):**
„PAR-Q+ – „Physical Activity Readiness Questionnaire for Everyone“. Der gesundheitliche Nutzen von Sport und regelmäßiger körperlicher Aktivität ist unbestritten; mehr Menschen sollten sich täglich mehr bewegen. Körperliche Aktivität und Sport (nachfolgend als Bewegung bezeichnet) sind für die MEISTEN Menschen unbedenklich. Dieser Fragebogen gibt Ihnen Auskunft darüber, ob Sie Ihre Ärztin / Ihren Arzt, Physiotherapeut:in oder Sportwissenschaftler:in (nachfolgend als qualifizierte Personen mit Bewegungsexpertise bezeichnet) konsultieren sollten, bevor Sie sich mehr bewegen.“

#### Teil A – ALLGEMEINE GESUNDHEITSFRAGEN (Seite 1)

Vorspann: „Bitte lesen Sie die folgenden Fragen genau durch und beantworten Sie jede Frage wahrheitsgemäß. Kreuzen Sie JA oder NEIN an“

| Nr. | Frage (JA / NEIN) |
|---|---|
| 1 | Hat Ihnen jemals eine Ärztin / ein Arzt gesagt, dass Sie eine Herzerkrankung ODER hohen Blutdruck haben? |
| 2 | Haben Sie in Ruhe, bei Aktivitäten des täglichen Lebens ODER bei Bewegung Schmerzen in der Brust? |
| 3 | Verlieren Sie manchmal das Gleichgewicht aufgrund von Schwindel ODER haben Sie innerhalb der letzten 12 Monaten mindestens einmal das Bewusstsein verloren? *Hinweis unter der Frage:* „Bitte kreuzen Sie NEIN an, wenn der Schwindel im Zusammenhang mit Hyperventilation oder starker körperlicher Belastung stand.“ |
| 4 | Haben Sie eine diagnostizierte chronische Erkrankung (langandauernd bzw. dauerhaft; ausgenommen Herzerkrankungen und / oder Bluthochdruck)? *Zusatz:* „Wenn ja, geben sie hier bitte die Erkrankung(en) an:“ → **Freitextfeld** |
| 5 | Nehmen Sie zurzeit verordnete Medikamente für eine chronische Erkrankung? *Zusatz:* „Wenn ja, geben sie hier bitte die Erkrankung(en) mit jeweiliger Medikation an:“ → **Freitextfeld** |
| 6 | Haben Sie zurzeit (oder hatten Sie in den letzten 12 Monaten) ein Problem oder eine Verletzung am Bewegungsapparat (Knochen, Gelenke, Muskeln, Bänder oder Sehnen), welche(s) sich durch mehr Bewegung verschlimmern könnte? *Hinweis:* „Falls Sie in der Vergangenheit ein Problem hatten, welches Sie aber nicht in Ihrer jetzigen Bewegungsfähigkeit einschränkt, kreuzen Sie NEIN an. Bitte geben sie hier das Problem/die Verletzung an:“ → **Freitextfeld** |
| 7 | Hat Ihnen jemals eine Ärztin / ein Arzt gesagt, dass Sie Bewegung (körperliche Aktivität oder Training) nur unter medizinischer Aufsicht durchführen sollten? |

**Text nach Teil A bei „alle NEIN“:**
„Wenn Sie alle sieben Fragen mit NEIN beantwortet haben, können Sie sich mehr bewegen (körperliche Aktivität oder Training). Bitte unterzeichnen Sie die EINVERSTÄNDNISERKLÄRUNG und überspringen Sie die Seiten 2 und 3.
Fangen Sie an, sich mehr zu bewegen – beginnen Sie langsam und steigern Sie sich allmählich. Folgen Sie den „Nationalen Bewegungsempfehlungen“ Ihrer Altersgruppe: www.bundesgesundheitsministerium.de
Sie können wahlweise eine Gesundheitsuntersuchung (z.B. Vorsorgeuntersuchung) oder Leistungsdiagnostik durchführen lassen.
Wenn Sie älter als 45 Jahre sind und NICHT an ein regelmäßiges Training mit starker bis maximaler Belastungsform gewöhnt sind, konsultieren Sie bitte vor solch intensiven Trainingseinheiten eine Ärztin / einen Arzt oder eine qualifizierte Person mit Bewegungsexpertise.
Wenn Sie weitere Fragen haben, wenden Sie sich an eine Ärztin / einen Arzt oder eine qualifizierte Person mit Bewegungsexpertise.“

**Text bei mindestens einer JA in Teil A:**
„Wenn Sie mindestens eine der sieben Fragen mit JA beantwortet haben, FÜLLEN SIE BITTE DIE SEITEN 2 UND 3 AUS.“

*Hinweis zur Umsetzung:* Der Satz „Seiten 2 und 3“ bleibt wörtlich. In der App heißt das: Teil B (Ergänzende Fragen) wird angezeigt.

#### Teil B – ERGÄNZENDE FRAGEN ZU IHREM GESUNDHEITSZUSTAND (Seiten 2 und 3)

Jede Unterfrage: JA / NEIN. Bei NEIN auf eine Hauptfrage: „fahren Sie mit Frage X fort“ (also Unterfragen überspringen).

**1. Haben Sie eine Gelenkerkrankung (Arthrose, Arthritis), Osteoporose oder Rückenbeschwerden?** Wenn mindestens eine dieser Erkrankungen/Beschwerden vorliegt, beantworten Sie die Fragen 1a-1c. *Wenn NEIN fahren Sie mit Frage 2 fort.*
- 1a. Haben Sie Schwierigkeiten, Ihre Beschwerden mit Medikamenten oder anderen ärztlich verordneten Therapien zu kontrollieren? (Antworten Sie mit NEIN, wenn Sie zurzeit keine Medikamente einnehmen bzw. keine anderen verordneten Therapien erhalten)
- 1b. Haben Sie Gelenkschmerzen, kürzlich einen Knochenbruch erlitten (auch durch Osteoporose oder eine Krebserkrankung), Wirbelgleiten (Spondylolisthesis) und / oder eine Spondylolyse (Riss/Spalt im knöchernen Bogen eines Wirbelkörpers)?
- 1c. Hatten Sie eine Steroidbehandlung (z.B. Kortison) als Injektion oder über Tabletten für mehr als 3 Monate?

**2. Haben Sie aktuell eine Krebserkrankung?** Wenn ja, beantworten Sie die Fragen 2a-2b. *Wenn NEIN fahren Sie mit Frage 3 fort.*
- 2a. Handelt es sich bei der Krebserkrankung um einen der folgenden Arten: Lungen- / Bronchialkarzinom, Multiples Myelom (Plasmazellerkrankung der Knochen und des Knochenmarks, z.B. Plasmozytom) oder Kopf-Hals-Tumore?
- 2b. Erhalten Sie zurzeit eine Krebstherapie (z.B. Chemo- oder Strahlentherapie)?

**3. Haben Sie ein Herz-Kreislauf- oder Gefäß-Erkrankung? (z.B. Koronare Herzkrankheit / KHK, Herzinsuffizienz, Herzrhythmusstörungen)** Wenn mindestens eine der Erkrankungen vorliegt, beantworten Sie die Fragen 3a-3d. *Wenn NEIN fahren Sie mit Frage 4 fort.*
- 3a. Haben Sie Schwierigkeiten, Ihre Erkrankung mit Medikamenten oder anderen verordneten Therapien unter Kontrolle zu bringen? (Antworten Sie mit NEIN, wenn Sie zurzeit keine Medikamente einnehmen bzw. keine anderen verordneten Therapien erhalten)
- 3b. Haben Sie Herzrhythmusstörungen, die medizinisch behandelt werden müssen? (z.B. Vorhofflimmern, ventrikuläre Extrasystolen)
- 3c. Haben Sie eine Herzinsuffizienz (Herzschwäche)?
- 3d. Haben Sie eine diagnostizierte koronare Herzkrankheit (KHK) und haben Sie sich in den letzten 2 Monaten nicht regelmäßig bewegt?

**4. Haben Sie Bluthochdruck?** Wenn ja, beantworten Sie die Fragen 4a-4b. *Wenn NEIN fahren Sie mit Frage 5 fort.*
- 4a. Haben Sie Schwierigkeiten Ihre Erkrankung mit Medikamenten oder anderen verordneten Therapien unter Kontrolle zu bringen? (Antworten Sie mit NEIN, wenn Sie zurzeit keine Medikamente nehmen bzw. keine anderen verordneten Therapien erhalten)
- 4b. Ist Ihr Blutdruck in Ruhe höher oder gleich 160 / 90 mmHg (mit oder ohne medikamentöse Therapie)? (Antworten Sie mit JA wenn Sie Ihren Blutdruck in Ruhe nicht kennen)

**5. Haben Sie eine Stoffwechselerkrankung? (z.B. Diabetes mellitus Typ 1, Typ 2 oder Prä-Diabetes oder eine Leber- / Nierenerkrankung)** Wenn mindestens eine der Erkrankungen vorliegt, beantworten Sie die Fragen 5a-5e. *Wenn NEIN fahren Sie mit Frage 6 fort.*
- 5a. Haben Sie Schwierigkeiten Ihren Blutzuckerspiegel durch Ernährung, Medikamente oder andere ärztlich verordnete Therapien zu kontrollieren?
- 5b. Leiden Sie häufig an Symptomen einer Unterzuckerung (Hypoglykämie) nach Sport und / oder bei alltäglichen Aktivitäten? Mögliche Symptome sind: Zittern, Nervosität, ungewohnte Reizbarkeit, exzessives Schwitzen, Schwindel oder Benommenheit, Verwirrtheit, Sprechstörungen, Schwäche oder Müdigkeit.
- 5c. Haben Sie Anzeichen oder Symptome, die auf Diabeteskomplikationen zurückzuführen sind, wie Herz- oder Gefäßerkrankungen, Augen- oder Nierenschäden ODER Missempfindungen in den Füßen und Zehen?
- 5d. Haben Sie andere Stoffwechselerkrankungen (wie Schwangerschaftsdiabetes, chronische Nierenerkrankung oder Probleme mit der Leber)?
- 5e. Planen Sie in nächster Zeit ein Training mit für Sie ungewohnt hoher Intensität durchzuführen?

**6. Haben Sie psychische Erkrankungen oder eine Lernbeeinträchtigung? (z.B. Alzheimer-Krankheit oder eine andere Form von Demenz, Depression, Angststörungen, Essstörungen, Psychosen, geistige Behinderung, Down-Syndrom/Trisomie 21)** Wenn mindestens eine dieser Erkrankungen / Beschwerden vorliegt, beantworten Sie die Fragen 6a-6b. *Wenn NEIN fahren Sie mit Frage 7 fort.*
- 6a. Haben Sie Schwierigkeiten Ihre Erkrankung mit Medikamenten oder anderen verordneten Therapien unter Kontrolle zu bringen? (Antworten Sie mit NEIN, wenn Sie zurzeit keine Medikamente nehmen bzw. keine anderen verordneten Therapien erhalten)
- 6b. Haben Sie ein Down-Syndrom UND Rückenbeschwerden, die Muskeln oder Nerven betreffen?

**7. Haben Sie eine Erkrankung der Atemwege? (z.B. COPD / chronisch obstruktive Lungenerkrankung, Asthma, Lungenhochdruck / pulmonale Hypertonie)** Wenn mindestens eine der Erkrankungen vorliegt, beantworten Sie die Fragen 7a-7d. *Wenn NEIN fahren Sie mit Frage 8 fort.*
- 7a. Haben Sie Schwierigkeiten Ihre Erkrankung mit Medikamenten oder anderen verordneten Therapien unter Kontrolle zu bringen? (Antworten Sie mit NEIN, wenn Sie zurzeit keine Medikamente nehmen bzw. keine anderen verordneten Therapien erhalten)
- 7b. Hat Ihnen jemals eine Ärztin / ein Arzt oder eine qualifizierte Person mit Bewegungsexpertise gesagt, dass die Sauerstoffsättigung Ihres Blutes in Ruhe oder bei Anstrengung zu niedrig ist und / oder dass Sie eine Sauerstoffgabe benötigen?
- 7c. Wenn Sie Asthmatiker:in sind: Haben Sie Beschwerden wie Engegefühl in der Brust, Giemen (Pfeifen, Rasseln), erschwerte Atmung, anhaltender Husten (mehr als 2 Tage / Woche) oder mussten Sie Ihre Notfallmedikation mehr als zweimal in der letzten Woche einnehmen?
- 7d. Hat eine Ärztin / ein Arzt bei Ihnen jemals einen zu hohen Blutdruck in den Blutgefäßen der Lunge festgestellt (Lungenhochdruck / pulmonale Hypertonie)?

**8. Haben Sie eine Verletzung des Rückenmarks? (z.B. Tetraplegie / Lähmung aller Extremitäten, Paraplegie / Lähmung der Beine)?** Liegt solch eine Verletzung vor, beantworten Sie die Fragen 8a-8c. *Wenn NEIN fahren Sie mit Frage 9 fort.*
- 8a. Haben Sie Schwierigkeiten Ihre Erkrankung mit Medikamenten oder anderen verordneten Therapien zu kontrollieren? (Antworten Sie mit NEIN, wenn Sie zurzeit keine Medikamente einnehmen bzw. keine anderen verordneten Therapien erhalten)
- 8b. Haben Sie typischerweise einen so niedrigen Blutdruck in Ruhe, dass Sie dadurch Schwindel oder Benommenheit empfinden und/oder eine Ohnmacht erleiden?
- 8c. Hat Ihre Ärztin / Ihr Arzt Ihnen gesagt, dass Sie manchmal anfallsartig hohe Blutdruckwerte haben (Autonome Dysreflexie)?

**9. Hatten Sie schon einmal einen Schlaganfall? (z.B. transitorische ischämische Attacke / TIA, Hirninfarkt oder Hirnblutung)** Wenn mindestens eine der Erkrankungen vorliegt, beantworten Sie die Fragen 9a-9c. *Wenn NEIN fahren Sie mit Frage 10 fort.*
- 9a. Haben Sie Schwierigkeiten Ihre Erkrankung mit Medikamenten oder anderen verordneten Therapien unter Kontrolle zu bringen? (Antworten Sie mit NEIN, wenn Sie zurzeit keine Medikamente nehmen bzw. keine anderen verordneten Therapien erhalten)
- 9b. Bestehen bei Ihnen Einschränkungen hinsichtlich des Gehens oder Ihrer Mobilität?
- 9c. Hatten Sie in den letzten 6 Monaten einen Schlaganfall oder eine Beeinträchtigung der Nerven oder der Muskulatur?

**10. Wurden bei Ihnen mindestens eine andere, hier nicht erwähnte Erkrankung diagnostiziert oder haben Sie mindestens zwei der bereits genannten Erkrankungen (Fragen 1-9)?** Wenn anderweitige oder mindestens zwei von den bereits genannten Erkrankungen bei Ihnen vorliegen, beantworten Sie die Fragen 10a-10c. *Wenn NEIN lesen Sie bitte die Empfehlungen auf Seite 4.*
- 10a. Hatten Sie in den letzten 12 Monaten infolge einer Kopfverletzung einen Ohnmachtsanfall oder einen Bewusstseinsverlust ODER hatten Sie in den letzten 12 Monaten eine diagnostizierte Gehirnerschütterung?
- 10b. Haben Sie eine hier nicht erwähnte, diagnostizierte Erkrankung (z.B. Epilepsie, neurologische Störungen, Probleme mit den Nieren)?
- 10c. Haben Sie aktuell zwei oder mehr Erkrankungen?

Am Ende von Teil B (nur bei Frage 10 = JA, **Freitextfeld**): „BITTE GEBEN SIE HIER IHRE ERKRANKUNGEN UND JEGLICHE DAZU VERORDNETE MEDIKATION AN:“

### 5.3 Texte zum Ergebnis (Originalwortlaut, nicht ändern)

**Empfehlungen bei „alle ergänzenden Fragen NEIN“ (Seite 4):**
„Bitte lesen Sie die nachfolgenden Empfehlungen bzgl. Ihrer Erkrankung(en) und unterzeichnen Sie die EINVERSTÄNDNISERKLÄRUNG.
Wenn Sie alle ERGÄNZENDEN FRAGEN (Seite 2 und 3) bzgl. Ihrer Erkrankung mit NEIN beantwortet haben, können Sie sich mehr bewegen – Bitte unterzeichnen Sie die untenstehende EINVERSTÄNDNISERKLÄRUNG:
Für die Entwicklung eines für Sie sicheren, effektiven und auf Ihre Gesundheitsbedürfnisse abgestimmten Bewegungsprogramms wird empfohlen, eine qualifizierte Person mit Bewegungsexpertise oder eine Ärztin / einen Arzt zu konsultieren.
Es wird empfohlen, langsam zu starten und allmählich zu steigern: 3-5 Mal pro Woche je 20-60 Minuten Bewegung mit leichter bis moderater Intensität, darunter auch Ausdauer- und Kräftigungstraining.
Zur Steigerung sollten Sie eine Gesamtzeit von 150 Minuten Bewegung pro Woche oder mehr mit moderater Intensität anstreben.
Wenn Sie älter als 45 Jahre sind und NICHT an ein regelmäßiges Training mit intensiver bis maximaler Anstrengung gewöhnt sind, konsultieren Sie bitte vor der weiteren Intensitätssteigerung eine Ärztin / einen Arzt oder eine qualifizierte Person mit Bewegungsexpertise.“

**Text bei mindestens einer JA bei den ergänzenden Fragen (Seite 4):**
„Wenn Sie mindestens eine der ergänzenden Fragen (Seite 2 und 3) mit JA beantwortet haben, sollten Sie weitere Informationen einholen, bevor Sie sich mehr bewegen oder einen Fitness- oder Leistungstest durchführen lassen.
Sie sollten das speziell dafür entwickelte Online Instrument ePARmed-X+ (www.eparmedx.com) zum Screening und für Trainingsempfehlungen selbstständig ausfüllen oder dieses zusammen mit einer Ärztin / einem Arzt oder einer qualifizierten Person mit Bewegungsexpertise durchgehen.“

**Warnhinweis „Bitte warten Sie …“ (Seite 1 und 4, hier die Fassung von Seite 4):**
„Bitte warten Sie damit, sich mehr zu bewegen, wenn:
Sie momentan erkältet / krank sind oder Fieber haben. In dem Fall ist es ratsam, die vollständige Genesung abzuwarten.
Sie schwanger sind – sprechen Sie mit Ihrer zuständigen Ärztin / Ihrem zuständigen Arzt, Frauenärztin / Frauenarzt oder Hebamme und / oder nutzen Sie den ePARmed-X+-Fragebogen auf www.eparmedx.com, bevor Sie sich mehr bewegen.
Sich Ihr Gesundheitszustand ändert – sprechen Sie mit Ihrer Ärztin / Ihrem Arzt oder einer qualifizierten Person mit Bewegungsexpertise bevor Sie mit Ihrem Bewegungsprogramm fortfahren.“
(Auf Seite 1 lautet der dritte Punkt: „Sich Ihr Gesundheitszustand ändert – Beantworten Sie die Fragen auf Seite 2 bis 3 dieses Fragebogens und / oder sprechen Sie mit Ihrer Ärztin / Ihrem Arzt oder qualifizierte Person mit Bewegungsexpertise, bevor Sie mit Ihrem Bewegungsprogramm fortfahren.“)

**Schlusshinweise (Seite 4, im Screen unten anzeigen):**
„Sie können den PAR-Q+ gerne kopieren. Bitte nutzen Sie den vollständigen Fragebogen, an dem KEINE Änderungen vorgenommen werden dürfen.
Die Autor:innen, die PAR-Q+ Kooperationspartner:innen, Partnerorganisationen und deren Vertreter:innen übernehmen keine Haftung für Personen, die Bewegungsaktivitäten durchführen und / oder sich am PAR-Q+ oder dem ePARmed-X+ orientieren.
Wenn Sie nach dem Ausfüllen dieses Fragebogens nicht sicher sind, konsultieren Sie Ihre Ärztin / Ihren Arzt, bevor Sie sich mehr bewegen.“

### 5.4 Einverständniserklärung (Originalwortlaut)

„Personen, die den PAR-Q+ ausgefüllt haben, lesen und unterzeichnen bitte folgende Einverständniserklärung.
Wenn Sie noch nicht volljährig sind oder die Einwilligung eines gesetzlichen Vertreters (z.B. Eltern, Vormund, Betreuer:in) benötigen, müssen diese ebenfalls unterschreiben.
Hiermit bestätige ich, dass ich den Fragebogen vollständig gelesen, verstanden und ausgefüllt habe. Ich nehme zur Kenntnis, dass diese Freigabe für mehr Bewegung ab Ausfülldatum für maximal 12 Monate gültig ist und ungültig wird, falls mein (gesundheitlicher) Zustand sich verändert. Ich bin damit einverstanden, dass mein Verein, Fitnessstudio, Sport- oder Gesundheitseinrichtung bei Bedarf eine Kopie meines ausgefüllten Fragebogens aufbewahrt. Entsprechend der Europäischen Datenschutz-Grundverordnung (DS-GVO) wird die Vertraulichkeit der Kopie gewahrt.
NAME: / DATUM: / UNTERSCHRIFT: / UNTERSCHRIFT GESETZLICHE VERTRETUNG (FALLS NÖTIG):“

**Umsetzung im MVP (Entscheidung):** Statt Unterschrift ein bewusstes Häkchen „Ich bestätige das“ plus automatisches Datum. Kein Name (Pseudonym-Regel). Der Text selbst bleibt unverändert. Minderjährige sind im MVP ausgeschlossen (App ab 18).
**Consent-Log:** Bei jedem Häkchen speichern: genauer Einwilligungstext, Version des Textes („DE 01.07.2024“), Zeitstempel, das Häkchen-Ereignis selbst, pseudonyme Teilnehmer-ID, **App-Version und Sprache**.
**UI-Anforderung:** Pflichtinformation, optionale Einwilligungen und Nutzungsbedingungen klar voneinander trennen (nicht in einem Häkchen bündeln).
Für den privaten Test mit Gabi reicht das. Für den kommerziellen Betrieb müssen Wirksamkeit der Einwilligung, Informationspflichten, Speicherfristen und Betroffenenrechte rechtlich geprüft werden **[OFFEN]**.

### 5.5 Datenmodell der Anamnese (lokal gespeichert)

- Teilnehmer-ID, Fassung des Fragebogens („DE 01.07.2024“), Ausfülldatum, gültig bis (Ausfülldatum + 12 Monate)
- Antworten je Frage (Nummer, JA/NEIN), Freitexte (Fragen 4, 5, 6 in Teil A, Medikation am Ende von Teil B), Einverständnis (ja, Datum, Consent-Log nach 5.4)
- Ergebnis: `freigegeben` | `nicht_freigegeben` | `freigegeben_nach_abklaerung` (mit Datum und Art der Abklärung)
- Die Freitexte und Antworten sind **Gesundheitsdaten (DSGVO Art. 9)**: nur lokal, nicht im Export ohne Warnhinweis, löschbar über „Alle Daten löschen“.

### 5.6 Abbruchregeln bei jedem Test (zusätzlich zur Anamnese)

**Ein Test oder eine Übung wird sofort beendet**, wenn eines dieser Warnzeichen auftritt:
- Brustschmerz, Brustdruck oder Engegefühl
- Atemnot, die außer Verhältnis zur Belastung steht
- Schwindel, Benommenheit, Gefühl kurz vor der Ohnmacht oder Ohnmacht
- Ungewöhnliches Herzrasen, Herzklopfen oder unregelmäßiger Puls
- Neue oder sich verändernde Schmerzen in Brust, Nacken, Kiefer, Rücken oder Armen
- Starke unerwartete Erschöpfung, Übelkeit oder kalter, klebriger Schweiß
- Ungeklärte Herzsymptome

**Danach:** Test beenden, klare Sicherheitsmeldung anzeigen, keine weitere Belastung empfehlen, bei Warnzeichen ärztliche Abklärung nahelegen. **Keine Diagnose**: Die App überwacht nicht in Echtzeit und leitet nichts Medizinisches ab.

**Umsetzung:**
- Die Liste liegt als **eine zentrale Konstante** im Code (nicht in jedem Test einzeln).
- Jeder Abbruch wird protokolliert: Grund, Zeitstempel, Testkontext.
- Die UI-Texte und der Eskalationshinweis brauchen einen medizinischen bzw. rechtlichen Review.

**Herkunft und Prüfstand:** Die Liste stammt aus dem LIVION-Handbuch, den ACSM-Warnzeichen (siehe Konzept, Abschnitt 4) und der konsolidierten Punktliste. Brust-, Hals-, Kiefer- und Armschmerz, Atemnot, Schwindel und Herzrasen sind in den von mir geprüften Quellen belegt. **Rückenschmerz, Übelkeit und kalter Schweiß konnte ich in diesen Quellen nicht bestätigen.** Sie bleiben trotzdem in der Liste, weil mehr Abbruchzeichen die sichere Richtung sind. Die Sportmedizin soll die Liste prüfen. **[OFFEN]** sportmedizinische Freigabe.

### 5.7 Lizenz

- Die offizielle englische PAR-Q+-Fassung 2023 steht unter CC BY-NC-ND 4.0 (Namensnennung, nicht kommerziell, keine Bearbeitung). Die deutsche Fassung (Version 01.07.2024) trägt im Dokument selbst nur die Copyright-Zeile und den Hinweis, dass der vollständige Fragebogen ohne Änderungen kopiert werden darf. Eine ausdrückliche Lizenz für kommerzielle Nutzung steht **nicht** darin.
- Für den privaten Test mit Gabi: unveränderter Text mit Quellenangabe, in Ordnung.
- **Blocker-Regel:** Ohne schriftliche Freigabe keine kommerzielle Auslieferung des PAR-Q+, schon gar nicht als verändertes oder eigenes Formular.
- **Aktion vor jeder kommerziellen Nutzung:** PAR-Q+ Collaboration schriftlich anschreiben (PARQ@hs-gesundheit.de bzw. eparmedx.com). **Inhalt der Anfrage:** kommerzielle Nutzung in einer mobilen oder Web-App; unveränderte deutsche Fassung 01.07.2024; digitale Anzeige; Speicherung der Antworten; Nutzerkonto ohne Namen möglich; gegebenenfalls Weitergabe an Trainer oder Coaches. Antwort, Lizenzbedingungen und erlaubte Änderungen dokumentieren. Keine Rechtsberatung, im Zweifel rechtlich prüfen lassen.

## 6. UKK-Fitness-Index

BMI = kg ÷ m². Zeit in Min und Sek getrennt (für die Frauenformel zusätzlich als Gesamtsekunden).

**Männer (in mehreren Quellen übereinstimmend):**
`Index = 420 − (11,6 × Min + 0,2 × Sek + 0,56 × Puls + 2,6 × BMI − 0,2 × Alter)`

**Frauen: teilweise geklärt, noch nicht produktiv.**
Kandidatenformel (KIT-Skript, hpcosmos):
`Index = 304 + 0,4 × Alter − (0,1417 × Zeit_in_Sekunden + 0,32 × Puls + 1,1 × BMI)`
- Das ist rechnerisch dieselbe Formel wie die frühere „Version B“ (304 − (8,5·Min + 0,14·Sek + 0,32·Puls + 1,1·BMI − 0,4·Alter)), denn 8,5 pro Minute entspricht 0,1417 pro Sekunde. Die Formel ist also in sich stimmig.
- Das ist **keine unabhängige Bestätigung**: Es bleibt dieselbe Sekundärquelle. Die abweichende „Version A“ (305 − (8,1·Min + 0,14·Sek + 0,36·Puls + 1,0·BMI − 0,3·Alter), jumk.de / TK-Testkarte) widerspricht in allen Koeffizienten und ist damit weiter ungeklärt.
- Das Original (Oja et al. 1991, Int J Sports Med 12:356–362) war nicht frei zugänglich, das UKK-Institut veröffentlicht die Formel nicht im Tester's Guide (nur in seiner Software).
- **Prüfplan vor dem produktiven Einsatz:**
  1. Originalquelle, UKK-Software oder eine zuverlässige Primärpublikation beschaffen.
  2. Die Formel mit **mindestens 10 repräsentativen Beispielprofilen** gegen die Referenz prüfen.
  3. Unit-Tests für Rundung, Grenzfälle, fehlende Werte und den Altersbereich 20–65 schreiben.
  4. **Akzeptanzkriterium:** identisches Ergebnis gegenüber der Referenzquelle bei identischen Eingabewerten.
- **Umsetzung:** Die Funktion für Frauen darf im Code stehen, ist aber hinter einem Schalter „Frauenindex“ **standardmäßig aus**. Solange der Schalter aus ist: Rohdaten speichern (Zeit, Puls, BMI, Alter) und im Verlauf die Gehzeit zeigen. Die Rohdaten reichen für eine nachträgliche Berechnung.
- **Rechentest (nur Prüfung der Programmlogik, keine Bestätigung der Formel):** Frau, 50 J., BMI 25, 17:00 min (1020 s), Puls 135 → 304 + 20 − (144,534 + 43,2 + 27,5) = 324 − 215,234 = **108,8**.

**Bewertung:** über 130 sehr gut, 111–130 gut, 90–110 mittel, 70–89 schwach, unter 70 sehr schwach. In der App „Fitness-Index“, nicht „dein VO2max“. Der Test eignet sich besser für Veränderungen als für Absolutwerte (Schätzfehler etwa 4 ml/kg/min).

**Altersbereich:** 20–65 Jahre (UKK-Institut, Oja 1991). Außerhalb davon keinen Index berechnen und keine Bewertung zeigen (Altersprüfung siehe Abschnitt 4).

**Testfall (Mann):** 50 J., BMI 25, 15:30 min, Puls 135 → 420 − 310,6 = **109,4** (mittel). Als automatischen Test einbauen.

## 7. Offene Punkte (Stand 2. November 2026)

| # | Punkt | Status |
|---|---|---|
| 1 | UKK-Frauenformel | **teilweise geklärt:** Kandidatenformel und Prüfplan in Abschnitt 6, Schalter aus. Verifikation am Original oder an der UKK-Software fehlt noch (P0) |
| 2 | UKK-Altersbereich | **geklärt:** 20–65, Altersprüfung vor Teststart (Abschnitt 4) |
| 3 | PAR-Q+ deutsche Fassung | **geklärt:** Fassung 01.07.2024 (Hochschule für Gesundheit Bochum), Wortlaut in Abschnitt 5 übernommen |
| 3a | PAR-Q+ kommerzielle Nutzung | **weiter offen (P0):** schriftliche Erlaubnis der PAR-Q+ Collaboration einholen, Anfrageinhalt in 5.7. Bis dahin keine kommerzielle Auslieferung |
| 3b | Häkchen statt Unterschrift, kein Name | **entschieden für das MVP:** Häkchen plus Consent-Log (5.4). Für den kommerziellen Betrieb rechtlich prüfen |
| 4 | Einbeinstand: SE oder SD, Pausenlänge | **größtenteils geklärt:** keine SE/SD-Anzeige, Pause 60 s. **Versuchszahl offen** (3 laut Springer, 2 laut Punktliste), siehe Abschnitt 11 |
| 5 | Back-Scratch-Details | **geklärt für das MVP:** T6 ist entfernt |
| 6 | Liegestütz Frauentabelle | **weiter offen, aber MVP-sicher:** für Frauen keine Norm und keine Kategorie, nur Wiederholungen und Verlauf. Spätere Norm nur mit Primärquelle (Geschlecht, Altersgruppe, Position, Abbruchkriterium exakt abbilden) |
| 7 | Abbruchregeln sportmedizinisch | **Kern geklärt, Umsetzung offen (P0):** Liste und Umsetzung in 5.6, medizinischer Review fehlt |
| 8 | Supplement-Empfehlungen (Health App) vs. LIVION-Claims | **nicht im MVP:** keine Empfehlungen, keine Dosierung, keine Kaufempfehlung. **To-do vor Wiederaufnahme:** Liste zulässiger und unzulässiger Health-Claims, Claim-Review, Datenquellenprüfung, rechtliche Freigabe |
| 9 | Medizinprodukte-Software (EU/MDCG 2019-11), Datenschutz (DSGVO Art. 9, DSFA) | **weiter offen, Zeitpunkt korrekt:** vor Blutwerte-Modul und vor Veröffentlichung. Maßnahmen in Abschnitt 9 (P1/P2) |
| 10 | Garmin-/Oura-Zugang | **Phase 3, kein MVP-Blocker.** Der Garmin-Zugang bleibt unsicher (siehe Konzept, Abschnitt 7). To-dos für Phase 3 in Abschnitt 9 |

## 8. Startablauf in Claude Code

1. Dieses Dokument einfügen. Claude Code fasst zusammen, was es verstanden hat, und stellt Rückfragen.
2. Projektordner anlegen und Grundgerüst der PWA bauen (Profil + Navigation).
3. Berechnungsfunktionen (BMI, Index Männer, Index Frauen hinter Schalter) mit Tests.
4. **Anamnese-Screen (PAR-Q+) bauen:** Texte aus Abschnitt 5.2–5.4 in `parq-de.json` übernehmen (wörtlich), Ablauflogik aus 5.1, Speicherung nach 5.5. Test: Alle Antworten NEIN → freigegeben; eine JA in Teil A → Teil B erscheint; eine JA in Teil B → nicht freigegeben, Tests gesperrt.
5. Abbruchregeln (5.6) als zentrale Konstante und Altersprüfung (Abschnitt 4) einbauen.
6. Testmappe und Test-Screens, Speichern lokal.
7. Verlaufsansicht, Export, Löschen.
8. Probelauf mit Gabi, Rückmeldungen sammeln.

## 9. Arbeitsplan (aus der konsolidierten Punktliste)

| Priorität | Arbeitspaket | Verantwortlich | Ergebnis |
|---|---|---|---|
| P0 | UKK-Frauenformel aus Originalquelle verifizieren | Produkt / Entwicklung | Freigegebene Formel und Unit-Tests |
| P0 | PAR-Q+ Collaboration um kommerzielle Nutzungserlaubnis bitten | Produkt / Recht | Schriftliche Lizenzantwort |
| P0 | Abbruchregeln implementieren | Entwicklung / Medizin | Sicherheitslogik und UI-Meldungen |
| P1 | Einbeinstand-Protokoll finalisieren | Produkt | Versuchszahl, 60 s Pause, bester Versuch |
| P1 | Consent-Log und Häkchen-Flow definieren | Produkt / Entwicklung / Datenschutz | Dokumentierter Consent-Prozess |
| P1 | Intended Purpose schreiben | Produkt / Recht | Kontrolliertes Dokument: Was tut die App, für wen, mit welchem Ergebnis, ohne welche Ansprüche |
| P2 | MDR-/MDCG-Check je Funktion (Anamnese, Risikobewertung, Trainingsplanung, Blutwerte, Garmin-/Oura-Integration) | Recht / Regulatory | Qualifizierungsentscheidung je Funktion |
| P2 | DSGVO Art. 9 und DSFA vorbereiten (Rechtsgrundlage, Einwilligung, Informationspflichten, Auftragsverarbeitung, Löschkonzept) | Datenschutz / Recht | Verarbeitungsverzeichnis, DSFA-Bericht. Externe Bewertung durch Datenschutz- und Medizinprodukterecht einholen |
| P3 | Garmin-/Oura-Integration planen (OAuth-Flows, Scopes, Datenminimierung, Widerruf durch Nutzer, Datenherkunft, Anzeige-Kontext; prüfen, ob zusätzliche Gesundheitsdaten den MDR-/DSGVO-Status ändern) | Produkt / Entwicklung | Integrations- und Datenschutzkonzept |

Die Spalte „Verantwortlich“ stammt aus der Punktliste. Michael ist bisher die einzige Person im Projekt, die Zuordnung zu Rollen ist ein Vorschlag.

## 10. Definition of Done für das MVP

- [ ] UKK-Formel ist gegen eine verifizierte Quelle geprüft und automatisiert getestet.
- [ ] UKK-Test ist auf 20–65 Jahre beschränkt.
- [ ] PAR-Q+ wird unverändert verwendet, oder es liegt eine schriftliche Nutzungsfreigabe vor.
- [ ] Consent wird per Häkchen erteilt, protokolliert und ist ohne Name möglich.
- [ ] Einbeinstand zeigt keine SE-/SD-Normwert-Streuung.
- [ ] Back-Scratch-Test ist nicht enthalten.
- [ ] Liegestütz zeigt für Frauen keine Normwert-Einstufung.
- [ ] Abbruchregeln sind implementiert, getestet und in der UI verständlich kommuniziert.
- [ ] Keine Supplement-Empfehlungen im MVP.
- [ ] Vor Release: Intended Purpose, MDR-Check, DSGVO Art. 9 und DSFA sind geprüft.

Für den **privaten Test mit Gabi** gelten nur die Punkte, die den Test selbst betreffen (Formel für Männer, Altersprüfung, unveränderter PAR-Q+, Häkchen, Abbruchregeln, keine Supplements). Die Punkte zur Frauenformel, zur PAR-Q+-Lizenz und zu Release-Prüfungen betreffen die kommerzielle Version.

## 11. Offene Entscheidungen

- **PAR-Q+ Collaboration:** kommerzielle Nutzung und digitale Speicherung schriftlich klären.
- **Einbeinstand:** Versuchszahl bestätigen. Dieses Dokument: 3 je Bein (Springer-Vergleich möglich). Punktliste: 2 Versuche (dann kein Springer-Vergleich). Pause 60 s ist gesetzt. **Bitte entscheiden.**
- **Liegestütz Frauen:** später entscheiden, ob eine validierte Normwertquelle eingeführt wird.
- **Supplement-Empfehlungen:** später entscheiden, ob und in welcher Form sie angeboten werden.
- **Medizinprodukt-Status:** nach Fixierung des Intended Purpose endgültig klären.
