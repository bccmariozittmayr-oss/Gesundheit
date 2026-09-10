/* Richtet die taegliche WHOOP-Abholung in der Windows-Aufgabenplanung ein.

   Aufruf:  node werkzeuge/whoop-aufgabe-einrichten.js          Aufgabe anlegen oder erneuern
            node werkzeuge/whoop-aufgabe-einrichten.js pruefen  nur nachsehen, nichts aendern
            node werkzeuge/whoop-aufgabe-einrichten.js jetzt     Aufgabe sofort einmal starten (Probelauf)
            node werkzeuge/whoop-aufgabe-einrichten.js entfernen

   Warum kein .cmd-Skript mehr: Am 10.09.2026 hat der Virenschutz die frueher hier
   liegende whoop-taeglich.cmd zweimal als "potentiell unerwuenschtes Programm"
   geloescht - eine Batchdatei, die node startet und etwas pusht, sieht fuer eine
   Heuristik nach einem Downloader aus. Die Aufgabe ruft deshalb node.exe direkt auf.

   Die Aufgabe laeuft taeglich um 07:30 und 12:30 und ist bewusst so eingestellt:
     - laeuft auch im Akkubetrieb            (sonst startet sie am Laptop fast nie)
     - holt verpasste Laeufe nach            (Laptop war aus? dann beim naechsten Anmelden)
     - nur eine Ausfuehrung gleichzeitig
     - bricht nach 10 Minuten ab             (haengt nie fest)
*/
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const NAME = 'Gesundheit WHOOP';
const ALTE_NAMEN = ['Gesundheit WHOOP frueh', 'Gesundheit WHOOP mittag']; // Fassung vom 10.09.2026
const SKRIPT = path.join(__dirname, 'whoop-abholen.js');
const NODE = process.execPath;

const schtasks = (...a) => execFileSync('schtasks', a, { stdio: 'pipe' }).toString();
const gibtEs = (tn) => { try { schtasks('/query', '/tn', tn); return true; } catch (e) { return false; } };

