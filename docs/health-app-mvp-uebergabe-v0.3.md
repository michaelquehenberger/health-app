# Health App × LIVION – MVP-Übergabe für Claude Code (v0.3)

Stand: 2. November 2026 | Basis: `health-app-livion-konzept.md` (Projekt-Doc) + Prüfung der offenen Punkte

**Änderungen in v0.3 (geklärte Punkte eingearbeitet):** UKK-Frauenformel als Kandidat mit Testfall (nicht produktiv), Einbeinstand-Pause festgelegt, Consent-Log für das Häkchen, erweiterte Abbruchzeichen, Status der offenen Punkte (Abschnitt 7) aktualisiert. Der PAR-Q+-Wortlaut (Abschnitt 5.2 bis 5.4) ist unverändert.
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
| T2 UKK-2-km-Gehtest | Min, Sek, Puls am Ende, Streckenart, Größe, Gewicht | Männer: Fitness-Index mit Bewertung (siehe 6). Frauen: vorerst nur Zeit und Puls als Verlauf |
| T3 30-s-Sit-to-Stand | Anzahl, Armeinsatz ja/nein → dann 0 | nein (Normen nur ab 60) |
| T4 Einbeinstand | 3 Versuche je Bein (s), **60 Sekunden Pause** zwischen den Versuchen, beste Zeit zählt, max. 45 s, nur Augen offen | eigene Haltezeit und Verlauf. Optional als reiner Vergleich die Mittelwerte Springer 2007 (40–49: 41,9 s bester Versuch; 50–59: 41,2 s). **Streuung nie anzeigen**, keine Bewertung |
| T5 Knie-zur-Wand | Abstand links/rechts (cm), Ferse abgehoben, Schmerz | Seitendifferenz ab ca. 1,5 cm als Hinweis, keine Bewertung |
| T7 Chair Sit-and-Reach | Abstand je Seite (cm, negativ bei Lücke), Schmerz | nein |
| T8 Liegestütz | Wiederholungen, Variante (Zehen/Knie), Abbruchgrund | Männer (Zehen) 40–49 und 50–59 laut Tabelle im Konzept. **Frauen: keine Norm und keine Bewertung**, nur Wiederholungen und persönliche Entwicklung |

**Nicht im MVP:** T6 Back-Scratch, T2b 6-Minuten-Gehtest, Handkraft.

Normen ab 60 (Sit-to-Stand usw.) bei unter 60-Jährigen nie anzeigen. Hauptaussage der App ist der persönliche Verlauf.

**Einbeinstand, Entscheidungen:** Die Streuungswerte der Springer-Tabelle sind Standardabweichungen (SD), keine Standardfehler. Für eine individuelle Einordnung sind sie nicht belastbar genug und werden deshalb nicht angezeigt. Die Pause von 60 Sekunden ist eine Produktentscheidung (die Studie legt nur die Pause zwischen Serien fest, keine feste Pause zwischen einzelnen Versuchen). Die Zahl der Versuche bleibt bei **3 je Bein**, weil die Springer-Vergleichswerte auf „beste von 3“ beruhen. Zwei Versuche wären ein anderes Protokoll und nicht mit der Tabelle vergleichbar.

## 5. Anamnese und Sicherheits-Gate (PAR-Q+, einmalig)

