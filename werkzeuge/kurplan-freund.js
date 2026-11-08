/* Macht aus der privaten mein-plan.json einen Kurplan für Freunde, die dieselbe Darmkur machen.
   Grundlage ist die 30-Tage-Broschüre der Darmkur, NICHT der eigene Arztbrief:
   - Kurablauf Tag 1–30 (Essen, Erlaubt/Verboten, Trinken, Bewegung) wird übernommen,
     eigene Regeln, die nicht aus der Broschüre stammen, werden entfernt (Liste unten).
   - Kur-Präparate werden nach der Broschüre angelegt (Tabelle BROSCHUERE). Der eigene verlängerte
     Aufbau und zusätzliche eigene Präparate entfallen.
   - Weggelassen: Dauer-Präparate, Befunde, Diagnosen, Termine, Training, persönliche Regeln,
     Startdatum, Bürotage, persönliche Frühstücksauswahl und Rezeptsperren aus eigenen Befunden.
   Am Ende prüft eine Sperrliste, dass kein persönlicher Begriff übrig ist – sonst bricht es ab.

   Aufruf:  node werkzeuge/kurplan-freund.js <mein-plan.json> <ausgabe.json> [--start=JJJJ-MM-TT] [--buero=1,4] [--einkauf=6]
   Danach:  node werkzeuge/plan-verschluesseln.js <ausgabe.json> <passwort.txt> --ziel=plaene/<name>.enc.json
   Die Ausgabe (Klartext) gehört wie mein-plan.json in den privaten OneDrive-Ordner, nie ins Repo. */
const fs = require('fs');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = n => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1];
const [quelle, ziel] = args;
if (!quelle || !ziel) { console.error('Aufruf: node kurplan-freund.js <mein-plan.json> <ausgabe.json> [--start=JJJJ-MM-TT] [--buero=1,4] [--einkauf=6]'); process.exit(1); }
const start = opt('start') || null;
if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) { console.error('--start im Format JJJJ-MM-TT'); process.exit(1); }
const p = JSON.parse(fs.readFileSync(quelle, 'utf8'));
if (!p.darmkur) { console.error('Kein darmkur-Block im Plan.'); process.exit(1); }
const klon = x => JSON.parse(JSON.stringify(x));
function fehler(t) { console.error('ABBRUCH – ' + t); process.exit(2); }

/* Kur-Präparate laut Darmkur-Broschüre (abTag 0 = Kurtag 1).
   Quelle: Darmkur-Broschüre (Ablauf und FODMAP-Teil). */
const BROSCHUERE = {
  bittersalz: [{ abTag: 0, bisTag: 0, m: 1, notiz: 'Reduziertag 1, optional' }],
  detox: null, // unverändert übernehmen (Tag 3–6, 7 Shakes)
  probio: [{ abTag: 6, bisTag: 28, nu: 1, n: 1, notiz: 'Tag 7–29: nüchtern + vor dem Schlafen' },
           { abTag: 29, bisTag: null, nu: 1, notiz: 'ab Tag 30 dauerhaft, nüchtern' }],
  glut:   [{ abTag: 6, bisTag: 28, m: 1, a: 1, notiz: 'Tag 7–29' }],
  basis:  [{ abTag: 6, bisTag: 12, m: 2, a: 2, notiz: 'Tag 7–13: je 2 EL' },
           { abTag: 13, bisTag: 28, m: 1, a: 1, notiz: 'Tag 14–29: je 1 EL' },
           { abTag: 29, bisTag: null, m: 1, a: 1, notiz: 'ab Tag 30 dauerhaft' }],
};
const kur = Object.keys(BROSCHUERE).map(id => {
  const m = p.praeparate.find(x => x.id === id && x.anker === 'kur');
  if (!m) fehler('Kur-Präparat "' + id + '" fehlt im Plan.');
  const c = klon(m); delete c.offen;
  if (BROSCHUERE[id]) c.phasen = BROSCHUERE[id];
  return c;
});

/* Eigene Textstellen, die nicht aus der Broschüre stammen */
const ERSETZEN = [
  [/\s*–\s*auch Kreatin[^"]*$/, ''],                       // eigene Supplements namentlich
  [/EMS und Krafttraining/g, 'Krafttraining'], [/EMS, Krafttraining/g, 'Krafttraining'],
  [/Normales Training laut Wochenplan\./g, 'Normales Training.'],
  [/^Zwiebel, Knoblauch, Kohl, Bohnen$/, 'Zwiebel, Knoblauch, Bohnen'],
  [/^Sorbit-Obst, Zwiebel, Knoblauch, Kohl$/, 'Sorbit-Obst, Zwiebel, Knoblauch'],
  [/^Frühstück – halbe Portion: Haferschleim mit Wasser, etwas Obst, 1 Ei$/, 'Frühstück – halbe Portion, FODMAP-arm'],
  [/^Kaffee wenig: max\. 3, der erste frühestens 90 Min\. nach dem Aufstehen$/, 'Kaffee wenig'],  // persönliche Regel
  [/ – und nur 80 % satt\./, '.'],
  [/Darmbasis\+, L-Glutamin\+, Probiotikum\+ und Butyzol/g, 'Darmbasis+, L-Glutamin+ und Probiotikum+'],
];
const QUELLE_RAUS = /Arztbrief|Einnahmeplan|persönlich|Ernährungsberat|Befund/i;
function saeubern(x, schluessel) {
  if (typeof x === 'string') {
    if (schluessel === 'quelle') return x.split(' · ').filter(t => !QUELLE_RAUS.test(t)).join(' · ');
    return ERSETZEN.reduce((s, [a, b]) => s.replace(a, b), x);
  }
  if (Array.isArray(x)) return x.map(v => saeubern(v, schluessel));
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, saeubern(v, k)]));
  return x;
}
const dk = saeubern(klon(p.darmkur));

