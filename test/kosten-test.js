/* Prüft die Kosten-Seite: Knopf unter „Mehr“, Kennzahlen, Filter (Zeitraum, Bereich), Aufgliederung,
   Untersuchungen, Supplements, Rechnungsliste, Tooltip – und das Entschlüsseln von kosten.enc.json.
   Aufruf: node test/kosten-test.js <Ausgabeordner> <rechnungen.json> [<Passwortdatei>]
   Die echten Daten bleiben außerhalb des Repos und werden nur als Pfad übergeben. */
const path=require('path'),fs=require('fs'),http=require('http');
const {chromium}=require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const root=path.join(__dirname,'..');
const [OUT,DATEN,PW]=process.argv.slice(2);
if(!OUT||!DATEN){console.error('Aufruf: node test/kosten-test.js <Ausgabeordner> <rechnungen.json> [<Passwortdatei>]');process.exit(1);}
fs.mkdirSync(OUT,{recursive:true});
const daten=JSON.parse(fs.readFileSync(DATEN,'utf8'));
const r2=x=>Math.round(x*100)/100;
const summe=f=>r2(daten.rechnungen.flatMap(r=>r.positionen).filter(f).reduce((s,p)=>s+p.brutto,0));
const ARZT=['untersuchung','behandlung'];
const eur0=v=>v.toLocaleString('de-AT',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}r.setHeader('content-type',{'.html':'text/html','.js':'text/javascript','.json':'application/json'}[path.extname(f)]||'text/plain');r.end(fs.readFileSync(f))}).listen(8767,'127.0.0.1');
let fehler=0;const ok=(c,t)=>{console.log((c?'OK   ':'FEHLER ')+t);if(!c)fehler++;};

