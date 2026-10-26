// عامل خدمة: شبكة أولاً للتنقل والأصول، كاش أولاً لبنك البيانات الكبير
// v32 — الواجهة الجديدة: الحسابات والجواهر والتدريب والأخطاء منقولة من أوريندو
const CACHE = "turbawy-v65";
const SHELL = ["/", "/manifest.json", "/icons/icon-192-v3.png", "/icons/icon-512-v3.png"];

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

  // ٢) بنك البيانات الكبير: كاش أولاً — يُحمَّل مرة واحدة ثم يعمل فوريًّا ودون اتصال،
  //    مع تحديث صامت في الخلفية ليصل أثر التوسعات في الزيارة التالية
  if (url.pathname.startsWith("/data/")) {
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const refresh = fetch(e.request)
          .then((res) => {
            if (res && res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() => null);
        return hit || refresh.then((res) => res || Response.error());
      })
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
