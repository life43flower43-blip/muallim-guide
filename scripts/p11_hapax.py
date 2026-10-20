# -*- coding: utf-8 -*-
"""P11: كشف الأخطاء الإملائية عبر الكلمات النادرة (تظهر مرة واحدة في كل المتون)."""
import json, re, collections

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'
AR = '\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF'
WORD = re.compile(rf'[{AR}]{{3,}}')

TEXT_KEYS = ('question', 'text', 'explanation', 'examples', 'example', 'fb',
             'option', 'stem', 'reason', 'title', 'chapter', 'definition',
             'phrase', 'hint', 'answer_text', 'name')

def walk(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items(): yield from walk(v, f'{p}.{k}')
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from walk(v, f'{p}[{i}]')
    elif isinstance(o, str): yield p, o

texts = []
d = json.load(open(QB, encoding='utf-8'))
for p, s in walk(d):
    seg = p.rsplit('.', 1)[-1].split('[')[0]
    if seg in TEXT_KEYS:
        texts.append((p, s))

freq = collections.Counter()
where = {}
for p, s in texts:
    for w in WORD.findall(s):
        freq[w] += 1
        where.setdefault(w, []).append((p, s))

hapax = [w for w, c in freq.items() if c == 1 and len(w) >= 4]
print(f'كلمات نادرة (مرة واحدة): {len(hapax)} من أصل {len(freq)} كلمة')
# حروف جر/عطف شائعة تُستثنى
STOP = {'لكن', 'ثم', 'أو', 'فيه', 'فيها', 'منه', 'منها', 'عنه', 'عنها', 'إلى', 'على'}
hapax = [w for w in hapax if w not in STOP]
for w in sorted(hapax, key=len, reverse=True)[:120]:
    p, s = where[w][0]
    i = s.find(w)
    ctx = s[max(0, i-40):i+len(w)+30].replace('\n', ' ')
    print(f"  {w} ← {ctx}")
print('HAPAX-END')
