// عامل خدمة: شبكة أولاً للتنقل والأصول، كاش أولاً لبنك البيانات الكبير
// v32 — الواجهة الجديدة: الحسابات والجواهر والتدريب والأخطاء منقولة من أوريندو
const CACHE = "turbawy-v180";
// كاش مستقل لبنك البيانات: لا يُحذف عند تحديث الواجهة، فلا يُعاد تنزيل البنك الكبير مع كل تحديث
const DATA_CACHE = "turbawy-data";
const SHELL = ["/", "/manifest.json", "/icons/icon-192-v3.png", "/icons/icon-512-v3.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== DATA_CACHE).map((k) => caches.delete(k)))
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
          // الصفحات المضمّنة (كالخرائط الذهنية) لا تحلّ محل هيكل التطبيق المحفوظ
          if (!url.pathname.startsWith("/tools/")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/").then((hit) => hit || Response.error()))
    );
    return;
  }

  // ٢) بنك البيانات الكبير: كاش أولًا بلا تنزيل متكرر — رابطه يحمل رقم إصداره،
  //    فإذا تغيّر المحتوى تغيّر الرابط فنُزّل مرة واحدة وحُذفت النسخ القديمة
  if (url.pathname.startsWith("/data/")) {
    e.respondWith(
      caches.open(DATA_CACHE).then((c) =>
        c.match(e.request).then(
          (hit) =>
            hit ||
            fetch(e.request).then((res) => {
              if (res && res.ok && res.type === "basic") {
                const copy = res.clone();
                c.keys().then((ks) => Promise.all(ks.filter((k) => new URL(k.url).pathname === url.pathname).map((k) => c.delete(k)))).then(() => c.put(e.request, copy));
              }
              return res;
            })
        )
      )
    );
    return;
  }

  // ٣) أصول التطبيق: شبكة أولاً مع تحديث الكاش في الخلفية —
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

// ٤) الإشعارات: التذكير اليومي وموعد مراجعة الأخطاء
self.addEventListener("push", (e) => {
  let data = { title: "تربوي", body: "حان وقت درسك اليوم", url: "/" };
  try {
    data = { ...data, ...e.data.json() };
  } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192-v3.png",
      badge: "/icons/icon-192-v3.png",
      dir: "rtl",
      lang: "ar",
      tag: data.tag || "turbawy",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
