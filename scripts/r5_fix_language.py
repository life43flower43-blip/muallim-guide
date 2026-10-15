#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اللغة والتحرير المتبقي (مرحلة 9) — وفق جولات المراجع 2 و4 و8:
أسئلة: Q13002 ضجاجه، Q13534 الفلافل.
مفاهيم: D989 أعقف→أعقد، D1337 تتلمع→تتملق، D1436 ندراكه→ندركه،
D1447/D1459 توحيد «القاصم الحرفي»، D1984 الفلافل، D2094 الترابيص+تقرار حركي.
سيناريوهات: الإرداعي→الردعي في src/lib/scenarios.ts.
"""
import json

BANK = 'public/data/qbank.json'
d = json.load(open(BANK, encoding='utf-8'))
Q = {q['id']: q for q in d['questions']}
C = {c['id']: c for c in d['concepts']}
log = []

def rep_concept(cid, old, new):
    t = C[cid]['explanation']
    assert old in t, f'{cid}: لا يوجد: {old[:40]}'
    C[cid]['explanation'] = t.replace(old, new, 1)
    log.append(f'{cid}[مفهوم]: «{old[:45]}» → «{new[:45]}»')

def rep_question(qid, field, old, new):
    t = Q[qid][field]
    assert old in t, f'{qid}[{field}]: لا يوجد: {old[:40]}'
    Q[qid][field] = t.replace(old, new, 1)
    log.append(f'{qid}[{field}]: «{old[:45]}» → «{new[:45]}»')

# ═══ المفاهيم ═══
rep_concept('D989', 'وتعد من أعقف فترات النمو', 'وتعد من أعقد فترات النمو')
rep_concept('D1337', 'تتلمع لذوي القرار', 'تتملق لذوي القرار')
rep_concept('D1436', 'بل ندراكه ثابت في حجمه الطبيعي', 'بل ندركه ثابت في حجمه الطبيعي')
rep_concept('D1447', 'والقواصم الحرفية تشكل', 'والقاصم الحرفي يشكل')
rep_concept('D1459', 'والروابط والقواصم', 'والروابط والقاصم الحرفي')
rep_concept('D1984', 'ويصنّف الفلافل التفكير الناقد في ست مكونات مترابطة',
            'ويصنّف التفكير الناقد إلى ست مكونات مترابطة')
rep_concept('D2094', 'كما يبنى البناء بالترابيص',
            'طبقةً فوق طبقة كما يبني التدريب المتدرج كل مرحلة على ما قبلها')
rep_concept('D2094', 'فتقرار حركي يخطط الاستجابة', 'فقرار حركي يخطط الاستجابة')

# ═══ الأسئلة ═══
rep_question('Q13002', 'reason', 'أما تضخيم الانفجار بسبب ضجاجه فيخلط', 'أما تضخيم الانفجار بسبب ضجيجه فيخلط')
rep_question('Q13534', 'reason', 'المسار السليم يمر بمكونات الفلافل الست', 'المسار السليم يمر بمكونات التفكير الناقد الست')

json.dump(d, open(BANK, 'w', encoding='utf-8'), ensure_ascii=False)
with open('review/r5_language_log.md', 'w', encoding='utf-8') as f:
    f.write('# سجل إصلاحات اللغة (مرحلة 9)\n\n')
    for line in log:
        f.write(f'- {line}\n')
print(f'أُنجز {len(log)} إصلاحًا لغويًا موثقًا.')

# ═══ scenarios.ts ═══
p = 'src/lib/scenarios.ts'
s = open(p, encoding='utf-8').read()
if 'أثرها الإرداعي' in s:
    s = s.replace('أثرها الإرداعي', 'أثرها الردعي')
    open(p, 'w', encoding='utf-8').write(s)
    log.append('scenarios.ts: «أثرها الإرداعي» → «أثرها الردعي»')
    print('scenarios.ts: أصلح الإرداعي → الردعي')
else:
    print('scenarios.ts: لا يوجد الإرداعي (مصلح سابقًا؟)')
