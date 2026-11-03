'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const serviceContent=require('./assets/services.js');
const base=__dirname,port=Number(process.env.PORT||3000),password=process.env.ADMIN_PASSWORD;
if(!password||password.length<12){console.error('Configura ADMIN_PASSWORD con 12 caracteres como mínimo.');process.exit(1)}
const dataDir=path.resolve(process.env.DATA_DIR||path.join(base,'data'));fs.mkdirSync(dataDir,{recursive:true});
const settingsPath=path.join(dataDir,'settings.json'),sessions=new Map(),key=crypto.randomBytes(32);
const esc=s=>JSON.stringify(s).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028');
function settings(){try{return JSON.parse(fs.readFileSync(settingsPath,'utf8'))}catch{return {}}}
function page(filename){const template=fs.readFileSync(path.join(base,filename),'utf8');return template.replace('<script id="siteDefaultConfig" type="application/json">{}</script>',`<script id="siteDefaultConfig" type="application/json">${esc(settings())}</script>`)}
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Cache-Control':'no-store'};
function send(res,status,body,contentType='text/html; charset=utf-8',extra={}){res.writeHead(status,{...headers,'Content-Type':contentType,...extra});res.end(body)}
function auth(req){const token=/(?:^|;\s*)spa_session=([0-9a-f]+)/.exec(req.headers.cookie||'')?.[1];return token&&sessions.get(token)>Date.now()?token:null}
function body(req,max=15*1024*1024){return new Promise((resolve,reject)=>{const a=[];let n=0;req.on('data',chunk=>{n+=chunk.length;if(n>max){reject(Error('Archivo demasiado grande'));req.destroy()}else a.push(chunk)});req.on('end',()=>resolve(Buffer.concat(a).toString('utf8')));req.on('error',reject)})}
const loginHtml=fs.readFileSync(path.join(base,'login.html'),'utf8');
const form=msg=>loginHtml.replace('<!--LOGIN_ERROR-->',msg?'<p class="error" role="alert">La contraseña no es correcta. Inténtalo de nuevo.</p>':'');
const attempts=new Map();
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),pathname=url.pathname;
 if(pathname.startsWith('/assets/')&&req.method==='GET'){
  const name=pathname.slice(8);
  if(!/^(?:photo-\d+\.webp|service-(?:recovery|laser|facial)\.webp|effects\.css|effects\.js|site\.css|site\.js|services\.js|admin\.js)$/.test(name))return send(res,404,'No encontrado','text/plain');
  const file=path.join(base,'assets',name);
  if(!fs.existsSync(file))return send(res,404,'No encontrado','text/plain');
  const mime={'.webp':'image/webp','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'}[path.extname(file)];
  return send(res,200,fs.readFileSync(file),mime,{'Cache-Control':path.extname(file)==='.webp'?'public, max-age=300':'no-store'});
 }
 if(pathname==='/'&&req.method==='GET')return send(res,200,page('public.html'));
 if(pathname==='/admin/login'&&req.method==='GET')return send(res,200,form(false));
 if(pathname==='/admin/login'&&req.method==='POST'){
  const ip=req.socket.remoteAddress||'unknown',rec=attempts.get(ip)||{n:0,until:0};if(rec.until>Date.now())return send(res,429,'Demasiados intentos. Intenta más tarde.');
  try{const input=new URLSearchParams(await body(req,2048)).get('password')||'',a=crypto.createHash('sha256').update(input).digest(),b=crypto.createHash('sha256').update(password).digest();if(crypto.timingSafeEqual(a,b)){attempts.delete(ip);const token=crypto.randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600*1000);return send(res,303,'','text/plain', {'Location':'/admin','Set-Cookie':`spa_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`})}rec.n++;if(rec.n>=5){rec.until=Date.now()+15*60*1000;rec.n=0}attempts.set(ip,rec);return send(res,401,form(true))}catch{return send(res,400,'Solicitud inválida')}
 }
 if(pathname==='/admin/logout'){const token=auth(req);if(token)sessions.delete(token);return send(res,303,'','text/plain',{'Location':'/','Set-Cookie':'spa_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})}
 if(pathname==='/admin'&&req.method==='GET'){if(!auth(req))return send(res,303,'','text/plain',{'Location':'/admin/login'});return send(res,200,page('admin.html'))}
 if(pathname==='/api/admin/settings'&&req.method==='PUT'){
  if(!auth(req))return send(res,401,JSON.stringify({error:'Sesión caducada'}),'application/json');
  if(req.headers.origin){try{const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)return send(res,403,'Origen no permitido')}catch{return send(res,403,'Origen no permitido')}}
  try{const data=JSON.parse(await body(req));if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Datos inválidos');
   const allowed=['businessName','phone','whatsapp','email','address','maps','facebook','instagram','instagramReel','videoUrl','googleBusiness','googleReview','googleReviews','tiktok','booking'];const out={};
   for(const k of allowed)out[k]=typeof data[k]==='string'?data[k].slice(0,2000):'';
   if(out.whatsapp){const digits=out.whatsapp.replace(/\D/g,'');if(!/^[+0-9 ()-]+$/.test(out.whatsapp)||!/^[1-9]\d{7,14}$/.test(digits))throw Error('WhatsApp inválido: incluye código de país y entre 8 y 15 dígitos.');out.whatsapp=digits}
   out.services=serviceContent.normalize(data.services);
   if(data.serviceCatalogVersion===1){out.serviceCatalogVersion=1;for(const item of Object.values(out.services))if(!item.title||!item.summary)throw Error('Cada servicio necesita nombre y resumen.');}
   out.photos={};if(data.photos&&typeof data.photos==='object')for(const [k,v] of Object.entries(data.photos)){if(!/^\d{1,2}$/.test(k)||+k>11||!v||typeof v!=='object')continue;const o={fit:v.fit==='contain'?'contain':'cover',x:Math.min(100,Math.max(0,Number.isFinite(Number(v.x))?Number(v.x):50)),y:Math.min(100,Math.max(0,Number.isFinite(Number(v.y))?Number(v.y):50))};if(typeof v.src==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(v.src)&&v.src.length<3*1024*1024)o.src=v.src;out.photos[k]=o}
   const temp=settingsPath+'.tmp';fs.writeFileSync(temp,JSON.stringify(out));fs.renameSync(temp,settingsPath);return send(res,200,JSON.stringify({ok:true}),'application/json')
  }catch(e){return send(res,400,JSON.stringify({error:e.message}),'application/json')}
 }
 return send(res,404,'Página no encontrada','text/plain');
}).listen(port,()=>console.log(`Angel Med Spa en http://localhost:${port}`));
