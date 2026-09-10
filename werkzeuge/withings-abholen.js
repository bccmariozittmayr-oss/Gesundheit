/* Holt die Waagenwerte von Withings (Gewicht und Koerperzusammensetzung) und legt sie fuer die App ab.

   Aufruf:
     node werkzeuge/withings-abholen.js anmelden       einmalig: Browser oeffnet sich, Withings-Zugriff freigeben
     node werkzeuge/withings-abholen.js holen [--tage 180] [--dry-run] [--push] [--log] [--unsichere]
                                                      Werte abholen, withings.json schreiben,
                                                      optional withings.enc.json + Git-Push
     node werkzeuge/withings-abholen.js status         zeigt, ob Anmeldung und Konfiguration passen (nur lesen)

   Mehrere Personen auf einer Waage:
     Die Waage ordnet jede Messung selbst einer Person zu. Withings liefert dazu ein Merkmal
     ("attrib"): sicher zugeordnet, mehrdeutig oder von Hand eingetragen. Mehrdeutige Messungen
     - die also auch einer anderen Person im Haushalt gehoeren koennen - werden hier NICHT
     uebernommen, sondern nur gezaehlt und gemeldet. Lieber ein Tag ohne Wert als ein fremder
     Wert im eigenen Verlauf. Mit --unsichere werden sie zusaetzlich uebernommen und markiert.

   Ablage:
     .env                  Client-ID/Secret (lokal, nie ins Repo)
     .withings-token.json  Zugangs-Token (lokal, nie ins Repo, nie in OneDrive)
     <Datenordner>/withings.json  Klartext-Werte, privat (OneDrive neben mein-plan.json)
     withings.enc.json     AES-verschluesselt, gleiches Passwort und Salt wie plan.enc.json - darf ins Repo.

   Keine Fremdbibliotheken, laeuft mit Node 18+. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { randomBytes } = require('crypto');
const { execFileSync } = require('child_process');
const { verschluesseln } = require('./krypto');

const ROOT = path.join(__dirname, '..');
const ENV_PFAD = path.join(ROOT, '.env');
const TOKEN_PFAD = path.join(ROOT, '.withings-token.json');
const API = 'https://wbsapi.withings.net';
const AUTH_URL = 'https://account.withings.com/oauth2_user/authorize2';
const TOKEN_URL = API + '/v2/oauth2';
const PORT = 8768;
const SCOPES = 'user.metrics';
// Rueckleitungsadresse - muss ZEICHENGENAU mit der im Withings-Dashboard hinterlegten
// Callback-URL uebereinstimmen, sonst kommt "redirect_uri_mismatch".
//
// Bevorzugt wird der direkte Weg auf den eigenen Rechner: dann laeuft der Anmeldecode
// ueber niemanden sonst. Withings markiert eine App mit localhost-Adresse zwar als
// "eingeschraenkt", fuer den Zugriff auf die eigenen Daten reicht das.
// Geht es damit nicht, kann in der .env auf die oeffentliche Zwischenseite umgestellt
// werden (withings-callback.html auf GitHub Pages, die an den lokalen Server weiterleitet):
//   WITHINGS_REDIRECT=https://bccmariozittmayr-oss.github.io/Gesundheit/withings-callback.html
const REDIRECT_STANDARD = `http://localhost:${PORT}/callback`;

// ---------- Konfiguration ----------
function ladeEnv() {
  const env = {};
  if (fs.existsSync(ENV_PFAD)) {
    for (const zeile of fs.readFileSync(ENV_PFAD, 'utf8').split(/\r?\n/)) {
      const m = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !zeile.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  for (const k of Object.keys(process.env)) if (/^WITHINGS_|^WHOOP_/.test(k) && !env[k]) env[k] = process.env[k];
  return env;
}
const ENV = ladeEnv();
// Datenordner und Passwortdatei teilen sich beide Anbindungen - es ist derselbe private Ordner.
const DATEN_ORDNER = ENV.WITHINGS_DATEN_ORDNER || ENV.WHOOP_DATEN_ORDNER;
const PASSWORT_DATEI = ENV.WITHINGS_PASSWORT_DATEI || ENV.WHOOP_PASSWORT_DATEI;
const REDIRECT = ENV.WITHINGS_REDIRECT || REDIRECT_STANDARD;
function brauche(k) {
  if (!ENV[k]) { console.error(`Fehlt: ${k} in .env`); process.exit(1); }
  return ENV[k];
}

// ---------- Protokoll ----------
function logDateiAn() {
  const datei = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'messwerte-abruf.log');
  const schreib = (art, args) => {
    const zeit = new Date().toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const txt = zeit + ' [Withings]' + (art === 'err' ? ' FEHLER ' : ' ') + args.map(a => typeof a === 'string' ? a : require('util').inspect(a)).join(' ') + String.fromCharCode(10);
    try { fs.appendFileSync(datei, txt); } catch (e) { /* Log darf den Lauf nie stoppen */ }
  };
  const log = console.log.bind(console), err = console.error.bind(console);
  console.log = (...a) => { schreib('log', a); log(...a); };
  console.error = (...a) => { schreib('err', a); err(...a); };
}

