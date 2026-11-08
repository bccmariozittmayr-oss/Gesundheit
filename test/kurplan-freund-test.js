/* Prüft den Kurplan für Freunde: Ein Link für alle, das Passwort entscheidet, welcher Plan aufgeht.
   - Freundes-Passwort: Kurplan öffnet, eigene Bereiche (Kosten, WHOOP, Körperwerte) sind ausgeblendet,
     es werden keine eigenen Daten (whoop/withings/kosten.enc.json) abgerufen, Darmkur-Karte läuft.
   - Eigenes Passwort: eigener Plan wie bisher, nichts ausgeblendet.
   - Falsches Passwort: „Passwort falsch“, kein Plan.
   Aufruf: node test/kurplan-freund-test.js <Ausgabeordner> <Freundes-Passwortdatei> <eigene Passwortdatei>
   Passwörter bleiben in den Dateien außerhalb des Repos und werden nicht ausgegeben. */
const path=require('path'),fs=require('fs'),http=require('http');
const {chromium}=require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const root=path.join(__dirname,'..');
const [OUT,PWF,PWE]=process.argv.slice(2);
if(!OUT||!PWF||!PWE){console.error('Aufruf: node test/kurplan-freund-test.js <Ausgabeordner> <Freundes-Passwortdatei> <eigene Passwortdatei>');process.exit(1);}
fs.mkdirSync(OUT,{recursive:true});
const TYP={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.statusCode=404;return r.end();}r.setHeader('content-type',TYP[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(r);}).listen(8767);
const heute=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const plusTage=(k,n)=>{const d=new Date(k+'T00:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
let fehler=0;const ok=(c,t)=>{console.log((c?'OK   ':'FEHLER ')+t);if(!c)fehler++;};

async function frischesHandy(b){
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'de-AT',serviceWorkers:'block'});
  const pg=await ctx.newPage();const abrufe=[];const errs=[];
  pg.on('request',q=>abrufe.push(new URL(q.url()).pathname));
  pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://127.0.0.1:8767/index.html',{waitUntil:'load'});await pg.waitForTimeout(400);
  return {ctx,pg,abrufe,errs};
}
async function entsperren(pg,pw){
  await pg.locator('nav button[data-p=mehr]').click();
  await pg.fill('#plan-pw',pw);await pg.locator('#plan-unlock').click();
  await pg.waitForFunction(()=>document.getElementById('plan-unlock').textContent.includes('entsperren'),null,{timeout:20000});
  await pg.waitForTimeout(1500);
}
const sichtbar=(pg,sel)=>pg.locator(sel).first().isVisible();