(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'de-AT',serviceWorkers:'block'});const pg=await ctx.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load/.test(m.text()))errs.push(m.text())});
  await pg.goto('http://127.0.0.1:8767/index.html',{waitUntil:'load'});await pg.waitForTimeout(300);
  const plan=fs.readFileSync(path.join(root,'mein-plan.beispiel.json'),'utf8');

  // 1) Ohne Daten: Hinweis statt Fehler
  await pg.evaluate(p=>{localStorage.clear();localStorage.setItem('gp_plan',p);},plan);await pg.reload({waitUntil:'load'});await pg.waitForTimeout(300);
  await pg.locator('nav button[data-p="mehr"]').click();
  ok(await pg.locator('#kosten-open').isVisible(),'Knopf „Meine Gesundheitskosten“ unter Mehr');
  await pg.locator('#kosten-open').click();
  ok(/Noch keine Rechnungsdaten/.test(await pg.locator('#kosten-inhalt').innerText()),'Ohne Daten: Hinweis');

  // 2) Mit Daten
  await pg.evaluate(d=>{localStorage.setItem('gp_kosten',JSON.stringify(d));localStorage.removeItem('gp_kosten_f');},daten);await pg.reload({waitUntil:'load'});await pg.waitForTimeout(300);
  await pg.locator('nav button[data-p="mehr"]').click();
  ok((await pg.locator('#kosten-knopf-info').innerText()).includes(daten.rechnungen.length+' Rechnungen'),'Knopf zeigt Anzahl und Summe');
  await pg.locator('#kosten-open').click();
  const kpi=async()=>(await pg.locator('#kosten-inhalt .k-stat').innerText()).replace(/\s+/g,' ');
  let k=await kpi();
  ok(k.includes(eur0(summe(()=>true)).replace(/\s/g,' ')),'Gesamt '+eur0(summe(()=>true)));
  ok(k.includes(eur0(summe(p=>ARZT.includes(p.kat))).replace(/\s/g,' ')),'Ärztlich '+eur0(summe(p=>ARZT.includes(p.kat))));
  ok(k.includes(eur0(summe(p=>!ARZT.includes(p.kat))).replace(/\s/g,' ')),'Supplements '+eur0(summe(p=>!ARZT.includes(p.kat))));
  ok(await pg.locator('#kosten-inhalt .k-chart').count()===1,'Monatsdiagramm vorhanden');
  ok(await pg.locator('#kosten-inhalt .k-leg span').count()>=2,'Legende vorhanden');
  await pg.screenshot({path:path.join(OUT,'kosten-oben.png'),fullPage:false});
  // Tooltip
  const hits=pg.locator('#kosten-inhalt .k-hit');await hits.first().click();
  ok(await pg.locator('#k-tip').isVisible()&&/€/.test(await pg.locator('#k-tip').innerText()),'Tooltip beim Antippen eines Monats');
  // Bereich „Ärztlich“
  await pg.locator('.k-seg[data-f="bereich"] button[data-v="arzt"]').click();
  k=await kpi();ok(k.startsWith(eur0(summe(p=>ARZT.includes(p.kat))).replace(/\s/g,' ')),'Filter Ärztlich: Gesamt = ärztliche Summe');
  // Aufgliedern nach Leistung
  await pg.locator('.k-seg[data-f="nach"] button[data-v="leistung"]').click();
  const zeilen=await pg.locator('#kosten-inhalt .k-z').count();
  const erwartet=new Set(daten.rechnungen.flatMap(r=>r.positionen).filter(p=>ARZT.includes(p.kat)&&p.brutto>0).map(p=>p.leistung)).size;
  ok(zeilen===erwartet,`Nach Leistung: ${zeilen} Zeilen (erwartet ${erwartet})`);
  ok(await pg.locator('#kosten-inhalt .k-det summary').filter({hasText:'Blutlabor'}).count()>=1||erwartet===0,'„Was wurde untersucht“ mit Gruppen');
  await pg.screenshot({path:path.join(OUT,'kosten-arzt.png'),fullPage:true});
  // Supplements
  await pg.locator('.k-seg[data-f="bereich"] button[data-v="supp"]').click();
  ok(await pg.locator('#kosten-inhalt .k-supp:not(.k-head)').count()===new Set(daten.rechnungen.flatMap(r=>r.positionen).filter(p=>!ARZT.includes(p.kat)).map(p=>p.leistung)).size,'Supplements je Produkt vollständig');
  // Alle Rechnungen im Filter „Alles“
  await pg.locator('.k-seg[data-f="bereich"] button[data-v="alle"]').click();
  await pg.locator('.k-seg[data-f="nach"] button[data-v="rechnung"]').click();
  ok(await pg.locator('#kosten-inhalt .k-z').count()===daten.rechnungen.length,'Nach Rechnung: alle Rechnungen');
  ok(await pg.locator('#kosten-inhalt .card').filter({hasText:'Alle Rechnungen'}).locator('details').count()===daten.rechnungen.length,'Rechnungsliste vollständig');
  // Filter bleibt gemerkt
  await pg.reload({waitUntil:'load'});await pg.waitForTimeout(300);await pg.evaluate(()=>gotoPage('kosten'));
  ok(await pg.locator('.k-seg[data-f="nach"] button.on').innerText()==='Rechnung','Filter bleibt nach Neuladen');
  await pg.locator('#kosten-zurueck').click();ok(await pg.locator('#p-mehr').isVisible(),'Zurück zu Mehr');

  // 3) Echte Entschlüsselung von kosten.enc.json
  if(PW){
    await pg.evaluate(()=>{localStorage.removeItem('gp_kosten');localStorage.removeItem('gp_kosten_iv');kosten=null;});
    await pg.evaluate(pw=>{document.getElementById('plan-pw').value=pw;document.getElementById('plan-unlock').click();},fs.readFileSync(PW,'utf8').trim());
    await pg.waitForFunction(()=>!!localStorage.getItem('gp_kosten'),null,{timeout:15000}).catch(()=>{});
    ok(await pg.evaluate(n=>kosten&&kosten.rechnungen.length===n,daten.rechnungen.length),'kosten.enc.json nach Entsperren entschlüsselt und geladen');
  } else console.log('(Entschlüsselungs-Test übersprungen – keine Passwortdatei)');

  ok(errs.length===0,'keine Fehler in der Konsole'+(errs.length?': '+errs.join(' | '):''));
  await b.close();srv.close();console.log(fehler?fehler+' FEHLER':'ALLES OK');process.exit(fehler?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
