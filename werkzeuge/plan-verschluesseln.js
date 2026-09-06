/* Verschlüsselt die private mein-plan.json für die App (AES-256-GCM, Schlüssel aus Passwort per PBKDF2).
   Ergebnis: plan.enc.json im App-Ordner – darf ins öffentliche Repo, enthält nur Chiffrat.
   Aufruf:  node werkzeuge/plan-verschluesseln.js <Pfad zu mein-plan.json> <Pfad zur Passwortdatei>
   Die Passwortdatei enthält nur das Passwort (eine Zeile) und bleibt außerhalb des Repos. */
const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;

const [planPfad, pwPfad] = process.argv.slice(2);
if (!planPfad || !pwPfad) { console.error('Aufruf: node plan-verschluesseln.js <mein-plan.json> <passwort.txt>'); process.exit(1); }
const plan = fs.readFileSync(planPfad, 'utf8');
JSON.parse(plan); // muss gültiges JSON sein
const pw = fs.readFileSync(pwPfad, 'utf8').trim();
if (pw.length < 12) { console.error('Passwort zu kurz (mindestens 12 Zeichen).'); process.exit(1); }

(async () => {
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const iterations = 300000;
  const base = await subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plan)));
  const b64 = a => Buffer.from(a).toString('base64');
  const out = { v: 1, kdf: 'PBKDF2-SHA256', iterations, salt: b64(salt), iv: b64(iv), data: b64(ct), stand: new Date().toISOString().slice(0, 10) };
  const ziel = path.join(__dirname, '..', 'plan.enc.json');
  fs.writeFileSync(ziel, JSON.stringify(out));
  console.log('geschrieben:', ziel, '(' + ct.length + ' Bytes Chiffrat, Stand ' + out.stand + ')');
})();
