# -*- coding: utf-8 -*-
"""تدقيق لغوي أكاديمي شامل لكل نصوص qbank.json (شرح + أمثلة + أسئلة + خيارات + أسباب)."""
import json, re, sys
from collections import Counter

BANK = json.load(open('/home/z/my-project/src/data/qbank.json'))
concepts, questions = BANK['concepts'], BANK['questions']

# ---------- 1. أنماط نحوية/إملائية مكسورة معروفة ----------
BROKEN_PATTERNS = [
    (r'مما\s+قياس\b', 'مما قياس (يجب: مما قاس)'),
    (r'مما\s+تعداد', 'مما تعداد'),
    (r'أشيار', 'أشيار (الصواب: أشهر)'),
    (r'سلم\s+المرحاض', 'سلم المرحاض (محتوى غير لائق)'),
    (r'فزاد\s+من\s+خطواته', 'فزاد من خطواته'),
    (r'فما\s+كان\s+لدى\s+\S+\s+(?!سوى)(غريزة|مشاعر|انفعال)', 'فما كان لدى X غريزة بلا «سوى»'),
    (r'والدهم\s+توفي', 'والدهم توفي (ضمير خاطئ)'),
    (r'شاهدت\s+الأم\s+خالد', 'شاهدت الأم خالد (ترتيب مختل)'),
    (r'معلمة\s+التربية\s+الإسلامية\s+ثوباً', 'إهداء ثوب لطالبة (محتوى حساس)'),
    (r'\bمنذ\s+أشهر\b.{0,30}والدهم', 'والدهم بعد إشارة أنثى'),
    (r'الأمهات\s+يضحكن', 'الأمهات يضحكن في مثال فردي'),
    (r'نورا\s+غريزة', 'نورا غريزة (إعراب خاطئ)'),
    (r'\bفي\s+أرضها\b', 'في أرضها (عبارة غامضة)'),
    (r'والدهم\s+توفي', 'والدهم توفي'),
    (r'البلوغ\s+الجنسي\s+الشبيه', 'عبارات مشبوهة'),
    (r'تموين\s+الصور', 'تموين الصور (خطأ تاريخي)'),
    (r'\bمنتنحي', 'منتنحي'),
    (r'\bالأوامال', 'الأوامال'),
    (r'يحسن\s+دقة', 'يحسن دقة'),
    (r'يضحك\s+من\s+شأنه', 'يضحك من شأنه'),
    (r'تضاف\s+إليها\s+دعم', 'تضاف إليها دعم'),
    (r'\bالبرجماتية', 'البرجماتية'),
    (r'\bإستراتيج', 'إستراتيج (الصواب: استراتيج)'),
    (r'فرط\s+النشاط\s+الدرقية', 'فرط النشاط الدرقية'),
    (r'حقل\s+صدق', 'حقل صدق'),
    (r'\bلأشياء\b', 'لأشياء'),
    (r'\bوالافتتاحيات', 'والافتتاحيات'),
    (r'يهاجم\s+نفسه\s+هو', 'تكرار ضمير'),
    (r'\bالكرام\s+والاحترام', 'تكرار'),
    (r'كلٌّ\s+من\s+كلٍّ', 'تكرار ضمائر'),
    (r'تشير\s+إلى\s+إلى', 'تشير إلى إلى (تكرار)'),
    (r'\bإلى\s+إلى\b', 'تكرار إلى إلى'),
    (r'\bفي\s+في\b', 'تكرار في في'),
    (r'\bمع\s+مع\b', 'تكرار مع مع'),
    (r'\bعلى\s+على\b', 'تكرار على على'),
    (r'\bما\s+ما\b', 'تكرار ما ما'),
    (r'\bالمعلم\s+المعلم', 'تكرار كلمة'),
    (r'\bالطالب\s+الطالب', 'تكرار كلمة'),
    (r'\bيعني\b', 'كلمة عامية «يعني»'),
    (r'\bطبعاً\b', 'كلمة عامية «طبعاً»'),
    (r'\bخلاص\b', 'كلمة عامية «خلاص»'),
    (r'\bشوي\b', 'كلمة عامية «شوي»'),
    (r'\bأوكي\b', 'كلمة عامية «أوكي»'),
    (r'\bمشكلة.{0,6}مو\b', 'عامية «مو»'),
    (r'\bالحين\b', 'عامية «الحين»'),
    (r'\bباينة\b', 'عامية «باينة»'),
    (r'\bزي\s+ما\b', 'عامية «زي ما»'),
    (r'\bعشان\b', 'عامية «عشان»'),
    (r'\bلأنه?\s+لأن', 'تكرار لأن'),
    (r',,|--|\.\.', 'ترقيم لاتيني غريب'),
]

