/* Nimmt ein kurzes Video der Heute-Ansicht mit Demo-WHOOP-Daten auf (für Posts – nur Demo, keine echten Werte).
   Aufruf: node test/video-whoop.js <Ausgabe.mp4>   (Playwright aus dbcc-360-crm, ffmpeg im PATH oder unter WinGet) */
const path=require('path');const fs=require('fs');const http=require('http');const os=require('os');const {execFileSync}=require('child_process');
const {chromium}=require('C:/Users/Mario/Desktop/claude-code/BCC-Zentrale/01_Kunden/dbcc-GmbH/projekte/dbcc-360-crm/node_modules/playwright');
const root=path.join(__dirname,'..');const ZIEL=process.argv[2]||path.join(root,'Gesundheits-App-WHOOP.mp4');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'video-'));
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}const t={'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(f)]||'text/plain';r.setHeader('content-type',t);r.end(fs.readFileSync(f))}).listen(8768,'127.0.0.1');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await chromium.launch();
  // Aufnahme in 780×1688: Fenster doppelt so groß, Seite per zoom 2 auf Handy-Breite gebracht (Playwright skaliert Videos nicht hoch)
  const ctx=await b.newContext({viewport:{width:780,height:1688},deviceScaleFactor:1,locale:'de-AT',recordVideo:{dir:tmp,size:{width:780,height:1688}}});
  await ctx.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.zoom='2';});});
  const pg=await ctx.newPage();
  await pg.goto('http://127.0.0.1:8768/index.html?demo=1',{waitUntil:'load'});await pause(1800);
  // langsam zur WHOOP-Karte scrollen
  const y=await pg.evaluate(()=>document.getElementById('whoop-card').getBoundingClientRect().top+window.scrollY-70);
  const steps=60;for(let i=1;i<=steps;i++){await pg.evaluate(v=>window.scrollTo(0,v),y*i/steps);await pause(45);}
  await pause(2200);
  // Details aufklappen und langsam durchscrollen
  await pg.locator('#whoop-card details summary').click();await pause(1200);
  const y2=await pg.evaluate(()=>document.body.scrollHeight-window.innerHeight);
  const st2=70;for(let i=1;i<=st2;i++){await pg.evaluate(o=>window.scrollTo(0,o.a+(o.b-o.a)*o.i/o.n),{a:y,b:y2,i,n:st2});await pause(60);}
  await pause(2500);
  await ctx.close();await b.close();srv.close();
  const webm=fs.readdirSync(tmp).find(f=>f.endsWith('.webm'));
  const ff=process.env.FFMPEG||'C:/Users/Mario/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
  execFileSync(ff,['-y','-loglevel','error','-i',path.join(tmp,webm),'-vf','scale=780:1688','-c:v','libx264','-pix_fmt','yuv420p','-crf','22','-movflags','+faststart',ZIEL]);
  fs.rmSync(tmp,{recursive:true,force:true});
  console.log('Video:',ZIEL,Math.round(fs.statSync(ZIEL).size/1024)+' KB');
})();
