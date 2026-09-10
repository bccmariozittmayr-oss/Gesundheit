/* Prueft, dass ein abgelaufener Zugang GENAU EINMAL erneuert wird, auch wenn mehrere
   Abfragen gleichzeitig laufen.

   Hintergrund (10.09.2026): whoop-abholen.js startet fuenf Abfragen parallel (Promise.all).
   Jede holte sich ihr eigenes Token. War der Zugang abgelaufen, gingen fuenf gleichzeitige
   Erneuerungen mit demselben Refresh-Token raus. WHOOP entwertet bei jeder Erneuerung den
   alten Token - eine gewinnt, vier scheitern, und der gueltige Token geht dabei verloren.
   Der Zugang war danach tot und musste von Hand neu angemeldet werden. Zweimal passiert.

   Der Test faehrt einen kleinen Ersatzserver hoch, der wie WHOOP arbeitet: jeder
   Refresh-Token laesst sich nur EINMAL einloesen. Kommt die Erneuerung mehrfach, faellt
   der Test durch.

   Aufruf: node test/token-test.js */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PORT = 8771;
const ROOT = path.join(__dirname, '..');
const fail = [];
let refreshAnfragen = 0;
let gueltigerRefresh = 'start-token';

const srv = http.createServer((q, r) => {
  let body = '';
  q.on('data', c => body += c);
  q.on('end', () => {
    const p = new URLSearchParams(body);
    const antwort = (code, obj) => { r.statusCode = code; r.setHeader('content-type', 'application/json'); r.end(JSON.stringify(obj)); };
    if (q.url.includes('/token')) {
      refreshAnfragen++;
      if (p.get('refresh_token') !== gueltigerRefresh) // wie bei WHOOP: alter Token ist entwertet
        return antwort(400, { error: 'invalid_request', error_description: 'refresh token already used' });
      gueltigerRefresh = 'token-' + refreshAnfragen;
      return antwort(200, { access_token: 'zugang-' + refreshAnfragen, refresh_token: gueltigerRefresh, expires_in: 3600 });
    }
    // alle Datenabfragen liefern leere, aber gueltige Sammlungen
    antwort(200, q.url.includes('measurement') ? { height_meter: 1.8, weight_kilogram: 80, max_heart_rate: 190 } : { records: [], next_token: null });
  });
}).listen(PORT, '127.0.0.1');

(async () => {
  // Werkzeug auf den Ersatzserver umbiegen und mit abgelaufenem Token starten
  const quelle = fs.readFileSync(path.join(ROOT, 'werkzeuge', 'whoop-abholen.js'), 'utf8');
  const arbeitsordner = fs.mkdtempSync(path.join(os.tmpdir(), 'token-test-'));
  const werkzeuge = path.join(arbeitsordner, 'werkzeuge');
  fs.mkdirSync(werkzeuge);
  fs.copyFileSync(path.join(ROOT, 'werkzeuge', 'krypto.js'), path.join(werkzeuge, 'krypto.js'));
  fs.writeFileSync(path.join(werkzeuge, 'whoop-abholen.js'), quelle
    .split('https://api.prod.whoop.com/developer/v2').join(`http://127.0.0.1:${PORT}/developer/v2`)
    .split('https://api.prod.whoop.com/oauth/oauth2/token').join(`http://127.0.0.1:${PORT}/oauth/oauth2/token`));
  fs.writeFileSync(path.join(arbeitsordner, '.env'),
    ['WHOOP_CLIENT_ID=test', 'WHOOP_CLIENT_SECRET=test', 'WHOOP_DATEN_ORDNER=' + path.join(arbeitsordner, 'daten').split('\\').join('/')].join('\n'));
  fs.writeFileSync(path.join(arbeitsordner, '.whoop-token.json'),
    JSON.stringify({ access_token: 'alt', refresh_token: 'start-token', gueltig_bis: Date.now() - 60000 }));

  let ausgabe = '';
  try {
    ausgabe = execFileSync(process.execPath, [path.join(werkzeuge, 'whoop-abholen.js'), 'holen', '--tage', '3'],
      { cwd: arbeitsordner, stdio: 'pipe' }).toString();
  } catch (e) {
    ausgabe = ((e.stdout || '') + (e.stderr || '')).toString();
    fail.push('Abruf ist fehlgeschlagen');
  }
  if(process.env.LAUT)console.log('--- Ausgabe des Werkzeugs ---'+String.fromCharCode(10)+ausgabe);
  console.log('Erneuerungs-Anfragen an den Ersatzserver:', refreshAnfragen, '(erwartet: 1)');
  if (refreshAnfragen !== 1) fail.push('Zugang wurde ' + refreshAnfragen + '-mal gleichzeitig erneuert statt einmal');
  if (/lässt sich nicht erneuern/.test(ausgabe)) fail.push('Werkzeug meldet abgelaufenen Zugang');

  // der zuletzt vergebene Token muss auch gespeichert sein
  const gespeichert = JSON.parse(fs.readFileSync(path.join(arbeitsordner, '.whoop-token.json'), 'utf8'));
  if (gespeichert.refresh_token !== gueltigerRefresh) fail.push('gespeicherter Refresh-Token ist nicht der gueltige');

  fs.rmSync(arbeitsordner, { recursive: true, force: true });
  console.log(fail.length ? 'FEHLGESCHLAGEN: ' + fail.join(' | ') : 'TOKEN-TEST OK');
  srv.close();
  process.exit(fail.length ? 1 : 0);
})();
