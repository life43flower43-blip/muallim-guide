// عامل خدمة: شبكة أولاً للتنقل والملفات الديناميكية، كاش أولاً للأصول الموسومة فقط
// v22 — إصلاح البقاء على نسخة قديمة: تحديث تلقائي عند توفر نسخة أحدث
const CACHE = "turbawy-v24";
const SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== location.origin) return;

  // ١) التنقل بين الصفحات: الشبكة أولاً — وإن فشلت عاد آخر هيكل محفوظ (للعمل دون اتصال)
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((hit) => hit || Response.error()))
    );
    return;
  }

  // ٢) أصول التطبيق: شبكة أولاً مع تحديث الكاش في الخلفية —
  //    بحيث لا يبقى المستخدم على حزمة جافاسكربت قديمة أبدًا ما دام متصلًا
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((hit) => hit || Response.error())
        )
    );
  }
});
