#!/usr/bin/env python3
"""تطبيق دفعة تعديلات على البنك مع فحوص صارمة.
الاستعمال: python3 apply_patch.py src/data/qbank.json patches/batch01.py
كل دفعة ملف بايثون فيه PATCH = { 'Q123': {'q':..., 'opts':{idx:text}, 'reason':..., 'rep':[(old,new)]} }
"""
import json, re, sys, shutil, importlib.util, statistics
FOREIGN = re.compile(r'[A-Za-z\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u3040-\u30FF\u3400-\u9FFF]')

def load_patch(p):
    spec = importlib.util.spec_from_file_location('patch', p); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.PATCH

def ratio(q):
    c = len(next(o for o in q['options'] if o['isCorrect'])['text'])
    return c / statistics.mean(len(o['text']) for o in q['options'] if not o['isCorrect'])

def main(qb_path, patch_path):
    shutil.copyfile(qb_path, qb_path + '.bak_' + patch_path.split('/')[-1].replace('.py', ''))
    d = json.load(open(qb_path, encoding='utf-8')); Q = {q['id']: q for q in d['questions']}
    patch = load_patch(patch_path); errs = []; rows = []
    for qid, p in patch.items():
        q = Q[qid]; r0 = ratio(q) if q['type'] == 'mcq' else None
        if 'q' in p: q['question'] = p['q']
        for i, t in p.get('opts', {}).items():
            o = q['options'][i]; o['text'] = t
            if o['isCorrect']: q['correct'] = t
        for old, new in p.get('rep', []):
            if old not in q['reason']: errs.append(f'{qid}: نص الاستبدال غير موجود: {old[:20]}')
            q['reason'] = q['reason'].replace(old, new)
        if 'reason' in p: q['reason'] = p['reason']
        # فحوص
        txt = q['question'] + q['reason'] + ''.join(o['text'] for o in q['options'])
        if FOREIGN.search(txt): errs.append(f'{qid}: حروف غير عربية')
        if q['type'] == 'mcq':
            if len({o['text'] for o in q['options']}) != len(q['options']): errs.append(f'{qid}: خيارات مكررة')
            if sum(o['isCorrect'] for o in q['options']) != 1: errs.append(f'{qid}: صحيح غير وحيد')
            if next(o for o in q['options'] if o['isCorrect'])['text'] != q['correct']: errs.append(f'{qid}: correct غير مطابق')
            if ratio(q) > 1.35: errs.append(f'{qid}: ما زالت نسبة الطول {ratio(q):.2f}')
            rows.append((qid, r0, ratio(q)))
        if len(q['reason']) < 150: errs.append(f'{qid}: الشرح أقل من ١٥٠ حرفًا')
    if errs:
        print('أخطاء — لم يُحفظ شيء:'); [print(' ', e) for e in errs]; shutil.copyfile(qb_path + '.bak_' + patch_path.split('/')[-1].replace('.py',''), qb_path); sys.exit(1)
    json.dump(d, open(qb_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for qid, a, b in rows: print(f'{qid}: نسبة الطول {a:.2f} ← {b:.2f}')
    print('تم تطبيق', len(patch), 'تعديلًا')

if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
