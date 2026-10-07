#!/usr/bin/env python3
"""دفعة ثانية: صفحات Play إضافية + بحث المتجر بالعربية + متجر آبل."""
import re, json, time, html, urllib.request, urllib.parse, pathlib

OUT = pathlib.Path('/home/z/my-project/scripts/research_out')
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
    return re.sub(r'\s+', ' ', h).strip()

def page(url, tag, maxchars=16000):
    try:
        txt = strip_html(fetch(url))[:maxchars]
        (OUT / f'page_{tag}.txt').write_text(txt, 'utf-8')
        print(f'[page:{tag}] {len(txt)} حرف')
    except Exception as e:
        print(f'[page:{tag}] فشل: {e}')

PAGES = [
    # بحث متجر Play بالعربية — لمعرفة تطبيقات إعداد المعلم العربية المشهورة
    ('play_search_ar_license', 'https://play.google.com/store/search?q=' + urllib.parse.quote('الرخصة المهنية للمعلمين') + '&c=apps&hl=ar'),
    ('play_search_ar_teacher', 'https://play.google.com/store/search?q=' + urllib.parse.quote('اختبار المعلمين تربوي') + '&c=apps&hl=ar'),
    ('play_search_ar_quiz', 'https://play.google.com/store/search?q=' + urllib.parse.quote('بنك أسئلة تربوي') + '&c=apps&hl=ar'),
    # تطبيقات عالمية إضافية
    ('kahoot_play', 'https://play.google.com/store/apps/details?id=no.mobitroll.kahoot.android'),
    ('quizizz_play', 'https://play.google.com/store/apps/details?id=co.quizizz.player'),
    ('study_smarter_play', 'https://play.google.com/store/apps/details?id=com.studysmarter.flashcards'),
    ('knowt', 'https://getknowt.com/'),
    ('quizlet_ios', 'https://apps.apple.com/us/app/quizlet-ai-powered-flashcards/id546473125'),
    ('remnote_play', 'https://play.google.com/store/apps/details?id=com.remnote.android'),
    ('magoosh', 'https://magoosh.com/gre/'),
]

if __name__ == '__main__':
    for tag, u in PAGES:
        page(u, tag)
        time.sleep(1)
    print('تم.')
