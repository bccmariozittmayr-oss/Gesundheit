/* Prüft den Kur-Speiseplan: richtige Kost je Kurtag (halb, flüssig, Shakes, weich, normal), Bürotage
   mit doppelt gekochtem Vorabend und Box, Fleisch-Grenze, Abwechslung, Einkaufsblöcke ab Samstag,
   Tauschen und Neu-Mischen sowie die Anzeige auf „Heute“, im Wochenplan und in der Einkaufsliste.
   Aufruf: node test/speiseplan-test.js <Ausgabeordner> <Plan-Datei mit darmkur-Block>
   Der echte Plan bleibt außerhalb des Repos und wird nur als Pfad übergeben. */
const path=require('path'),fs=require('fs'),http=require('http');
const {chromium}=require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const root=path.join(__dirname,'..');
const OUT=process.argv[2],PLAN=process.argv[3];
if(!OUT||!PLAN){console.error('Aufruf: node test/speiseplan-test.js <Ausgabeordner> <Plan-Datei>');process.exit(1);}
fs.mkdirSync(OUT,{recursive:true});
const plan=JSON.parse(fs.readFileSync(PLAN,'utf8'));
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}r.setHeader('content-type',{'.html':'text/html','.js':'text/javascript','.json':'application/json'}[path.extname(f)]||'text/plain');r.end(fs.readFileSync(f))}).listen(8767,'127.0.0.1');
const heute=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const plusTage=(k,n)=>{const d=new Date(k+'T00:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
let fehler=0;const ok=(c,t)=>{console.log((c?'OK   ':'FEHLER ')+t);if(!c)fehler++;};

(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'de-AT',serviceWorkers:'block'});const pg=await ctx.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load/.test(m.text()))errs.push(m.text())});
  await pg.goto('http://127.0.0.1:8767/index.html',{waitUntil:'load'});await pg.waitForTimeout(400);
  // Start so legen, dass heute Tag 0 ist (Plan aktiv, alle 30 Tage in der Zukunft) – Wochentage wie beim echten Start
  const start=plusTage(heute(),1);
  const setze=async(extra={})=>{await pg.evaluate(([p,s,x])=>{localStorage.clear();localStorage.setItem('gp_plan',JSON.stringify(p));localStorage.setItem('gp_set',JSON.stringify(s));Object.entries(x).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));},
    [plan,{times:{},atimes:{},notif:false,medOverride:{},kurStart:start,kurStartManuell:true},extra]);await pg.reload({waitUntil:'load'});await pg.waitForTimeout(300);};
  await setze();
  const M=await pg.evaluate(()=>{const t=kurMenue();const R=id=>{const r=REZ(id);return {id:r.id,name:r.name,kur:r.kur||[],box:!!r.box,fleisch:!!r.fleisch};};
    return Object.values(t).map(d=>({...d,wd:new Date(d.datum+'T00:00:00').getDay(),wk:mondayOf(d.datum),F:d.f&&R(d.f),Mi:d.m&&R(d.m),A:d.a&&R(d.a)}));});
  const dk=plan.darmkur,ohne=(dk.ohneRezepte||[]).map(x=>x.id||x),bt=dk.buerotage||[];
  ok(M.length===(dk.menueBisTag||30),'Speiseplan für '+M.length+' Tage');
  const T=n=>M.find(d=>d.tag===n);
  ok([3,4,5,6].every(n=>!T(n).f&&!T(n).m&&!T(n).a),'Tag 3–6: kein Essen, nur Shakes');
  ok(T(1).typ==='halb'&&(dk.fruehstueck||[]).includes(T(1).f),'Tag 1: halbe Portion, Hafer-Frühstück');
  ok([2,7].every(n=>[T(n).F,T(n).Mi,T(n).A].filter(Boolean).every(r=>r.kur.includes('fluessig'))),'Tag 2 und 7: nur Flüssiges (Smoothie, Joghurt, Suppe)');
  ok([T(8).F,T(8).Mi,T(8).A].filter(Boolean).every(r=>r.kur.includes('weich')),'Tag 8: nur Weiches');
  const alle=M.flatMap(d=>[d.f,d.m,d.a]).filter(Boolean);
  ok(!alle.some(id=>ohne.includes(id)),'Gesperrte Rezepte (Kohl, Kokosmilch, Käse) kommen nicht vor');
  ok(alle.every(id=>!!id),'Kein Tag ohne passendes Rezept');
  // Bürotage
  const bueroTage=M.filter(d=>bt.includes(d.wd)&&d.typ!=='keins'&&d.tag>1);
  ok(bueroTage.length>0,'Bürotage im Plan: '+bueroTage.map(d=>'Tag '+d.tag).join(', '));
  ok(bueroTage.every(d=>d.box&&d.m===T(d.tag-1).a&&T(d.tag-1).doppelt),'Bürotag: Mittag = Box vom doppelt gekochten Vorabend');
  ok(bueroTage.every(d=>T(d.tag-1).A.box),'Vorabend-Gericht eignet sich für die Box');
  ok(bueroTage.every(d=>d.typ==='normal'||d.Mi.kur.includes(d.typ)),'Box passt auch zur Kost am Bürotag');
  ok(M.filter(d=>d.doppelt).every(d=>bueroTage.some(x=>x.tag===d.tag+1)),'Doppelt kochen nur vor einem Bürotag');
  // Fleisch und Abwechslung
  const fl={};M.forEach(d=>[d.Mi,d.A].filter(r=>r&&r.fleisch).forEach(()=>fl[d.wk]=(fl[d.wk]||0)+1));
  ok(Object.values(fl).every(n=>n<=2),'Fleisch max. 2× je Kalenderwoche ('+JSON.stringify(fl)+')');
  const folge=M.filter(d=>d.tag>1&&d.m&&d.a).every(d=>{const g=T(d.tag-1);return !(d.a===g.a)&&(d.box||!(d.m===g.m||d.m===g.a));});
  ok(folge,'Kein Gericht an zwei Tagen hintereinander (außer der Box)');
  const viel=new Set(M.filter(d=>d.tag>=9).flatMap(d=>[d.m,d.a])).size;
  ok(viel>=12,'Abwechslung Tag 9–30: '+viel+' verschiedene Gerichte');
  // Einkauf
  const bl=await pg.evaluate(()=>kurEinkaufsBloecke().map(b=>({von:b.von,bis:b.bis,wd:new Date(b.datum+'T00:00:00').getDay(),n:kurEinkaufsListe(b).length})));
  ok(bl[0].von===1,'Erster Einkaufsblock ab Tag 1 (Tag '+bl[0].von+'–'+bl[0].bis+')');
  ok(bl.slice(1).every(x=>x.wd===(dk.einkaufstag??6)),'Weitere Blöcke beginnen am Einkaufstag: '+bl.map(x=>x.von+'–'+x.bis).join(', '));
  ok(bl.every(x=>x.n>3),'Jede Einkaufsliste hat Zutaten');
  // Stabil, tauschen, neu mischen
  await pg.reload({waitUntil:'load'});await pg.waitForTimeout(300);
  const M2=await pg.evaluate(()=>JSON.stringify(Object.values(kurMenue()).map(d=>[d.f,d.m,d.a])));
  ok(M2===JSON.stringify(M.map(d=>[d.f,d.m,d.a])),'Nach dem Neuladen derselbe Plan');
  const vor=bueroTage[0].tag-1;
  const tausch=await pg.evaluate(t=>{const alt=kurMenue()[t].a;kurTausch(t,'a');const d=kurMenue();return {alt,neu:d[t].a,box:d[t+1].m,doppelt:d[t].doppelt};},vor);
  ok(tausch.neu&&tausch.neu!==tausch.alt&&tausch.box===tausch.neu&&tausch.doppelt,'Tausch am Vorabend: neues Gericht, Box am Bürotag zieht mit');
  const misch=await pg.evaluate(()=>{const a=JSON.stringify(Object.values(kurMenue()).map(d=>[d.m,d.a]));$('woche-neu').click();return a!==JSON.stringify(Object.values(kurMenue()).map(d=>[d.m,d.a]));});
  ok(misch,'„Neu mischen“ ergibt einen anderen Plan');
  // Anzeige auf „Heute“
  await setze();
  const zeigeTag=async n=>{await pg.evaluate(k=>{TK=k;renderHeute();},plusTage(start,n-1));return pg.locator('#heute-banner .dk').innerText();};
  let txt=await pg.locator('#heute-banner .dk').innerText();
  ok(/Morgen essen/.test(txt)&&/Heute vorbereiten/.test(txt),'Vortag: „Morgen essen“ und „Heute vorbereiten“');
  await pg.screenshot({path:path.join(OUT,'sp-tag00.png'),fullPage:true});
  txt=await zeigeTag(1);
  ok(await pg.locator('#heute-banner .dk-meal').count()===3,'Tag 1: drei Gerichte im Tagesablauf');
  ok(/½ Portion/.test(txt),'Tag 1: „½ Portion“ markiert');
  ok(/Präparate heute/.test(txt),'Tag 1: Präparate-Box');
  ok(!/Pflicht[^\n]*Bittersalz/.test(txt)&&/Nur bei Bedarf[^\n]*Bittersalz/.test(txt),'Tag 1: Bittersalz nur „bei Bedarf“, nicht Pflicht');
  await pg.screenshot({path:path.join(OUT,'sp-tag01.png'),fullPage:true});
  const bt1=bueroTage[0].tag;
  txt=await zeigeTag(bt1-1);ok(/×2 kochen/.test(txt)&&/doppelt kochen/.test(txt),'Vorabend Bürotag (Tag '+(bt1-1)+'): doppelt kochen + Vorbereiten');
  txt=await zeigeTag(bt1);ok(/Box vom Vorabend/.test(txt),'Bürotag (Tag '+bt1+'): Box vom Vorabend');
  ok(await pg.locator('#heute-banner .dk-meal').filter({hasText:'Box vom Vorabend'}).locator('.dk-swap').count()===0,'Box-Mittag ohne Tausch-Knopf');
  await pg.screenshot({path:path.join(OUT,'sp-buero.png'),fullPage:true});
  txt=await zeigeTag(4);ok(/Keine – auch keine Dauer/.test(txt)&&await pg.locator('#heute-banner .dk-meal').count()===0,'Detox-Tag: keine Gerichte, keine Präparate');
  txt=await zeigeTag(14);ok(/Wegen der Kur \(Pflicht\)/.test(txt),'Tag 14: Kur-Präparate als Pflicht');
  const vorTausch=await pg.locator('#heute-banner .dk-meal b').nth(1).innerText();
  await pg.locator('#heute-banner .dk-swap').nth(1).click();await pg.waitForTimeout(150);
  ok(await pg.locator('#heute-banner .dk-meal b').nth(1).innerText()!==vorTausch,'🔀 auf „Heute“ tauscht das Gericht');
  // Wochenplan und Einkauf
  await pg.evaluate(()=>{gotoPage('essen');});await pg.waitForTimeout(150);
  await pg.evaluate(()=>{document.querySelectorAll('.sub').forEach(s=>s.classList.toggle('on',s.id==='s-woche'));renderWoche();});
  ok(/Darmkur/.test(await pg.locator('#woche-info').innerText())&&await pg.locator('#woche .day').count()===7,'Wochenplan zeigt 7 Kurtage');
  ok(/Nur die 7 Shakes/.test(await pg.locator('#woche').innerText()),'Wochenplan: Shake-Tage markiert');
  await pg.screenshot({path:path.join(OUT,'sp-woche.png'),fullPage:true});
  await pg.evaluate(()=>{document.querySelectorAll('.sub').forEach(s=>s.classList.toggle('on',s.id==='s-einkauf'));renderEinkauf();});
  ok(await pg.locator('#kur-bloecke button').count()===bl.length,'Einkauf: '+bl.length+' Blöcke wählbar');
  await pg.locator('#einkauf .chk').first().click();await pg.waitForTimeout(100);
  ok(await pg.locator('#einkauf .chk.done').count()===1&&!!(await pg.evaluate(()=>Object.keys(LS.get('gp_kurshop',{})).length)),'Einkauf: Haken wird gemerkt');
  await pg.screenshot({path:path.join(OUT,'sp-einkauf.png'),fullPage:true});
  // Nach der Kur: normaler Wochenplan
  await pg.evaluate(()=>{set.kurStart='2020-01-01';kurMenueCache=null;renderWoche();});
  ok(/ab /.test(await pg.locator('#woche-info').innerText()),'Nach Tag 30: wieder der normale Wochenplan');
  // Übersicht für die Durchsicht (nur in den Ausgabeordner)
  fs.writeFileSync(path.join(OUT,'kur-menue.txt'),M.map(d=>`Tag ${String(d.tag).padStart(2)} ${d.datum} ${['So','Mo','Di','Mi','Do','Fr','Sa'][d.wd]} ${d.typ.padEnd(8)} | F: ${d.F?.name||'–'} | M: ${d.Mi?.name||'–'}${d.box?' [Box]':''} | A: ${d.A?.name||'–'}${d.doppelt?' [×2]':''}`).join('\n')+'\n');
  ok(!errs.length,'Keine JS-Fehler'+(errs.length?': '+errs.join(' | '):''));
  await b.close();srv.close();
  console.log(fehler?`\n${fehler} FEHLER`:'\nAlles grün');process.exit(fehler?1:0);
})().catch(e=>{console.error(e);srv.close();process.exit(1);});
