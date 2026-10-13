# -*- coding: utf-8 -*-
"""P11: مسح مُحكَم لسلامة العربية — نصوص معروضة فقط، بحدود كلمات سليمة."""
import json, re, os, collections

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'

AR = '\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF'
LAT = re.compile(r'[A-Za-z]')
EN_DIGIT = re.compile(r'[0-9]')
INVIS = re.compile(r'[\u200b\u200c\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]')
# كلمة عربية كاملة متكررة متتالية (حدود كلمات حقيقية)
REPEAT = re.compile(rf'(?<![{AR}A-Za-z0-9])([{AR}]{{2,}}) \1(?!{AR})')
DBLSPACE = re.compile(r'\S  +\S')
ELLIPSIS = re.compile(r'\.{2,}')

TEXT_KEYS = ('.question', '.text', '.explanation', '.examples', '.example', '.fb',
             '.option', '.stem', '.reason', '.title', '.chapter', '.definition',
             '.phrase', '.hint', '.answer_text', '.name', '.explanation_short')

def walk(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items(): yield from walk(v, f'{p}.{k}')
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from walk(v, f'{p}[{i}]')
    elif isinstance(o, str): yield p, o

found = collections.defaultdict(list)
d = json.load(open(QB, encoding='utf-8'))

for p, s in walk(d):
    if not any(k in '.' + p for k in TEXT_KEYS): continue
    short = s.strip()
    if not short: continue
    for name, m in [('LAT', LAT), ('DIGIT', EN_DIGIT), ('INVIS', INVIS), ('REPEAT', REPEAT), ('DBLSPACE', DBLSPACE), ('DOTS', ELLIPSIS)]:
        for mm in m.finditer(short):
            ctx = short[max(0, mm.start()-45):mm.end()+45]
            found[name].append((p, ctx.replace('\n', ' ')))

for k in ['LAT', 'DIGIT', 'INVIS', 'REPEAT', 'DBLSPACE', 'DOTS']:
    lst = found[k]
    print(f"=== {k}: {len(lst)}")
    for p, ctx in lst[:20]:
        print(f"  {p}\n      …{ctx}…")
    if len(lst) > 20: print(f"  … و{len(lst)-20} أخرى")
print('SCAN-END')