function xml() {
  const trigger = (zeit) => `    <CalendarTrigger>
      <StartBoundary>2026-01-01T${zeit}:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>`;
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Holt taeglich die WHOOP-Werte fuer die Gesundheits-App und legt sie verschluesselt ab.</Description>
  </RegistrationInfo>
  <Triggers>
${trigger('07:30')}
${trigger('12:30')}
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <AllowHardTerminate>true</AllowHardTerminate>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <ExecutionTimeLimit>PT10M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${NODE}</Command>
      <Arguments>"${SKRIPT}" holen --push --log</Arguments>
    </Exec>
  </Actions>
</Task>
`;
}

// Ergebniscodes der Aufgabenplanung, soweit sie hier vorkommen
const ERGEBNIS = {
  '0': 'erfolgreich',
  '1': 'mit Fehler beendet - ins Log sehen',
  '2': 'mit Fehler beendet - ins Log sehen',
  '267011': 'noch nie gelaufen',
  '267009': 'laeuft gerade',
  '267014': 'wurde abgebrochen',
};

function pruefen() {
  if (!gibtEs(NAME)) { console.log(`Aufgabe "${NAME}" ist NICHT eingerichtet.`); return false; }
  const x = schtasks('/query', '/tn', NAME, '/xml');
  const wert = (feld, standard) => (new RegExp(`<${feld}>(.*?)</${feld}>`).exec(x) || [, standard])[1]; // Windows laesst Felder weg, die dem Standard entsprechen
  const zeiten = [...x.matchAll(/<StartBoundary>.*?T(\d{2}:\d{2})/g)].map(m => m[1]);
  console.log(`Aufgabe "${NAME}": eingerichtet`);
  console.log('  Laeuft taeglich um:      ' + (zeiten.join(' und ') || '(kein Zeitplan)'));
  const liste = schtasks('/query', '/tn', NAME, '/fo', 'LIST', '/v');
  const feld = (bez) => { const m = new RegExp('^(?:' + bez + ')[^:]*:' + '\\s*(.+)$', 'mi').exec(liste); return m ? m[1].trim() : '?'; };
  const ergebnis = feld('Letztes Ergebnis|Last Result');
  console.log('  Zustand:                 ' + feld('Status der geplanten Aufgabe|Scheduled Task State') + ' / ' + feld('Status'));
  console.log('  Naechster Lauf:          ' + feld('N.chste Laufzeit|Next Run Time'));
  console.log('  Letzter Lauf:            ' + feld('Letzte Laufzeit|Last Run Time') + '  (' + (ERGEBNIS[ergebnis] || 'Code ' + ergebnis) + ')');
  console.log('  Auch im Akkubetrieb:     ' + (wert('DisallowStartIfOnBatteries', 'true') === 'false' ? 'ja' : 'NEIN - laeuft am Akku nicht'));
  console.log('  Verpasstes wird geholt:  ' + (wert('StartWhenAvailable', 'false') === 'true' ? 'ja' : 'NEIN'));
  console.log('  Startet:                 ' + (/<Command>(.*?)<\/Command>/.exec(x) || [, '?'])[1]);
  console.log('  Mit:                     ' + (/<Arguments>(.*?)<\/Arguments>/.exec(x) || [, '?'])[1]);
  const ziel = /<Arguments>"(.*?)"/.exec(x);
  if (ziel) console.log('  Zieldatei vorhanden:     ' + (fs.existsSync(ziel[1]) ? 'ja' : 'NEIN - die Datei fehlt!'));
  const logDatei = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'whoop-abholen.log');
  if (!fs.existsSync(logDatei)) console.log('  Log:                     noch keines vorhanden');
  else {
    const zeilen = fs.readFileSync(logDatei, 'utf8').trim().split(String.fromCharCode(10)).filter(Boolean);
    console.log('  Letzte Zeile im Log:     ' + (zeilen[zeilen.length - 1] || '(leer)'));
  }
  return true;
}

function entfernen(nurAlte) {
  for (const tn of nurAlte ? ALTE_NAMEN : [NAME, ...ALTE_NAMEN]) {
    if (!gibtEs(tn)) continue;
    schtasks('/delete', '/tn', tn, '/f');
    console.log('entfernt:', tn);
  }
}

const befehl = process.argv[2];
try {
  if (befehl === 'pruefen') { pruefen(); process.exit(0); }
  if (befehl === 'jetzt') { // Probelauf ueber die Aufgabenplanung - beweist, dass der Weg wirklich funktioniert
    if (!gibtEs(NAME)) { console.error('Aufgabe ist nicht eingerichtet. Zuerst ohne Zusatz aufrufen.'); process.exit(1); }
    schtasks('/run', '/tn', NAME);
    console.log('Gestartet - der Lauf dauert ein paar Sekunden.');
    setTimeout(pruefen, 20000);
    return;
  }
  if (befehl === 'entfernen') { entfernen(false); console.log('Fertig.'); process.exit(0); }

  if (!fs.existsSync(SKRIPT)) { console.error('Fehlt: ' + SKRIPT); process.exit(1); }
  entfernen(true); // Aufgaben der alten Fassung wegraeumen, sie zeigen auf die geloeschte .cmd
  const datei = path.join(os.tmpdir(), 'whoop-aufgabe.xml');
  fs.writeFileSync(datei, '\uFEFF' + xml(), 'utf16le'); // die Aufgabenplanung erwartet UTF-16 mit BOM
  try {
    schtasks('/create', '/tn', NAME, '/xml', datei, '/f');
  } finally {
    try { fs.unlinkSync(datei); } catch (e) {}
  }
  console.log(`Aufgabe "${NAME}" angelegt.\n`);
  pruefen();
  console.log('\nProtokoll der Laeufe: ' + path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'whoop-abholen.log'));
  console.log('Rueckgaengig:         node werkzeuge/whoop-aufgabe-einrichten.js entfernen');
} catch (e) {
  const txt = (e.stderr || e.stdout || '').toString().trim() || e.message;
  console.error('Fehlgeschlagen: ' + txt);
  if (/verweigert|denied/i.test(txt)) console.error('Tipp: Terminal einmal als Administrator oeffnen und erneut ausfuehren.');
  process.exit(1);
}
