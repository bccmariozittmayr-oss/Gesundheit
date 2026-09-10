/* Holt die Tageswerte von WHOOP (Recovery, Schlaf, Belastung, Workouts) und legt sie für die App ab.

   Aufruf:
     node werkzeuge/whoop-abholen.js anmelden          einmalig: Browser öffnet sich, WHOOP-Zugriff freigeben
     node werkzeuge/whoop-abholen.js holen [--tage 30] [--dry-run] [--push] [--log]
                                                       Werte abholen, whoop.json schreiben, optional whoop.enc.json + Git-Push
                                                       --log schreibt alle Ausgaben zusaetzlich in %LOCALAPPDATA%, Datei whoop-abholen.log
                                                       (so braucht die Aufgabenplanung keine .cmd-Datei als Umweg)
     node werkzeuge/whoop-abholen.js status            zeigt, ob Anmeldung und Konfiguration passen (nur lesen)

   Ablage:
     .env               Client-ID/Secret, Datenordner, Passwortdatei (lokal, nie ins Repo)
     .whoop-token.json  Zugangs-Token (lokal, nie ins Repo, nie in OneDrive)
     <Datenordner>/whoop.json    Klartext-Werte, privat (OneDrive neben mein-plan.json)
     whoop.enc.json     AES-verschlüsselt, gleiches Passwort und gleiches Salt wie plan.enc.json – darf ins Repo.

   Keine Fremdbibliotheken, läuft mit Node 18+. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { webcrypto, randomBytes } = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENV_PFAD = path.join(ROOT, '.env');
const TOKEN_PFAD = path.join(ROOT, '.whoop-token.json');
const API = 'https://api.prod.whoop.com/developer/v2';
const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const PORT = 8766;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPES = 'offline read:recovery read:cycles read:sleep read:workout read:body_measurement';

// ---------- Konfiguration ----------
function ladeEnv() {
  const env = {};
  if (fs.existsSync(ENV_PFAD)) {
    for (const zeile of fs.readFileSync(ENV_PFAD, 'utf8').split(/\r?\n/)) {
      const m = zeile.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !zeile.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  for (const k of Object.keys(process.env)) if (k.startsWith('WHOOP_') && !env[k]) env[k] = process.env[k];
  return env;
}
const ENV = ladeEnv();
function brauche(k) {
  if (!ENV[k]) { console.error(`Fehlt: ${k} in .env (Vorlage: .env.example)`); process.exit(1); }
  return ENV[k];
}

// ---------- Token ----------
function ladeToken() { return fs.existsSync(TOKEN_PFAD) ? JSON.parse(fs.readFileSync(TOKEN_PFAD, 'utf8')) : null; }
function speichereToken(t) {
  t.gueltig_bis = Date.now() + (t.expires_in || 3600) * 1000 - 60000;
  fs.writeFileSync(TOKEN_PFAD, JSON.stringify(t, null, 1));
}
async function tokenAnfrage(form, versuch = 1) {
  const body = new URLSearchParams({ ...form, client_id: brauche('WHOOP_CLIENT_ID'), client_secret: brauche('WHOOP_CLIENT_SECRET') });
  const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const txt = await r.text();
  if (r.status >= 500 && versuch < 3) { // Serverfehler bei WHOOP: kurz warten und noch einmal
    console.error(`WHOOP-Server antwortet mit ${r.status} – Versuch ${versuch + 1} von 3 in 5 Sekunden …`);
    await new Promise(s => setTimeout(s, 5000));
    return tokenAnfrage(form, versuch + 1);
  }
  if (!r.ok) throw new Error(`Token-Anfrage fehlgeschlagen (${r.status}): ${txt.slice(0, 300)}`);
  return JSON.parse(txt);
}
async function gueltigesToken() {
  let t = ladeToken();
  if (!t) { console.error('Noch nicht angemeldet. Zuerst: node werkzeuge/whoop-abholen.js anmelden'); process.exit(1); }
  if (Date.now() < (t.gueltig_bis || 0)) return t.access_token;
  if (!t.refresh_token) { console.error('Token abgelaufen und kein Refresh-Token vorhanden. Bitte neu anmelden.'); process.exit(1); }
  let neu;
  try {
    neu = await tokenAnfrage({ grant_type: 'refresh_token', refresh_token: t.refresh_token, scope: 'offline' });
  } catch (e) {
    console.error('Der WHOOP-Zugang ist abgelaufen und lässt sich nicht erneuern.');
    console.error('Einmal am Laptop ausführen:  node werkzeuge/whoop-abholen.js anmelden');
    console.error('(technische Meldung: ' + e.message + ')');
    process.exit(2);
  }
  if (!neu.refresh_token) neu.refresh_token = t.refresh_token;
  speichereToken(neu);
  return neu.access_token;
}

// ---------- Anmelden (OAuth Authorization Code, Rückleitung auf localhost) ----------
async function anmelden() {
  const clientId = brauche('WHOOP_CLIENT_ID'); brauche('WHOOP_CLIENT_SECRET');
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
        antwort('WHOOP verbunden ✓'); srv.close(); try { fs.unlinkSync(path.join(ROOT, '.whoop-login-url.txt')); } catch (e) {} resolve();
      } catch (e) { antwort('Fehlgeschlagen: ' + e.message); srv.close(); reject(e); }
    }).listen(PORT, '127.0.0.1', () => {
      console.log('Browser öffnet sich – bei WHOOP anmelden und den Zugriff bestätigen.');
      console.log('Falls kein Browser aufgeht: Adresse steht in der Datei .whoop-login-url.txt (lokal).'); fs.writeFileSync(path.join(ROOT, '.whoop-login-url.txt'), url);
      // rundll32 statt 'cmd /c start': cmd würde die Adresse am ersten & abschneiden
      try { execFileSync('rundll32', ['url.dll,FileProtocolHandler', url], { stdio: 'ignore' }); } catch (e) { /* Adresse steht oben */ }
    });
  });
  console.log('Angemeldet. Token liegt in', TOKEN_PFAD, '(bleibt lokal).');
}

