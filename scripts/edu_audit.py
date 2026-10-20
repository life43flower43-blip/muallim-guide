#!/usr/bin/env python3
# تدقيق qbank.json — رصد الأسئلة الحسابية/غير التربوية ومشاكل الجودة واللغة
# للقراءة فقط: لا يعدل أي ملف. النتائج تُطبع وتُحفظ في scripts/edu_audit_out.json
import json, re, sys
from collections import Counter, defaultdict

P = 'public/data/qbank.json'
d = json.load(open(P, encoding='utf-8'))

courses = d['courses']; concepts = d['concepts']; questions = d['questions']
print('=== TOP KEYS ===', list(d.keys()))
print('counts: courses=%d concepts=%d questions=%d' % (len(courses), len(concepts), len(questions)))

print('\n=== SAMPLE CONCEPT ===')
print(json.dumps(concepts[0], ensure_ascii=False)[:400])
print('\n=== SAMPLE QUESTIONS ===')
for q in questions[:2]:
    print(json.dumps(q, ensure_ascii=False)[:500])

# حقول الأسئلة
qkeys = Counter()
for q in questions: qkeys.update(q.keys())
print('\n=== QUESTION FIELDS ===', dict(qkeys))
print('qtype:', Counter(q.get('qtype') for q in questions).most_common())
print('diff:', Counter(q.get('diff') for q in questions).most_common())
print('correct:', Counter(str(q.get('correct')) for q in questions).most_common(8))

# توزيع المقررات
cmap = {c.get('id'): c for c in concepts}
per_course_c = Counter(c.get('courseId') for c in concepts)
per_course_q = Counter(cmap.get(q.get('conceptId'), {}).get('courseId', '؟؟') for q in questions)
print('\n=== COURSES ===')
for cid, name in courses.items():
    print(f'{cid}: {name} | concepts={per_course_c.get(cid,0)} | questions={per_course_q.get(cid,0)}')
orphan_q = [q for q in questions if q.get('conceptId') not in cmap]
print('orphan questions (conceptId غير موجود):', len(orphan_q))

# ---------- رصد الحسابي / غير التربوي ----------
# أنماط قوية لمسائل حسابية صريحة
strong_math = [
    r'احسب', r'أحسب', r'كم يساوي', r'كم يساوي ناتج', r'ناتج الضرب', r'ناتج الجمع',
    r'حاصل ضرب', r'حاصل جمع', r'حاصل قسمة', r'حاصل طرح', r'ناتج القسمة', r'ناتج الطرح',
    r'[٠-٩0-9]\s*[+\-×÷*/]\s*[٠-٩0-9]', r'[٠-٩0-9]\s*[+\-]\s*[٠-٩0-9]\s*=',
    r'=\s*[٠-٩0-9]+\s*\?', r'معادلة', r'جذر', r'مكعبي? [٠-٩0-9]', r'أس\s*[٠-٩0-9]',
    r'\bx\b', r'\by\b', r'س\s*=\s*[٠-٩0-9]', r'ص\s*=\s*[٠-٩0-9]',
    r'مساحة', r'محيط', r'قياس الزاوية', r'الزاوية القائمة', r'مثلث قائم',
    r'مجموع قياسات', r'مضلع', r'متوازي الأضلاع', r'معين', r'شبه منحرف',
    r'كسر(?:\s|$)', r'أعداد كسرية', r'كسور عشرية', r'أعداد صحيحة', r'الأعداد النسبية',
    r'جدول توزيع تكراري', r'الوسيط الحسابي', r'المنوال', r'المدى',
]
# كلمات قد تكون سليمة تربوياً في سياقها لكن تستدعي الفحص
soft_math = [r'نسبة مئوية', r'متوسط', r'نسبة', r'إحصاء', r'مئوية', r'درجة مئوية']

def flags_for(text):
    fl = []
    for pat in strong_math:
        if re.search(pat, text):
            fl.append(pat)
    return fl

math_hits = []
for q in questions:
    text = q.get('question', '')
    opts = ' '.join(q.get(k, '') for k in ('a', 'b', 'c', 'd') if q.get(k))
    fl = flags_for(text)
    if fl:
        math_hits.append({'id': q.get('id'), 'course': cmap.get(q.get('conceptId'), {}).get('courseId'),
                          'concept': cmap.get(q.get('conceptId'), {}).get('name', '')[:40],
                          'flags': fl, 'question': text[:160]})
print('\n=== MATH-FLAGGED QUESTIONS:', len(math_hits), '===')
by_course = Counter(m['course'] for m in math_hits)
print('by course:', dict(by_course))
for m in math_hits[:40]:
    print(f"[{m['course']}|{m['concept']}] {m['question']}  {m['flags']}")

# ---------- جودة اللغة والصياغة ----------
latin = re.compile(r'[A-Za-z]')
latin_hits, short_hits, dupopt_hits, noreason_hits = [], [], [], []
stem_count = Counter()
for q in questions:
    text = q.get('question', '')
    opts = [q.get(k, '') for k in ('a', 'b', 'c', 'd') if q.get(k) is not None and q.get(k) != '']
    stem_count[text.strip()] += 1
    if latin.search(text) or any(latin.search(o) for o in opts):
        latin_hits.append({'id': q.get('id'), 'course': cmap.get(q.get('conceptId'), {}).get('courseId'), 'q': text[:120]})
    if len(text.strip()) < 30:
        short_hits.append({'id': q.get('id'), 'q': text})
    if len(opts) >= 2 and len(set(opts)) != len(opts):
        dupopt_hits.append({'id': q.get('id'), 'q': text[:80]})
    if not (q.get('reason') or '').strip():
        noreason_hits.append(q.get('id'))

dups = {s: n for s, n in stem_count.items() if n > 1}
print('\n=== LATIN CHARS:', len(latin_hits), '| SHORT STEMS:', len(short_hits), '| DUP OPTIONS:', len(dupopt_hits), '| NO REASON:', len(noreason_hits), '| DUP STEMS:', len(dups))
for l in latin_hits[:15]: print('LATIN:', l)
for s in short_hits[:15]: print('SHORT:', s)
for d_ in dupopt_hits[:10]: print('DUPOPT:', d_)
for s, n in list(dups.items())[:10]: print(f'DUP x{n}:', s[:100])

# عينة عشوائية للاستعراض البصري
import random
random.seed(42)
print('\n=== RANDOM SAMPLE (24) ===')
for q in random.sample(questions, 24):
    cc = cmap.get(q.get('conceptId'), {})
    print(f"[{cc.get('courseId')}|{cc.get('name','')[:32]}] {q.get('question','')[:110]}")

out = {'math_hits': math_hits, 'latin_hits': latin_hits, 'short_hits': short_hits,
       'dupopt_hits': dupopt_hits, 'noreason_ids': noreason_hits,
       'dup_stems': {s: n for s, n in dups.items()}}
json.dump(out, open('scripts/edu_audit_out.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\nsaved -> scripts/edu_audit_out.json')
