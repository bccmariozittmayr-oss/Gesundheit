/* Prueft das Nachtragen vergangener Tage auf der Seite "Heute".
   Aufruf: node test/nachtrag-test.js <Ausgabeordner> [pfad/zu/mein-plan.json] */
const path=require('path');const fs=require('fs');
const {chromium}=require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const http=require('http');
const root=path.join(__dirname,'..');
const OUT=process.argv[2];
const plan=fs.readFileSync(process.argv[3]||path.join(root,'mein-plan.beispiel.json'),'utf8');
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}const t={'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(f)]||'text/plain';r.setHeader('content-type',t);r.end(fs.readFileSync(f))}).listen(8767,'127.0.0.1');
const fail=[];const chk=(b,t)=>{if(!b)fail.push(t)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'de-AT'});const pg=await ctx.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 await pg.goto('http://127.0.0.1:8767/index.html',{waitUntil:'load'});await pg.waitForTimeout(300);
 await pg.evaluate(p=>localStorage.setItem('gp_plan',p),plan);
 await pg.reload({waitUntil:'load'});await pg.waitForTimeout(300);

 // heute: keine Nachtrag-Kennzeichnung, kein Vor-Knopf
 chk(!(await pg.locator('#tagnav').getAttribute('class')).includes('nachtrag'),'heute faelschlich als Nachtrag markiert');
 chk(await pg.locator('#tag-vor').isDisabled(),'Vor-Knopf am heutigen Tag nicht gesperrt');
 chk(!await pg.locator('#tag-heute').isVisible(),'Heute-Knopf am heutigen Tag sichtbar');
 const heuteMeds=await pg.locator('#med-list .chk').count();

 // einen Tag zurueck
 await pg.locator('#tag-zurueck').click();await pg.waitForTimeout(150);
 const nav=await pg.locator('#tagnav').innerText();
 console.log('Leiste gestern:', nav.replace(/\n/g,' | '));
 chk((await pg.locator('#tagnav').getAttribute('class')).includes('nachtrag'),'Nachtrag nicht gekennzeichnet');
 chk(/Gestern/.test(nav),'Wort "Gestern" fehlt');
 chk(await pg.locator('#tag-heute').isVisible(),'Heute-Knopf fehlt');
 chk(/Nachtrag/.test(await pg.locator('#hd-title').innerText()),'Kopfzeile zeigt keinen Nachtrag');

 // Supplement, Kaffee und Notiz fuer gestern eintragen
 chk(await pg.locator('#med-list .chk').count()===heuteMeds,'Praeparateliste fuer gestern leer/anders');
 await pg.locator('#med-list .chk').first().click();await pg.waitForTimeout(100);
 await pg.locator('#kaffee-plus').click();await pg.waitForTimeout(100);
 await pg.fill('#notiz','nachgetragen');await pg.waitForTimeout(100);
 await pg.screenshot({path:OUT+'/nachtrag.png',fullPage:true});

 // zurueck zu heute
 await pg.locator('#tag-heute').click();await pg.waitForTimeout(150);
 chk(!(await pg.locator('#tagnav').getAttribute('class')).includes('nachtrag'),'Ruecksprung auf heute misslungen');
 chk(await pg.locator('#kaffee-v').innerText()==='0','Kaffee von gestern landete bei heute');
 chk(await pg.inputValue('#notiz')==='','Notiz von gestern landete bei heute');

 const st=await pg.evaluate(()=>{const g=addDays(HEUTE,-1);return {gestern:log[g]?{kaffee:log[g].kaffee,notiz:log[g].notiz,meds:Object.values(log[g].meds).filter(Boolean).length}:null,heuteMeds:Object.values((log[HEUTE]||{meds:{}}).meds).filter(Boolean).length};});
 console.log('Gespeichert:',JSON.stringify(st));
 chk(st.gestern&&st.gestern.kaffee===1,'Kaffee nicht bei gestern gespeichert');
 chk(st.gestern&&st.gestern.notiz==='nachgetragen','Notiz nicht bei gestern gespeichert');
 chk(st.gestern&&st.gestern.meds===1,'Supplement nicht bei gestern gespeichert');
 chk(st.heuteMeds===0,'Supplement landete zusaetzlich bei heute');

 // Grenze: nicht in die Zukunft, nicht weiter als NACHTRAG_MAX zurueck
 const grenze=await pg.evaluate(async()=>{for(let i=0;i<40;i++)tagWechsel(-1);const min=TK;tagWechsel(1);const nachVor=TK;TK=HEUTE;renderHeute();tagWechsel(1);return {min,zurueck:daysBetween(min,HEUTE),nachVor,zukunft:TK===HEUTE};});
 console.log('Grenzen:',JSON.stringify(grenze));
 chk(grenze.zurueck===30,'Rueckgrenze nicht 30 Tage, sondern '+grenze.zurueck);
 chk(grenze.zukunft,'Sprung in die Zukunft moeglich');

 console.log('ERRORS:',errs.length?errs.join(' | '):'keine');
 if(errs.length)fail.push('JS-Fehler auf der Seite');
 console.log(fail.length?'FEHLGESCHLAGEN: '+fail.join(' | '):'NACHTRAG-TEST OK');
 await b.close();srv.close();process.exit(fail.length?1:0);
})();
