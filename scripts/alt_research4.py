#!/usr/bin/env python3
"""جلب عنوان كل تطبيق مرشح عبر Range خفيف، ثم وصف كامل للمختص التربوي."""
import re, time, html, urllib.request, urllib.parse, pathlib

OUT = pathlib.Path('/home/z/my-project/scripts/research_out')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36'

def fetch(url, rng=None, timeout=20):
    hh = {'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.9'}
    if rng: hh['Range'] = rng
    req = urllib.request.Request(url, headers=hh)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', errors='ignore')

def title_of(pid):
    try:
        h = fetch(f'https://play.google.com/store/apps/details?id={pid}&hl=ar', rng='bytes=0-8000')
        m = re.search(r'<title[^>]*>(.*?)</title>', h, re.S)
        t = html.unescape(m.group(1)).strip() if m else '?'
        m2 = re.search(r'itemprop="description"[^>]*>(.*?)</div>', h, re.S)
        return t
    except Exception as e:
        return f'ERR:{e}'

def strip_html(h):
    h = re.sub(r'<script[^>]*>.*?</script>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<style[^>]*>.*?</style>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<[^>]+>', ' ', h)
    h = html.unescape(h)
    return re.sub(r'\s+', ' ', h).strip()

queries = ['أسئلة الرخصة المهنية للمعلمين', 'اختبار الرخصة المهنية معلم', 'إعداد المعلمين التعيين', 'مساعد المعلم تحضير', 'أسئلة التعيين معلم']
ids = []
for q in queries:
    try:
        h = fetch('https://play.google.com/store/search?q=' + urllib.parse.quote(q) + '&c=apps&hl=ar')
        for pid in re.findall(r'/store/apps/details\?id=([\w.]+)', h):
            if pid not in ids:
                ids.append(pid)
        time.sleep(1)
    except Exception as e:
        print('فشل بحث:', q, e)

print('معرفات فريدة:', len(ids))
KEYS = ['معلم', 'تربوي', 'رخصة', 'تعليم', 'أستاذ', 'مدرس', 'أسئلة', 'تحضير', 'تربية', 'اختبار', 'التعيين']
picked = []
for pid in ids:
    t = title_of(pid)
    ok = not t.startswith('ERR') and any(k in t for k in KEYS) and 'Google Play' in t
    name = t.replace(' - تطبيقات Android على Google Play', '').replace(' Apps on Google Play', '').strip() if ok else t
    if ok:
        picked.append((pid, name))
        print('✔', pid, '|', name[:60])
    time.sleep(0.4)

print('المختارة:', len(picked))
# جلب الوصف الكامل لأول 6
for pid, name in picked[:6]:
    try:
        txt = strip_html(fetch(f'https://play.google.com/store/apps/details?id={pid}&hl=ar'))[:12000]
        (OUT / f'arapp_{pid}.txt').write_text(name + '\n' + txt, 'utf-8')
        print(f'[حفظ {pid}] {len(txt)} حرف — {name[:40]}')
        time.sleep(1)
    except Exception as e:
        print(f'فشل {pid}: {e}')
