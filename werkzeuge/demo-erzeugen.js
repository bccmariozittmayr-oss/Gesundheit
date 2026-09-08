/* Erzeugt aus der privaten mein-plan.json eine Demo-Fassung ohne Befunde, Diagnosen und
   Termine (mein-plan.demo.json) sowie ein Demo-Protokoll mit einigen Tagen Verlauf
   (demo-protokoll.json, in der App unter Mehr → Protokoll wiederherstellen laden).
   Aufruf:  node werkzeuge/demo-erzeugen.js <Pfad/mein-plan.json> [Enddatum JJJJ-MM-TT]
   Die private Eingabedatei bleibt außerhalb des Repos. */
const fs=require('fs'),path=require('path');
const src=process.argv[2]; if(!src){console.error('Aufruf: node demo-erzeugen.js <mein-plan.json> [Enddatum]');process.exit(1);}
const ende=process.argv[3]||new Date().toISOString().slice(0,10);
const p=JSON.parse(fs.readFileSync(src,'utf8'));
const root=path.join(__dirname,'..');

// ---- Plan bereinigen ----
const d={...p};
delete d.arztbriefDatum;
d._hinweis='DEMO-Fassung: echter Einnahmeplan, aber ohne Befunde, Diagnosen und Termine. Zum Ausprobieren und für Vorführungen.';
d.quelle='dieFITMACHER, Einnahmeplan (Demo-Fassung ohne Befunde)';
d.diagnosen=['Demo: keine Diagnosen hinterlegt'];
d.befunde=[{name:'Beispielwert (Demo)',wert:'–',ref:'–',status:'ok',datum:'',bedeutung:'Im echten Plan stehen hier die Laborwerte aus dem Arztbrief, mit Referenzbereich und Bedeutung.'}];
d.termine=[{name:'Kontroll-Blutabnahme',datum:'Jänner 2027',details:'Demo-Eintrag'}];
d.bedarf=(p.bedarf||[]).filter(b=>!/B-Komplex|Infusion|IHHT|Arginin/i.test(b.name)).map(b=>({...b,wann:(b.wann||'').replace(/\s*\(Arztbrief\)/,'')}));
if(d.persoenlich){
  d.persoenlich={...d.persoenlich,kost:(d.persoenlich.kost||[]).map(k=>k.replace(/\s*\(.*?\)/g,'')),
    meiden:(d.persoenlich.meiden||[]).map(m=>({...m,grund:/Ernährungsberater/.test(m.grund||'')?m.grund:'Unverträglichkeit'}))};
}
if(d.training&&d.training.puls)d.training={...d.training,puls:{...d.training.puls,quelle:'Leistungstest am Rad'}};
fs.writeFileSync(path.join(root,'mein-plan.demo.json'),JSON.stringify(d,null,1)+'\n');

// ---- Protokoll mit Verlauf ----
const day=s=>{const [y,m,dd]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,dd));};
const key=t=>t.toISOString().slice(0,10);
const anker=day(d.anker.plan);
const log={};
const tage=[];for(let i=5;i>=0;i--){const t=new Date(day(ende));t.setUTCDate(t.getUTCDate()-i);if(t>=anker)tage.push(t);}
const wochenTraining=d.training&&d.training.woche||{};
const muster=[ // Hals, Bauch (0–3), Stress (0–10), Schlaf, Gewicht, Kaffee
  [2,2,6,6.5,84.2,3],[2,1,5,7,84.0,2],[1,1,4,7.5,83.8,2],[1,1,4,7,83.7,2],[1,0,3,8,83.5,2],[0,0,3,7.5,83.4,1]];
tage.forEach((t,i)=>{
  const off=Math.round((t-anker)/86400000);
  const planned=[];
  d.praeparate.forEach(m=>{ if(m.anker==='kur')return; const ph=(m.phasen||[]).find(x=>off>=x.abTag&&(x.bisTag==null||off<=x.bisTag)); if(!ph)return;
    ['nu','m','mi','a','n'].forEach(s=>{if(ph[s]>0)planned.push(m.id+'_'+s);}); });
  const meds={};planned.forEach((k,j)=>{meds[k]=!(i===1&&j%6===5);}); // ein Tag mit vergessenen Einnahmen
  const wd=String(t.getUTCDay());const tr=wochenTraining[wd]||[];
  const training={},trainingMin={};tr.forEach((x,j)=>{training['t'+j]=true;trainingMin['t'+j]=/EMS/.test(x.name)?20:(/lang/.test(x.name)?150:(/Kraft/.test(x.name)?45:(/Biken/.test(x.name)?75:30)));});
  const sport=tr.some(x=>x.zone!=='A'||/Biken/.test(x.name));
  if(sport){(d.sport||[]).filter(s=>s.zeitpunkt==='waehrend'||s.zeitpunkt==='danach').forEach(s=>{const k='sport_'+s.name.replace(/\W/g,'')+'_sp';planned.push(k);meds[k]=true;});}
  const mu=muster[Math.min(i,muster.length-1)];
  const e={hals:mu[0],bauch:mu[1],stress:mu[2],schlaf:mu[3],gewicht:mu[4],kaffee:mu[5],notiz:'',meds,medsPlanned:planned,
    atmen:{am:true,at:i!==2,ab:true},training,trainingMin,sport};
  log[key(t)]=e;
});
const set={times:{},atimes:{},notif:false,kurStart:null,medOverride:{}};
fs.writeFileSync(path.join(root,'demo-protokoll.json'),JSON.stringify({log,set},null,1)+'\n');
console.log('Demo-Plan:',d.praeparate.length,'Präparate; Protokoll:',Object.keys(log).join(', '));
