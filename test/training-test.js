/* Prueft die freie Trainingsauswahl auf der Seite "Heute".
   Aufruf: node test/training-test.js <Ausgabeordner> */
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
}).listen(8774, '127.0.0.1');

const fail = []; const chk = (b, t) => { if (!b) fail.push(t); };
const heute = new Date();
const wd = heute.getDay();
const morgen = (wd + 1) % 7;

// Testplan: fuenf Einheiten, verteilt wie im echten Plan - eine fuer heute, eine fuer morgen
const PLAN = {
  anker: { plan: heute.toISOString().slice(0, 10) },
  praeparate: [{ id: 'p1', name: 'Testpraeparat', einheit: 'Kps.', phasen: [{ abTag: 0, m: 1 }] }],
  training: {
    woche: {
      [wd]: [{ name: 'Krafttraining (Basic Workout)', dauer: '45 Min.', zone: 'kraft', sportart: 'auto' }],
      [morgen]: [{ name: 'Biken – Grundlage', dauer: '60 Min.', zone: 'AB', sportart: 'auto' }],
      [(wd + 2) % 7]: [{ name: 'EMS Stromtraining', dauer: '20 Min.', zone: 'kraft', sportart: 'auto' }],
      [(wd + 3) % 7]: [{ name: 'Locker: Spaziergang', dauer: '30 Min.', zone: 'A', sportart: 'gehen' }],
      [(wd + 4) % 7]: [{ name: 'Biken oder Berggehen – lang', dauer: '120 Min.', zone: 'AB', sportart: 'auto' }],
    },
  },
};
const TK = heute.getFullYear() + '-' + String(heute.getMonth() + 1).padStart(2, '0') + '-' + String(heute.getDate()).padStart(2, '0');
const WHOOP = { quelle: 'WHOOP', stand: new Date().toISOString(), tage: { [TK]: {
  recovery: 60, workouts: [{ sport: 'cycling', start: new Date().toISOString(), minuten: 52, pulsAvg: 131, pulsMax: 158, km: 24.5 }] } } };

