# نتائج فحص تجربة المستخدم متعدد الشاشات

**الأداء:** qbank.json = 10.3 ميغابايت، ترميز الخادم: gzip
**PWA:** {"manifestLink": true, "viewportMeta": "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no", "manifestName": "تربوي — رفيقك في علم النفس التربوي", "dir": "rtl", "lang": "ar", "display": "standalone", "icons": ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"], "iconsOk": ["/icons/icon-192.png:200", "/icons/icon-512.png:200", "/icons/icon-maskable-512.png:200"], "swStatus": 200}

## التدفقات
- ✔ الرئيسية تُحمّل
- ✔ فتح مختبر محاكاة الصفوف
- ✔ فتح المحاكاة الموقوتة
- ✘ فتح تحديد المستوى — Locator.wait_for: Timeout 15000ms exceeded.
Call log:
  - waiting for locator("text=المستوى").first to be visible

- ✔ فتح دليل المعلم

## القياسات
- مختبر 320px (320px): ⚠ تجاوز أفقي — عناصر فائضة: 1، خطوط <12px: 64، أهداف لمس <40px: 1، لاتيني ظاهر: []، CJK: 0
    - فائض: <DIV> يمين=360 «» cls=pointer-events-none absolute -right-10 top-16 h-40
- هاتف صغير (320px): ⚠ تجاوز أفقي — عناصر فائضة: 1، خطوط <12px: 25، أهداف لمس <40px: 1، لاتيني ظاهر: []، CJK: 0
    - فائض: <DIV> يمين=360 «» cls=pointer-events-none absolute -right-10 top-16 h-40
- أندرويد متوسط (360px): سليم — عناصر فائضة: 1، خطوط <12px: 25، أهداف لمس <40px: 1، لاتيني ظاهر: []، CJK: 0
    - فائض: <DIV> يمين=400 «» cls=pointer-events-none absolute -right-10 top-16 h-40
- آيفون SE (375px): سليم — عناصر فائضة: 1، خطوط <12px: 25، أهداف لمس <40px: 1، لاتيني ظاهر: []، CJK: 0
    - فائض: <DIV> يمين=415 «» cls=pointer-events-none absolute -right-10 top-16 h-40
- آيفون بلس (414px): سليم — عناصر فائضة: 1، خطوط <12px: 25، أهداف لمس <40px: 1، لاتيني ظاهر: []، CJK: 0
    - فائض: <DIV> يمين=454 «» cls=pointer-events-none absolute -right-10 top-16 h-40
- لوحي (768px): سليم — عناصر فائضة: 0، خطوط <12px: 25، أهداف لمس <40px: 1، لاتيني ظاهر: []، CJK: 0
- سطح مكتب (1440px): سليم — عناصر فائضة: 0، خطوط <12px: 25، أهداف لمس <40px: 1، لاتيني ظاهر: []، CJK: 0

## كونسول (أخطاء/تحذيرات)
- reqfail: http://localhost:3000/icons/icon-512.png
- reqfail: http://localhost:3000/sw.js
- reqfail: http://localhost:3000/icons/icon-192.png
- reqfail: http://localhost:3000/icons/icon-maskable-512.png