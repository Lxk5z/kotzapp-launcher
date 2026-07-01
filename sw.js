self.skipWaiting();

const CACHE_NAME = "kotzapp-" + Date.now();
const CDN_BASE = "https://cdn.jsdelivr.net/gh/Lxk5z/kotzapp-web@latest";
const STATIC_ASSETS = [
  "/",

  // HTML
  "/index.html",
  "/404.html",
  "/messenger.html",
  "/login.html",

  // CSS
  `${CDN_BASE}/style.css`,
  `${CDN_BASE}/login.css`,
  `${CDN_BASE}/messenger.css`,

  // JAVA-SCRIPT
  `${CDN_BASE}/main.js`,
  `${CDN_BASE}/messenger.js`,
  `${CDN_BASE}/online-ping.js`,

  // /FONTS
  `${CDN_BASE}/fonts/aclonica.css`,
  `${CDN_BASE}/fonts/aclonica-v25-latin-regular.woff2`,

  // /IMAGES
  `${CDN_BASE}/images/logo-clean.png`,
  `${CDN_BASE}/images/chat-bg.png`,
  `${CDN_BASE}/images/kotzapp.webp`,
  `${CDN_BASE}/images/kotzapp-red.webp`,

  // /IMAGES/ICONS
        `${CDN_BASE}/images/icons/ai_logo.png`,
      
  // /IMAGES/USERS
  `${CDN_BASE}/images/users/classchat.png`,
  `${CDN_BASE}/images/users/online.png`,

  // /IMAGES/USERS/BACKGROUNDS              -> Speicher sparen, daher auskommentiert
        // `${CDN_BASE}/images/users/backgrounds/background1.png`,
        // `${CDN_BASE}/images/users/backgrounds/background2.png`,
        // `${CDN_BASE}/images/users/backgrounds/background3.png`,
        // `${CDN_BASE}/images/users/backgrounds/background4.png`,
        // `${CDN_BASE}/images/users/backgrounds/background5.png`,
        // `${CDN_BASE}/images/users/backgrounds/background6.png`,
        // `${CDN_BASE}/images/users/backgrounds/background7.png`,
        // `${CDN_BASE}/images/users/backgrounds/background8.png`,
        // `${CDN_BASE}/images/users/backgrounds/background9.png`,
        // `${CDN_BASE}/images/users/backgrounds/background10.png`,
        // `${CDN_BASE}/images/users/backgrounds/background11.png`,
        // `${CDN_BASE}/images/users/backgrounds/background12.png`,
        // `${CDN_BASE}/images/users/backgrounds/background13.png`,
        // `${CDN_BASE}/images/users/backgrounds/background14.png`,
        // `${CDN_BASE}/images/users/backgrounds/background15.png`,
        // `${CDN_BASE}/images/users/backgrounds/background16.png`,
        // `${CDN_BASE}/images/users/backgrounds/background17.png`,
        // `${CDN_BASE}/images/users/backgrounds/background18.png`,
        // `${CDN_BASE}/images/users/backgrounds/background19.png`,
        // `${CDN_BASE}/images/users/backgrounds/background20.png`,
        // `${CDN_BASE}/images/users/backgrounds/background21.png`,
        // `${CDN_BASE}/images/users/backgrounds/background22.png`,
        // `${CDN_BASE}/images/users/backgrounds/background23.png`,
        // `${CDN_BASE}/images/users/backgrounds/background24.png`,
        // `${CDN_BASE}/images/users/backgrounds/background25.png`,
        // `${CDN_BASE}/images/users/backgrounds/background26.png`,
        // `${CDN_BASE}/images/users/backgrounds/background27.png`,
        // `${CDN_BASE}/images/users/backgrounds/background28.png`,
        // `${CDN_BASE}/images/users/backgrounds/background29.png`,
        // `${CDN_BASE}/images/users/backgrounds/background30.png`,
];

/* =========================
   LISTEN FOR MESSAGES (VOM BUTTON) 👋
========================= */
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "FORCE_HARD_RESET") {
    console.log("Hard-Reset Signal erhalten! Kicke alten Cache... 🧹");
    
    // Lösche ALLE Caches restlos
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).then(() => {
        console.log("Caches komplett geleert! Überspringe Warten...");
        self.skipWaiting(); // Aktiviert den SW sofort!
      })
    );
  }
  
  if (event.data && event.data.action === "skipWaiting") {
     self.skipWaiting();
  }
});

/* =========================
   INSTALL
========================= */
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Auch beim normalen Update nicht warten
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Installiere Assets in neuen Cache:", CACHE_NAME);
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Löscht alte Caches, falls noch Reste existieren
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
                console.log("Lösche alten Cache:", key);
                return caches.delete(key);
            }
          })
        )
      ),
      self.clients.claim()
    ])
  );
});

/* =========================
   FETCH (MAGIE ✨)
========================= */
const API_BASE = "https://kotzapp.onrender.com";
const SUPABASE_HOST = "supabase.co";

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const requestUrl = new URL(req.url);
  const isApiRequest = requestUrl.href.startsWith(API_BASE) || requestUrl.href.includes(SUPABASE_HOST);

  if (isApiRequest) {
    event.respondWith(
      fetch(req.clone())
        .then((res) => res)
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((res) => {
        if (!res || res.status !== 200) return res;

        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, resClone);
        });

        return res;
      }).catch(() => caches.match(req));
    })
  );
});