const CACHE_NAME='san-finance-alpha3-planning-business-v1';
const FILES=["./", "./index.html", "./manifest.webmanifest", "./icon-72.png", "./icon-96.png", "./icon-128.png", "./icon-144.png", "./icon-152.png", "./icon-180.png", "./icon-192.png", "./icon-384.png", "./icon-512.png", "./icon-maskable-512.png", "./splash-1170x2532.png", "./splash-1284x2778.png", "./splash-1125x2436.png", "./splash-828x1792.png", "./splash-1242x2688.png"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html')))
  );
});
