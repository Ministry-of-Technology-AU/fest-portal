// Lets the portal's pages open without a connection. Data is handled by the
// app itself (lib/offline); this only caches the pages and their static files.
//
// - /_next/static/*: cache first (file names change with every build)
// - page loads: network first, falling back to the last copy of that page
//   if the network fails or takes too long
// - everything else (API calls, auth): straight to the network

const CACHE = 'fest-portal-v1'
const NAVIGATION_TIMEOUT_MS = 4000

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

/** Only real pages for a signed-in operator are worth keeping, not login redirects or errors */
function isCacheablePage(response) {
  return (
    response.ok &&
    !response.redirected &&
    (response.headers.get('content-type') || '').includes('text/html')
  )
}

async function cachePage(url) {
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!isCacheablePage(response)) return
  const cache = await caches.open(CACHE)
  await cache.put(new URL(url, self.location.origin).pathname, response.clone())

  // Also save the scripts and styles the page loads, in case it's never opened online
  const html = await response.text()
  const assets = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])
  await Promise.all([...assets].map((asset) => handleStatic(new Request(asset)).catch(() => {})))
}

async function handleNavigation(request) {
  const key = new URL(request.url).pathname
  const cache = await caches.open(CACHE)

  const network = fetch(request).then(async (response) => {
    if (isCacheablePage(response)) await cache.put(key, response.clone())
    return response
  })

  // If the saved copy is shown, a later network failure is expected, not an error
  network.catch(() => {})
  const timeout = new Promise((resolve) => setTimeout(resolve, NAVIGATION_TIMEOUT_MS))

  try {
    // On a slow connection, show the saved copy instead of a blank screen
    const response = await Promise.race([network, timeout])
    if (response) return response
    const cached = await cache.match(key)
    return cached || (await network)
  } catch {
    const cached = await cache.match(key)
    if (cached) return cached
    return new Response(
      '<!doctype html><meta name="viewport" content="width=device-width"><title>Offline</title>' +
        '<body style="font-family:system-ui;padding:2rem;text-align:center">' +
        '<h1>No connection</h1><p>This page hasn\'t been saved on this device yet. ' +
        'Open the Gate-In or Registration page while online to save it.</p>' +
        '<p><a href="/gate-in">Gate-In</a> · <a href="/registration">Registration</a></p></body>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

async function handleStatic(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStatic(request))
  } else if (request.mode === 'navigate' && !url.pathname.startsWith('/api/')) {
    event.respondWith(handleNavigation(request))
  }
})

// The app asks for its pages to be saved right after sign-in, so they open
// offline even if the operator never visited them on this device
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'warm' && Array.isArray(event.data.urls)) {
    event.waitUntil(Promise.all(event.data.urls.map((url) => cachePage(url).catch(() => {}))))
  }
})