# ---------- 2. جمع النصوص ----------
def concept_texts(c):
    texts = [('شرح: ' + c['title'], c['explanation'])]
    for ex in (c.get('examples') or []):
        if isinstance(ex, str) and ex.strip():
            texts.append(('مثال: ' + c['title'], ex))
    return texts

def question_texts(q):
    t = [('سؤال', q['question']), ('سبب', str(q['reason']))]
    if isinstance(q['options'], list):
        for o in q['options']:
            if isinstance(o, dict):
                t.append(('خيار', str(o.get('text',''))))
            else:
                t.append(('خيار', str(o)))
    return t

records = []
for c in concepts:
    for where, txt in concept_texts(c):
        records.append((c['id'], where, txt))
for q in questions:
    for where, txt in question_texts(q):
        records.append((q['id'], where, txt))

print(f'إجمالي القطع النصية المدققة: {len(records)}')

# ---------- 3. فحص الأنماط ----------
hits = Counter()
details = {}
for cid, where, txt in records:
    for pat, label in BROKEN_PATTERNS:
        for m in re.finditer(pat, txt):
            key = (label,)
            hits[key] += 1
            details.setdefault(label, []).append((cid, where, txt[max(0, m.start()-40):m.end()+40]))

print('\n=== الأنماط المكسورة المرصودة ===')
for (label,), n in hits.most_common():
    print(f'{n:5d} × {label}')
    for cid, where, ctx in details[label][:3]:
        print(f'      [{cid} / {where}] …{ctx}…')

# ---------- 4. إحصاءات أكاديمية عامة ----------
def wlen(s): return len(re.findall(r'\S+', s))

exp_lens = [wlen(c['explanation']) for c in concepts]
print(f'\n=== الشروح: متوسط الكلمات {sum(exp_lens)/len(exp_lens):.0f}، أدنى {min(exp_lens)}، أقصى {max(exp_lens)}')
short_exp = [c['id'] for c in concepts if wlen(c['explanation']) < 35]
print(f'شروح قصيرة جداً (<35 كلمة): {len(short_exp)} → {short_exp[:12]}')

q_lens = [wlen(q['question']) for q in questions]
print(f'أسئلة: متوسط {sum(q_lens)/len(q_lens):.0f} كلمة، أقصر {min(q_lens)}')
short_q = [q['id'] for q in questions if wlen(q['question']) < 8]
print(f'أسئلة قصيرة جداً (<8 كلمات): {len(short_q)} → {short_q[:12]}')

r_lens = [wlen(str(q['reason'])) for q in questions]
print(f'الأسباب: متوسط {sum(r_lens)/len(r_lens):.0f} كلمة')
short_r = [q['id'] for q in questions if wlen(str(q['reason'])) < 15]
print(f'أسباب ضحلة (<15 كلمة): {len(short_r)} → {short_r[:15]}')

# أسلوب الأسباب: كثير يبدأ بـ«الصحيح لأنه» أو «الخيارات الأخرى خاطئة» — أسلوب غير أكاديمي
starts = Counter()
for q in questions:
    r = str(q['reason'])
    if r.startswith('الصحيح'):
        starts['يبدأ بـ«الصحيح»'] += 1
    if 'المشتتات' in r:
        starts['يذكر «المشتتات»'] += 1
    if 'الخيارات الأخرى خاطئة' in r:
        starts['يكرر «الخيارات الأخرى خاطئة»'] += 1
    if r.startswith('الإجابة الصحيحة'):
        starts['يبدأ بـ«الإجابة الصحيحة»'] += 1
print('\n=== أنماط أسلوب الأسباب (تكرار قالب واحد) ===')
for k, v in starts.most_common():
    print(f'{v:5d} × {k}')

# تذبذب المصطلح: التلميذ مقابل الطالب داخل النص نفسه
mixed = 0
for cid, where, txt in records:
    has_t = 'التلميذ' in txt or 'التلميذة' in txt
    has_s = 'الطالب' in txt or 'الطالبة' in txt
    if has_t and has_s:
        mixed += 1
print(f'\nنصوص تخلط «التلميذ» و«الطالب» في القطعة نفسها: {mixed}')

# جمل طويلة بلا ترقيم
long_nopunct = 0
for cid, where, txt in records:
    for sent in re.split(r'[.؟!]', txt):
        if wlen(sent) > 45:
            long_nopunct += 1
            break
print(f'قطع تحتوي جملة >45 كلمة بلا وقفة: {long_nopunct}')

# تنصيص لاتيني متبقٍ
lat_quotes = sum(1 for _, _, t in records if '"' in t or "«»" in t)
print(f'قطع فيها تنصيص لاتيني: {lat_quotes}')
