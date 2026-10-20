# -*- coding: utf-8 -*-
"""P11: مسح شامل لسلامة العربية في بيانات المحتوى (qbank.json + بقية src/data)."""
import json, re, os, collections

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'

LAT = re.compile(r'[A-Za-z]')
EN_DIGIT = re.compile(r'[0-9]')
INVIS = re.compile(r'[\u200b\u200c\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]')
REPEAT = re.compile(r'(\S{2,}) \1')          # كلمة مكررة متتالية
DBLSPACE = re.compile(r'\S  +\S')
BAD_PUNCT = re.compile(r' [,،.]|[،.]،|\?|!{2,}|\.{3,}')
UNBAL = lambda s: (s.count('«') != s.count('»')) or (s.count('"') % 2 == 1)

def walk(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items(): yield from walk(v, f'{p}.{k}')
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from walk(v, f'{p}[{i}]')
    elif isinstance(o, str): yield p, o

def field_kind(path):
    # أسئلة: منع اللاتيني والأرقام في نص الخيارات والسؤال والتغذية (باستثناء معرفات تقنية)
    return path

found = collections.defaultdict(list)
d = json.load(open(QB, encoding='utf-8'))

for p, s in walk(d):
    short = s.strip()
    if not short: continue
    # معرفات تقنية لا تُفحص
    if re.fullmatch(r'[A-Z]?\d+(-\d+)?|[A-Z]+\d*', short): continue
    if re.fullmatch(r'[A-Z]+-s\d', short): continue
    loc = p.split('.')
    is_text_field = any(k in p for k in ['.text', '.question', '.stem', '.explanation', '.examples', '.fb', '.answer_text', '.title', '.chapter', '.definition', '.phrase', '.hint'])
    for name, m in [('LAT', LAT), ('DIGIT', EN_DIGIT), ('INVIS', INVIS), ('REPEAT', REPEAT), ('DBLSPACE', DBLSPACE), ('PUNCT', BAD_PUNCT)]:
        for mm in m.finditer(short):
            ctx = short[max(0, mm.start()-40):mm.end()+40]
            found[name].append((p, ctx))
    if UNBAL(short):
        found['UNBAL'].append((p, short[:80]))

# لاتيني/أرقام داخل نصوص عربية فقط (لا تعرف على أسطر عربية خالصة؛ أظهر كل شيء ثم قرر)
for k in ['LAT', 'DIGIT', 'INVIS', 'REPEAT', 'DBLSPACE', 'PUNCT', 'UNBAL']:
    lst = found[k]
    print(f"=== {k}: {len(lst)}")
    for p, ctx in lst[:25]:
        print(f"  {p}\n      …{ctx}…")
    if len(lst) > 25: print(f"  … و{len(lst)-25} أخرى")

# إحصاء لاتيني في الملفات الأخرى
print('\n=== بقية ملفات data ===')
for dp, _, fs in os.walk(f'{ROOT}/src/data'):
    for f in sorted(fs):
        fp = os.path.join(dp, f)
        if f == 'qbank.json': continue
        try: txt = open(fp, encoding='utf-8').read()
        except Exception: continue
        n_lat = len(LAT.findall(txt)); n_dig = len(EN_DIGIT.findall(txt))
        if n_lat or n_dig:
            print(f"  {fp.replace(ROOT+'/', '')}: latin={n_lat} digits={n_dig}")
print('SCAN-END')
