const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const dataDir = mkdtempSync(path.join(tmpdir(), 'angel-spa-test-'));
const password = crypto.randomBytes(24).toString('hex');
const base = 'http://127.0.0.1:3097';
const child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: '3097', ADMIN_PASSWORD: password, DATA_DIR: dataDir, NODE_ENV: 'test' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
(async()=>{
let browser;
try {
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timed out')),10000);child.once('error',reject);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('exit',code=>reject(Error('Server stopped: '+code)))});
 assert.equal((await fetch(base)).status,200);
 assert.equal((await fetch(base+'/assets/site.css')).status,200);assert.equal((await fetch(base+'/assets/site.js')).headers.get('cache-control'),'no-store');
 assert.equal((await fetch(base+'/assets/photo-1.webp')).status,200);
 assert.equal((await fetch(base+'/assets/../server.js')).status,404);
 assert.equal((await fetch(base+'/admin',{redirect:'manual'})).status,303);
 assert.equal((await fetch(base+'/api/admin/settings',{method:'PUT',body:'{}'})).status,401);
 const bad=await fetch(base+'/admin/login',{method:'POST',body:'password=wrong'});assert.equal(bad.status,401);assert.match(await bad.text(),/role="alert"/);
 const login=await fetch(base+'/admin/login',{method:'POST',body:new URLSearchParams({password}),redirect:'manual'});assert.equal(login.status,303);
 const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
 assert.equal((await fetch(base+'/admin',{headers:{cookie}})).status,200);
 const settings={businessName:'Angel Med Spa & Wellness',address:'Orlando, Florida',phone:'+14075550999',email:'example@example.com',booking:'https://example.com/book',instagram:'https://www.instagram.com/angelmedspa/',instagramReel:'https://www.instagram.com/reel/De9bdqOJ9yF/',videoUrl:'https://example.com/video.mp4',photos:{'1':{fit:'cover',x:40,y:60}}};
 assert.equal((await fetch(base+'/api/admin/settings',{method:'PUT',headers:{cookie,'Content-Type':'application/json',origin:'https://invalid.example'},body:JSON.stringify(settings)})).status,403);
 assert.equal((await fetch(base+'/api/admin/settings',{method:'PUT',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({...settings,whatsapp:'123'})})).status,400);
 assert.equal((await fetch(base+'/api/admin/settings',{method:'PUT',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({...settings,services:{recovery:{videoUrl:'javascript:alert(1)'}}})})).status,400);
 const save=await fetch(base+'/api/admin/settings',{method:'PUT',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify(settings)});assert.equal(save.status,200);assert.match(await (await fetch(base)).text(),/https:\/\/example.com\/video.mp4/);
 console.log('PASS: public assets, protected routes, login, origin check and persistent settings.');
 if(process.env.PLAYWRIGHT_MODULE){
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE);browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Restore default settings before public-page tests.
 await fetch(base+'/api/admin/settings',{method:'PUT',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({...settings,videoUrl:'',photos:{}})});
 for (const legacy of [true,false]) {
 await page.route(base+'/',async route=>{const response=await route.fetch();let html=await response.text();html=legacy?html.replace('id="bookingUnavailable"','id="instagramBooking"'):html.replace(/<div class="appointment-form" id="bookingUnavailable"[^>]*>.*?<\/div>/,'');await route.fulfill({response,body:html})});
 await page.goto(base);assert.equal(await page.locator('#bookingUnavailable').isVisible(),true);assert.equal(await page.locator('#instagramBooking').count(),0);assert.equal(await page.locator('#appointmentForm').isVisible(),false);
 await page.unroute(base+'/');
 }
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 assert.equal((await fetch(base+'/assets/effects.js')).status,200);
 assert.equal((await fetch(base+'/assets/effects.css')).status,200);
 await page.locator('[data-filter=skin]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.treatment:visible').count(),1);
 await page.locator('.treatment:visible summary').click();assert.equal(await page.locator('.treatment:visible details').getAttribute('open'),'');
 await page.locator('[data-filter=all]').click();assert.equal(await page.locator('.treatment:visible').count(),2);
 await page.locator('.treatment[data-category=skin] summary').click();
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.hero-visual').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.add('is-visible'));scrollTo({top:0,behavior:'instant'})});await page.waitForTimeout(800);
await page.screenshot({path:path.join(process.env.TEMP,'angel-spa-desktop.png'),fullPage:true});
 assert.equal(await page.locator('#bookingUnavailable').isVisible(),true);assert.equal(await page.locator('#appointmentForm').isVisible(),false);
 await page.selectOption('#language','en');assert.match(await page.locator('h1').innerText(),/Your wellbeing/);await page.selectOption('#language','es');
 assert.equal(await page.locator('#tratamientos a[href*=instagram]').count(),0);assert.equal(await page.locator('#socialInstagram').isVisible(),true);assert.equal(await page.locator('#socialTikTok').isVisible(),false);
 await page.setViewportSize({width:390,height:844});await page.goto(base);
 await page.locator('[data-filter=skin]').click();assert.equal(await page.locator('.treatment:visible').count(),1);await page.locator('[data-filter=all]').click();
 await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.8){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,80))}scrollTo({top:0,behavior:'instant'})});await page.waitForTimeout(800);
 await page.screenshot({path:path.join(process.env.TEMP,'angel-spa-mobile.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#menuToggle').click();await page.locator('#navLinks a').first().click();assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'false');
 await page.goto(base+'/admin');await page.fill('#password',password);await page.locator('#togglePassword').click();assert.equal(await page.locator('#password').getAttribute('type'),'text');await page.locator('button[type=submit]').click();await page.waitForURL('**/admin');await page.locator('[name=whatsapp]').fill('+14075550123');await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();
 await page.goto(base);assert.equal(await page.locator('#appointmentForm').isVisible(),true);await page.locator('[data-service="Faciales y piel"]').click();assert.equal(await page.locator('#service').inputValue(),'Faciales y piel');
 await page.route('https://wa.me/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>WhatsApp test destination</p>'}));
 async function verifyWhatsApp(number){
  await page.goto(base);await page.locator('#name').fill('Ana & María');await page.locator('#phone').fill('+57 300 123 4567');await page.selectOption('#service','Faciales y piel');await page.locator('#message').fill('Quiero consultar disponibilidad.');
  const requested=page.waitForRequest(r=>r.url().startsWith('https://wa.me/'));await page.locator('#appointmentForm button[type=submit]').click();const request=await requested;const destination=new URL(request.url());assert.equal(destination.pathname,'/'+number);assert.match(destination.searchParams.get('text'),/Ana & María/);assert.match(destination.searchParams.get('text'),/Faciales y piel/);assert.match(destination.searchParams.get('text'),/Quiero consultar disponibilidad/);
 }
 await verifyWhatsApp('14075550123');
 await page.goto(base+'/admin');await page.locator('[name=whatsapp]').fill('+57 300 123 4567');await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();await verifyWhatsApp('573001234567');
 await page.goto(base+'/admin');await page.locator('[name=whatsapp]').fill('');await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();await page.goto(base);assert.equal(await page.locator('#bookingUnavailable').isVisible(),true);assert.equal(await page.locator('#appointmentForm').isVisible(),false);assert.equal(await page.locator('#bookingUnavailable a').count(),0);
 await page.goto(base+'/admin');
 await page.locator('[name=tiktok]').fill('https://www.tiktok.com/@angelmedspa');
 await page.locator('[name=recovery_details]').fill('Descripción personalizada.\n\nSegundo párrafo <script>alert(1)</script>');
 await page.locator('[name=recovery_videoUrl]').fill('https://youtu.be/abcdefghijk');
 await page.locator('[name=skin_videoUrl]').fill('https://example.com/facial.mp4');
 await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();
 await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>Embedded video test</p>'}));
 await page.goto(base);assert.equal(await page.locator('#socialTikTok').getAttribute('href'),'https://www.tiktok.com/@angelmedspa');assert.equal(await page.locator('#tratamientos a[href*=instagram]').count(),0);
 const recovery=page.locator('.treatment[data-category=recovery]');await recovery.locator('summary').click();assert.match(await recovery.locator('[data-service-field=details]').innerText(),/Segundo párrafo <script>/);assert.equal(await recovery.locator('script').count(),0);await recovery.locator('iframe').waitFor();assert.match(await recovery.locator('iframe').getAttribute('src'),/youtube-nocookie.com\/embed\/abcdefghijk/);assert.equal(new URL(page.url()).origin,base);
 await recovery.locator('summary').click();await recovery.locator('iframe').waitFor({state:'detached'});
 const skin=page.locator('.treatment[data-category=skin]');await skin.locator('summary').click();await skin.locator('video').waitFor();assert.equal(await skin.locator('video').getAttribute('src'),'https://example.com/facial.mp4');await skin.locator('summary').click();await skin.locator('video').waitFor({state:'detached'});
 await page.goto(base+'/admin');assert.match(await page.locator('[name=recovery_details]').inputValue(),/Segundo párrafo/);await page.locator('[name=recovery_videoUrl]').fill('https://example.com/not-a-video');await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'MP4/WebM'}).waitFor();await page.locator('#discard').click();assert.equal(await page.locator('[name=recovery_videoUrl]').inputValue(),'https://youtu.be/abcdefghijk');
 await page.locator('[name=recovery_videoUrl]').fill('');await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();await page.goto(base);await recovery.locator('summary').click();assert.equal(await recovery.locator('.service-video').isVisible(),false);
 await page.goto(base+'/admin');await page.locator('[name=address]').fill('Pending edit');await page.locator('#discard').click();assert.equal(await page.locator('[name=address]').inputValue(),'Orlando, Florida');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const tikTokUrl='https://www.tiktok.com/@angelmedspa/video/7573392719318437150';
 const videoTools=require('../assets/services.js');
 assert.equal(videoTools.videoSource(tikTokUrl+'?_r=1').type,'tiktok');
 for(const badUrl of ['https://www.tiktok.com.evil.example/@angelmedspa/video/7573392719318437150','javascript:alert(1)','https://vm.tiktok.com/abc','https://www.tiktok.com/@angelmedspa'])assert.equal(videoTools.videoSource(badUrl),null);
 await page.locator('[name=recovery_videoUrl]').fill(tikTokUrl);await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();
 await page.route('https://www.tiktok.com/player/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>TikTok player test</p>'}));
 await page.goto(base);await recovery.locator('summary').click();await recovery.locator('iframe').waitFor();assert.equal(await recovery.locator('iframe').getAttribute('src'),'https://www.tiktok.com/player/v1/7573392719318437150?autoplay=0&rel=0');assert.equal(await recovery.locator('.video-fallback').getAttribute('href'),tikTokUrl);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await recovery.locator('summary').click();await recovery.locator('iframe').waitFor({state:'detached'});
 await page.goto(base+'/admin');assert.equal(await page.locator('[name=recovery_videoUrl]').inputValue(),tikTokUrl);
 console.log('PASS: TikTok URL validation, saved link, inline vertical player, fallback and teardown (player response mocked).');
 // Create, persist, select, discard deletion, delete, and retain an empty catalog.
 await page.locator('#addService').click();
 const editor=page.locator('[data-service-editor]').last();const newId=await editor.getAttribute('data-service-editor');
 await editor.locator('[data-service-key=title]').fill('Servicio de prueba');await editor.locator('[data-service-key=summary]').fill('Resumen de prueba');await editor.locator('[data-service-key=details]').fill('Detalles del servicio nuevo.');
 await editor.locator('[data-service-key=imageUrl]').fill('https://example.com/service.webp');
 await page.locator('[name=whatsapp]').fill('+14075550123');await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();
 await page.goto(base);assert.equal(await page.locator('.treatment').count(),3);await page.locator('[data-filter=wellness]').click();assert.equal(await page.locator('.treatment:visible').count(),1);assert.equal(await page.locator('.treatment:visible img').getAttribute('src'),'https://example.com/service.webp');await page.locator('.treatment:visible [data-service]').click();assert.equal(await page.locator('#service').inputValue(),'Servicio de prueba');
 await page.selectOption('#language','en');assert.equal(await page.locator('.treatment:visible h3').innerText(),'Servicio de prueba');await page.selectOption('#language','es');
 await page.goto(base+'/admin');await page.locator('[data-service-editor="'+newId+'"] button').click();await page.locator('#discard').click();assert.equal(await page.locator('[data-service-editor]').count(),3);
 while(await page.locator('[data-service-editor] button').count())await page.locator('[data-service-editor] button').first().click();
 await page.locator('#saveButton').click();await page.locator('#saveStatus').filter({hasText:'Cambios guardados'}).waitFor();await page.reload();assert.equal(await page.locator('[data-service-editor]').count(),0);
 await page.goto(base);assert.equal(await page.locator('.treatment').count(),0);assert.equal(await page.locator('#service [data-service-id]').count(),0);
 await page.goto(base+'/admin');await page.locator('#addService').click();await page.locator('#discard').click();assert.equal(await page.locator('[data-service-editor]').count(),0);
 console.log('PASS: service creation, persistence, image, category filtering, booking selection, deletion/discard and empty catalog.');
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(process.env.TEMP,'angel-spa-admin.png'),fullPage:true});await page.locator('a[href="/admin/logout"]').click();await page.goto(base+'/admin');assert.match(page.url(),/admin\/login/);await page.screenshot({path:path.join(process.env.TEMP,'angel-spa-login.png'),fullPage:true});assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile layouts, bilingual content, internal service descriptions/videos and separate social links, login/logout, admin save/discard, service selection and booking activation. Service filters, expandable cards and reduced-motion mode passed. WhatsApp destination, message, number changes, validation and disabled booking passed. No browser JavaScript errors.');
 }
} finally {if(browser)await browser.close();child.kill();await new Promise(resolve=>child.exitCode!==null?resolve():child.once('exit',resolve));rmSync(dataDir,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
