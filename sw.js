/* TeacherFlow service worker: precache penuh agar bisa dipakai offline sejak kunjungan pertama */
const VERSION='v3a6',CACHE='teacherflow-'+VERSION;
const ASSETS=["./", "index.html", "manifest.webmanifest", "assets/app.css", "assets/theme.css", "assets/fa/fa-brands-400.woff2", "assets/fa/fa-regular-400.woff2", "assets/fa/fa-solid-900.woff2", "assets/fa/fa-v4compatibility.woff2", "assets/fonts/poppins-latin-400-normal.woff2", "assets/fonts/poppins-latin-500-normal.woff2", "assets/fonts/poppins-latin-600-normal.woff2", "assets/fonts/poppins-latin-700-normal.woff2", "assets/fonts/poppins-latin-800-normal.woff2", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/icon.svg"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('teacherflow-')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin){
    /* Firebase/Google API tidak di-cache; modul gstatic (SDK Firebase) di-cache setelah dipakai sekali */
    if(u.host==='www.gstatic.com'&&u.pathname.includes('/firebasejs/'))e.respondWith(caches.open(CACHE+'-sdk').then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{c.put(r,x.clone());return x}))));
    return;
  }
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(x=>{const cp=x.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return x}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(x=>{if(x.ok){const cp=x.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return x})));
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l[0]?l[0].focus():clients.openWindow('./')))});
