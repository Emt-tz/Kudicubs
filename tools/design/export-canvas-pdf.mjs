// Renders every Design-canvas board (.dc.html) to an image, then assembles one PDF.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const [,, projDir, outDir, brandDir] = process.argv;
const canvas = JSON.parse(fs.readFileSync(path.join(projDir,'canvas.json'),'utf8'));
const blobs = {
 '052d859f6cfb6ba016f71e72ddd4b5b5':'logo-on-white.png','5686708e623a872a20b21d49a072ea85':'logo-on-yellow.png',
 '99b23ccfe9664e4aac19be05e83141b3':'logo-on-brown.png','48e3ae69e739b1993bd3c631e26d7f36':'kudi-wave.png',
 '185ccbfb57f26e82918f50db31e80c83':'kudi-celebrate.png','3945593096f79c0f3e00e5f36a410711':'kudi-thumbs-up.png',
 '278605869ebee984d68ed953129b40ea':'kudi-headphones.png','80e75a58bc65899a4a056e43f4b66545':'kudi-fist.png'};
fs.mkdirSync(path.join(outDir,'img'),{recursive:true});
const browser = await chromium.launch(); 
const ctx = await browser.newContext({deviceScaleFactor:1.5});
const page = await ctx.newPage();
const rows=[];
for (const f of canvas.order) {
  const b = canvas.boards[f]; if(!b) continue;
  let h = fs.readFileSync(path.join(projDir,f),'utf8');
  for (const [id,name] of Object.entries(blobs)) h = h.split('/_blob/'+id).join(pathToFileURL(path.join(brandDir,name)).href);
  h = h.replace(/<script src="\.\/support\.js"><\/script>/,'').replace(/<x-dc[^>]*>/,'<div id="dc">').replace(/<\/x-dc>/,'</div>')
       .replace(/<helmet>([\s\S]*?)<\/helmet>/,'$1');
  const tmp = path.join(outDir,'tmp.html'); fs.writeFileSync(tmp,h);
  await page.setViewportSize({width:b.w,height:b.h});
  await page.goto(pathToFileURL(tmp).href,{waitUntil:'networkidle'}).catch(()=>{});
  await page.evaluate(()=>document.fonts.ready);
  const out = path.join(outDir,'img',f.replace('.dc.html','.jpg'));
  await page.screenshot({path:out,type:'jpeg',quality:88,clip:{x:0,y:0,width:b.w,height:b.h}});
  rows.push({f,b,img:out});
}
fs.unlinkSync(path.join(outDir,'tmp.html'));
// group: title rows from notes by y
const titles = Object.values(canvas.notes).filter(n=>n.kind==='title1').sort((a,c)=>a.y-c.y);
const secFor = b => { let t=''; for(const n of titles) if(n.y<=b.y+1) t=n.text; return t; };
let css='', body='';
const sizes = new Map();
rows.forEach((r,i)=>{
  const key=`${r.b.w}x${r.b.h}`; const cls='p'+key.replace('x','_');
  if(!sizes.has(key)){ sizes.set(key,cls); css+=`@page ${cls}{size:${r.b.w}px ${r.b.h+56}px;margin:0}.${cls}{page:${cls}}\n`; }
  body+=`<section class="pg ${cls}" style="width:${r.b.w}px;height:${r.b.h+56}px"><header><b>${secFor(r.b)}</b> &nbsp;·&nbsp; ${r.b.title||r.f} <span>${i+1}/${rows.length}</span></header><img src="${pathToFileURL(r.img).href}" width="${r.b.w}" height="${r.b.h}"></section>\n`;
});
const html=`<!doctype html><meta charset=utf-8><style>${css}*{margin:0;padding:0}body{font-family:Helvetica,Arial,sans-serif}
.pg{break-after:page;overflow:hidden;background:#fff}header{height:56px;box-sizing:border-box;padding:0 16px;display:flex;align-items:center;font-size:14px;background:#3E2312;color:#FEF5E0;gap:6px;white-space:nowrap;overflow:hidden}header span{margin-left:auto;opacity:.7}img{display:block}</style>${body}`;
fs.writeFileSync(path.join(outDir,'book.html'),html);
await page.goto(pathToFileURL(path.join(outDir,'book.html')).href,{waitUntil:'load'});
await page.pdf({path:path.join(outDir,'KudiCubs-all-screens.pdf'),preferCSSPageSize:true,printBackground:true});
await browser.close(); console.log('boards',rows.length);
