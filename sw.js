// 0. นำเข้าตัวแปร APP_VERSION จากไฟล์ version.js
importScripts('version.js');

// 1. กำหนดชื่อ Cache โดยอิงจาก APP_VERSION ที่ import มา
const CACHE_NAME = 'finance-manager-' + APP_VERSION;

// รายการไฟล์ที่ต้องการให้จำไว้ในเครื่อง
const ASSETS_TO_CACHE = [
  `./?v=${APP_VERSION}`,
  `./index.html?v=${APP_VERSION}`,
  `./version.js?v=${APP_VERSION}`,
  `./styles.css?v=${APP_VERSION}`,
  `./js/config.js?v=${APP_VERSION}`,
  `./js/state.js?v=${APP_VERSION}`,
  `./js/utils.js?v=${APP_VERSION}`,
  `./js/db.js?v=${APP_VERSION}`,
  `./js/firebase.js?v=${APP_VERSION}`,
  `./js/logic.js?v=${APP_VERSION}`,
  `./js/charts.js?v=${APP_VERSION}`,
  `./js/ui.js?v=${APP_VERSION}`,
  `./js/events.js?v=${APP_VERSION}`,
  `./js/main.js?v=${APP_VERSION}`,
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  
  // CDN Libraries
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js',
  'https://unpkg.com/@panzoom/panzoom@4.5.1/dist/panzoom.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

// 2. Event Install
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// รอรับคำสั่ง "skipWaiting" จากปุ่มกดหน้าเว็บ
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// 3. Event Activate
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated version:', APP_VERSION);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// 4. Event Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('googleapis.com/auth')) {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch((error) => {
         console.error('[Service Worker] Fetch failed:', error);
      });
    })
  );
});