(async()=>{
  const b=await chromium.launch();
  const pwF=fs.readFileSync(PWF,'utf8').trim(),pwE=fs.readFileSync(PWE,'utf8').trim();

  // 1) Freund: frisches Handy, gleicher Link, sein Passwort
  {const {ctx,pg,abrufe,errs}=await frischesHandy(b);
    await entsperren(pg,pwF);
    const st=await pg.evaluate(()=>({q:localStorage.getItem('gp_planquelle'),gast:document.body.classList.contains('gast'),quelle:plan&&plan.quelle,n:plan&&plan.praeparate.length,ids:plan&&plan.praeparate.map(m=>m.id),befunde:!!(plan&&plan.befunde),training:!!(plan&&plan.training)}));
    ok(st.q==='"plaene/kur-1.enc.json"','Freund: Kurplan aus plaene/kur-1.enc.json geöffnet');
    ok(st.gast,'Freund: Gast-Modus aktiv');
    ok(/Kurplan für Freunde/.test(st.quelle||''),'Freund: Plan-Quelle „Kurplan für Freunde“');
    ok(st.n===5&&!st.ids.includes('buty'),'Freund: 5 Kur-Präparate nach Broschüre, kein Butyzol ('+(st.ids||[]).join(',')+')');
    ok(!st.befunde&&!st.training,'Freund: keine Befunde, kein Training im Plan');
    ok(!(await sichtbar(pg,'#kosten-open'))&&!(await sichtbar(pg,'#whoop-refresh'))&&!(await sichtbar(pg,'#koerper-refresh')),'Freund: Kosten, WHOOP, Körperwerte ausgeblendet');
    await pg.screenshot({path:path.join(OUT,'freund-mehr.png'),fullPage:true});
    // Kurstart setzen wie er es tun würde, dann Heute ansehen (Tag 9 = erster Tag Regeneration)
    await pg.evaluate(k=>{const e=document.getElementById('kur-start');e.value=k;e.dispatchEvent(new Event('change'));},plusTage(heute(),-8));
    await pg.locator('nav button[data-p=heute]').click();await pg.waitForTimeout(400);
    const karte=await pg.locator('#heute-banner .dk').innerText().catch(()=> '');
    ok(/Regeneration – Tag 9 von 30/.test(karte),'Freund: Darmkur-Karte auf Heute (Tag 9)');
    ok(!/Butyzol|Paprika|Essigwasser|80 %/.test(karte),'Freund: keine persönlichen Regeln auf der Karte');
    await pg.screenshot({path:path.join(OUT,'freund-heute-tag9.png'),fullPage:true});
    await pg.evaluate(k=>{const e=document.getElementById('kur-start');e.value=k;e.dispatchEvent(new Event('change'));},plusTage(heute(),-29));
    await pg.locator('nav button[data-p=heute]').click();await pg.waitForTimeout(300);
    ok(/Stabilisierung/.test(await pg.locator('#heute-banner .dk').innerText().catch(()=> '')),'Freund: Tag 30 = Stabilisierung');
    // Essen-Seite mit Scanner und Rezepten erreichbar
    await pg.locator('nav button[data-p=essen]').click();await pg.waitForTimeout(300);
    ok(await pg.locator('button[data-sub=scan]').count()===1,'Freund: Essen mit Scan-Reiter vorhanden');
    // Neu laden: bleibt beim Kurplan
    await pg.reload({waitUntil:'load'});await pg.waitForTimeout(800);
    ok(await pg.evaluate(()=>document.body.classList.contains('gast')&&/Kurplan für Freunde/.test(plan.quelle)),'Freund: nach Neuladen weiter Kurplan');
    const eigene=abrufe.filter(a=>/whoop\.enc|withings\.enc|kosten\.enc/.test(a));
    ok(eigene.length===0,'Freund: keine eigenen Daten abgerufen ('+eigene.length+')');
    ok(errs.length===0,'Freund: keine Skriptfehler'+(errs.length?' – '+errs[0]:''));
    await ctx.close();}

  // 2) Eigenes Passwort: wie bisher
  {const {ctx,pg,abrufe,errs}=await frischesHandy(b);
    await entsperren(pg,pwE);
    const st=await pg.evaluate(()=>({q:localStorage.getItem('gp_planquelle'),gast:document.body.classList.contains('gast'),n:plan&&plan.praeparate.length}));
    ok(st.q==='"plan.enc.json"'&&!st.gast,'Eigen: eigener Plan, kein Gast-Modus');
    ok(st.n>5,'Eigen: alle eigenen Präparate ('+st.n+')');
    ok(await sichtbar(pg,'#kosten-open')&&await sichtbar(pg,'#whoop-refresh'),'Eigen: Kosten und WHOOP sichtbar');
    ok(abrufe.some(a=>/whoop\.enc/.test(a)),'Eigen: WHOOP-Werte werden geladen');
    ok(errs.length===0,'Eigen: keine Skriptfehler'+(errs.length?' – '+errs[0]:''));
    await ctx.close();}

  // 3) Falsches Passwort
  {const {ctx,pg}=await frischesHandy(b);
    await pg.locator('nav button[data-p=mehr]').click();
    await pg.fill('#plan-pw','Falsch-Falsch-Falsch-123');await pg.locator('#plan-unlock').click();
    await pg.waitForFunction(()=>document.getElementById('plan-unlock').textContent.includes('entsperren'),null,{timeout:20000});
    const t=await pg.locator('.toast').innerText();
    ok(/Passwort falsch/.test(t)&&await pg.evaluate(()=>!plan),'Falsch: „Passwort falsch“, kein Plan');
    await ctx.close();}

  await b.close();srv.close();
  console.log(fehler?fehler+' FEHLER':'Alles OK');process.exit(fehler?1:0);
})().catch(e=>{console.error(e);srv.close();process.exit(1);});
