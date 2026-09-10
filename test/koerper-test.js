/* Prueft die Anzeige der Withings-Waagenwerte in der App.
   Aufruf: node test/koerper-test.js <Ausgabeordner> */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const http = require('http');
const root = path.join(__dirname, '..');
const OUT = process.argv[2];
const plan = fs.readFileSync(process.argv[3] || path.join(root, 'mein-plan.beispiel.json'), 'utf8');
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(root, p); if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  const t = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }[path.extname(f)] || 'text/plain';
  r.setHeader('content-type', t); r.end(fs.readFileSync(f));
}).listen(8769, '127.0.0.1');

const fail = []; const chk = (b, t) => { if (!b) fail.push(t); };
const tag = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

// Testwerte: heute, gestern und vor 30 Tagen - damit auch der Trend geprueft wird
const DATEN = { quelle: 'Withings', stand: new Date().toISOString(), benutzer: 1, tage: {
  [tag(30)]: { zeit: new Date().toISOString(), gewicht: 88.5, fettAnteil: 19.0, muskelmasse: 66.0, wasser: 48.0, wasserAnteil: 54.2, knochenmasse: 3.5, fettMasse: 16.8, magermasse: 71.7, muskelAnteil: 74.6 },
  [tag(1)]: { zeit: new Date().toISOString(), gewicht: 86.6, fettAnteil: 17.5, muskelmasse: 67.2, wasser: 49.0, wasserAnteil: 56.6, knochenmasse: 3.55, fettMasse: 15.2, magermasse: 71.4, muskelAnteil: 77.6 },
  [tag(0)]: { zeit: new Date().toISOString(), gewicht: 86.1, fettAnteil: 17.2, muskelmasse: 67.7, wasser: 49.3, wasserAnteil: 57.3, knochenmasse: 3.56, fettMasse: 14.8, magermasse: 71.3, muskelAnteil: 78.6 },
} };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'de-AT' });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('http://127.0.0.1:8769/index.html', { waitUntil: 'load' }); await pg.waitForTimeout(300);
  await pg.evaluate(p => localStorage.setItem('gp_plan', p), plan);
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(300);

  // ohne Daten darf keine leere Karte stehenbleiben
  chk((await pg.locator('#koerper-card').innerText()).trim() === '', 'Karte ist ohne Daten nicht leer');

  // Werte einspielen, wie es die entschluesselte Datei tun wuerde
  await pg.evaluate(d => { uebernehmeKoerper(d); renderHeute(); }, DATEN);
  await pg.waitForTimeout(200);
  const karte = (await pg.locator('#koerper-card').innerText()).replace(/\n/g, ' | ');
  console.log('Karte:', karte.slice(0, 260));
  chk(/86,1 kg/.test(karte), 'Gewicht fehlt in der Karte');
  chk(/17,2 %/.test(karte), 'Koerperfett fehlt');
  chk(/67,7 kg/.test(karte), 'Muskelmasse fehlt');
  chk(/57,3 %/.test(karte), 'Wasseranteil fehlt');
  chk(/heute/.test(karte), 'Kennzeichnung "heute" fehlt');
  chk(/-2,4 kg/.test(karte), 'Trend Gewicht (-2,4 kg gegenueber vor 30 Tagen) fehlt');
  chk(/-1,8 %/.test(karte), 'Trend Koerperfett fehlt');
  chk(/\+1,7 kg/.test(karte), 'Trend Muskeln fehlt');

  // Aufklappbare Einzelwerte
  await pg.locator('#koerper-card summary').click(); await pg.waitForTimeout(150);
  const det = (await pg.locator('#koerper-card').innerText()).replace(/\n/g, ' | ');
  chk(/Knochenmasse/.test(det), 'Knochenmasse fehlt in der Detailansicht');
  chk(/Magermasse/.test(det), 'Magermasse fehlt in der Detailansicht');
  await pg.screenshot({ path: OUT + '/koerper-heute.png', fullPage: true });

  // Gewicht muss im Tagesprotokoll gelandet sein
  const g = await pg.evaluate(() => (log[HEUTE] || {}).gewicht);
  console.log('Gewicht im Protokoll:', g);
  chk(g === 86.1, 'Gewicht nicht ins Tagesprotokoll uebernommen (ist: ' + g + ')');

  // Handeingabe muss gewinnen
  await pg.evaluate(d => { const e = entry(HEUTE); e.gewicht = 90; e.auto.gewicht = false; saveLog(); koerperInsProtokoll(HEUTE); }, DATEN);
  const g2 = await pg.evaluate(() => log[HEUTE].gewicht);
  chk(g2 === 90, 'Handeingabe wurde ueberschrieben (ist: ' + g2 + ')');

  // Verlaufsseite
  await pg.locator('nav button[data-p=verlauf]').click(); await pg.waitForTimeout(250);
  const verl = (await pg.locator('#koerper-verlauf').innerText()).replace(/\n/g, ' | ');
  console.log('Verlauf:', verl.slice(0, 200));
  chk(/3 Messtage/.test(verl), 'Anzahl Messtage fehlt im Verlauf');
  chk(/86,1 kg/.test(verl), 'letzter Wert fehlt im Verlauf');
  chk(/88,5/.test(verl), 'hoechstes Gewicht fehlt im Verlauf');
  await pg.screenshot({ path: OUT + '/koerper-verlauf.png', fullPage: true });

  // Mehr-Seite
  await pg.locator('nav button[data-p=mehr]').click(); await pg.waitForTimeout(250);
  const mehr = await pg.locator('#koerper-status').innerText();
  console.log('Mehr:', mehr);
  chk(/3 Messtage geladen/.test(mehr), 'Statuszeile auf der Mehr-Seite stimmt nicht');

  // Messung mit unsicherer Zuordnung muss gekennzeichnet werden
  await pg.evaluate(d => { const k = Object.keys(d.tage).sort().pop(); const kopie = JSON.parse(JSON.stringify(d));
    kopie.tage[k].zuordnungUnsicher = true; kopie.stand = new Date(Date.now() + 1000).toISOString();
    uebernehmeKoerper(kopie); renderHeute(); }, DATEN);
  await pg.locator('nav button[data-p=heute]').click(); await pg.waitForTimeout(200);
  chk(/nicht eindeutig/.test(await pg.locator('#koerper-card').innerText()), 'Warnung bei unsicherer Zuordnung fehlt');

  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'keine');
  if (errs.length) fail.push('JS-Fehler auf der Seite');
  console.log(fail.length ? 'FEHLGESCHLAGEN: ' + fail.join(' | ') : 'KOERPER-TEST OK');
  await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
