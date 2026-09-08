# So baust du dir deine eigene Gesundheits-App

Diese App habe ich mir nach meiner Untersuchung selbst gebaut – nicht als Programmierer,
sondern mit einem KI-Werkzeug, dem ich gesagt habe, was ich im Alltag brauche.
Hier steht, wie du das in ein paar Stunden nachmachst. Kostenlos, ohne App-Store,
und deine Gesundheitsdaten bleiben bei dir.

**Wichtig vorweg:** Die App ersetzt keinen Arzt und keine Beratung. Sie hilft dir nur,
das umzusetzen, was du mit deinem Arzt oder Therapeuten besprochen hast.

---

## Weg 1: Meine App direkt verwenden (10 Minuten, kein Coden)

1. Auf GitHub oben rechts auf **Fork** klicken (kostenloses GitHub-Konto nötig).
   Du hast dann eine eigene Kopie.
2. In deiner Kopie die Datei `plan.enc.json` **löschen** – das ist mein verschlüsselter Plan,
   den brauchst du nicht.
3. Zum Ausprobieren zuerst `mein-plan.demo.json` laden (erfundene Daten). Dann `mein-plan.beispiel.json` herunterladen, als `mein-plan.json` speichern und mit deinen
   Präparaten, Zeiten und Phasen befüllen (Struktur ist selbsterklärend).
4. In deiner Kopie: **Settings → Pages → Branch main → Save.** Nach einer Minute läuft
   deine App unter `https://<dein-name>.github.io/Gesundheit/`.
5. Am Handy öffnen, „Zum Home-Bildschirm" hinzufügen, unter **Mehr → Plan laden** deine
   `mein-plan.json` wählen. Fertig.

Die Datei `mein-plan.json` bleibt am Handy bzw. auf deinem Rechner. Sie wird nie hochgeladen.

---

## Weg 2: Deine eigene App bauen lassen (2–4 Stunden)

Du brauchst ein KI-Werkzeug, das Dateien schreiben kann. Ich habe **Claude Code** verwendet
(claude.ai/code). Es geht auch mit ChatGPT, Gemini oder Cursor – dann kopierst du den
erzeugten Code selbst in eine Datei `index.html`.

Kopiere den folgenden Text als ersten Auftrag hinein und ersetze die Klammern:

```
Baue mir eine persönliche Gesundheits-App als eine einzige HTML-Datei (index.html),
die am Handy als Web-App („Zum Home-Bildschirm") läuft und offline funktioniert.
Ich bin kein Entwickler – erkläre mir jeden Schritt in einfachen Worten.

Meine Situation:
- Ich nehme [Anzahl] Präparate zu diesen Tageszeiten: [nüchtern / morgens / mittags / abends / vor dem Schlafen].
- Es gibt Phasen (z.B. Woche 1–2 anders als danach): [kurz beschreiben oder „keine"].
- Ich soll bestimmte Lebensmittel meiden: [z.B. FODMAP-reich / Gluten / Laktose / Zucker / „keine"].
- Ich mache Atemübungen / Sport: [was, wie oft].

Was die App können soll (in dieser Reihenfolge bauen, nach jedem Schritt kurz testen):
1. Seite „Heute": Checkliste der Präparate nach Tageszeit zum Abhaken, plus Atemübungen
   und ein Kurz-Check (Schlaf, Stress, Bauch, Gewicht – nur Zahlen, kein Freitext).
2. Seite „Essen": Ampel-Liste (grün/gelb/rot) meiner Lebensmittel mit Suche, ein
   Wochenplan mit Rezepten und eine Einkaufsliste daraus.
3. Strichcode-Scanner mit der Handykamera: Produkt nachschlagen (Open Food Facts, kostenlos)
   und die Zutaten gegen meine Meide-Liste prüfen. Zusätzlich: Foto der Zutatenliste
   mit Texterkennung im Browser (Tesseract.js), falls kein Strichcode da ist.
4. Seite „Atmen": geführte Übungen (4-7-8, Box-Atmung, 5-5) mit Timer.
5. Seite „Verlauf": Kurve der letzten 30 Tage und Einnahmequote je Präparat.
6. Seite „Mehr": Erinnerungszeiten, Kalender-Export als .ics-Datei (für Outlook/Google/Apple),
   Datensicherung als JSON-Export/Import.

Regeln:
- Alles Persönliche (Präparate, Dosierungen, Befunde) steht in einer eigenen Datei
  mein-plan.json, die ich in der App lade. Der Code selbst enthält keine Gesundheitsdaten.
- Keine Server, keine Konten, keine Cloud. Daten nur im Browser-Speicher des Geräts.
- Keine externen Aufrufe außer Open Food Facts beim Scannen.
- Große Buttons, wenig Text, alles ohne Anleitung bedienbar.
- Sichtbarer Hinweis in der App: „Ersetzt keinen Arzt."
```

