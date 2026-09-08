/* Prüft die WHOOP-Anbindung in der App ohne echte Daten:
   verschlüsselt Beispielplan + erfundene WHOOP-Werte mit einem Testpasswort, entsperrt den Plan in der App
   und kontrolliert, dass whoop.enc.json automatisch nachgeladen und auf Heute/Verlauf/Mehr angezeigt wird.
   Aufruf: node test/whoop-test.js <Ausgabeordner>   (Playwright aus dbcc-360-crm) */
const path=require('path');const fs=require('fs');const http=require('http');const os=require('os');
const {webcrypto}=require('crypto');const subtle=webcrypto.subtle;
const {chromium}=require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const root=path.join(__dirname,'..');const OUT=process.argv[2]||os.tmpdir();fs.mkdirSync(OUT,{recursive:true});
const PW='Test-Wort-Wort-Wort-1234';const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'whoop-test-'));
const b64=a=>Buffer.from(a).toString('base64');
async function enc(text,salt,stand){const e=new TextEncoder();const iv=webcrypto.getRandomValues(new Uint8Array(12));const iterations=1000; // wenig Iterationen: nur Test
  const base=await subtle.importKey('raw',e.encode(PW),'PBKDF2',false,['deriveKey']);
  const key=await subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt']);
  const ct=new Uint8Array(await subtle.encrypt({name:'AES-GCM',iv},key,e.encode(text)));
  return JSON.stringify({v:1,kdf:'PBKDF2-SHA256',iterations,salt:b64(salt),iv:b64(iv),data:b64(ct),stand});}
const heute=new Date().toISOString().slice(0,10);const tagVor=n=>new Date(Date.now()-n*86400000).toISOString().slice(0,10);
function whoopDaten(stand,mitHeute){const tage={};for(let i=7;i>=(mitHeute?0:1);i--){const k=tagVor(i);const rec=[82,55,30,71,64,90,45,68][i];
  tage[k]={recovery:rec,hrv:40+i*2.5,ruhepuls:50+i,strain:8+i*0.7,kcal:2200+i*50,pulsAvg:66,pulsMax:140,
    schlaf:{stunden:6.5+i*0.2,imBett:7.5+i*0.2,leistung:80+i,effizienz:90.5,konsistenz:75,tief:1.4,rem:1.6,leicht:3.3,wach:0.5,zyklen:4,stoerungen:8,atemfrequenz:15.2,bedarf:8.1},
    spo2:96.2,hauttemp:33.4,workouts:i%2?[{sport:'cycling',start:k+'T16:00:00Z',minuten:45,strain:9.1,pulsAvg:128,pulsMax:151,km:21.3,zonenMin:[2,10,20,10,3,0]}]:[]};}
  return JSON.stringify({quelle:'WHOOP',stand,koerper:{groesse:1.8,gewicht:80,maxPuls:185},tage});}
