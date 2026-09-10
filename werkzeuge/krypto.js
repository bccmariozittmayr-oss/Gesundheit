/* Gemeinsame Verschluesselung fuer die Zusatzdaten der Gesundheits-App (WHOOP, Withings).

   Verfahren wie in plan-verschluesseln.js: AES-256-GCM, Schluessel per PBKDF2 aus dem
   Plan-Passwort. Salt und Iterationszahl werden aus plan.enc.json uebernommen - so oeffnet
   die App alle Dateien mit EINEM Schluessel, den sie beim Entsperren des Plans ableitet.

   Liegt bewusst als eigenes Modul vor: sonst gaebe es die Krypto in jedem Abholwerkzeug
   erneut, und eine Aenderung an einer Stelle wuerde die App fuer die andere Datei aussperren. */
const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');

async function verschluesseln(klartext, pwPfad, root, zielName) {
  const subtle = webcrypto.subtle;
  const enc = new TextEncoder();
  const pw = fs.readFileSync(pwPfad, 'utf8').trim();
  if (pw.length < 12) throw new Error('Passwort zu kurz');
  const planEnc = path.join(root, 'plan.enc.json');
  if (!fs.existsSync(planEnc)) throw new Error('plan.enc.json fehlt – zuerst den Plan verschlüsseln');
  const p = JSON.parse(fs.readFileSync(planEnc, 'utf8'));
  const salt = Buffer.from(p.salt, 'base64');
  const iterations = p.iterations;
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const base = await subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(klartext)));
  const b64 = a => Buffer.from(a).toString('base64');
  const ziel = path.join(root, zielName);
  fs.writeFileSync(ziel, JSON.stringify({
    v: 1, kdf: 'PBKDF2-SHA256', iterations, salt: p.salt,
    iv: b64(iv), data: b64(ct), stand: new Date().toISOString(),
  }));
  return ziel;
}

module.exports = { verschluesseln };
