/* Prüft den Darmkur-Tagesablauf auf „Heute“: Karte je Kurtag, Zeiten, Präparate je Uhrzeit,
   Detox-Tage (alles pausiert, auch Sport-Shakes), Hinweis in der Trainingskarte, Gesamtübersicht,
   Startdatum aus dem Plan und Verhalten ohne darmkur-Block.
   Aufruf: node test/darmkur-test.js <Ausgabeordner> <Plan-Datei mit darmkur-Block> [<Passwortdatei> <alter plan.enc.json>]
   Der echte Plan bleibt außerhalb des Repos und wird nur als Pfad übergeben. */
const path=require('path'),fs=require('fs'),http=require('http');
const {chromium}=require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const root=path.join(__dirname,'..');
const OUT=process.argv[2],PLAN=process.argv[3];
if(!OUT||!PLAN){console.error('Aufruf: node test/darmkur-test.js <Ausgabeordner> <Plan-Datei>');process.exit(1);}
fs.mkdirSync(OUT,{recursive:true});
const plan=JSON.parse(fs.readFileSync(PLAN,'utf8'));
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}r.setHeader('content-type',{'.html':'text/html','.js':'text/javascript','.json':'application/json'}[path.extname(f)]||'text/plain');r.end(fs.readFileSync(f))}).listen(8766,'127.0.0.1');
const heute=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const plusTage=(k,n)=>{const d=new Date(k+'T00:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
let fehler=0;const ok=(c,t)=>{console.log((c?'OK   ':'FEHLER ')+t);if(!c)fehler++;};

(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'de-AT',serviceWorkers:'block'});const pg=await ctx.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load/.test(m.text()))errs.push(m.text())});
  await pg.goto('http://127.0.0.1:8766/index.html',{waitUntil:'load'});await pg.waitForTimeout(400);
  const setze=async(set,p=plan)=>{await pg.evaluate(([p,s])=>{localStorage.setItem('gp_plan',JSON.stringify(p));localStorage.setItem('gp_set',JSON.stringify(s));},[p,set]);await pg.reload({waitUntil:'load'});await pg.waitForTimeout(300);};
  const basis={times:{},atimes:{},notif:false,medOverride:{}};
  const tagSetzen=async tag=>setze({...basis,kurStart:plusTage(heute(),-(tag-1)),kurStartManuell:true});
  const karte=()=>pg.locator('#heute-banner .dk');

  // 1) Startdatum kommt aus dem Plan, wenn in der App keines gesetzt ist
  await setze({...basis,kurStart:null});
  const ks=await pg.evaluate(()=>set.kurStart);
  ok(ks===plan.darmkur.start,'Startdatum aus dem Plan übernommen ('+ks+')');

  // 2) Tag vor dem Start
  await tagSetzen(0);
  ok(/startet morgen/.test(await karte().innerText()),'Vortag: „Darmkur startet morgen“ mit Vorbereitung');
  await pg.screenshot({path:path.join(OUT,'tag00-vortag.png'),fullPage:true});

  // 3) Stichtage
  const faelle=[[1,'Reduziertag 1'],[2,'Reduziertag 2'],[3,'Darmdetox+ Tag 1 von 4'],[6,'Darmdetox+ Tag 4 von 4'],[7,'Aufbautag 1'],[8,'Aufbautag 2'],[9,'Regeneration – Tag 9 von 30'],[14,'Regeneration – Tag 14 von 30'],[31,'Verlängerter Aufbau – Tag 31 von 67'],[68,'Monat 3–4 – Tag 68'],[129,'Erhaltung']];
  for(const [tag,titel] of faelle){
    await tagSetzen(tag);
    const txt=await karte().innerText();
    ok(txt.includes(titel),`Tag ${tag}: Titel „${titel}“`);
    const zeilen=await pg.locator('#heute-banner .dk-row').count();
    ok(zeilen>=6,`Tag ${tag}: ${zeilen} Zeilen im Tagesablauf`);
    const medZeilen=await pg.locator('#heute-banner .dk-med').allInnerTexts();
    if(tag>=3&&tag<=6){
      ok(medZeilen.filter(t=>t.startsWith('💊')).length===0,`Tag ${tag}: keine Präparate im Ablauf (Detox)`);
      ok(/Alle anderen Präparate pausieren/.test(txt),`Tag ${tag}: Pausen-Hinweis`);
      const aktiv=await pg.evaluate(()=>medsToday().filter(m=>!m.paused).map(m=>m.id));
      ok(aktiv.every(id=>id==='detox'),`Tag ${tag}: in der Checkliste nur Shakes aktiv (${[...new Set(aktiv)].join(',')})`);
      await pg.evaluate(()=>{entry(TK).sport=true;saveLog();renderHeute();});
      const sportAktiv=await pg.locator('#med-list .chk:not(.paused)').filter({hasText:/SMP|Recovery/}).count();
      ok(sportAktiv===0,`Tag ${tag}: Sport-Shakes pausiert`);
      ok(/nur leichte Bewegung/.test(await pg.locator('#train-list').innerText()),`Tag ${tag}: Hinweis in der Trainingskarte`);
    }
    if(tag===7){ok(medZeilen.some(t=>/Probiotikum/.test(t))&&medZeilen.some(t=>/Darmbasis\+ 2/.test(t)),'Tag 7: Probiotikum und Darmbasis 2 EL im Ablauf');}
    if(tag===14){ok(medZeilen.some(t=>/Darmbasis\+ 1/.test(t)),'Tag 14: Darmbasis 1 EL');}
    if(tag===68){ok(!medZeilen.some(t=>/Butyzol/.test(t)),'Tag 68: Butyzol nicht mehr dabei');}
    if([0,1,3,7,9,31].includes(tag)||tag===129)await pg.screenshot({path:path.join(OUT,'tag'+String(tag).padStart(3,'0')+'.png'),fullPage:true});
  }

  // 4) Gesamtübersicht
  await tagSetzen(3);
  await pg.locator('#heute-banner details summary').click();
  const plan10=await pg.locator('#heute-banner .dk-plan > div').count();
  ok(plan10===plan.darmkur.abschnitte.length,'Übersicht: '+plan10+' Abschnitte');
  ok(await pg.locator('#heute-banner .dk-plan .jetzt').count()===1,'Übersicht: aktueller Abschnitt markiert');
  await pg.locator('#heute-banner .dk').screenshot({path:path.join(OUT,'uebersicht.png')});

  // 5) Ohne darmkur-Block: alter Kurzhinweis
  const ohne={...plan};delete ohne.darmkur;
  await setze({...basis,kurStart:plusTage(heute(),-2),kurStartManuell:true},ohne);
  ok(await karte().count()===0&&/Darmkur Tag 3/.test(await pg.locator('#heute-banner').innerText()),'Ohne darmkur-Block: Kurzhinweis wie bisher');

  // 6) Nachladen ohne Passwort: mit altem Plan entsperren, dann liegt der neue plan.enc.json bereit
  const PW=process.argv[4],ALT=process.argv[5];
  if(PW&&ALT){
    await setze({...basis,kurStart:null},ohne);
    await pg.route('**/plan.enc.json*',r=>r.fulfill({contentType:'application/json',body:fs.readFileSync(ALT,'utf8')}));
    await pg.evaluate(()=>showPage&&showPage('mehr')).catch(()=>{});
    await pg.evaluate(pw=>{document.getElementById('plan-pw').value=pw;document.getElementById('plan-unlock').click();},fs.readFileSync(PW,'utf8').trim());
    await pg.waitForFunction(()=>!!localStorage.getItem('gp_plan_iv'),null,{timeout:15000});
    ok(await pg.evaluate(()=>!plan.darmkur),'Entsperrt mit altem Plan (ohne darmkur)');
    await pg.unroute('**/plan.enc.json*');
    const neu=await pg.evaluate(async()=>{planLetzterCheck=0;return await planLaden();});
    ok(neu&&await pg.evaluate(s=>!!plan.darmkur&&set.kurStart===s,plan.darmkur.start),'Neuer Plan ohne Passwort nachgeladen, Startdatum gesetzt');
    ok(await pg.evaluate(async()=>{whoop=null;return await whoopLaden(true);}),'WHOOP danach weiter lesbar');
  } else console.log('(Nachlade-Test übersprungen – Passwortdatei und alter plan.enc.json fehlen)');
  ok(errs.length===0,'keine Fehler in der Konsole'+(errs.length?': '+errs.join(' | '):''));
  await b.close();srv.close();
  console.log(fehler?fehler+' FEHLER':'ALLES OK');process.exit(fehler?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
