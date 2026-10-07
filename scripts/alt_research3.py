#!/usr/bin/env python3
"""استخراج معرفات حزم تطبيقات عربية من بحث Play ثم جلب وصف كل تطبيق."""
import re, json, time, html, urllib.request, urllib.parse, pathlib

OUT = pathlib.Path('/home/z/my-project/scripts/research_out')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.9'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', errors='ignore')

def strip_html(h):
    h = re.sub(r'<script[^>]*>.*?</script>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<style[^>]*>.*?</style>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<[^>]+>', ' ', h)
    h = html.unescape(h)
    return re.sub(r'\s+', ' ', h).strip()

# 1) اجمع كل روابط التطبيقات من صفحات بحث عربية
queries = ['أسئلة الرخصة المهنية للمعلمين', 'اختبار الرخصة المهنية معلم', 'إعداد المعلمين التعيين', 'مساعد المعلم تحضير']
ids = {}
for q in queries:
    try:
        h = fetch('https://play.google.com/store/search?q=' + urllib.parse.quote(q) + '&c=apps&hl=ar')
        # التقاط الاسم والمعرف من كتل aria-label
        for m in re.finditer(r'href="/store/apps/details\?id=([\w.]+)"[^>]*aria-label="([^"]{2,80})"', h):
            pid, name = m.group(1), html.unescape(m.group(2))
            ids.setdefault(pid, name)
        for m in re.finditer(r'href="/store/apps/details\?id=([\w.]+)"', h):
            ids.setdefault(m.group(1), m.group(1))
        time.sleep(1)
    except Exception as e:
        print('فشل بحث:', q, e)

print(f'تم جمع {len(ids)} معرفًا')
# 2) فلترة: أسماء تربوية على الأرجح
keywords = ['معلم', 'تربوي', 'رخصة', 'تعليم', 'أستاذ', 'مدرس', 'اختبار', 'أسئلة', 'تحضير', 'تربية']
picked = []
for pid, name in ids.items():
    if any(k in name for k in keywords):
        picked.append((pid, name))
print('المرشحة:', len(picked))
for pid, name in picked[:14]:
    print(' -', pid, '|', name[:50])

# 3) جلب صفحات المرشحين الأعلى
results = {}
for pid, name in picked[:8]:
    try:
        txt = strip_html(fetch(f'https://play.google.com/store/apps/details?id={pid}&hl=ar'))[:12000]
        results[pid] = {'name': name, 'text': txt}
        (OUT / f'arapp_{pid}.txt').write_text(name + '\n' + txt, 'utf-8')
        print(f'[arapp:{pid}] {len(txt)} حرف')
        time.sleep(1)
    except Exception as e:
        print(f'فشل {pid}: {e}')
