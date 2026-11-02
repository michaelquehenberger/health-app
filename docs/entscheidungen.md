# Entscheidungen

Getroffene Produktentscheidungen zu offenen Punkten der MVP-Übergabe. Neueste oben.

| Datum | Punkt | Entscheidung | Von |
|---|---|---|---|
| 02.11.2026 | Beschwerden an mehreren Stellen | Seite links/rechts direkt auf der Körperkarte; bei Knie, Hüfte, Schulter und Hand Pflicht. Mehrere Beschwerden gleichzeitig (z. B. Hüfte links und rechts); der Tagesplan berücksichtigt alle, die vorsichtigste Angabe bestimmt die Stufe. | Michael |
| 02.11.2026 | Rahmen für die Testphase | Vorerst kein eigener Server, kein AV-Vertrag mit Anthropic, keine MDR-Prüfung (kein Verkauf) und keine ärztliche Fachprüfung der Regeln. Diese Punkte kommen erst, wenn die App verkauft werden soll. Quellen mit PubMed-Belegen gelten als erledigt. | Michael |
| 02.11.2026 | KI-Auswertung (Schritt 5) | Umsetzung nach Konzept und Auswertungslogik: KI fasst alle Daten zusammen und wählt nur aus der Übungsdatenbank; rote Flaggen und Schmerzregel gehen vor; keine Diagnose, keine Dosis. Übernahme in den Tagesplan nur auf Knopfdruck. | Michael |
| 02.11.2026 | Blutwerte und Beschwerden | Befund als **PDF oder Foto hochladen**, KI liest die Werte aus, die Nutzerin prüft vor dem Übernehmen. Beschwerden mit **Mehrfachauswahl** (Art, Wann, Was verstärkt es) für genauere Angaben. Für den privaten Test direkter KI-Aufruf mit eigenem Schlüssel; Proxy, AVV und MDR-Prüfung vor jeder Weitergabe offen. | Michael |
| 02.11.2026 | Ablauf und Kern der App | Reihenfolge **Profil → Anamnese → Testmappe → Gesundheitsmodul → Auswertung und Übungsplan**. Das Gesundheitsmodul (Blutwerte, Beschwerden, Oura inkl. VO2max) ist das Herzstück und Pflichtschritt, kein Zusatz. Pflicht in Schritt 4: Einwilligung und Blutwerte; Oura und Beschwerden empfohlen. Ziel: Übungen und Anwendungen per KI aus allen Daten ableiten (Umsetzung offen, siehe README). | Michael |
| 02.11.2026 | Umfang nächster Schritt | Gesundheitsmodul, Videos, Ernährung, Supplements und Oura in einem Zug (Version 0.5) | Michael |
| 02.11.2026 | Supplement-Hinweise für Gabis privaten Test | Infokarten ohne Dosis, nur nach niedrigem Laborwert, mit Quellen und Hinweis auf Arzt oder Apotheke. Die Sperre „keine Supplement-Empfehlungen“ aus Übergabe v0.4 gilt für den privaten Test nicht mehr; vor einer Weitergabe bleiben Claims-Prüfung und rechtliche Freigabe offen | Michael |
| 02.11.2026 | Speicherort | lokal im Browser plus Export, kein Server. Folge: Oura-Login alle etwa 30 Tage, Garmin nur per Datei | Michael |
| 02.11.2026 | Ablauf nach der Anamnese | Erfolgsmeldung mit „So geht es weiter“, Testmappe mit „Dein nächster Schritt“, Fortschritt in drei Etappen, Materialliste, „Weiter“ zum nächsten Test | Michael |
| 02.11.2026 | Einbeinstand: Versuchszahl (Übergabe v0.4, Abschnitt 11) | **3 Versuche je Bein**, 60 s Pause, beste Zeit zählt, max. 45 s. Der Vergleich mit den Mittelwerten nach Springer 2007 bleibt damit zulässig. | Michael |
| 02.11.2026 | Einbeinstand: Pause | 60 Sekunden zwischen den Versuchen | Michael |
| 02.11.2026 | Frauenindex UKK | **Als geprüft übernommen:** `304 + 0,4 × Alter − (0,1417 × Zeit_in_Sekunden + 0,32 × Puls + 1,1 × BMI)`. Wird für Frauen von 20–65 Jahren immer berechnet, ohne Schalter und ohne Vermerk „vorläufig“. Die Referenz der Prüfung (Prüfplan Übergabe v0.4, Abschnitt 6) ist hier noch nicht dokumentiert. Ersetzt die frühere Entscheidung „hinter Schalter, Standard aus“. | Michael |
| 02.11.2026 | Zweckbestimmung (Intended Purpose) | vorerst nicht | Michael |
| 01.11.2026 | Sicherheitscheck | PAR-Q+ als einmalige Anamnese in der App (seit Übergabe v0.2) | Michael |
| 01.11.2026 | Teilnehmer-ID | T01 für Gabi, kein Name | Michael |
