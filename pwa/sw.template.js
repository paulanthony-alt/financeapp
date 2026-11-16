/* FinPilot service worker. Built into dist/sw.js by the plugin in vite.config.js,
 * which fills in the build id and the list of files to cache. */
const BUILD = '__BUILD__'
const PRECACHE = __PRECACHE__
const CACHE = `finpilot-${BUILD}`
const scope = self.registration.scope
const abs = (p) => new URL(p, scope).href
const SHELL = abs('index.html')
// Files are matched by URL only. Servers often send "Vary: Origin", and module scripts
// carry an Origin header that the worker's own precache requests don't, which would
// otherwise make every cached file look like a miss.
const MATCH = { ignoreVary: true }

// Cache the whole app up front so every tab works offline after the first visit.
// No skipWaiting: a new version waits until old tabs close, so an open tab never
// loses the (hashed) files it still needs.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map(abs))))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('finpilot-') && k !== CACHE).map((k) => caches.delete(k)))),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // fonts etc. go straight to the network

  // Pages: network first so a new deploy shows up, cached copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(SHELL, copy))
          }
          return res
        })
        .catch(() => caches.match(SHELL, MATCH)),
    )
    return
  }

  // Nightly prices and IPO status: always try for fresh ones, fall back to the last copy offline.
  if (/\/(prices|ipo-status)\.json$/.test(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => caches.match(req, MATCH)),
    )
    return
  }

  // Everything else (hashed, immutable files): cache first.
  event.respondWith(
    caches.match(req, MATCH).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
