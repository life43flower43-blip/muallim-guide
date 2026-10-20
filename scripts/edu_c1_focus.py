#!/usr/bin/env python3
# فحص مركز لمسار C1 (المهارات) وكل الأسئلة ذات الأرقام/الحساب في البنك كله
import json, re
from collections import Counter, defaultdict

d = json.load(open('public/data/qbank.json', encoding='utf-8'))
courses, concepts, questions = d['courses'], d['concepts'], d['questions']
cmap = {c['id']: c for c in concepts}

C1_CONCEPTS = [c for c in concepts if c['courseId'] == 'C1']
print('=== C1 CHAPTERS ===')
by_chapter = defaultdict(list)
for c in C1_CONCEPTS:
    by_chapter[c['chapter']].append(c)
for ch, cs in by_chapter.items():
    print(f'- {ch}: {len(cs)} مفهوماً')

print('\n=== C1 CONCEPTS WITH DIGIT/CALC QUESTIONS ===')
digit_re = re.compile(r'[٠-٩0-9]')
calc_re = re.compile(r'[٠-٩0-9]\s*[+×÷−*/=\-]\s*[٠-٩0-9]')
calc_words = re.compile(r'حساب|احسب|أحسب|جمع|ضرب|قسمة|طرح|كسور|مضاعفات|جدول الضرب|سلسلة أمثلة')
for c in C1_CONCEPTS:
    qs = [q for q in questions if q['conceptId'] == c['id']]
    dq = [q for q in qs if calc_re.search(q['question']) or (digit_re.search(q['question']) and calc_words.search(q['question']))]
    if dq:
        print(f"\n### {c['id']} | {c['chapter']} | {c['title']} | {len(qs)} سؤالاً | {len(dq)} حسابياً")
        print('   شرح:', c['explanation'][:130])
        for q in dq[:4]:
            print('   →', q['question'][:140])

print('\n=== ALL ARITHMETIC-STYLE QUESTIONS IN WHOLE BANK (by course) ===')
hits = []
for q in questions:
    if calc_re.search(q['question']):
        hits.append(q)
print('total:', len(hits), '| by course:', dict(Counter(cmap.get(q['conceptId'], {}).get('courseId', '؟') for q in hits)))
for q in hits:
    cc = cmap.get(q['conceptId'], {})
    print(f"[{cc.get('courseId')}|{cc.get('title','')[:28]}] {q['id']}: {q['question'][:130]}")

print('\n=== C1: ALL CONCEPT TITLES (for curation) ===')
for c in C1_CONCEPTS:
    qs = [q for q in questions if q['conceptId'] == c['id']]
    print(f"{c['id']} | {c['chapter'][:20]:20} | {c['title'][:46]:46} | {len(qs)}س")