// ---------- Token ----------
function ladeToken() { return fs.existsSync(TOKEN_PFAD) ? JSON.parse(fs.readFileSync(TOKEN_PFAD, 'utf8')) : null; }
function speichereToken(t) {
  t.gueltig_bis = Date.now() + (t.expires_in || 10800) * 1000 - 60000;
  fs.writeFileSync(TOKEN_PFAD, JSON.stringify(t, null, 1));
}
// Withings antwortet immer mit HTTP 200 und packt den echten Zustand in das Feld "status".
// 0 = in Ordnung, alles andere ist ein Fehler - deshalb wird hier beides geprueft.
async function anfrage(url, form, versuch = 1) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form),
  });
  const txt = await r.text();
  if (r.status >= 500 && versuch < 3) {
    console.error(`Withings antwortet mit ${r.status} – Versuch ${versuch + 1} von 3 in 5 Sekunden …`);
    await new Promise(s => setTimeout(s, 5000));
    return anfrage(url, form, versuch + 1);
  }
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}: ${txt.slice(0, 300)}`);
  let j;
  try { j = JSON.parse(txt); } catch (e) { throw new Error('Antwort ist kein JSON: ' + txt.slice(0, 200)); }
  if (j.status !== 0) throw new Error(`Withings meldet Status ${j.status}${j.error ? ': ' + j.error : ''}`);
  return j.body;
}
async function tokenAnfrage(form) {
  return anfrage(TOKEN_URL, {
    action: 'requesttoken',
    client_id: brauche('WITHINGS_CLIENT_ID'),
    client_secret: brauche('WITHINGS_CLIENT_SECRET'),
    ...form,
  });
}
async function gueltigesToken() {
  const t = ladeToken();
  if (!t) { console.error('Noch nicht angemeldet. Zuerst: node werkzeuge/withings-abholen.js anmelden'); process.exit(1); }
  if (Date.now() < (t.gueltig_bis || 0)) return t.access_token;
  if (!t.refresh_token) { console.error('Token abgelaufen und kein Refresh-Token vorhanden. Bitte neu anmelden.'); process.exit(1); }
  let neu;
  try {
    neu = await tokenAnfrage({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
  } catch (e) {
    console.error('Der Withings-Zugang ist abgelaufen und lässt sich nicht erneuern.');
    console.error('Einmal am Laptop ausführen:  node werkzeuge/withings-abholen.js anmelden');
    console.error('(technische Meldung: ' + e.message + ')');
    process.exit(2);
  }
  if (!neu.refresh_token) neu.refresh_token = t.refresh_token;
  if (neu.userid == null && t.userid != null) neu.userid = t.userid;
  speichereToken(neu);
  return neu.access_token;
}

// ---------- Anmelden ----------
async function anmelden() {
  const clientId = brauche('WITHINGS_CLIENT_ID'); brauche('WITHINGS_CLIENT_SECRET');
  const state = randomBytes(12).toString('hex');
  const url = `${AUTH_URL}?${new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: REDIRECT, scope: SCOPES, state })}`;
  await new Promise((resolve, reject) => {
    const srv = http.createServer(async (req, res) => {
      const u = new URL(req.url, `http://localhost:${PORT}`);
      if (u.pathname !== '/callback') { res.statusCode = 404; return res.end(); }
      const antwort = (text) => { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(`<meta charset="utf-8"><body style="font-family:sans-serif;padding:40px"><h2>${text}</h2><p>Dieses Fenster kann geschlossen werden.</p></body>`); };
      try {
        if (u.searchParams.get('state') !== state) throw new Error('state stimmt nicht – Anmeldung abgebrochen');
        if (u.searchParams.get('error')) throw new Error(u.searchParams.get('error_description') || u.searchParams.get('error'));
        const code = u.searchParams.get('code'); if (!code) throw new Error('kein Code erhalten');
        const t = await tokenAnfrage({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT });
        speichereToken(t);
        antwort('Withings verbunden ✓');
        console.log('Angemeldet als Withings-Benutzer ' + (t.userid ?? '(unbekannt)') + '. Token liegt in ' + TOKEN_PFAD + ' (bleibt lokal).');
        srv.close(); try { fs.unlinkSync(path.join(ROOT, '.withings-login-url.txt')); } catch (e) {} resolve();
      } catch (e) { antwort('Fehlgeschlagen: ' + e.message); srv.close(); reject(e); }
    }).listen(PORT, '127.0.0.1', () => {
      console.log('Browser öffnet sich – bei Withings anmelden und den Zugriff bestätigen.');
      console.log('WICHTIG: mit dem Withings-Konto anmelden, unter dem DEIN Profil auf der Waage läuft.');
      console.log('Falls kein Browser aufgeht: Adresse steht in der Datei .withings-login-url.txt (lokal).');
      fs.writeFileSync(path.join(ROOT, '.withings-login-url.txt'), url);
      try { execFileSync('rundll32', ['url.dll,FileProtocolHandler', url], { stdio: 'ignore' }); } catch (e) { /* Adresse steht oben */ }
    });
  });
}

