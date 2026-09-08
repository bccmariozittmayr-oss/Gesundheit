# Gesundheit – persönliche Alltags-App

Eine kleine Web-App (eine HTML-Datei, läuft am Handy als „App"), die im Alltag hilft:

- **Heute:** Tabletten-Checkliste nach Tageszeit, Atemübungen abhaken, Kurz-Check (Hals, Bauch, Stress, Schlaf, Gewicht)
- **Essen:** FODMAP-Ampel mit Suche, Wochenplan mit Rezepten, Einkaufsliste daraus, Ess-Regeln
- **Atmen:** geführte Übungen (4-7-8, 5-5, 4:6, Box, Stille) mit Timer
- **Verlauf:** Kurve der letzten 30 Tage, Befunde, Termine
- **Mehr:** Plan laden, Darmkur-Start, Erinnerungszeiten, Kalender-Export, Datensicherung

## Datenschutz – so ist es gebaut

Dieses Repo ist öffentlich. **Es enthält keine Gesundheitsdaten.** Der Code kennt nur allgemeine Listen (FODMAP-Tabelle, Rezepte, Atemübungen).

Alles Persönliche (Präparate, Dosierungen, Befunde, Termine) steht in **`mein-plan.json`**. Diese Datei

- liegt nur auf OneDrive (privater Ordner),
- ist per `.gitignore` vom Repo ausgeschlossen,
- wird einmalig pro Gerät in der App unter **Mehr → Plan laden** ausgewählt und bleibt dann im Browser-Speicher (localStorage) des Geräts.

`mein-plan.beispiel.json` zeigt die Struktur ohne echte Werte, `mein-plan.demo.json` ist eine Demo-Fassung ohne Befunde, `demo-protokoll.json` ein Beispiel-Verlauf dazu (beide mit `werkzeuge/demo-erzeugen.js` erzeugt).

**Selbst nachbauen?** Siehe [NACHBAUEN.md](NACHBAUEN.md) – Anleitung und Start-Prompt.

## Plan in die App bringen (verschlüsselt)

Damit kein Handy-Dateizugriff nötig ist, liegt der Plan zusätzlich **verschlüsselt** im Repo (`plan.enc.json`, AES-256-GCM, Schlüssel aus einem Passwort per PBKDF2 mit 300.000 Runden). Die App entschlüsselt ihn unter **Mehr → Plan entsperren** nur mit dem Passwort auf dem Gerät; das Passwort wird nicht gespeichert und steht nirgends im Repo.

Nach jeder Änderung an `mein-plan.json`:

    node werkzeuge/plan-verschluesseln.js <Pfad/mein-plan.json> <Pfad/PLAN-PASSWORT.txt>

dann committen. Beide Eingabedateien bleiben außerhalb des Repos.

## Installation am Handy

1. Seite im Browser öffnen (GitHub Pages).
2. iPhone: Teilen → „Zum Home-Bildschirm". Android: Menü → „App installieren".
3. In der App: Mehr → Plan entsperren → Passwort eingeben (alternativ: `mein-plan.json` als Datei laden).
4. Mehr → „In Kalender übernehmen" → .ics importieren. Dann erinnert der Kalender täglich, auch wenn die App geschlossen ist. (Browser-Benachrichtigungen funktionieren nur, solange die App offen ist.)

## Plan ändern

`mein-plan.json` bearbeiten (Dosis, Phasen, neue Präparate), speichern, in der App neu laden. Kleine Dosis-Korrekturen gehen auch direkt in der App unter Mehr → Dosierung anpassen.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | die App |
| `daten.js` | allgemeine Listen: FODMAP, Rezepte, Vorrat, Atemübungen, Regeln |
| `sw.js`, `manifest.json`, `icon*.png/svg` | Offline-Betrieb und App-Installation |
| `mein-plan.beispiel.json` | Vorlage für die private Plan-Datei |

Bei Änderungen an `index.html` oder `daten.js` die `VERSION` in `sw.js` hochzählen, sonst zeigt das Handy die alte Fassung.