**Quelle:** PAR-Q+ „Physical Activity Readiness Questionnaire for Everyone“, deutsche Fassung, Version 01.07.2024, Copyright © 2024 PAR-Q+ Collaboration | Hochschule für Gesundheit Bochum. Übersetzung: Tobias Braun, Alina Rieckmann, Annika Glöckl, Cheyenne Hanna Haugwitz-Mayall, Christian Thiel. Kontakt: [www.eparmedx.com](https://www.eparmedx.com) | [www.hs-gesundheit.de/PARQ](https://www.hs-gesundheit.de/PARQ) | PARQ@hs-gesundheit.de.
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
Fangen Sie an, sich mehr zu bewegen – beginnen Sie langsam und steigern Sie sich allmählich. Folgen Sie den „Nationalen Bewegungsempfehlungen“ Ihrer Altersgruppe: [www.bundesgesundheitsministerium.de](https://www.bundesgesundheitsministerium.de)
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
Sie sollten das speziell dafür entwickelte Online Instrument ePARmed-X+ ([www.eparmedx.com](https://www.eparmedx.com)) zum Screening und für Trainingsempfehlungen selbstständig ausfüllen oder dieses zusammen mit einer Ärztin / einem Arzt oder einer qualifizierten Person mit Bewegungsexpertise durchgehen.“

**Warnhinweis „Bitte warten Sie …“ (Seite 1 und 4, hier die Fassung von Seite 4):**
„Bitte warten Sie damit, sich mehr zu bewegen, wenn:
Sie momentan erkältet / krank sind oder Fieber haben. In dem Fall ist es ratsam, die vollständige Genesung abzuwarten.
Sie schwanger sind – sprechen Sie mit Ihrer zuständigen Ärztin / Ihrem zuständigen Arzt, Frauenärztin / Frauenarzt oder Hebamme und / oder nutzen Sie den ePARmed-X+-Fragebogen auf [www.eparmedx.com](https://www.eparmedx.com), bevor Sie sich mehr bewegen.
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
**Consent-Log (neu):** Bei jedem Häkchen speichern: genauer Einwilligungstext, Version des Textes („DE 01.07.2024“), Zeitstempel, das Häkchen-Ereignis selbst und die Teilnehmer-ID.
Für den privaten Test mit Gabi reicht das. Für den kommerziellen Betrieb muss ein Anwalt die Wirksamkeit der Einwilligung, die Informationspflichten und die Speicherung des Consent-Logs prüfen **[OFFEN]**.

### 5.5 Datenmodell der Anamnese (lokal gespeichert)

- Teilnehmer-ID, Fassung des Fragebogens („DE 01.07.2024“), Ausfülldatum, gültig bis (Ausfülldatum + 12 Monate)
- Antworten je Frage (Nummer, JA/NEIN), Freitexte (Fragen 4, 5, 6 in Teil A, Medikation am Ende von Teil B), Einverständnis (ja, Datum, Consent-Log nach 5.4)
- Ergebnis: `freigegeben` | `nicht_freigegeben` | `freigegeben_nach_abklaerung` (mit Datum und Art der Abklärung)
- Die Freitexte und Antworten sind **Gesundheitsdaten (DSGVO Art. 9)**: nur lokal, nicht im Export ohne Warnhinweis, löschbar über „Alle Daten löschen“.

### 5.6 Abbruchregeln bei jedem Test (zusätzlich zur Anamnese)

**Sofort stoppen** bei: Brustschmerz oder -druck, Schmerz oder Druck in Hals, Kiefer oder Armen, Atemnot bei geringer Belastung oder neu auftretender starker Atemnot, Schwindel oder Ohnmachtsgefühl, Herzrasen oder ungewöhnlichem Herzklopfen, ungewöhnlicher Müdigkeit oder Erschöpfung, ungeklärten Herzsymptomen.
Dann: klare Sicherheitsmeldung und Hinweis auf ärztliche Abklärung. **Keine Diagnose**, die App überwacht nicht in Echtzeit und behauptet keine medizinische Einschätzung.
Die Zeichen stammen nicht aus dem PAR-Q+, sondern aus dem LIVION-Handbuch und den ACSM-Warnzeichen (siehe Konzept, Abschnitt 4). Rückenschmerzen als eigenes Abbruchzeichen habe ich nicht in den geprüften Quellen gefunden und deshalb nicht aufgenommen. Das kann die Sportmedizin ergänzen. **[OFFEN]** sportmedizinische Freigabe der Abbruchregeln.

### 5.7 Lizenz

- Die offizielle englische PAR-Q+-Fassung 2023 steht unter CC BY-NC-ND 4.0 (Namensnennung, nicht kommerziell, keine Bearbeitung). Die deutsche Fassung (Version 01.07.2024) trägt im Dokument selbst nur die Copyright-Zeile und den Hinweis, dass der vollständige Fragebogen ohne Änderungen kopiert werden darf. Eine ausdrückliche Lizenz für kommerzielle Nutzung steht **nicht** darin.
- Für den privaten Test mit Gabi: unveränderter Text mit Quellenangabe, in Ordnung.
- **Bis die schriftliche Erlaubnis vorliegt:** den PAR-Q+ nicht kommerziell ausliefern und nicht als verändertes oder umgestaltetes Formular einsetzen.
- **Aktion vor jeder kommerziellen Nutzung:** schriftliche Nutzungserlaubnis der PAR-Q+ Collaboration einholen (Kontakt: PARQ@hs-gesundheit.de bzw. eparmedx.com). Keine Rechtsberatung, im Zweifel rechtlich prüfen lassen.

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
- **Vor dem produktiven Einsatz** gegen das Original oder die UKK-Software prüfen.
- **Umsetzung:** Die Funktion für Frauen darf im Code stehen, ist aber hinter einem Schalter „Frauenindex“ **standardmäßig aus**. Solange der Schalter aus ist: Rohdaten speichern (Zeit, Puls, BMI, Alter) und im Verlauf die Gehzeit zeigen. Die Rohdaten reichen für eine nachträgliche Berechnung.
- **Rechentest (nur Prüfung der Programmlogik, keine Bestätigung der Formel):** Frau, 50 J., BMI 25, 17:00 min (1020 s), Puls 135 → 304 + 20 − (144,534 + 43,2 + 27,5) = 324 − 215,234 = **108,8**.

**Bewertung:** über 130 sehr gut, 111–130 gut, 90–110 mittel, 70–89 schwach, unter 70 sehr schwach. In der App „Fitness-Index“, nicht „dein VO2max“. Der Test eignet sich besser für Veränderungen als für Absolutwerte (Schätzfehler etwa 4 ml/kg/min).

**Altersbereich:** 20–65 Jahre (Angabe des UKK-Instituts, Oja 1991). Außerhalb davon keinen Index berechnen.

**Testfall (Mann):** 50 J., BMI 25, 15:30 min, Puls 135 → 420 − 310,6 = **109,4** (mittel). Als automatischen Test einbauen.

## 7. Offene Punkte (Stand 2. November 2026)

| # | Punkt | Status |
|---|---|---|
| 1 | UKK-Frauenformel | **teilweise geklärt:** Kandidatenformel in Abschnitt 6, Schalter aus. Prüfung am Original oder an der UKK-Software fehlt noch |
| 2 | UKK-Altersbereich | **geklärt:** 20–65 |
| 3 | PAR-Q+ deutsche Fassung | **geklärt:** Fassung 01.07.2024 (Hochschule für Gesundheit Bochum) liegt vor, Wortlaut in Abschnitt 5 übernommen |
| 3a | PAR-Q+ kommerzielle Nutzung | **weiter offen:** keine klare Lizenz für eine kommerzielle App. Schriftliche Erlaubnis der PAR-Q+ Collaboration einholen, bis dahin nicht kommerziell ausliefern (5.7) |
| 3b | Häkchen statt Unterschrift, kein Name | **entschieden für das MVP:** Häkchen plus Consent-Log (5.4). Für den kommerziellen Betrieb rechtlich prüfen |
| 4 | Einbeinstand: SE oder SD, Pausenlänge | **größtenteils geklärt:** Werte sind SD und werden nicht angezeigt, Pause 60 s als Produktentscheidung, 3 Versuche bleiben (Abschnitt 4) |
| 5 | Back-Scratch-Details | **geklärt für das MVP:** T6 ist entfernt, kein Handlungsbedarf |
| 6 | Liegestütz Frauentabelle | **weiter offen, aber MVP-sicher:** für Frauen keine Normwerte, nur Wiederholungen und Entwicklung. Für spätere Normwerte eine Primärquelle verwenden |
| 7 | Abbruchregeln sportmedizinisch | **Kern klar, Freigabe offen:** Zeichen in 5.6, Freigabe durch die Sportmedizin fehlt |
| 8 | Supplement-Empfehlungen (Health App) vs. LIVION-Claims | **nicht im MVP.** Erst nach Klärung von Claim, Rechtslage und Datenquelle wieder aufnehmen (Entscheidung des Nutzers) |
| 9 | Medizinprodukte-Software (EU/MDCG 2019-11), Datenschutz (DSGVO Art. 9, DSFA) | **weiter offen, Zeitpunkt korrekt:** vor Blutwerte-Modul und vor Veröffentlichung klären. **Aktion:** Verwendungszweck (Intended Purpose) schriftlich festlegen, dann rechtliche Bewertung. Die Anamnese enthält schon Gesundheitsdaten (5.5) |
| 10 | Garmin-/Oura-Zugang | **Phase 3, kein MVP-Blocker.** Der Garmin-Zugang bleibt unsicher (siehe Konzept, Abschnitt 7) |

## 8. Startablauf in Claude Code

1. Dieses Dokument einfügen. Claude Code fasst zusammen, was es verstanden hat, und stellt Rückfragen.
2. Projektordner anlegen und Grundgerüst der PWA bauen (Profil + Navigation).
3. Berechnungsfunktionen (BMI, Index Männer, Index Frauen hinter Schalter) mit Tests.
4. **Anamnese-Screen (PAR-Q+) bauen:** Texte aus Abschnitt 5.2–5.4 in `parq-de.json` übernehmen (wörtlich), Ablauflogik aus 5.1, Speicherung nach 5.5. Test: Alle Antworten NEIN → freigegeben; eine JA in Teil A → Teil B erscheint; eine JA in Teil B → nicht freigegeben, Tests gesperrt.
5. Testmappe und Test-Screens, Speichern lokal.
6. Verlaufsansicht, Export, Löschen.
7. Probelauf mit Gabi, Rückmeldungen sammeln.
