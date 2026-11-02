# مدونة تربوي

موقع ثابت مستقل عن التطبيق: مقالات أصلية للتسويق للتطبيق، جاهزة لـ AdSense.

- المقالات: `content/articles/*.md`، والصفحات الثابتة: `content/pages/*.md`.
- الإعدادات: `site.json` (رابط الموقع، رابط التطبيق، البريد، رمز AdSense).
- البناء: `python3 site/build.py` يكتب الموقع في `site/public/`.

النشر على Cloudflare Pages: اربط المستودع، واجعل أمر البناء `python3 site/build.py`، ومجلد الإخراج `site/public`.
