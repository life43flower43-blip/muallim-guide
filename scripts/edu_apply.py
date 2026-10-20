# -*- coding: utf-8 -*-
# تطبيق التعديلات على qbank.json:
# ١) حذف كتلة القدرات غير التربوية (C801–C814) بمفاهيمها وأسئلتها
# ٢) إعادة صياغة الأسئلة المبتورة (خريطة STEM_REWRITES)
# ٣) إضافة مسار «الذكاء الاصطناعي في التعليم» (AI1) بمفاهيمه وأسئلته
# ثم فحوصات سلامة شاملة وكتابة مضغوطة مطابقة للتنسيق الأصلي.
import json, re, sys
sys.path.insert(0, 'scripts')
from edu_stems import STEM_REWRITES
from edu_ai_concepts import NEW_CONCEPTS
from edu_ai_questions_a import NEW_QUESTIONS_A
from edu_ai_questions_b import NEW_QUESTIONS_B

P = 'public/data/qbank.json'
d = json.load(open(P, encoding='utf-8'))
courses, concepts, questions = d['courses'], d['concepts'], d['questions']

before = (len(courses), len(concepts), len(questions))

# ---------- ٠) إصلاح عيوب موروثة: ثمانية أسئلة موسومة بإجابتين صحيحتين ----------
# الحكم على الإجابة المقصودة من حقل «reason» الذي يشرح القصد الأصلي.
DEFECT_FIX = {
    # {معرّف: فهرس الخيار الصحيح أو نص ص/خطأ}
    "Q1146": 1, "Q1543": 1, "Q1701": 1, "Q11186": 1, "Q11189": 1,
    "Q11188": "صح", "Q11191": "صح", "Q11192": "خطأ",
}
qmap0 = {q['id']: q for q in questions}
fixed = 0
for qid, ans in DEFECT_FIX.items():
    q = qmap0[qid]
    for i, o in enumerate(q['options']):
        o['isCorrect'] = (i == ans) if isinstance(ans, int) else (o['text'] == ans)
    corr = [o['text'] for o in q['options'] if o['isCorrect']][0]
    q['correct'] = corr
    fixed += 1
print(f"أُصلح {fixed} سؤالاً موسوم بإجابتين صحيحتين")

# ---------- ١) حذف كتلة القدرات ----------
DROP = {f"C8{i:02d}" for i in range(1, 15)}  # C801..C814
removed_concepts = [c for c in concepts if c['id'] in DROP]
removed_qids = {q['id'] for q in questions if q['conceptId'] in DROP}
concepts = [c for c in concepts if c['id'] not in DROP]
questions = [q for q in questions if q['conceptId'] not in DROP]
print(f"حُذفت {len(removed_concepts)} مفهوماً و{len(removed_qids)} سؤالاً من كتلة القدرات")

# ---------- ٢) إعادة الصياغة ----------
miss = [k for k in STEM_REWRITES if k not in {q['id'] for q in questions}]
if miss:
    print("!! معرفات إعادة الصياغة غير الموجودة:", miss); sys.exit(1)
applied = 0
for q in questions:
    if q['id'] in STEM_REWRITES:
        q['question'] = STEM_REWRITES[q['id']]
        applied += 1
print(f"أُعيدت صياغة {applied} سؤالاً")

# ---------- ٣) إضافة المسار الجديد ----------
if 'AI1' in courses:
    print("!! المسار AI1 موجود سلفاً"); sys.exit(1)
courses['AI1'] = 'الذكاء الاصطناعي في التعليم'
new_q = NEW_QUESTIONS_A + NEW_QUESTIONS_B

# فحص تطابق correct مع الخيار الصحيح
for q in new_q:
    corr = [o['text'] for o in q['options'] if o['isCorrect']]
    if len(corr) != 1 or q['correct'] != corr[0]:
        print(f"!! خلل في {q['id']}: correct لا يوافق الخيار الصحيح"); sys.exit(1)
    if q['type'] == 'tf':
        if sorted(o['text'] for o in q['options']) != ['خطأ', 'صح']:
            print(f"!! {q['id']}: خيارات ص/خ غير قياسية"); sys.exit(1)
    else:
        if len(q['options']) != 4:
            print(f"!! {q['id']}: ليست أربعة خيارات"); sys.exit(1)

# فحص عدم وجود حروف لاتينية في المحتوى الجديد (قاعدة الصفر اللاتيني)
latin = re.compile(r'[A-Za-z]')
for c in NEW_CONCEPTS:
    blob = c['title'] + c['explanation'] + c['example'] + ' '.join(c.get('examples', []))
    if latin.search(blob):
        print(f"!! حرف لاتيني في المفهوم {c['id']}"); sys.exit(1)
for q in new_q:
    blob = q['question'] + q['reason'] + ' '.join(o['text'] for o in q['options'])
    if latin.search(blob):
        print(f"!! حرف لاتيني في السؤال {q['id']}"); sys.exit(1)

concepts.extend(NEW_CONCEPTS)
questions.extend(new_q)
print(f"أُضيف مسار AI1: {len(NEW_CONCEPTS)} مفهوماً و{len(new_q)} سؤالاً")

# ---------- فحوصات السلامة الشاملة ----------
cids = [c['id'] for c in concepts]
qids = [q['id'] for q in questions]
assert len(set(cids)) == len(cids), "معرفات مفاهيم مكررة"
assert len(set(qids)) == len(qids), "معرفات أسئلة مكررة"
cmap = {c['id']: c for c in concepts}
for q in questions:
    assert q['conceptId'] in cmap, f"سؤال يتيم {q['id']}"
    assert q['type'] in ('mcq', 'tf'), q['id']
    assert q['difficulty'] in ('سهل', 'متوسط', 'صعب'), q['id']
    assert q['reason'].strip(), q['id']
    corr_count = sum(1 for o in q['options'] if o['isCorrect'])
    assert corr_count == 1, f"{q['id']}: عدد الإجابات الصحيحة {corr_count}"
    assert q['correct'] == [o['text'] for o in q['options'] if o['isCorrect']][0], q['id']
# كل مفهوم له أسئلة
for c in concepts:
    n = sum(1 for q in questions if q['conceptId'] == c['id'])
    assert n > 0, f"مفهوم بلا أسئلة {c['id']}"

d['courses'], d['concepts'], d['questions'] = courses, concepts, questions
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

print(f"\nقبل: مقررات={before[0]} مفاهيم={before[1]} أسئلة={before[2]}")
print(f"بعد:  مقررات={len(courses)} مفاهيم={len(concepts)} أسئلة={len(questions)}")
print('\nتوزيع المقررات النهائي:')
from collections import Counter
per_c = Counter(c['courseId'] for c in concepts)
per_q = Counter(cmap.get(q['conceptId'], {}).get('courseId', '؟') for q in questions)
for cid, name in courses.items():
    print(f"  {cid}: {name} | مفاهيم={per_c.get(cid,0)} | أسئلة={per_q.get(cid,0)}")
print('\nتم الحفظ في', P)
