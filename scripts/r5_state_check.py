#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""فحص الحالة الراهنة للأسئلة المذكورة في جولات المراجعة 12-17 (بأسماء الحقول الصحيحة)."""
import json

BANK = 'public/data/qbank.json'
d = json.load(open(BANK, encoding='utf-8'))
Q = {q['id']: q for q in d['questions']}
C = {c['id']: c for c in d['concepts']}

def correct_idx(q):
    for i, o in enumerate(q.get('options', [])):
        if o.get('isCorrect'):
            return i
    return None

def show(qid, label=''):
    q = Q.get(qid)
    if not q:
        print(f'--- {qid} {label}: غير موجود!')
        return
    print(f'=== {qid} {label} [{q.get("type")}] fixedOrder={q.get("fixedOrder")}')
    print('  Q:', q.get('question', '')[:250])
    if q.get('type') == 'mcq':
        ci = correct_idx(q)
        for i, o in enumerate(q.get('options', [])):
            mark = '>>> صح' if i == ci else '    '
            print(f'  {mark} [{i+1}] {o["text"][:100]}')
    else:
        print(f'  correct: {q.get("correct")!r}')
    print('  REASON:', q.get('reason', '')[:420])
    print()

# جولة 17 (علمية)
for qid in ['Q604', 'Q668', 'Q652', 'Q840', 'Q846', 'Q662', 'Q605', 'Q659', 'Q672', 'Q015', 'Q593', 'Q649', 'Q686', 'Q673', 'Q678', 'Q679']:
    show(qid, 'ج17')
