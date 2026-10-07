#!/usr/bin/env python3
"""مسار بحث بديل: DuckDuckGo HTML + جلب صفحات المنافسين مباشرة واستخراج النص."""
import re, json, time, html, urllib.request, pathlib, sys

OUT = pathlib.Path('/home/z/my-project/scripts/research_out')
OUT.mkdir(exist_ok=True)
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers={
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', errors='ignore')

def strip_html(h):
    h = re.sub(r'<script[^>]*>.*?</script>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<style[^>]*>.*?</style>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<noscript[^>]*>.*?</noscript>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<[^>]+>', ' ', h)
    h = html.unescape(h)
    h = re.sub(r'\s+', ' ', h)
    return h.strip()

def ddg(query, tag):
    try:
        u = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote(query)
        h = fetch(u)
        items = []
        for m in re.finditer(r'<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', h, re.S):
            href, title = m.group(1), strip_html(m.group(2))
            # ddg يلف الروابط بـ uddg=
            um = re.search(r'uddg=([^&]+)', href)
            if um:
                href = urllib.parse.unquote(um.group(1))
            items.append({'title': title, 'url': href})
        snips = [strip_html(s) for s in re.findall(r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>', h, re.S)]
        for i, s in enumerate(snips):
            if i < len(items):
                items[i]['snippet'] = s
        (OUT / f'search_{tag}.json').write_text(json.dumps(items, ensure_ascii=False, indent=1), 'utf-8')
        print(f'[search:{tag}] {len(items)} نتيجة')
        return items
    except Exception as e:
        print(f'[search:{tag}] فشل: {e}')
        return []

def page(url, tag, maxchars=14000):
    try:
        h = fetch(url)
        txt = strip_html(h)
        txt = txt[:maxchars]
        (OUT / f'page_{tag}.txt').write_text(txt, 'utf-8')
        print(f'[page:{tag}] {len(txt)} حرف')
    except Exception as e:
        print(f'[page:{tag}] فشل: {e}')

import urllib.parse

QUERIES = [
    ('teacher_license', 'تطبيق الرخصة المهنية للمعلمين أسئلة تجريبية ميزات'),
    ('ar_teacher_apps', 'أفضل تطبيقات إعداد المعلم اختبار تربوي اندرويد'),
    ('study_features', 'best study apps features flashcards spaced repetition exam prep'),
    ('mistakes_review', 'exam prep app review wrong answers mistakes feature mastery'),
]

PAGES = [
    ('anki_docs', 'https://docs.ankiweb.net/background.html'),
    ('ankidroid_play', 'https://play.google.com/store/apps/details?id=com.ichi2.anki'),
    ('quizlet_play', 'https://play.google.com/store/apps/details?id=com.quizlet.quizletandroid'),
    ('brainscape_play', 'https://play.google.com/store/apps/details?id=com.brainscape'),
    ('remnote', 'https://www.remnote.com/features'),
    ('quizizz', 'https://quizizz.com/en/for-teachers'),
    ('kahoot', 'https://kahoot.com/schools/'),
    ('khan', 'https://www.khanacademy.org/about'),
    ('duolingo_play', 'https://play.google.com/store/apps/details?id=com.duolingo'),
    ('brisk', 'https://www.briskteaching.com/'),
]

if __name__ == '__main__':
    for tag, q in QUERIES:
        ddg(q, tag)
        time.sleep(2)
    for tag, u in PAGES:
        page(u, tag)
        time.sleep(1)
    print('تم.')