// ---------- Messwerte ----------
// Withings-Messtypen. Der echte Wert ist value * 10^unit.
const TYPEN = {
  1: ['gewicht', 'kg'],
  4: ['groesse', 'm'],
  5: ['magermasse', 'kg'],      // fettfreie Masse
  6: ['fettAnteil', '%'],
  8: ['fettMasse', 'kg'],
  9: ['blutdruckDia', 'mmHg'],
  10: ['blutdruckSys', 'mmHg'],
  11: ['puls', '/min'],
  76: ['muskelmasse', 'kg'],
  77: ['wasser', 'kg'],         // Withings nennt das "Hydration"
  88: ['knochenmasse', 'kg'],
};
// Zuordnung einer Messung zu einer Person (Feld "attrib" bei Withings)
const ZUORDNUNG = {
  0: 'sicher',        // vom Geraet erfasst und eindeutig diesem Benutzer zugeordnet
  1: 'mehrdeutig',    // vom Geraet erfasst, koennte auch einer anderen Person gehoeren
  2: 'von Hand',      // manuell eingetragen
  4: 'von Hand',      // manuell bei der Einrichtung eingetragen
  5: 'sicher',
  7: 'sicher',
  8: 'sicher',
};

const r1 = x => x == null ? null : Math.round(x * 10) / 10;
const r2 = x => x == null ? null : Math.round(x * 100) / 100;

// Zeitzonenversatz der Withings-Antwort in Sekunden, damit eine Abendmessung
// nicht auf den Folgetag rutscht.
function versatzSekunden(tz) {
  try {
    const teil = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(new Date()).find(p => p.type === 'timeZoneName');
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(teil ? teil.value : '');
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 3600 + Number(m[3]) * 60) : 0;
  } catch (e) { return 0; }
}
const lokalesDatum = (unix, versatz) => new Date((unix + versatz) * 1000).toISOString().slice(0, 10);

