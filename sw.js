const C="loan-tracker-v3";

const F=[
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./config.js",
  "./manifest.json"
];

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(C)
      .then(c=>c.addAll(F))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(k=>k!==C)
          .map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    fetch(e.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(C).then(c=>c.put(e.request,copy));
        return response;
      })
      .catch(()=>caches.match(e.request))
  );
});
