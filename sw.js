// 0. นำเข้าตัวแปร APP_VERSION จากไฟล์ version.js
importScripts('version.js');

// 1. กำหนดชื่อ Cache โดยอิงจาก APP_VERSION ที่ import มา
// (เมื่อแก้เลขใน version.js ชื่อ Cache จะเปลี่ยน และ Trigger การอัปเดตทันที)
const CACHE_NAME = 'finance-manager-' + APP_VERSION;

// รายการไฟล์ที่ต้องการให้จำไว้ในเครื่อง (เพื่อให้โหลดเร็วและใช้ Offline ได้)
const ASSETS_TO_CACHE = [
  `./?v=${APP_VERSION}`,
  `./index.html?v=${APP_VERSION}`,
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
  `./version.js?v=${APP_VERSION}`,
  `./styles.css?v=${APP_VERSION}`,
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  
  // CDN Libraries (เพื่อให้หน้าเว็บสวยและทำงานได้แม้เน็ตหลุด)
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

// 2. Event Install: ติดตั้งไฟล์ลงเครื่อง (แต่ยังไม่แย่งการทำงานทันที)
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version:', CACHE_NAME);

  // *** จุดสำคัญ: ตรงนี้ต้อง "ไม่มี" self.skipWaiting() เด็ดขาด ***
  // เพื่อรอให้ User กดปุ่มอัปเดตหน้าเว็บก่อน ถึงจะยอมเปลี่ยนเวอร์ชัน
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// +++ ส่วนสำคัญ: รอรับคำสั่ง "skipWaiting" จากปุ่มกดหน้าเว็บ +++
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting(); // ทำงานเมื่อ user กดปุ่มเท่านั้น
  }
});

// 3. Event Activate: ทำงานเมื่อได้รับอนุญาตให้เป็น Active Worker แล้ว
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated version:', APP_VERSION);

  // ลบ Cache ของเวอร์ชันเก่าทิ้ง
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // ลบ Cache ที่ชื่อไม่ตรงกับเวอร์ชันปัจจุบัน
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );

  // สั่งให้ Service Worker เข้าควบคุมหน้าเว็บทันทีหลังจาก Activate แล้ว
  return self.clients.claim();
});

// 4. Event Fetch: ดักจับการโหลดไฟล์
self.addEventListener('fetch', (event) => {
  // ข้ามการ Cache ข้อมูลจาก Firebase/Firestore หรือ Google Auth
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('googleapis.com/auth')) {
    return; // ให้โหลดสดจากเน็ตเสมอ
  }

  // Cache First Strategy
  event.respondWith(
    // ใส่ { ignoreSearch: true } เพื่อให้หาไฟล์เจอแม้ request จะมีหรือไม่มี ?v=...
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      if (response) {
        return response; // เจอใน Cache ใช้เลย
      }
      
      // ถ้าไม่เจอ ให้ไปโหลดจากเน็ต
      return fetch(event.request).catch((error) => {
         // กรณี Offline และหาไฟล์ไม่เจอ (อาจจะ Error หรือไม่มีเน็ต)
         console.error('[Service Worker] Fetch failed:', error);
         // ตรงนี้สามารถเพิ่ม logic return file offline.html ได้ถ้าต้องการ
      });
    })
  );
});