async function holen(tage, dryRun, push, mitUnsicheren) {
  if (!DATEN_ORDNER) { console.error('Fehlt: WHOOP_DATEN_ORDNER (oder WITHINGS_DATEN_ORDNER) in .env'); process.exit(1); }
  const tok = await gueltigesToken();
  const bis = Math.floor(Date.now() / 1000);
  const von = bis - tage * 86400;
  console.log(`Hole Withings-Werte der letzten ${tage} Tage …`);
  const body = await anfrage(API + '/measure', {
    action: 'getmeas',
    meastypes: Object.keys(TYPEN).join(','),
    category: 1,           // 1 = echte Messungen, 2 = Zielwerte
    startdate: von,
    enddate: bis,
    access_token: tok,
  });
  const gruppen = body.measuregrps || [];
  const versatz = versatzSekunden(body.timezone);

  const tageMap = {};
  const zaehler = { sicher: 0, mehrdeutig: 0, 'von Hand': 0, unbekannt: 0 };
  for (const g of gruppen.slice().sort((a, b) => a.date - b.date)) { // aufsteigend: die spaetere Messung am selben Tag gewinnt
    const art = ZUORDNUNG[g.attrib] || 'unbekannt';
    zaehler[art] = (zaehler[art] || 0) + 1;
    if (art === 'mehrdeutig' && !mitUnsicheren) continue; // koennte eine andere Person im Haushalt sein
    const k = lokalesDatum(g.date, versatz);
    const t = tageMap[k] = tageMap[k] || {};
    t.zeit = new Date(g.date * 1000).toISOString();
    if (art === 'mehrdeutig') t.zuordnungUnsicher = true;
    if (art === 'von Hand') t.vonHand = true;
    for (const m of g.measures || []) {
      const def = TYPEN[m.type]; if (!def) continue;
      const wert = m.value * Math.pow(10, m.unit);
      t[def[0]] = def[1] === '%' ? r1(wert) : r2(wert);
    }
  }
  // Werte, die Withings nicht selbst mitliefert
  for (const t of Object.values(tageMap)) {
    if (t.muskelmasse == null && t.magermasse != null && t.knochenmasse != null) t.muskelmasse = r2(t.magermasse - t.knochenmasse);
    if (t.wasser != null && t.gewicht) t.wasserAnteil = r1(t.wasser / t.gewicht * 100);
    if (t.muskelmasse != null && t.gewicht) t.muskelAnteil = r1(t.muskelmasse / t.gewicht * 100);
  }

  const keys = Object.keys(tageMap).sort();
  console.log(`${gruppen.length} Messungen (${zaehler.sicher} sicher zugeordnet, ${zaehler.mehrdeutig} mehrdeutig, ${zaehler['von Hand']} von Hand) → ${keys.length} Tage mit Werten.`);
  if (zaehler.mehrdeutig && !mitUnsicheren)
    console.log(`Hinweis: ${zaehler.mehrdeutig} mehrdeutige Messungen übersprungen – die Waage konnte sie nicht eindeutig dir zuordnen. Mit --unsichere werden sie übernommen und markiert.`);
  if (!keys.length) console.log('Keine eindeutig zugeordneten Messungen im Zeitraum.');
  else {
    const l = tageMap[keys[keys.length - 1]];
    console.log(`Letzter Tag ${keys[keys.length - 1]}: Gewicht ${l.gewicht ?? '–'} kg · Fett ${l.fettAnteil ?? '–'} % · Muskeln ${l.muskelmasse ?? '–'} kg · Wasser ${l.wasser ?? '–'} kg · Knochen ${l.knochenmasse ?? '–'} kg`);
  }
  if (dryRun) { console.log('Dry-Run: nichts geschrieben.'); return; }

  const zielKlartext = path.join(DATEN_ORDNER, 'withings.json');
  let alt = {};
  if (fs.existsSync(zielKlartext)) { try { alt = JSON.parse(fs.readFileSync(zielKlartext, 'utf8')).tage || {}; } catch (e) { alt = {}; } }
  const daten = {
    quelle: 'Withings', stand: new Date().toISOString(), benutzer: (ladeToken() || {}).userid ?? null,
    tage: Object.fromEntries(Object.entries({ ...alt, ...tageMap }).sort()),
  };
  fs.mkdirSync(DATEN_ORDNER, { recursive: true });
  fs.writeFileSync(zielKlartext, JSON.stringify(daten, null, 1));
  console.log('geschrieben:', zielKlartext, `(gesamt ${Object.keys(daten.tage).length} Tage)`);

  if (!PASSWORT_DATEI) { console.log('Hinweis: WHOOP_PASSWORT_DATEI nicht gesetzt – keine withings.enc.json für die App erzeugt.'); return; }
  const ziel = await verschluesseln(JSON.stringify(daten), PASSWORT_DATEI, ROOT, 'withings.enc.json');
  console.log('geschrieben:', ziel);
  if (!push) return;
  const g = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
  if (!g('status', '--porcelain', '--', 'withings.enc.json')) { console.log('Git: keine Änderung.'); return; }
  const zweig = g('rev-parse', '--abbrev-ref', 'HEAD');
  let upstream = null;
  try { upstream = g('rev-parse', '--abbrev-ref', '@{u}'); } catch (e) { /* kein Upstream */ }
  g('add', 'withings.enc.json');
  g('commit', '-m', 'Withings-Werte ' + daten.stand.slice(0, 10) + ' (verschlüsselt)');
  if (!upstream) {
    console.error('Git: auf Zweig "' + zweig + '" committet, aber NICHT gepusht – dieser Zweig hat kein Gegenstück am Server.');
    return;
  }
  try { g('push'); console.log('Git: withings.enc.json committet und nach ' + upstream + ' gepusht.'); }
  catch (e) { console.error('Git: committet, aber Push fehlgeschlagen (' + ((e.stderr || '').toString().trim().split(String.fromCharCode(10))[0] || e.message) + '). Beim nächsten Lauf geht es mit.'); }
}

