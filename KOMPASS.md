# KOMPASS – Gesundheit-App

**Was:** Persönliche Alltags-App (PWA, eine Seite) – Tabletten-Checkliste mit Phasen, Atemübungen, FODMAP-Ampel, Wochenplan + Einkaufsliste, Puls-Zonen, Verlauf.
**Live:** https://bccmariozittmayr-oss.github.io/Gesundheit/ (GitHub Pages, Repo ÖFFENTLICH).
**Stand:** Umbau 06.09.2026 auf Basis der ärztlichen Befunde (Details nur im privaten Plan).

## Grundsatz
Code öffentlich, Daten privat. **Keine Gesundheitsdaten ins Repo.** Alles Persönliche steht in
`mein-plan.json` (per `.gitignore` ausgeschlossen) und wird in der App unter Mehr → Plan laden gewählt.

## Wo liegt was
| Datei | Zweck |
|---|---|
| `index.html` | App-Logik + Oberfläche (5 Seiten: Heute, Essen, Atmen, Verlauf, Mehr). Auf „Heute" wählt eine Leiste den Tag: `HEUTE` ist der echte heutige Tag, `TK` der angezeigte – beim Nachtragen ein früherer (bis 30 Tage zurück, nie in die Zukunft). Erinnerungen, Wochenplan und Export hängen immer an `HEUTE`. |
| `daten.js` | allgemeine Listen: FODMAP (168 Lebensmittel), 30 Rezepte mit Kochtipps, Vorrat, Atemübungen, Tipps, Standard-Regeln |
| `sw.js` | Offline-Cache – VERSION bei jeder Änderung hochzählen |
| `mein-plan.beispiel.json` | Struktur der privaten Plan-Datei ohne echte Werte |
| `plan.enc.json` | der echte Plan, AES-verschlüsselt – nach jeder Planänderung mit `werkzeuge/plan-verschluesseln.js` neu erzeugen |
| `mein-plan.demo.json`, `demo-protokoll.json` | Demo ohne Befunde + Beispiel-Verlauf für Videos/Vorführungen – neu erzeugen mit `werkzeuge/demo-erzeugen.js <mein-plan.json> [Enddatum]` |
| `withings.enc.json` | Waagenwerte von Withings (Gewicht, Körperfett, Muskel-, Wasser-, Knochenmasse), gleiche Verschlüsselung wie whoop.enc.json. Erzeugt `werkzeuge/withings-abholen.js holen --push`. Klartext `withings.json` nur im OneDrive-Datenordner. Einrichtung und Besonderheiten (mehrere Personen auf der Waage): `WITHINGS.md`. Das Gewicht von hier hat im Tagesprotokoll Vorrang vor dem WHOOP-Profilgewicht. |
| `werkzeuge/krypto.js` | die gemeinsame Verschlüsselung für whoop.enc.json und withings.enc.json – liegt bewusst nur an dieser einen Stelle |
| `whoop.enc.json` | WHOOP-Tageswerte (Erholung, HRV, Ruhepuls, Schlaf, Belastung, Workouts), verschlüsselt mit dem Plan-Passwort und dem Salt aus plan.enc.json. Erzeugt `werkzeuge/whoop-abholen.js holen --push` (täglich per Aufgabenplanung). Klartext `whoop.json` liegt nur im OneDrive-Datenordner. Einrichtung: `WHOOP.md`. Die App übernimmt Schlaf, Sport (bei Workout) und Gewicht (WHOOP-Profil) ins Tagesprotokoll, Handeingabe überschreibt. Aufgabenplanung: eine Aufgabe „Gesundheit Messwerte" (07:30 und 12:30) holt nacheinander WHOOP und Withings, einmalig einrichten und prüfen mit `werkzeuge/tagesabruf-einrichten.js` (ruft node direkt auf – eine .cmd-Datei hat der Virenschutz am 10.09.2026 zweimal gelöscht). Log: `%LOCALAPPDATA%\whoop-abholen.log`. Sind die Werte 2 Tage oder älter, warnt die App auf „Heute" |
| `.env` / `.whoop-token.json` | WHOOP-Zugang (Client-ID/Secret, Token) – lokal, in .gitignore, nie in OneDrive |
| `NACHBAUEN.md`, `LICENSE` | öffentliche Nachbau-Anleitung mit Start-Prompt, MIT |
| OneDrive … `/Gesundheits-App/PLAN-PASSWORT.txt` | Passwort dazu – nie ins Repo, nie in den Chat |
| OneDrive `Mario - Dokumente/Privat/Arzt/Die Fitmacher/Gesundheits-App/mein-plan.json` | **Master der privaten Daten** (Präparate, Phasen, Befunde, Termine, Trainingswoche, Puls) |
| OneDrive … `/Gesundheits-App/befund-extrakt.md` | Volltext-Extrakt aller 13 Befund-PDFs (Quelle für den Plan) |
| OneDrive `13 Claude Sicherung/Claude Code/BCC-Zentrale/03_Privat/Gesundheit/` | Kopie der PDFs + Plan |

## Plan-Logik (mein-plan.json)
- `anker.plan` = Plandatum. Präparate mit `anker:"plan"` zählen Tage ab dort, `anker:"kur"` ab dem Darmkur-Start (in der App eingetragen).
- `phasen[]` mit `abTag`/`bisTag` (Tag 0 = Anker) und Slots `nu` (nüchtern), `m`, `mi`, `a`, `n` (vor dem Schlafen).
- Darmkur: Tag 1–2 Reduzieren, 3–6 Detox (alle anderen Präparate pausiert), 7–8 Aufbau, bis 67 Monat 1–2, bis 128 Monat 3–4, danach Erhaltung.
- Dosis-Korrekturen in der App (Mehr → Dosierung) überschreiben nur die laufende Phase; Änderungen am Plan gehören in die JSON.

## Test
`test/training-test.js <Ausgabeordner>` – prüft die freie Trainingsauswahl: geplante und zusätzliche Einheiten, Abhaken, Minuten, Zuordnung eines WHOOP-Workouts, Migration alter Einträge.
`test/koerper-test.js <Ausgabeordner>` – prüft die Withings-Karte, die Trendzeile, den Verlauf und dass das Waagengewicht ins Tagesprotokoll wandert, ohne eine Handeingabe zu überschreiben.
`test/nachtrag-test.js <Ausgabeordner>` – prüft das Nachtragen: Tagesleiste, Kennzeichnung, dass Einträge beim gewählten Tag landen und nicht bei heute, Grenzen (30 Tage zurück, keine Zukunft).
`test/whoop-test.js <Ausgabeordner>` – prüft Entsperren, Nachladen von whoop.enc.json ohne Passwort (Schlüssel in IndexedDB) und die WHOOP-Karten mit Testdaten.
`test/smoke-test.js` (Playwright aus dbcc-360-crm; Aufruf: `node test/smoke-test.js <Ausgabeordner>`) – lädt den echten Plan, klickt alle Seiten, prüft Phasen an 8 Stichtagen. Vor jedem Merge laufen lassen.

## Offen
Offene Behandlungs- und Dosisfragen stehen NICHT hier (öffentliches Repo), sondern in
`OneDrive …/Gesundheits-App/NOTIZEN-offen.md` neben der mein-plan.json.
