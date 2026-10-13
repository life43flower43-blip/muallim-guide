# -*- coding: utf-8 -*-
"""تطبيق شواهد G4: لكل مفهوم من الـ٣٩ الناقصة تُبنى examples = [الشاهد الأصلي] + ٤ شواهد جديدة
فيتوحد المعيار (٥ شواهد لكل مفهوم) مع فحص ذاتي للأطوال والتنوع."""
import json, shutil, sys, re
sys.path.insert(0, '/home/z/my-project/scripts')
from g3_ex_g1a import EX_G1A
from g3_ex_g1b import EX_G1B
from g3_ex_c1 import EX_C1

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'
BAK = f'{ROOT}/scripts/fix1_baks/qbank_pre_examples.json'

shutil.copy(QB, BAK)
q = json.load(open(QB, encoding='utf-8'))
PATCH = {**EX_G1A, **EX_G1B, **EX_C1}
cs = {c['id']: c for c in q['concepts']}

missing = [k for k in PATCH if k not in cs]
if missing:
    print('مفاهيم غير موجودة:', missing); sys.exit(1)

applied = 0
for cid, new4 in PATCH.items():
    c = cs[cid]
    if c.get('examples'):
        print(f'{cid}: له أمثلة أصلًا — تخطي'); continue
    base = c.get('example', '').strip()
    if not base:
        print(f'{cid}: بلا شاهد أصلي!'); continue
    c['examples'] = [base] + new4
    applied += 1
json.dump(q, open(QB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ── التحقق ──
errs = []
for cid, new4 in PATCH.items():
    c = cs[cid]
    ex = c.get('examples', [])
    if len(ex) != 5:
        errs.append(f'{cid}: عدد الشواهد {len(ex)}')
    texts = [t.replace(' ', '') for t in ex]
    if len(set(texts)) != len(texts):
        errs.append(f'{cid}: تكرار شاهد')
    short = [t for t in ex if len(t) < 120]
    if short:
        errs.append(f'{cid}: شاهد قصير <١٢٠ حرفًا')
    # لا لاتيني ملاصق ولا CJK
    blob = ''.join(ex)
    if re.search(r'[\u0600-\u06FF][A-Za-z]|[A-Za-z][\u0600-\u06FF]', blob):
        errs.append(f'{cid}: لاتيني ملاصق')
    if re.search(r'[\u4e00-\u9fff]', blob):
        errs.append(f'{cid}: CJK')
    # أرقام لاتينية داخل الشواهد
    if re.search(r'[0-9]', blob):
        errs.append(f'{cid}: أرقام غير مشرقية')

noex = [c['id'] for c in q['concepts'] if not c.get('examples')]
print(f'applied: {applied}/{len(PATCH)} | مفاهيم ما زالت بلا شواهد: {noex if noex else "صفر"}')
print('errors:', errs[:8] if errs else 'لا شيء')
if errs or noex:
    shutil.copy(BAK, QB)
    print('FAILED — رُجّعت النسخة'); sys.exit(1)
print('EXAMPLES OK — كل المفاهيم الآن بخمسة شواهد')