// ---------- Status ----------
function status() {
  const ok = (b, t) => console.log((b ? '  ✓ ' : '  ✗ ') + t);
  console.log('Withings-Anbindung:');
  ok(fs.existsSync(ENV_PFAD), '.env vorhanden');
  ok(!!ENV.WITHINGS_CLIENT_ID && !!ENV.WITHINGS_CLIENT_SECRET, 'Client-ID und Secret gesetzt');
  ok(!!DATEN_ORDNER && fs.existsSync(DATEN_ORDNER || ''), 'Datenordner vorhanden');
  ok(!!PASSWORT_DATEI && fs.existsSync(PASSWORT_DATEI || ''), 'Passwortdatei vorhanden (für withings.enc.json)');
  const t = ladeToken(); ok(!!t, 'angemeldet (Token vorhanden)');
  if (t) console.log('    Withings-Benutzer ' + (t.userid ?? '?') + ', Token ' + (Date.now() < t.gueltig_bis ? 'gültig' : 'abgelaufen, wird beim nächsten Abruf erneuert') + (t.refresh_token ? '' : ' – KEIN Refresh-Token, Neuanmeldung nötig'));
  const wj = DATEN_ORDNER && path.join(DATEN_ORDNER, 'withings.json');
  if (wj && fs.existsSync(wj)) {
    const d = JSON.parse(fs.readFileSync(wj, 'utf8'));
    const k = Object.keys(d.tage || {}).sort();
    console.log('    withings.json: Stand ' + d.stand + ', ' + k.length + ' Tage' + (k.length ? ' (' + k[0] + ' bis ' + k[k.length - 1] + ')' : ''));
  }
}

// ---------- Start ----------
(async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? (rest[i + 1] ?? true) : d; };
  if (rest.includes('--log')) logDateiAn();
  try {
    if (cmd === 'anmelden') await anmelden();
    else if (cmd === 'holen') await holen(parseInt(opt('--tage', 180), 10) || 180, rest.includes('--dry-run'), rest.includes('--push'), rest.includes('--unsichere'));
    else if (cmd === 'status') status();
    else { console.log('Aufruf: node werkzeuge/withings-abholen.js anmelden | holen [--tage 180] [--dry-run] [--push] [--log] [--unsichere] | status'); process.exit(cmd ? 1 : 0); }
  } catch (e) { console.error('Fehler:', e.message || e); process.exit(1); }
})();