(async () => {
  const b = await chromium.launch();
  const pg = await (await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-AT' })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('http://127.0.0.1:8774/index.html', { waitUntil: 'load' }); await pg.waitForTimeout(300);
  await pg.evaluate(p => localStorage.setItem('gp_plan', JSON.stringify(p)), PLAN);
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(300);

  // 1. Fuer heute Geplantes steht oben, die anderen sind hinter "Anderes Training" erreichbar
  let txt = (await pg.locator('#train-list').innerText()).replace(/\n/g, ' | ');
  console.log('Start:', txt.slice(0, 200));
  chk(/Krafttraining/.test(txt), 'die fuer heute geplante Einheit fehlt');
  chk(/für heute geplant/.test(txt), 'Kennzeichnung "fuer heute geplant" fehlt');
  chk(/Anderes Training eintragen \(4\)/.test(txt), 'Auswahl der uebrigen 4 Einheiten fehlt');
  chk(!/Biken – Grundlage/.test(txt.split('Anderes Training')[0]), 'Einheit eines anderen Tages steht faelschlich oben');

  // 2. Eine Einheit eines anderen Tages hinzufuegen
  await pg.locator('#train-list summary').click(); await pg.waitForTimeout(150);
  await pg.locator('[data-add]').filter({ hasText: 'Biken – Grundlage' }).click(); await pg.waitForTimeout(200);
  txt = (await pg.locator('#train-list').innerText()).replace(/\n/g, ' | ');
  chk(/Biken – Grundlage/.test(txt), 'hinzugefuegte Einheit erscheint nicht');
  chk(/zusätzlich/.test(txt), 'hinzugefuegte Einheit ist nicht als zusaetzlich gekennzeichnet');

  // 3. Abhaken und Minuten eintragen
  await pg.locator('.chk[data-k]').first().click(); await pg.waitForTimeout(150);
  await pg.locator('.tmin').first().fill('45'); await pg.locator('.tmin').first().dispatchEvent('change'); await pg.waitForTimeout(200);
  const st = await pg.evaluate(() => ({ training: log[HEUTE].training, min: log[HEUTE].trainingMin, sport: log[HEUTE].sport, extra: log[HEUTE].trainingExtra }));
  console.log('Gespeichert:', JSON.stringify(st));
  chk(st.sport === true, 'Sport-Kennzeichen nicht gesetzt');
  chk(Object.values(st.training).filter(Boolean).length >= 1, 'nichts als erledigt gespeichert');
  chk(Object.values(st.min).includes(45), 'Minuten nicht gespeichert');
  chk(Object.keys(st.training).every(k => k.startsWith('tr_')), 'Schluessel sind nicht die stabilen Namensschluessel: ' + Object.keys(st.training));

  // 4. Zusaetzliche Einheit wieder entfernen
  await pg.locator('[data-weg]').first().click(); await pg.waitForTimeout(200);
  txt = (await pg.locator('#train-list').innerText()).replace(/\n/g, ' | ');
  chk(!/Biken – Grundlage.*zusätzlich/.test(txt), 'entfernte Einheit steht noch in der Liste');

  // 5. WHOOP-Workout einer Einheit zuordnen
  await pg.evaluate(w => { uebernehmeWhoop(w); renderHeute(); }, WHOOP);
  await pg.waitForTimeout(250);
  txt = (await pg.locator('#train-list').innerText()).replace(/\n/g, ' | ');
  console.log('Mit WHOOP:', txt.slice(txt.indexOf('Von WHOOP'), txt.indexOf('Von WHOOP') + 160));
  chk(/Von WHOOP aufgezeichnet/.test(txt), 'WHOOP-Workout wird nicht angezeigt');
  chk(/cycling/.test(txt) && /52 Min/.test(txt), 'Angaben des Workouts fehlen');
  const sel = pg.locator('[data-wo]').first();
  chk(await sel.count() > 0, 'Zuordnungsfeld fehlt');
  const optId = await pg.evaluate(() => document.querySelector('[data-wo]').options[1].value);
  await sel.selectOption(optId); await pg.waitForTimeout(250);
  const st2 = await pg.evaluate(() => ({ min: log[HEUTE].trainingMin, training: log[HEUTE].training }));
  console.log('Nach Zuordnung:', JSON.stringify(st2));
  chk(Object.values(st2.min).includes(52), 'gemessene Dauer wurde nicht uebernommen');
  chk(st2.training[optId] === true, 'zugeordnete Einheit wurde nicht abgehakt');
  txt = (await pg.locator('#train-list').innerText());
  chk(/bereits eingetragen/.test(txt), 'Hinweis "bereits eingetragen" fehlt nach der Zuordnung');
  await pg.screenshot({ path: OUT + '/training.png', fullPage: true });

  // 6. Alte Daten (Schluessel t0) muessen uebernommen werden
  await pg.evaluate(() => { const e = entry(HEUTE); e.training = { t0: true }; e.trainingMin = { t0: 33 }; delete e.trainingExtra; saveLog(); renderHeute(); });
  await pg.waitForTimeout(200);
  const st3 = await pg.evaluate(() => ({ training: log[HEUTE].training, min: log[HEUTE].trainingMin }));
  console.log('Nach Migration:', JSON.stringify(st3));
  chk(!Object.keys(st3.training).some(k => /^t\d+$/.test(k)), 'alter Schluessel t0 ist noch da');
  chk(Object.values(st3.min).includes(33), 'Minuten aus den alten Daten sind verloren');

  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'keine');
  if (errs.length) fail.push('JS-Fehler auf der Seite');
  console.log(fail.length ? 'FEHLGESCHLAGEN: ' + fail.join(' | ') : 'TRAINING-TEST OK');
  await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
