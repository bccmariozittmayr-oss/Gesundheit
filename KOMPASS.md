# KOMPASS – Gesundheit-App

**Was:** Persönliche Alltags-App (PWA, eine Seite) – Tabletten-Checkliste mit Phasen, Atemübungen, FODMAP-Ampel, Wochenplan + Einkaufsliste, Puls-Zonen, Verlauf.
**Live:** https://bccmariozittmayr-oss.github.io/Gesundheit/ (GitHub Pages, Repo ÖFFENTLICH).
**Stand:** Umbau 06.09.2026 auf Basis der Fitmacher-Befunde (Einnahmeplan 04.09.2026).

## Grundsatz
Code öffentlich, Daten privat. **Keine Gesundheitsdaten ins Repo.** Alles Persönliche steht in
`mein-plan.json` (per `.gitignore` ausgeschlossen) und wird in der App unter Mehr → Plan laden gewählt.

## Wo liegt was
| Datei | Zweck |
|---|---|
| `index.html` | App-Logik + Oberfläche (5 Seiten: Heute, Essen, Atmen, Verlauf, Mehr) |
| `daten.js` | allgemeine Listen: FODMAP (168 Lebensmittel), 30 Rezepte mit Kochtipps, Vorrat, Atemübungen, Tipps, Standard-Regeln |
| `sw.js` | Offline-Cache – VERSION bei jeder Änderung hochzählen |
| `mein-plan.beispiel.json` | Struktur der privaten Plan-Datei ohne echte Werte |
| OneDrive `Mario - Dokumente/Privat/Arzt/Die Fitmacher/Gesundheits-App/mein-plan.json` | **Master der privaten Daten** (Präparate, Phasen, Befunde, Termine, Trainingswoche, Puls) |
| OneDrive … `/Gesundheits-App/befund-extrakt.md` | Volltext-Extrakt aller 13 Befund-PDFs (Quelle für den Plan) |
| OneDrive `13 Claude Sicherung/Claude Code/BCC-Zentrale/03_Privat/Gesundheit/` | Kopie der PDFs + Plan |

## Plan-Logik (mein-plan.json)
- `anker.plan` = Plandatum (04.09.2026). Präparate mit `anker:"plan"` zählen Tage ab dort, `anker:"kur"` ab dem Darmkur-Start (in der App eingetragen).
- `phasen[]` mit `abTag`/`bisTag` (Tag 0 = Anker) und Slots `nu` (nüchtern), `m`, `mi`, `a`, `n` (vor dem Schlafen).
- Darmkur: Tag 1–2 Reduzieren, 3–6 Detox (alle anderen Präparate pausiert), 7–8 Aufbau, bis 67 Monat 1–2, bis 128 Monat 3–4, danach Erhaltung.
- Dosis-Korrekturen in der App (Mehr → Dosierung) überschreiben nur die laufende Phase; Änderungen am Plan gehören in die JSON.

## Test
`test/smoke-test.js` (Playwright aus dbcc-360-crm; Aufruf: `node test/smoke-test.js <Ausgabeordner>`) – lädt den echten Plan, klickt alle Seiten, prüft Phasen an 8 Stichtagen. Vor jedem Merge laufen lassen.

## Offen (Stand 06.09.2026)
- Darmkur-Startdatum (Mario trägt es in der App ein). Achtung: Detox-Tage pausieren ALLE Präparate – nicht in die Vitamin-D-Hochdosis (18.–24.09.) legen.
- Vitamin D Hochdosis 7 Tage vs. handschriftlich „10 Wo" – beim Arzt bestätigen.
- Omega 3+ Kapseln: sobald geliefert, Eintrag `omega` in der JSON anpassen.
- Vagus-Vit-/IHHT-Termine nachtragen.
