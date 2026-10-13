# -*- coding: utf-8 -*-
"""G3/VARIETY — كسر القالب الآلي «الخيارات الأخرى لا تصح» في ٢٢٢ سؤالًا
بتدوير صياغات أكاديمية متنوعة متوافقة مع نمط splitReason في arabic.ts
(حتى يظل التعليل من شقين: أساس الصواب / موقف البدائل)،
+ إصلاحات إملائية عدة: قلق اجتماعية، الأتربوي، المشتتات (Q457/Q469)."""
import json, re, shutil, sys, hashlib

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'
BAK = f'{ROOT}/scripts/fix1_baks/qbank_pre_variety.json'
TPL = 'الخيارات الأخرى لا تصح'

# كل بادئة متوافقة مع REJECT في splitReason: أما | ولا يصح | وتسقط | وتبقى | وباقي | البدائل
VARIANTS = [
    'أما البدائل فتسقط',
    'ولا يصح أيٌّ من الخيارات الأخرى',
    'وتسقط الخيارات الأخرى',
    'وتبقى الخيارات الأخرى مردودة',
    'وباقي الخيارات لا تصمد أمام المفهوم',
    'البدائل الأخرى لا تصلح',
]

shutil.copy(QB, BAK)
q = json.load(open(QB, encoding='utf-8'))
rot = fixed = 0
byidx = {}
for x in q['questions']:
    if TPL in x['reason']:
        n = x['reason'].count(TPL)
        # تدوير ثابت بحسب المعرف حتى تكون النتيجة قابلة للتكرار ومتنوعة داخل الملف
        for k in range(n):
            v = VARIANTS[(int(hashlib.md5((x['id'] + str(k)).encode()).hexdigest(), 16) + k) % len(VARIANTS)]
            x['reason'] = x['reason'].replace(TPL, v, 1)
            rot += 1
    # إصلاحات إملائية
    if 'قلق اجتماعية' in x['reason'] or any('قلق اجتماعية' in o['text'] for o in x['options']):
        x['reason'] = x['reason'].replace('قلق اجتماعية', 'قلق اجتماعي')
        for o in x['options']:
            o['text'] = o['text'].replace('قلق اجتماعية', 'قلق اجتماعي')
        fixed += 1
    if 'الأتربوي' in x['reason'] or 'الأتربوي' in x['question']:
        x['reason'] = x['reason'].replace('الأتربوي', 'التربوي')
        x['question'] = x['question'].replace('الأتربوي', 'التربوي').replace('لهذا الملاحظة', 'لهذه الملاحظة')
        fixed += 1
    # المشتتات في سياق بيئة التعلم — صياغة أكاديمية أنظف
    if x['id'] == 'Q1424':
        x['question'] = x['question'].replace(
            'ما هو المشتت الأقل تأثيرًا على عملية تعلم الطلاب في هذا الموقف؟',
            'أي العوامل الآتية أقل تأثيرًا على عملية تعلم الطلاب في هذا الموقف؟')
    if 'المشتتات' in x['reason'] or any('المشتتات' in o['text'] for o in x['options']):
        x['reason'] = x['reason'].replace('إبعاد المشتتات', 'إبعاد ما يشتت الانتباه') \
                                  .replace('المشتتات', 'مصادر التشتت')
        for o in x['options']:
            o['text'] = o['text'].replace('إبعاد المشتتات', 'إبعاد ما يشتت الانتباه') \
                                  .replace('المشتتات', 'مصادر التشتت')
        fixed += 1
    if 'فصل المشتت عن' in x['reason'] or any('فصل المشتت عن' in o['text'] for o in x['options']):
        x['reason'] = x['reason'].replace('فصل المشتت عن', 'فصل مصادر التشتت عن')
        for o in x['options']:
            o['text'] = o['text'].replace('فصل المشتت عن', 'فصل مصادر التشتت عن')
        fixed += 1
    if 'المشتتين' in x['reason'] or any('المشتتين' in o['text'] for o in x['options']):
        x['reason'] = x['reason'].replace('المشتتين', 'المتشتتين')
        for o in x['options']:
            o['text'] = o['text'].replace('المشتتين', 'المتشتتين')
        fixed += 1
    if x.get('correct'):
        ci = next((i for i, o in enumerate(x['options']) if o.get('isCorrect')), None)
        if ci is not None and x['correct'] != x['options'][ci]['text']:
            x['correct'] = x['options'][ci]['text']

json.dump(q, open(QB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ── حقول المفاهيم: تنظيف بقايا «المشتت/المشتتات» ──
cfix = 0
def clean_concept_text(s: str) -> str:
    return (s.replace('السلوكيات المشتتة', 'السلوكيات التشتتية')
             .replace('بعيداً عن المشتتات', 'بعيدًا عن مصادر التشتت')
             .replace('إبعاد المشتتات', 'إبعاد ما يشتت')
             .replace('وفرة المشتتات الرقمية', 'وفرة مثيرات التشتت الرقمية'))
for c in q['concepts']:
    for key in ('explanation', 'example'):
        if key in c and isinstance(c[key], str) and re.search(r'المشتت(?!تين)', c[key]):
            c[key] = clean_concept_text(c[key]); cfix += 1
    if isinstance(c.get('examples'), list):
        for i, e in enumerate(c['examples']):
            if re.search(r'المشتت(?!تين)', e):
                c['examples'][i] = clean_concept_text(e); cfix += 1
json.dump(q, open(QB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ── التحقق ──
raw = open(QB, encoding='utf-8').read()
ALLOWED = ['أما البدائل', 'ولا يصح', 'وتسقط', 'وتبقى', 'وباقي', 'البدائل']
bad = []
for x in q['questions']:
    if TPL in x['reason']:
        bad.append((x['id'], 'قالب متبقٍ'))
    for s in re.split(r'(?<=[.؛])\s+', x['reason']):
        for v in VARIANTS:
            if v in s and not any(s.strip().startswith(a) for a in ALLOWED):
                bad.append((x['id'], 'بادئة غير متوافقة مع splitReason: ' + s[:40]))
    for pat in [r'قلق اجتماعية', r'الأتربوي', r'المشتت', r'نضمه']:
        if re.search(pat, x['reason'] + x['question'] + ''.join(o['text'] for o in x['options'])):
            bad.append((x['id'], 'بقية نمط: ' + pat))
# المشتت يظهر فقط داخل «المتشتتين»
leftover_m = re.findall(r'المشتت(?!تين)', raw)
print(f'rotated: {rot} | typo-fixes: {fixed} | bad: {bad[:8] if bad else "لا شيء"} | المشتت خارج المتشتتين: {len(leftover_m)}')
if bad or leftover_m:
    shutil.copy(BAK, QB)
    print('FAILED — رُجّعت النسخة'); sys.exit(1)
print('VARIETY OK')
