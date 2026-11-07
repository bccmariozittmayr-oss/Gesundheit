/* Prüft und verschlüsselt die private rechnungen.json für die Kosten-Seite der App.
   Ergebnis: kosten.enc.json im App-Ordner (gleicher Schlüssel wie plan.enc.json, siehe krypto.js).
   Aufruf:  node werkzeuge/kosten-verschluesseln.js <Pfad zu rechnungen.json> <Pfad zur Passwortdatei>
   Prüfungen vor dem Verschlüsseln – bei einem Fehler wird nichts geschrieben:
   - jede Rechnung hat nr, datum (JJJJ-MM-TT), brutto und mindestens eine Position
   - keine Rechnungsnummer doppelt (Duplikate/zweite Scans nur einmal erfassen)
   - Summe der Positionen = Rechnungsbetrag (auf den Cent)
   - jede Position hat eine bekannte Kategorie */
const fs = require('fs');
const path = require('path');
const { verschluesseln } = require('./krypto');

const KATEGORIEN = ['untersuchung', 'behandlung', 'supplements', 'darmkur', 'sport', 'sonstiges'];
const [quelle, pwPfad] = process.argv.slice(2);
if (!quelle || !pwPfad) { console.error('Aufruf: node kosten-verschluesseln.js <rechnungen.json> <passwort.txt>'); process.exit(1); }

function pruefen(d) {
  const fehler = [];
  if (!Array.isArray(d.rechnungen)) return ['rechnungen fehlt'];
  const nummern = new Set();
  for (const r of d.rechnungen) {
    const id = r.nr || '(ohne Nr.)';
    if (!r.nr) fehler.push('Rechnung ohne nr');
    if (nummern.has(r.nr)) fehler.push(id + ': Nummer doppelt');
    nummern.add(r.nr);
    if (!/^\d{4}-\d\d-\d\d$/.test(r.datum || '')) fehler.push(id + ': datum ungültig');
    if (typeof r.brutto !== 'number') fehler.push(id + ': brutto fehlt');
    if (!Array.isArray(r.positionen) || !r.positionen.length) { fehler.push(id + ': keine Positionen'); continue; }
    const summe = r.positionen.reduce((s, p) => s + (p.brutto || 0), 0);
    if (Math.abs(summe - r.brutto) > 0.005) fehler.push(id + ': Positionen ' + summe.toFixed(2) + ' ≠ Rechnung ' + r.brutto.toFixed(2));
    for (const p of r.positionen) if (!KATEGORIEN.includes(p.kat)) fehler.push(id + ': unbekannte Kategorie „' + p.kat + '“');
  }
  return fehler;
}

(async () => {
  const text = fs.readFileSync(quelle, 'utf8');
  const d = JSON.parse(text);
  const fehler = pruefen(d);
  if (fehler.length) { console.error('NICHT verschlüsselt:\n- ' + fehler.join('\n- ')); process.exit(1); }
  const summe = d.rechnungen.reduce((s, r) => s + r.brutto, 0);
  const ziel = await verschluesseln(text, pwPfad, path.join(__dirname, '..'), 'kosten.enc.json');
  console.log('geprüft:', d.rechnungen.length, 'Rechnungen, Summe', summe.toFixed(2), '€ → geschrieben:', ziel);
})().catch(e => { console.error(e.message); process.exit(1); });