Danach arbeitest du im Gespräch weiter: „Die Schrift ist zu klein", „Ich brauche noch
Erinnerungen um 7 Uhr", „Mach mir eine Ampel für Restaurants". Das KI-Werkzeug baut um,
du testest am Handy.

### Online stellen (kostenlos)

GitHub-Konto anlegen, neues öffentliches Repository „Gesundheit", `index.html` hochladen,
**Settings → Pages → Branch main**. Die Adresse `https://<dein-name>.github.io/Gesundheit/`
öffnest du am Handy und legst sie auf den Home-Bildschirm.

---

## Vier Regeln, damit das seriös bleibt

0. **Dir muss klar sein: Beim Bauen gibst du deine Gesundheitsdaten an eine KI.**
   Alles, was du in den Prompt schreibst (Präparate, Diagnosen, Regeln), landet beim
   Anbieter des KI-Werkzeugs (z.B. Anthropic in den USA, OpenAI). Ich habe das für
   mich bewusst entschieden. Wer das nicht will: nur allgemein beschreiben („5 Präparate
   zu 3 Tageszeiten") und die echten Namen erst später selbst in die Plan-Datei
   eintragen. Die fertige App schickt danach nichts mehr an eine KI.
1. **Gesundheitsdaten nie in den Code und nie auf GitHub.** Immer in eine eigene Datei,
   die nur bei dir liegt. Wenn du unsicher bist: Repository auf „privat" stellen.
2. **Die App erinnert, sie entscheidet nicht.** Dosierungen und Phasen kommen von deinem
   Arzt oder Therapeuten, du trägst sie nur ein.
3. **Einmal in der Woche sichern.** Mehr → Datensicherung → Export, Datei auf deinem
   Laufwerk ablegen.

## Was mich das gekostet hat

Werkzeug: Ich habe das große Claude-Paket (Max), weil ich beruflich täglich damit arbeite.
Für diese App reicht nach meiner Einschätzung das Einstiegspaket (Pro, ca. 20 €/Monat,
ein Monat genügt) – man stößt dort öfter an die Stundengrenze und muss kurz warten,
mehr nicht. Hosting: 0 €. Zeit: der erste Stand an einem Abend, dann eine Woche lang
jeden Tag 20 Minuten Feinschliff beim Benutzen. Die aktuelle Fassung in diesem
Repository entstand im Wesentlichen an einem Sonntagnachmittag im September 2026.

**Daten in der EU behalten?** Claude (Anthropic) und ChatGPT (OpenAI) sind US-Anbieter.
Wer die Gesundheitsdaten beim Bauen in Europa lassen will, kann Mistral aus Frankreich
nehmen (Le Chat im Browser, oder Mistral Vibe als Programmier-Werkzeug). Der Start-Prompt
oben funktioniert dort genauso. Ich habe diese App aber mit Claude gebaut und Mistral
dafür nicht getestet – die Qualität kann abweichen. Der sicherste Weg bleibt Regel 0:
keine echten Daten in den Prompt.

**Tiefer einsteigen?** Die AI Masterclass des BTM Podcast (btm-podcast.com/ai-masterclass)
zeigt in vier Sessions, wie man mit KI Landingpages, Agenten und Prototypen baut –
für alle, die nach dieser App weitermachen wollen.

Fragen? Mario Zittmayr – LinkedIn.
