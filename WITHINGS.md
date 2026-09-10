# Withings-Waage anbinden

Liefert Gewicht und Körperzusammensetzung (Körperfett, Fettmasse, Magermasse, Muskelmasse,
Wasser, Knochenmasse) — also genau die Werte, die WHOOP über seine Schnittstelle **nicht**
weitergibt. Dort kommen nur `height_meter`, `weight_kilogram` und `max_heart_rate`, auch wenn
die Waage mit WHOOP gekoppelt ist.

## Einmalige Einrichtung

1. Auf **developer.withings.com** anmelden (privates Withings-Konto genügt), eine Organisation
   auf den eigenen Namen anlegen — **nicht auf eine Firma**: es sind private Gesundheitsdaten,
   eine Firma als Verantwortliche würde die Sache nur ohne Nutzen verkomplizieren.
2. Anwendung anlegen, Typ **Integration der öffentlichen API** (die übrigen Typen gibt es nur
   mit Vertrag). Umgebung: Development. Laut Withings: *„Es gibt keine Voraussetzungen, und der
   Zugang ist kostenlos."*
3. Als **Callback-URL** eintragen: `http://localhost:8768/callback`
4. `client_id` und `client_secret` in die `.env` (nie ins Repo, nie in einen Chat):
   ```
   WITHINGS_CLIENT_ID=…
   WITHINGS_CLIENT_SECRET=…
   ```
5. Anmelden: `node werkzeuge/withings-abholen.js anmelden` — Browser öffnet sich.
   **Mit dem Konto anmelden, unter dem das eigene Profil auf der Waage läuft.**

Withings markiert eine App mit `localhost`-Adresse als **„Eingeschränkt"**. Für den Zugriff auf
die eigenen Daten reicht das; im Test einwandfrei. Der Vorteil dieses Weges: der Anmeldecode
geht direkt vom Browser an das Programm am eigenen Rechner und läuft über niemanden sonst.

### Ausweichweg, falls localhost nicht mehr angenommen wird

Im Repo liegt `withings-callback.html` — eine Zwischenstation auf GitHub Pages
(öffentlich erreichbar, HTTPS auf Port 443, wie Withings es sonst verlangt). Sie nimmt den
Rückruf entgegen und leitet ihn an den lokalen Server weiter. Umstellen:

1. Im Withings-Dashboard die Callback-URL ändern auf
   `https://bccmariozittmayr-oss.github.io/Gesundheit/withings-callback.html`
2. In der `.env` ergänzen:
   `WITHINGS_REDIRECT=https://bccmariozittmayr-oss.github.io/Gesundheit/withings-callback.html`

Nachteil: Der Anmeldecode läuft einmalig über eine bei GitHub gehostete Seite. Er ist nur
wenige Minuten gültig, einmal einlösbar und ohne das Client-Secret wertlos — Restrisiko gering,
aber vorhanden. Deshalb ist localhost der Standard.

## Mehrere Personen auf einer Waage

Die Waage ordnet jede Messung selbst einer Person zu. Withings liefert dazu ein Merkmal
(`attrib`): sicher zugeordnet, mehrdeutig, oder von Hand eingetragen.

**Mehrdeutige Messungen werden nicht übernommen**, sondern nur gezählt und beim Abruf gemeldet.
Lieber ein Tag ohne Wert als das Gewicht einer anderen Person im eigenen Verlauf. Beim ersten
Abruf am 10.09.2026 waren 220 von 220 Messungen eindeutig zugeordnet — die Waage unterscheidet
zuverlässig.

Sollten doch einmal viele Messungen fehlen, holt `--unsichere` sie mit; sie werden dann im
Datensatz markiert und in der App mit einem Warnhinweis angezeigt.

## Werte holen

```
node werkzeuge/withings-abholen.js holen [--tage 180] [--dry-run] [--push] [--log] [--unsichere]
node werkzeuge/withings-abholen.js status
```

`--dry-run` zeigt nur, was käme. `--push` legt `withings.enc.json` verschlüsselt ins Repo und
schiebt sie zu GitHub Pages. `--log` schreibt alle Ausgaben zusätzlich nach
`%LOCALAPPDATA%\withings-abholen.log`.

## In der App

- **Heute**: Karte „Körperwerte" mit Gewicht, Körperfett, Muskeln und Wasseranteil, dazu die
  Veränderung gegenüber vor 30 Tagen und aufklappbar alle Einzelwerte. Ist die letzte Messung
  drei Tage oder älter, wird der Stand orange hervorgehoben.
- **Verlauf**: Messtage, tiefstes und höchstes Gewicht, die letzten 14 Messungen.
- Das **Gewicht wandert automatisch ins Tagesprotokoll** — tagesgenau von der Waage und damit
  mit Vorrang vor dem WHOOP-Profilgewicht. Eine Handeingabe gewinnt immer.
- Nachgeladen wird beim Öffnen der App und beim Zurückkehren, höchstens alle 30 Minuten.
  **Mehr → Waagenwerte jetzt holen** erzwingt es.

## Sicherheit

- `.env`, `.withings-token.json` und `withings.json` stehen in `.gitignore` und bleiben lokal.
- `withings.enc.json` enthält nur Chiffrat (AES-256-GCM, Schlüssel per PBKDF2 aus dem
  Plan-Passwort, gleiches Salt wie `plan.enc.json` — die App öffnet alle Dateien mit einem
  Schlüssel). Die Verschlüsselung liegt gemeinsam in `werkzeuge/krypto.js`.
- Withings hostet in der **EU Medical Cloud** (DSGVO, ISO 27001:2017, HDS-zertifiziert).
- Angefragt wird nur `user.metrics` — Lesezugriff auf Messwerte, kein Schreibrecht.
- Zugriff widerrufen: in der Withings-App unter Profil → verbundene Anwendungen, oder die
  Anwendung im Entwickler-Dashboard löschen.

## Test

`node test/koerper-test.js <Ausgabeordner>` — prüft Karte, Trendzeile, Einzelwerte, Verlauf,
Statuszeile, die Übernahme ins Tagesprotokoll (samt Vorrang der Handeingabe) und die
Kennzeichnung unsicher zugeordneter Messungen.
