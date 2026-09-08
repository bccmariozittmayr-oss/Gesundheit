/* Erzeugt erfundene WHOOP-Tageswerte für die Demo (whoop.demo.json) – 14 Tage, plausible Kurven, keine echten Daten.
   Der Demo-Start (?demo=1) verschiebt die Tage so, dass der letzte Tag = heute ist.
   Aufruf: node werkzeuge/whoop-demo-erzeugen.js */
const fs=require('fs'),path=require('path');
const tage={};const N=14;const base=new Date('2026-09-09T00:00:00Z');
const rec=[71,64,38,55,82,77,46,69,90,61,33,74,86,68];
const sport=['cycling','walking',null,'cycling',null,'running','hiking',null,'cycling','walking',null,'cycling','running',null];
const r1=x=>Math.round(x*10)/10;
for(let i=0;i<N;i++){
  const k=new Date(base.getTime()-(N-1-i)*86400000).toISOString().slice(0,10);
  const r=rec[i];const hrv=r1(28+r*0.35+(i%3)*1.5);const rhp=Math.round(62-r*0.12+(i%2));
  const std=r1(6.2+r/50+(i%4)*0.15);const tief=r1(std*0.22),rem=r1(std*0.24),wach=r1(0.3+(100-r)/200),leicht=r1(std-tief-rem);
  const w=sport[i]?[{sport:sport[i],start:k+'T15:30:00Z',minuten:sport[i]==='running'?35:sport[i]==='hiking'?110:50,strain:r1(sport[i]==='hiking'?11.5:8+(i%3)),pulsAvg:sport[i]==='walking'?102:sport[i]==='hiking'?118:131,pulsMax:sport[i]==='walking'?121:155,km:sport[i]==='walking'?5.2:sport[i]==='running'?6.1:sport[i]==='hiking'?9.4:24.8,hoehenmeter:sport[i]==='hiking'?540:sport[i]==='cycling'?180:null,zonenMin:sport[i]==='walking'?[5,30,15,0,0,0]:sport[i]==='hiking'?[8,40,45,15,2,0]:[3,12,22,10,3,0]}]:[];
  tage[k]={recovery:r,hrv,ruhepuls:rhp,spo2:r1(95.5+r/60),hauttemp:r1(33.1+(i%3)*0.2),strain:r1(w.length?w[0].strain+3.5:5.5+(i%4)*0.8),kcal:Math.round(2150+(w.length?w[0].minuten*7:0)),pulsAvg:Math.round(64+(w.length?6:0)),pulsMax:w.length?w[0].pulsMax:128,
    schlaf:{start:new Date(new Date(k).getTime()-2.2*3600000).toISOString(),ende:new Date(new Date(k).getTime()+(5.9+std-std*0.9)*3600000).toISOString(),stunden:std,imBett:r1(std+wach),leistung:Math.min(100,Math.round(std/8.1*100)),effizienz:r1(100-wach/(std+wach)*100),konsistenz:Math.round(70+r/6),tief,rem,leicht,wach,zyklen:3+(std>7?1:0),stoerungen:Math.round(6+(100-r)/8),atemfrequenz:r1(14.6+(i%3)*0.3),bedarf:8.1},
    workouts:w};
}
const out={quelle:'WHOOP (Demo, erfundene Werte)',stand:'2026-09-09T06:15:00Z',koerper:{groesse:1.8,gewicht:80.4,maxPuls:186},tage};
const ziel=path.join(__dirname,'..','whoop.demo.json');fs.writeFileSync(ziel,JSON.stringify(out));
console.log('geschrieben:',ziel,Object.keys(tage).length,'Tage');
