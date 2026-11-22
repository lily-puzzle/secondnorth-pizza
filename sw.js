/* NORTHSIDE PIZZA Ver.48 - offline cache. Local save data is never deleted. */
const CACHE_VERSION='northside-pizza-v48-pwa-20261122-1';
const CORE_FILES=[
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png',
  './icons/apple-touch-icon.png','./icons/favicon.png'
];
self.addEventListener('install', event=>{
  event.waitUntil(caches.open(CACHE_VERSION)
    .then(cache=>cache.addAll(CORE_FILES))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith('northside-pizza-')&&key!==CACHE_VERSION).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const scopePath=new URL('./',self.location.href).pathname;
  if(!url.pathname.startsWith(scopePath))return;
  if(request.mode==='navigate'){
    // Network first for updates, fall back to an offline shell.
    event.respondWith(fetch(request).then(async response=>{
      if(response.ok){
        const cache=await caches.open(CACHE_VERSION);
        await cache.put('./index.html',response.clone());
      }
      return response;
    }).catch(async()=>{
      const cache=await caches.open(CACHE_VERSION);
      return (await cache.match('./index.html'))||(await cache.match('./'))||Response.error();
    }));
    return;
  }
  event.respondWith(caches.open(CACHE_VERSION).then(cache=>cache.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok)event.waitUntil(cache.put(request,response.clone()));
    return response;
  }))));
});