// ---------- Abholen ----------
async function api(pfad, params = {}) {
  const tok = await gueltigesToken();
  const u = new URL(API + pfad); Object.entries(params).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { authorization: 'Bearer ' + tok } });
  if (r.status === 429) { await new Promise(s => setTimeout(s, 15000)); return api(pfad, params); }
  if (!r.ok) throw new Error(`${pfad} → ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
async function alle(pfad, start) { // Sammlung mit Seitenwechsel
  const out = []; let nextToken;
  do {
    const s = await api(pfad, { limit: 25, start, nextToken });
    out.push(...(s.records || [])); nextToken = s.next_token;
  } while (nextToken);
  return out;
}
const lokalesDatum = (iso, offset) => { // Datum in der Zeitzone des Nutzers zum Zeitpunkt der Aufzeichnung
  const d = new Date(iso); const m = /^([+-])(\d{2}):(\d{2})$/.exec(offset || 'Z');
  const min = m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0;
  return new Date(d.getTime() + min * 60000).toISOString().slice(0, 10);
};
const h = ms => Math.round((ms || 0) / 36000) / 100; // Millisekunden → Stunden mit 2 Nachkommastellen
const r1 = x => x == null ? null : Math.round(x * 10) / 10;

async function holen(tage, dryRun, push) {
  const ordner = brauche('WHOOP_DATEN_ORDNER');
  const start = new Date(Date.now() - tage * 86400000).toISOString();
  console.log(`Hole WHOOP-Daten der letzten ${tage} Tage …`);
  const [cycles, recoveries, sleeps, workouts, koerper] = await Promise.all([
    alle('/cycle', start), alle('/recovery', start), alle('/activity/sleep', start), alle('/activity/workout', start),
    api('/user/measurement/body').catch(() => null),
  ]);
  const tageMap = {};
  const tag = k => (tageMap[k] = tageMap[k] || { workouts: [] });
  const cycleDatum = {};
  // Ein WHOOP-Zyklus beginnt beim Einschlafen am Vorabend – der Tag heißt nach dem Aufwachen (Ende des Hauptschlafs).
  const hauptschlaf = {}; for (const s of sleeps) if (!s.nap) hauptschlaf[s.cycle_id] = s;
  const zyklusDatum = c => { const s = hauptschlaf[c.id]; if (s) return lokalesDatum(s.end, s.timezone_offset);
    const d = new Date(c.start); const m = /^([+-])(d{2}):(d{2})$/.exec(c.timezone_offset || 'Z'); const min = m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0;
    const lokal = new Date(d.getTime() + min * 60000); return lokal.getUTCHours() >= 15 ? new Date(lokal.getTime() + 86400000).toISOString().slice(0, 10) : lokal.toISOString().slice(0, 10); };
  for (const c of cycles.slice().sort((x, y) => x.start < y.start ? -1 : 1)) { // aufsteigend: bei zwei Zyklen am selben Tag gewinnt der spätere
    const k = zyklusDatum(c); cycleDatum[c.id] = k; const t = tag(k);
    t.zyklusStart = c.start; t.zyklusEnde = c.end || null; t.laufend = !c.end;
    if (c.score_state === 'SCORED' && c.score) { t.strain = r1(c.score.strain); t.kcal = Math.round(c.score.kilojoule / 4.184); t.pulsAvg = c.score.average_heart_rate; t.pulsMax = c.score.max_heart_rate; }
  }
  const schlafById = Object.fromEntries(sleeps.map(s => [s.id, s]));
  for (const rc of recoveries) {
    const k = cycleDatum[rc.cycle_id]; if (!k) continue; const t = tag(k);
    if (rc.score_state === 'SCORED' && rc.score) {
      t.recovery = Math.round(rc.score.recovery_score); t.hrv = r1(rc.score.hrv_rmssd_milli); t.ruhepuls = Math.round(rc.score.resting_heart_rate);
      if (rc.score.spo2_percentage != null) t.spo2 = r1(rc.score.spo2_percentage);
      if (rc.score.skin_temp_celsius != null) t.hauttemp = r1(rc.score.skin_temp_celsius);
      if (rc.score.user_calibrating) t.kalibriert = false;
    } else t.recoveryStatus = rc.score_state;
    const s = schlafById[rc.sleep_id];
    if (s && s.score_state === 'SCORED' && s.score) {
      const st = s.score.stage_summary, need = s.score.sleep_needed;
      t.schlaf = { start: s.start, ende: s.end, stunden: h(st.total_in_bed_time_milli - st.total_awake_time_milli), imBett: h(st.total_in_bed_time_milli),
        leistung: Math.round(s.score.sleep_performance_percentage ?? 0) || null, effizienz: r1(s.score.sleep_efficiency_percentage), konsistenz: Math.round(s.score.sleep_consistency_percentage ?? 0) || null,
        tief: h(st.total_slow_wave_sleep_time_milli), rem: h(st.total_rem_sleep_time_milli), leicht: h(st.total_light_sleep_time_milli), wach: h(st.total_awake_time_milli),
        zyklen: st.sleep_cycle_count, stoerungen: st.disturbance_count, atemfrequenz: r1(s.score.respiratory_rate),
        bedarf: need ? h(need.baseline_milli + need.need_from_sleep_debt_milli + need.need_from_recent_strain_milli + need.need_from_recent_nap_milli) : null };
    }
  }
  for (const s of sleeps) if (s.nap && s.score_state === 'SCORED') { const t = tag(lokalesDatum(s.start, s.timezone_offset)); t.nickerchen = (t.nickerchen || 0) + h(s.score.stage_summary.total_in_bed_time_milli - s.score.stage_summary.total_awake_time_milli); }
  for (const w of workouts) {
    const t = tag(lokalesDatum(w.start, w.timezone_offset)); const sc = w.score_state === 'SCORED' ? w.score : null;
    const z = sc?.zone_durations;
    t.workouts.push({ sport: w.sport_name, start: w.start, minuten: Math.round((new Date(w.end) - new Date(w.start)) / 60000),
      strain: sc ? r1(sc.strain) : null, pulsAvg: sc?.average_heart_rate ?? null, pulsMax: sc?.max_heart_rate ?? null,
      km: sc?.distance_meter != null ? r1(sc.distance_meter / 1000) : null, hoehenmeter: sc?.altitude_gain_meter != null ? Math.round(sc.altitude_gain_meter) : null,
      zonenMin: z ? [z.zone_zero_milli, z.zone_one_milli, z.zone_two_milli, z.zone_three_milli, z.zone_four_milli, z.zone_five_milli].map(ms => Math.round(ms / 60000)) : null });
  }
  Object.values(tageMap).forEach(t => t.workouts.sort((a, b) => a.start < b.start ? -1 : 1));

  // mit vorhandener Datei zusammenführen (ältere Tage bleiben erhalten)
  const zielKlartext = path.join(ordner, 'whoop.json');
  let alt = {}; if (fs.existsSync(zielKlartext)) { try { alt = JSON.parse(fs.readFileSync(zielKlartext, 'utf8')).tage || {}; } catch (e) { alt = {}; } }
  const daten = { quelle: 'WHOOP', stand: new Date().toISOString(),
    koerper: koerper ? { groesse: r1(koerper.height_meter), gewicht: r1(koerper.weight_kilogram), maxPuls: koerper.max_heart_rate } : undefined,
    tage: Object.fromEntries(Object.entries({ ...alt, ...tageMap }).sort()) };
  const keys = Object.keys(tageMap).sort();
  console.log(`${cycles.length} Zyklen, ${recoveries.length} Recoveries, ${sleeps.length} Schlafphasen, ${workouts.length} Workouts → ${keys.length} Tage (${keys[0]} bis ${keys[keys.length - 1]}), gesamt ${Object.keys(daten.tage).length} Tage in der Datei.`);
  const heute = tageMap[keys[keys.length - 1]] || {};
  console.log(`Letzter Tag: Recovery ${heute.recovery ?? '–'} % · HRV ${heute.hrv ?? '–'} ms · Ruhepuls ${heute.ruhepuls ?? '–'} · Schlaf ${heute.schlaf?.stunden ?? '–'} h · Strain ${heute.strain ?? '–'}`);
  if (dryRun) { console.log('Dry-Run: nichts geschrieben.'); return; }
  fs.mkdirSync(ordner, { recursive: true });
  fs.writeFileSync(zielKlartext, JSON.stringify(daten, null, 1));
  console.log('geschrieben:', zielKlartext);

  if (ENV.WHOOP_PASSWORT_DATEI) {
    const ziel = await verschluesseln(JSON.stringify(daten), ENV.WHOOP_PASSWORT_DATEI);
    console.log('geschrieben:', ziel);
    if (push) {
      const g = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
      if (!g('status', '--porcelain', '--', 'whoop.enc.json')) console.log('Git: keine Änderung.');
      else {
        const zweig = g('rev-parse', '--abbrev-ref', 'HEAD');
        let upstream = null;
        try { upstream = g('rev-parse', '--abbrev-ref', '@{u}'); } catch (e) { /* kein Upstream */ }
        g('add', 'whoop.enc.json');
        g('commit', '-m', 'WHOOP-Werte ' + daten.stand.slice(0, 10) + ' (verschlüsselt)');
        if (!upstream) {
          console.error('Git: auf Zweig "' + zweig + '" committet, aber NICHT gepusht – dieser Zweig hat kein Gegenstück am Server.');
          console.error('Die App auf GitHub Pages bekommt die Werte erst, wenn dieser Zweig nach main zusammengeführt ist.');
        } else {
          try { g('push'); console.log('Git: whoop.enc.json committet und nach ' + upstream + ' gepusht.'); }
          catch (e) { console.error('Git: committet, aber Push fehlgeschlagen (' + ((e.stderr || '').toString().trim().split(String.fromCharCode(10))[0] || e.message) + '). Beim nächsten Lauf geht es mit.'); }
        }
      }
    }
  } else console.log('Hinweis: WHOOP_PASSWORT_DATEI nicht gesetzt – keine whoop.enc.json für die App erzeugt.');
}

// gleiches Verfahren wie plan-verschluesseln.js; das Salt wird aus plan.enc.json übernommen, damit die App mit EINEM Schlüssel beide Dateien öffnet
async function verschluesseln(klartext, pwPfad) {
  const subtle = webcrypto.subtle; const enc = new TextEncoder();
  const pw = fs.readFileSync(pwPfad, 'utf8').trim(); if (pw.length < 12) throw new Error('Passwort zu kurz');
  const planEnc = path.join(ROOT, 'plan.enc.json');
  if (!fs.existsSync(planEnc)) throw new Error('plan.enc.json fehlt – zuerst den Plan verschlüsseln');
  const p = JSON.parse(fs.readFileSync(planEnc, 'utf8'));
  const salt = Buffer.from(p.salt, 'base64'); const iterations = p.iterations;
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const base = await subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(klartext)));
  const b64 = a => Buffer.from(a).toString('base64');
  const ziel = path.join(ROOT, 'whoop.enc.json');
  fs.writeFileSync(ziel, JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iterations, salt: p.salt, iv: b64(iv), data: b64(ct), stand: new Date().toISOString() }));
  return ziel;
}

function status() {
  const ok = (b, t) => console.log((b ? '  ✓ ' : '  ✗ ') + t);
  console.log('WHOOP-Anbindung:');
  ok(fs.existsSync(ENV_PFAD), '.env vorhanden');
  ok(!!ENV.WHOOP_CLIENT_ID && !!ENV.WHOOP_CLIENT_SECRET, 'Client-ID und Secret gesetzt');
  ok(!!ENV.WHOOP_DATEN_ORDNER && fs.existsSync(ENV.WHOOP_DATEN_ORDNER || ''), 'Datenordner vorhanden');
  ok(!!ENV.WHOOP_PASSWORT_DATEI && fs.existsSync(ENV.WHOOP_PASSWORT_DATEI || ''), 'Passwortdatei vorhanden (für whoop.enc.json)');
  const t = ladeToken(); ok(!!t, 'angemeldet (Token vorhanden)');
  if (t) console.log('    Token ' + (Date.now() < t.gueltig_bis ? 'gültig' : 'abgelaufen, wird beim nächsten Abruf erneuert') + (t.refresh_token ? '' : ' – KEIN Refresh-Token, Neuanmeldung nötig'));
  const wj = ENV.WHOOP_DATEN_ORDNER && path.join(ENV.WHOOP_DATEN_ORDNER, 'whoop.json');
  if (wj && fs.existsSync(wj)) { const d = JSON.parse(fs.readFileSync(wj, 'utf8')); console.log('    whoop.json: Stand ' + d.stand + ', ' + Object.keys(d.tage || {}).length + ' Tage'); }
}

// ---------- Protokoll ----------
// Mit --log gehen alle Ausgaben zusaetzlich in eine Datei. Damit kann die Aufgabenplanung
// node direkt aufrufen; frueher lag dafuer eine .cmd-Datei mit Umleitung dazwischen - die
// hat ein Virenschutz zweimal als "potentiell unerwuenscht" geloescht (10.09.2026).
function logDateiAn() {
  const ordner = process.env.LOCALAPPDATA || process.env.TMPDIR || '.';
  const datei = path.join(ordner, 'whoop-abholen.log');
  const schreib = (art, args) => {
    const zeile = new Date().toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + (art === 'err' ? ' FEHLER ' : ' ') +
      args.map(a => typeof a === 'string' ? a : require('util').inspect(a)).join(' ') + String.fromCharCode(10);
    try { fs.appendFileSync(datei, zeile); } catch (e) { /* Log darf den Lauf nie stoppen */ }
  };
  const log = console.log.bind(console), err = console.error.bind(console);
  console.log = (...a) => { schreib('log', a); log(...a); };
  console.error = (...a) => { schreib('err', a); err(...a); };
  return datei;
}

// ---------- Start ----------
(async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? (rest[i + 1] ?? true) : d; };
  if (rest.includes('--log')) logDateiAn();
  try {
    if (cmd === 'anmelden') await anmelden();
    else if (cmd === 'holen') await holen(parseInt(opt('--tage', 30), 10) || 30, rest.includes('--dry-run'), rest.includes('--push'));
    else if (cmd === 'status') status();
    else { console.log('Aufruf: node werkzeuge/whoop-abholen.js anmelden | holen [--tage 30] [--dry-run] [--push] [--log] | status'); process.exit(cmd ? 1 : 0); }
  } catch (e) { console.error('Fehler:', e.message || e); process.exit(1); }
})();
