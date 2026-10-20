#!/usr/bin/env python3
"""
إصلاح انحياز موضع الإجابة الصحيحة في أسئلة الاختيار من متعدد.
الاستعمال:  python3 fix_option_positions.py  src/data/qbank.json
- لا يلمس أي سؤال يشير شرحه أو نصه إلى ترتيب الخيارات (الأول/الثاني/…).
- يتجاهل الأسئلة التي فيها «كل/جميع ما سبق» أو «لا شيء مما سبق».
- يوزّع موضع الصحيح على بقية الأسئلة لتصير المواضع الأربعة متقاربة كليًا.
- تخليط ثابت (بذرة) فيعطي النتيجة نفسها كل مرة. وتُحفظ نسخة احتياطية بجانب الملف.
"""
import json, re, sys, random, shutil, collections

ORDINAL = re.compile(
    r'(?<![\u0621-\u064a])[وفبل]?(?:ال)?(?:أول|اول|ثاني|ثالث|رابع|أخير|الأخير)(?:ه|ها|هما|ان|ين|ة)?(?![\u0621-\u064a])'
    r'|(?<![\u0621-\u064a])[وفبل]?(?:الأول|الأولى|الثاني|الثانية|الثالث|الثالثة|الرابع|الرابعة|الأخير|الأخيرة)(?![\u0621-\u064a])'
    r'|(?<![\u0621-\u064a])(?:الخياران|الخيارين|أولهما|ثانيهما)(?![\u0621-\u064a])'
    r'|(?:الخيار|البديل|المشتت|الاختيار)\s*(?:أ|ب|ج|د)(?![\u0621-\u064a])'
)
ALLABOVE = re.compile(r'(جميع|كل|لا\s*شيء|كلا|كلتا).{0,8}(ما\s*سبق|مما\s*سبق|الإجابات|الخيارات)')

def refs_order(q):
    return bool(ORDINAL.search(q['reason']) or ORDINAL.search(q['question']))

def main(path):
    shutil.copyfile(path, path + '.bak_positions')
    d = json.load(open(path, encoding='utf-8'))
    mcq = [q for q in d['questions'] if q['type'] == 'mcq']
    rng = random.Random(20261013)

    def pos(q): return next(i for i, o in enumerate(q['options']) if o['isCorrect'])

    fixed_q = [q for q in mcq if refs_order(q) or any(ALLABOVE.search(o['text']) for o in q['options'])]
    movable = [q for q in mcq if q not in fixed_q]
    used = collections.Counter(pos(q) for q in fixed_q)
    before = collections.Counter(pos(q) for q in mcq)

    for q in fixed_q:
        q['fixedOrder'] = True   # الشرح يشير للترتيب — لا يُخلط عند العرض
    for q in movable:
        q.pop('fixedOrder', None)
    rng.shuffle(movable)
    for q in movable:
        n = len(q['options'])
        slots = [i for i in range(n)]
        low = min(used[i] for i in slots)
        target = rng.choice([i for i in slots if used[i] == low])
        correct = next(o for o in q['options'] if o['isCorrect'])
        rest = [o for o in q['options'] if not o['isCorrect']]
        rng.shuffle(rest)
        rest.insert(target, correct)
        q['options'] = rest
        used[target] += 1

    after = collections.Counter(pos(q) for q in mcq)
    tot = len(mcq)
    print('أسئلة اختيار من متعدد:', tot, '| مثبتة الترتيب:', len(fixed_q), '| أُعيد توزيعها:', len(movable))
    for name, c in (('قبل', before), ('بعد', after)):
        print(name, ' '.join(f'{"أبجد"[i]}={c[i]} ({c[i]*100/tot:.1f}%)' for i in range(4)))
    # فحوص سلامة
    for q in d['questions']:
        if q['type'] == 'mcq':
            assert sum(o['isCorrect'] for o in q['options']) == 1
            assert q['correct'] in [o['text'] for o in q['options']]
            assert next(o for o in q['options'] if o['isCorrect'])['text'] == q['correct']
    json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('تم الحفظ. النسخة الاحتياطية:', path + '.bak_positions')

if __name__ == '__main__':
    main(sys.argv[1])
