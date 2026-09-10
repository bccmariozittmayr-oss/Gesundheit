/* Prueft die Seite "Für den Arzt": Kennzahlen, Verlaufskurven, Zeitraumwahl.
   Aufruf: node test/arzt-test.js <Ausgabeordner> */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const http = require('http');
const root = path.join(__dirname, '..');
const OUT = process.argv[2];
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(root, p); if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  r.setHeader('content-type', { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' }[path.extname(f)] || 'text/plain');
  r.end(fs.readFileSync(f));
}).listen(8775, '127.0.0.1');

const fail = []; const chk = (b, t) => { if (!b) fail.push(t); };
const tag = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

// 180 Tage erfundener Verlauf: Gewicht und Fett sinken, Muskeln steigen leicht
const whoopTage = {}, koerperTage = {}, logTage = {};
for (let i = 180; i >= 0; i--) {
  const k = tag(i), f = (180 - i) / 180;
  whoopTage[k] = {
    recovery: Math.round(50 + 20 * f + (i % 7) - 3), hrv: Math.round(30 + 10 * f), ruhepuls: Math.round(58 - 6 * f),
    strain: Math.round((8 + 4 * Math.sin(i / 3)) * 10) / 10,
    schlaf: { stunden: Math.round((6.5 + f * 0.8) * 100) / 100, tief: 1.4, rem: 1.6, leistung: 80, atemfrequenz: 15.2 },
    workouts: i % 3 === 0 ? [{ sport: 'cycling', start: new Date().toISOString(), minuten: 45, pulsAvg: 130 }] : [],
  };
  if (i % 2 === 0) koerperTage[k] = {
    gewicht: Math.round((89 - 3 * f) * 100) / 100, fettAnteil: Math.round((19.5 - 2.3 * f) * 10) / 10,
    muskelmasse: Math.round((66 + 1.8 * f) * 100) / 100, wasserAnteil: Math.round((54 + 3 * f) * 10) / 10,
    knochenmasse: 3.55,
  };
  logTage[k] = { hals: i % 9 === 0 ? 1 : 0, bauch: i % 13 === 0 ? 2 : 0, stress: 4 + (i % 4), schlaf: 7, gewicht: null,
    notiz: i % 30 === 0 ? 'Testnotiz Tag ' + i : '', meds: { a_m: true, b_m: i % 5 !== 0 }, atmen: {},
    training: i % 3 === 0 ? { tr_test: true } : {}, trainingMin: i % 3 === 0 ? { tr_test: 45 } : {} };
}
const PLAN = { anker: { plan: tag(180) }, praeparate: [{ id: 'a', name: 'A', phasen: [{ abTag: 0, m: 1 }] }] };

(async () => {
  const b = await chromium.launch();
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-AT' })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('http://127.0.0.1:8775/index.html', { waitUntil: 'load' }); await pg.waitForTimeout(300);
  await pg.evaluate(d => {
    localStorage.setItem('gp_plan', JSON.stringify(d.plan));
    localStorage.setItem('gp_log', JSON.stringify(d.log));
    localStorage.setItem('gp_whoop', JSON.stringify({ quelle: 'WHOOP', stand: new Date().toISOString(), tage: d.whoop }));
    localStorage.setItem('gp_koerper', JSON.stringify({ quelle: 'Withings', stand: new Date().toISOString(), tage: d.koerper }));
  }, { plan: PLAN, log: logTage, whoop: whoopTage, koerper: koerperTage });
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(400);

  await pg.locator('nav button[data-p=verlauf]').click(); await pg.waitForTimeout(200);
  await pg.locator('.tabs button[data-sub=arzt]').click(); await pg.waitForTimeout(400);

  const txt = (await pg.locator('#arzt').innerText()).replace(/\n/g, ' | ');
  console.log('Auszug:', txt.slice(0, 300));

  // die vier geforderten Bloecke
  ['Körper und Kreislauf', 'Schlaf und Erholung', 'Therapietreue und Beschwerden', 'Training und Belastung']
    .forEach(t => chk(txt.includes(t), 'Block fehlt: ' + t));

  // Kennzahlen und Kurven
  const kurven = await pg.locator('#arzt svg').count();
  console.log('Verlaufskurven:', kurven, '| Kennzahlen-Kacheln:', await pg.locator('#arzt .stat > div').count());
  chk(kurven >= 6, 'zu wenige Verlaufskurven (' + kurven + ')');
  chk(await pg.locator('#arzt .stat > div').count() >= 16, 'zu wenige Kennzahlen');
  chk(/Gewicht/.test(txt) && /Körperfett/.test(txt) && /Muskeln/.test(txt), 'Koerperwerte fehlen');
  chk(/Ruhepuls/.test(txt) && /HRV/.test(txt), 'Kreislaufwerte fehlen');
  chk(/Supplements genommen/.test(txt), 'Therapietreue fehlt');
  chk(/Einheiten je Woche/.test(txt), 'Trainingshaeufigkeit fehlt');
  chk(/Testnotiz/.test(txt), 'Notizen fehlen');
  chk(/kein ärztlicher Befund/.test(txt), 'Hinweis zur Einordnung fehlt');

  // Richtungspfeile: Gewicht runter, Muskeln rauf
  chk(/▼/.test(txt), 'kein Abwaertspfeil (Gewicht sollte sinken)');
  chk(/▲/.test(txt), 'kein Aufwaertspfeil (Muskeln sollten steigen)');

  await pg.screenshot({ path: OUT + '/arzt-90.png', fullPage: true });

  // Zeitraum umschalten
  await pg.locator('#arzt-zeitraum button[data-tage="30"]').click(); await pg.waitForTimeout(300);
  const t30 = await pg.locator('#arzt').innerText();
  chk(/30 Tage/.test(t30), 'Zeitraum 30 Tage wirkt nicht');
  await pg.locator('#arzt-zeitraum button[data-tage="180"]').click(); await pg.waitForTimeout(300);
  const t180 = await pg.locator('#arzt').innerText();
  chk(/180 Tage/.test(t180), 'Zeitraum 180 Tage wirkt nicht');
  chk(t30 !== t180, 'Zeitraumwechsel aendert die Auswertung nicht');
  await pg.screenshot({ path: OUT + '/arzt-180.png', fullPage: true });

  // ohne Daten darf nichts abstuerzen
  await pg.evaluate(() => { localStorage.clear(); });
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(300);
  await pg.locator('nav button[data-p=verlauf]').click(); await pg.waitForTimeout(150);
  await pg.locator('.tabs button[data-sub=arzt]').click(); await pg.waitForTimeout(300);
  chk((await pg.locator('#arzt').innerText()).length > 0, 'ohne Daten bleibt die Seite leer');

  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'keine');
  if (errs.length) fail.push('JS-Fehler auf der Seite');
  console.log(fail.length ? 'FEHLGESCHLAGEN: ' + fail.join(' | ') : 'ARZT-TEST OK');
  await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