/* Phase 2 (ab Tag 9): eigene Regeln raus, Broschüre bleibt */
const p2 = dk.vorlagen && dk.vorlagen.phase2;
if (!p2) fehler('Vorlage phase2 fehlt.');
const RAUS_P2 = [
  /^Paprika$/,
  /^Sonnenblumenöl, Kokosöl, Margarine$/,
  /^Essfenster/,
  /^Kohlenhydrate nie alleine/,
  /^Ballaststoffe bei jeder Mahlzeit/,
  /^Fermentiertes:/,
];
['verboten', 'erlaubt', 'regeln'].forEach(k => { if (p2[k]) p2[k] = p2[k].filter(t => !RAUS_P2.some(r => r.test(t))); });
p2.ablauf = (p2.ablauf || []).filter(a => !/^Frühestens jetzt der erste Kaffee/.test(a.was)).map(a => {
  if (/^Frühstück \(fix\):/.test(a.was)) return { ...a, was: 'Frühstück – FODMAP-arm, Vorschläge im Reiter „Essen“' };
  if (/^Mittag: zuerst Gemüse, Salat oder ein Glas Essigwasser/.test(a.was)) return { ...a, was: 'Mittag: Eiweiß (Huhn, Rind, Fisch, Ei, Tofu) mit Gemüse und einer FODMAP-armen Beilage (Kartoffeln, Reis, Quinoa, Hirse, Buchweizen)' };
  return a;
});

/* Kurabschnitte: Tag 1–29 wie Broschüre, ab Tag 30 Stabilisierung (statt eigenem verlängertem Aufbau) */
const vor = dk.abschnitte.filter(a => a.von < 30).map(a => (a.bis == null || a.bis >= 30) ? { ...a, bis: 29 } : a);
if (!vor.length || vor[vor.length - 1].bis !== 29) fehler('Kurabschnitte bis Tag 29 nicht wie erwartet.');
dk.abschnitte = [...vor, {
  von: 30, bis: null, basis: 'phase2', titel: 'Stabilisierung', name: 'Stabilisierung – Tag {tag}',
  kurz: '30-Tage-Kur geschafft. Darmbasis+ (1 EL morgens und abends) und Probiotikum+ (1 Kapsel morgens nüchtern) dauerhaft weiter. Darmsanierung 1× jährlich wiederholen.',
  vorbereiten: 'Ab morgen Stabilisierung: L-Glutamin+ ist fertig, Probiotikum+ nur noch morgens nüchtern, Darmbasis+ 1 EL morgens und abends.',
  regelnPlus: ['Kohlenhydrate wieder vielfältig und ballaststoffreich (Broschüre: nach Phase 2)'],
}];

dk.start = start;
dk.buerotage = opt('buero') ? opt('buero').split(',').map(Number) : [];
dk.einkaufstag = opt('einkauf') ? Number(opt('einkauf')) : (dk.einkaufstag ?? 6);
dk.menueBisTag = Math.min(dk.menueBisTag || 29, 29);
delete dk.fruehstueck;
dk.ohneRezepte = (dk.ohneRezepte || []).filter(r => !/Darmbefund|Meiden-Liste|Ernährungsberat/i.test(r.grund || ''));

const heute = new Date().toISOString().slice(0, 10);
const aus = {
  version: p.version || 1, stand: heute,
  quelle: 'Darmkur dieFITMACHER (30-Tage-Broschüre) – Kurplan für Freunde',
  anker: { plan: start || heute }, praeparate: kur, darmkur: dk,
};

// Sperrliste: nichts Persönliches darf übrig sein
const text = JSON.stringify(aus);
const sperre = ['Arztbrief', 'Einnahmeplan', 'Ernährungsberat', 'Befund', 'Kreatin', 'Immun+', 'SMP+', 'Recovery+', 'BCAA', 'EMS', 'WHOOP', 'Withings', 'Mario', 'Dr. Hoo', 'persönlich',
  'Butyzol', 'Apriwell', 'Essigwasser', '80 %', 'Kokosöl', 'Essfenster', 'Paprika', 'Haferschleim mit Wasser +', '90 Min', 'Monat 3', 'Fermentiert',
  ...p.praeparate.filter(m => m.anker !== 'kur').map(m => m.name)];
const treffer = sperre.filter(w => w && text.includes(w));
if (/\bKohl\b/.test(text)) treffer.push('Kohl');
if (treffer.length) {
  console.error('ABBRUCH – persönliche Begriffe gefunden:');
  treffer.forEach(w => { const i = text.search(w === 'Kohl' ? /\bKohl\b/ : new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))); console.error(' - ' + w + ': …' + text.slice(Math.max(0, i - 60), i + 40) + '…'); });
  process.exit(2);
}
fs.writeFileSync(ziel, JSON.stringify(aus, null, 2));
console.log('geschrieben:', ziel);
console.log('Kur-Präparate:', kur.map(m => m.name).join(', '));
console.log('Kurabschnitte:', dk.abschnitte.map(a => a.von + '–' + (a.bis ?? '')).join(' | '), '· gesperrte Rezepte:', dk.ohneRezepte.length,
  '· Start:', start || 'trägt er in der App ein', '· Bürotage:', dk.buerotage.length ? dk.buerotage.join(',') : 'keine', '· Einkaufstag:', dk.einkaufstag);