(async()=>{
  const salt=webcrypto.getRandomValues(new Uint8Array(16));
  fs.writeFileSync(path.join(tmp,'plan.enc.json'),await enc(fs.readFileSync(path.join(root,'mein-plan.beispiel.json'),'utf8'),salt,'2026-09-01'));
  fs.writeFileSync(path.join(tmp,'whoop.enc.json'),await enc(whoopDaten('2026-09-08T05:00:00Z',false),salt,'2026-09-08T05:00:00Z'));
  const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';let f=path.join(tmp,p);if(!fs.existsSync(f))f=path.join(root,p);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}const t={'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(f)]||'text/plain';r.setHeader('content-type',t);r.end(fs.readFileSync(f))}).listen(8767,'127.0.0.1');
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'de-AT'});const pg=await ctx.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
  const out=[],fail=[];
  await pg.goto('http://127.0.0.1:8767/index.html',{waitUntil:'load'});await pg.waitForTimeout(300);
  out.push('ohne Plan – WHOOP-Karte leer: '+((await pg.locator('#whoop-card').innerHTML()).trim()===''));
  // Plan entsperren → Schlüssel gespeichert → whoop.enc.json wird nachgeladen
  await pg.locator('nav button[data-p=mehr]').click();await pg.fill('#plan-pw',PW);await pg.locator('#plan-unlock').click();await pg.waitForTimeout(1200);
  const st=await pg.locator('#whoop-status').innerText();out.push('Mehr-Status: '+st);if(!/7 Tage geladen/.test(st))fail.push('WHOOP nicht nachgeladen');
  await pg.locator('nav button[data-p=heute]').click();await pg.waitForTimeout(200);
  let card=(await pg.locator('#whoop-card').innerText()).replace(/\n/g,' | ');out.push('Heute (gestern-Stand): '+card.slice(0,260));
  if(!/heute noch nicht bewertet/.test(card))fail.push('Gestern-Kennzeichnung fehlt');if(!/55 %/.test(card))fail.push('Recovery gestern (55) fehlt');
  await pg.screenshot({path:path.join(OUT,'whoop-heute-alt.png'),fullPage:true});
  // Schlaf ins Protokoll übernommen?
  const schlafGestern=await pg.evaluate(k=>(JSON.parse(localStorage.getItem('gp_log'))[k]||{}).schlaf,tagVor(1));out.push('Schlaf gestern im Protokoll: '+schlafGestern+' (nur wenn Eintrag existierte)');
  // Neue Datei mit heutigem Tag → beim Zurückkehren in die App automatisch geholt
  fs.writeFileSync(path.join(tmp,'whoop.enc.json'),await enc(whoopDaten('2026-09-08T06:30:00Z',true),salt,'2026-09-08T06:30:00Z'));
  await pg.evaluate(()=>{whoopLetzterCheck=0;});await pg.reload({waitUntil:'load'});await pg.waitForTimeout(1200);
  card=(await pg.locator('#whoop-card').innerText()).replace(/\n/g,' | ');out.push('Heute (nach Reload, Schlüssel aus IndexedDB): '+card.slice(0,260));
  if(!/82 %/.test(card))fail.push('Recovery heute (82) fehlt – Nachladen ohne Passwort klappt nicht');if(!/Grünes Licht/.test(card))fail.push('Empfehlung fehlt');
  const schlafHeute=await pg.evaluate(k=>(JSON.parse(localStorage.getItem('gp_log'))[k]||{}).schlaf,heute);out.push('Schlaf heute im Protokoll: '+schlafHeute);if(schlafHeute!==6.5)fail.push('Schlaf heute nicht übernommen');
  const eh=await pg.evaluate(k=>JSON.parse(localStorage.getItem('gp_log'))[k],heute);out.push('Heute automatisch: Gewicht '+eh.gewicht+' Sport '+eh.sport+' Hinweis: '+await pg.locator('#save-info').innerText());if(eh.gewicht!==80)fail.push('Gewicht nicht übernommen');if(eh.sport!==false&&eh.sport!==undefined)fail.push('Sport heute (kein Workout) falsch gesetzt');
  const eg=await pg.evaluate(k=>JSON.parse(localStorage.getItem('gp_log'))[k],tagVor(1));out.push('Gestern automatisch: '+JSON.stringify(eg&&{schlaf:eg.schlaf,sport:eg.sport}));
  await pg.locator('#whoop-card details summary').click();const det=(await pg.locator('#whoop-card details').innerText()).replace(/\n/g,' | ');out.push('Details: '+det.slice(0,200));if(!/Tiefschlaf|Kalorien/.test(det))fail.push('Detailansicht fehlt');
  await pg.screenshot({path:path.join(OUT,'whoop-heute.png'),fullPage:true});
  await pg.locator('nav button[data-p=verlauf]').click();await pg.waitForTimeout(200);
  const v=(await pg.locator('#whoop-verlauf').innerText()).replace(/\n/g,' | ');out.push('Verlauf: '+v.slice(0,300));if(!/Ø Erholung/.test(v)||!/cycling 45 Min/.test(v))fail.push('Verlauf unvollständig');
  await pg.screenshot({path:path.join(OUT,'whoop-verlauf.png'),fullPage:true});
  // Falsches Passwort darf nichts kaputt machen
  await pg.locator('nav button[data-p=mehr]').click();await pg.fill('#plan-pw','falsch-falsch-falsch');await pg.locator('#plan-unlock').click();await pg.waitForTimeout(800);
  out.push('Nach falschem Passwort Status: '+await pg.locator('#whoop-status').innerText());
  console.log(out.join('\n'));console.log('ERRORS:',errs.length?errs.join('\n'):'keine');if(errs.length)fail.push('Browserfehler');
  console.log(fail.length?'FEHLGESCHLAGEN: '+fail.join(', '):'WHOOP-TEST OK');
  await b.close();srv.close();fs.rmSync(tmp,{recursive:true,force:true});process.exit(fail.length?1:0);
})();
