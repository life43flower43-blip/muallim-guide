# -*- coding: utf-8 -*-
"""تطبيق دفعة 02 على البنك: استبدال الخيارات والتعليل (+نص السؤال عند الحاجة)،
إزالة fixedOrder من المعدَّل (لأن التعليلات الجديدة بلا إشارات موضعية)،
ومزامنة حقل correct إن وُجد، ثم بطارية تحقق."""
import json, shutil, sys
sys.path.insert(0, '/home/z/my-project/scripts')
from g2_b2a import B2A
from g2_b2b import B2B

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'
BAK = f'{ROOT}/scripts/fix1_baks/qbank_pre_batch02.json'

shutil.copy(QB, BAK)
q = json.load(open(QB, encoding='utf-8'))
PATCH = {**B2A, **B2B}
byid = {x['id']: x for x in q['questions']}

missing = [k for k in PATCH if k not in byid]
if missing:
    print('معرفات غير موجودة:', missing); sys.exit(1)

applied = 0
for qid, p in PATCH.items():
    x = byid[qid]
    if 'q' in p:
        x['question'] = p['q']
    for i, t in enumerate(p['opts']):
        x['options'][i]['text'] = t
        x['options'][i]['isCorrect'] = (i == p['ci'])
    x['reason'] = p['reason']
    x.pop('fixedOrder', None)
    if 'correct' in x:
        x['correct'] = p['opts'][p['ci']]
    applied += 1
json.dump(q, open(QB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ── التحقق ──
import re
raw = open(QB, encoding='utf-8').read()
errs = []
# ١) صحة البنية: صحيح وحيد، ضمن الخيارات، لا نص فارغ
for x in q['questions']:
    ci = [i for i, o in enumerate(x['options']) if o.get('isCorrect')]
    if len(ci) != 1:
        errs.append(f"{x['id']}: isCorrect {len(ci)}")
    if x['type'] == 'mcq' and 'correct' in x and x['correct'] != x['options'][ci[0]]['text']:
        errs.append(f"{x['id']}: correct غير متزامن")
    if any(not o['text'].strip() for o in x['options']):
        errs.append(f"{x['id']}: خيار فارغ")
# ٢) الانحياز الطولي بعد التعديل
def ratio(x):
    ci = next(i for i, o in enumerate(x['options']) if o.get('isCorrect'))
    lo = len(x['options'][ci]['text'])
    others = [len(o['text']) for i, o in enumerate(x['options']) if i != ci]
    return lo / max(1, sum(others) / len(others))
worst = sorted(((round(ratio(byid[i]), 3), i) for i in PATCH), reverse=True)
over = [(r, i) for r, i in worst if r > 1.35]
# ٣) قوالب آلية وأخطاء معروفة — على المعدَّل فقط
PATCHED_TEXT = ''.join(
    byid[i]['question'] + byid[i]['reason'] + ''.join(o['text'] for o in byid[i]['options'])
    for i in PATCH
)
for pat in [r'المشتت', r'الصحيح صحيح', r'الخيارات الأخرى لا تصح', r'ذاكلة', r'التشخيح',
            r'نضمه', r'الأتربوي', r'الأدى به', r'لل حساسية', r'قلق اجتماعية', r'الذاجيبوا', r'قومه على']:
    if re.search(pat, PATCHED_TEXT):
        errs.append(f'قالب متبقٍ: {pat}')
# ٤) لا لاتيني ملاصق ولا CJK في المعدَّل
for i in PATCH:
    blob = byid[i]['question'] + byid[i]['reason'] + ''.join(o['text'] for o in byid[i]['options'])
    if re.search(r'[\u0600-\u06FF][A-Za-z]|[A-Za-z][\u0600-\u06FF]', blob):
        errs.append(f'{i}: لاتيني ملاصق')
    if re.search(r'[\u4e00-\u9fff]', blob):
        errs.append(f'{i}: CJK')

print(f'applied: {applied}/{len(PATCH)}')
print('أعلى ٨ نسب بعد التعديل:', worst[:8])
print('فوق ١٫٣٥ بعد التعديل:', over)
print('errors:', errs[:10] if errs else 'لا شيء')
if errs or over:
    shutil.copy(BAK, QB)
    print('FAILED — رُجّعت النسخة الاحتياطية'); sys.exit(1)
print('BATCH02 OK — البنك الآن:', len(q['questions']), 'سؤالاً')
