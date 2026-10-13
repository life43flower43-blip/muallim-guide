# -*- coding: utf-8 -*-
"""تطبيق دفعة G5 (٨٨ سؤالًا جديدًا) على البنك مع بطارية تحقق:
معرفات فريدة، صحيح وحيد ضمن الخيارات، موازنة المواضع والنسب الطولية،
طول التعليل ≥١٥٠، لا قوالب آلية، أرقام مشرقية، لا لاتيني ملاصق ولا CJK."""
import json, shutil, sys, re
from collections import Counter
sys.path.insert(0, '/home/z/my-project/scripts')
from g4_newq_a import NEW_A
from g4_newq_b import NEW_B
from g4_newq_c import NEW_C
from g4_newq_d import NEW_D
from g4_newq_fixups import FIX_OPTS

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'
BAK = f'{ROOT}/scripts/fix1_baks/qbank_pre_newq.json'

ALL = NEW_A + NEW_B + NEW_C + NEW_D
q = json.load(open(QB, encoding='utf-8'))
ids = {x['id'] for x in q['questions']}
cs = {c['id'] for c in q['concepts']}

errs = []
if len(ids) != len(ALL) and (ids & {x['id'] for x in ALL}):
    errs.append('معرفات متعارضة: ' + str(sorted(ids & {x['id'] for x in ALL})))
for x in ALL:
    if x['conceptId'] not in cs:
        errs.append(f"{x['id']}: مفهوم غير موجود {x['conceptId']}")
    ci = [i for i, (_, c) in enumerate(x['options']) if c]
    if len(ci) != 1:
        errs.append(f"{x['id']}: isCorrect {len(ci)}")
    if len(set(o for o, _ in x['options'])) != len(x['options']):
        errs.append(f"{x['id']}: خيارات مكررة")
    if len(x['reason']) < 150:
        errs.append(f"{x['id']}: تعليل قصير {len(x['reason'])}")
    for pat in [r'المشتت', r'الخيارات الأخرى لا تصح', r'الصحيح صحيح', r'نضمه', r'الأتربوي']:
        if re.search(pat, x['question'] + x['reason'] + ''.join(o for o, _ in x['options'])):
            errs.append(f"{x['id']}: قالب {pat}")
    blob = x['question'] + x['reason'] + ''.join(o for o, _ in x['options'])
    if re.search(r'[0-9]', blob):
        errs.append(f"{x['id']}: أرقام غير مشرقية")
    if re.search(r'[\u0600-\u06FF][A-Za-z]|[A-Za-z][\u0600-\u06FF]', blob):
        errs.append(f"{x['id']}: لاتيني ملاصق")
    if re.search(r'[\u4e00-\u9fff]', blob):
        errs.append(f"{x['id']}: CJK")

if errs:
    print('أخطاء قبل التطبيق:', errs[:12]); sys.exit(1)

# ── دمج تصحيحات الأطوال ──
for x in ALL:
    if x['id'] in FIX_OPTS:
        texts = FIX_OPTS[x['id']]
        assert len(texts) == len(x['options']), x['id']
        x['options'] = [(texts[i], x['options'][i][1]) for i in range(len(texts))]

# ── موازنة مواضع الصحيح دوريًا ٠،١،٢،٣ ──
mcq_idx = [i for i, x in enumerate(ALL) if x['type'] == 'mcq']
for k, i in enumerate(mcq_idx):
    x = ALL[i]
    cur = next(j for j, (_, c) in enumerate(x['options']) if c)
    tgt = k % 4
    if cur != tgt:
        opts = list(x['options'])
        opts[cur], opts[tgt] = opts[tgt], opts[cur]
        x['options'] = opts

shutil.copy(QB, BAK)
added = 0
for x in ALL:
    q['questions'].append({
        'id': x['id'], 'conceptId': x['conceptId'], 'type': x['type'],
        'difficulty': x['difficulty'], 'question': x['question'],
        'options': [{'text': t, 'isCorrect': bool(c)} for t, c in x['options']],
        'correct': next(t for t, c in x['options'] if c),
        'reason': x['reason'],
    })
    added += 1
json.dump(q, open(QB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ── تقارير الجودة ──
new_mcq = [x for x in ALL if x['type'] == 'mcq']
def ratio(x):
    lo = len(x['options'][next(i for i, (_, c) in enumerate(x['options']) if c)][0] if False else '')
    ci = next(i for i, (_, c) in enumerate(x['options']) if c)
    lo = len(x['options'][ci][0])
    others = [len(o[0]) for i, o in enumerate(x['options']) if i != ci]
    return lo / max(1, sum(others) / len(others))
worst = sorted(((round(ratio(x), 3), x['id']) for x in new_mcq), reverse=True)
over = [(r, i) for r, i in worst if r > 1.35]
pos = Counter(next(i for i, (_, c) in enumerate(x['options']) if c) for x in new_mcq)
diff = Counter(x['difficulty'] for x in ALL)
typ = Counter(x['type'] for x in ALL)
courses = Counter(next(c['courseId'] for c in q['concepts'] if c['id'] == x['conceptId']) for x in ALL)
print(f'added: {added} | البنك الآن: {len(q["questions"])} سؤالاً')
print('مواضع الصحيح (٠-٣):', dict(sorted(pos.items())))
print('الصعوبات:', dict(diff), '| الأنماط:', dict(typ))
print('توزيع المساقات:', dict(courses))
print('أعلى ٨ نسب طولية:', worst[:8])
print('فوق ١٫٣٥:', over if over else 'لا شيء')
if over:
    print('تنبيه: نسب مرتفعة — تُعالج في تمريرة قادمة')
print('NEWQ OK')
