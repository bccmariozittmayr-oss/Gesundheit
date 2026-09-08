# WHOOP anbinden

Die App zeigt auf **Heute** die Erholung (Recovery), HRV, Ruhepuls, Schlaf und Belastung des Tages, im **Verlauf** die letzten 30 Tage.
Die Werte holt ein kleines Skript am Rechner von WHOOP – nicht die App selbst. Grund: WHOOP verlangt ein geheimes
Client-Secret, und das darf nicht in einer öffentlichen Web-App liegen.

## Einmalige Einrichtung

1. **WHOOP-Entwicklerkonto**: https://developer.whoop.com, mit dem normalen WHOOP-Login anmelden (kostenlos).
2. **App anlegen** mit
   - Redirect URL: `http://localhost:8766/callback` (exakt so)
   - Scopes: `read:recovery read:cycles read:sleep read:workout read:body_measurement offline`
3. Client-ID und Client-Secret in eine Datei `.env` im App-Ordner eintragen (Vorlage: `.env.example`).
   Dazu den Ordner für die Klartext-Datei `whoop.json` (privat, z.B. neben `mein-plan.json`) und optional die
   Passwortdatei des Plans – dann entsteht zusätzlich `whoop.enc.json` für die App.
4. Anmelden: `node werkzeuge/whoop-abholen.js anmelden` – Browser öffnet sich, Zugriff bestätigen.
5. Probelauf: `node werkzeuge/whoop-abholen.js holen --dry-run`, dann echt: `node werkzeuge/whoop-abholen.js holen --push`

`--push` committet nur `whoop.enc.json` und pusht – so kommen die Werte auf das Handy.

## Täglich automatisch (Windows-Aufgabenplanung)

Aufgabe anlegen, die z.B. um 07:30 und 12:00 ausführt:
`node werkzeuge/whoop-abholen.js holen --push` im App-Ordner. WHOOP bewertet die Nacht kurz nach dem Aufwachen,
ein zweiter Lauf mittags holt Nachzügler.

## In der App

- Einmal unter **Mehr → Plan entsperren** das Passwort eingeben. Dabei wird der Schlüssel (nicht das Passwort)
  auf dem Gerät gespeichert, damit `whoop.enc.json` ohne erneute Eingabe nachgeladen wird.
- Nachgeladen wird beim Öffnen der App und beim Zurückkehren, höchstens alle 30 Minuten. **Mehr → WHOOP-Werte jetzt holen** erzwingt es.
- Schlafstunden übernimmt die App ins Tagesprotokoll, wenn dort noch nichts eingetragen ist.

## Sicherheit

- `.env`, `.whoop-token.json` und `whoop.json` stehen in `.gitignore` und bleiben lokal.
- `whoop.enc.json` enthält nur Chiffrat (AES-256-GCM, Schlüssel per PBKDF2 aus dem Plan-Passwort).
- Zugriff bei WHOOP widerrufen: in der WHOOP-App unter Profil → Apps, oder die App im Entwicklerportal löschen.
