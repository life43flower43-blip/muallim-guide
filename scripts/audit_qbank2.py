# -*- coding: utf-8 -*-
"""تدقيق دقيق: خريطة الدورات→المفاهيم + كشف المسائل الحسابية الحقيقية فقط"""
import json
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

with open("public/data/qbank.json", encoding="utf-8") as f:
    d = json.load(f)

courses = d["courses"]
concepts = d["concepts"]
questions = d["questions"]

# بنية المفاهيم
c0 = concepts[0] if isinstance(concepts, list) else list(concepts.items())[0]
print("بنية المفهوم:", json.dumps(c0, ensure_ascii=False)[:300])
print()

# خريطة مفهوم → دورة
if isinstance(concepts, list):
    cmap = {}
    for c in concepts:
        cmap[c.get("id")] = c.get("course") or c.get("courseId") or c.get("cid") or "?"
else:
    cmap = {}

# توزيع الأسئلة على الدورات
qcourse = Counter()
for q in questions:
    cid = q.get("conceptId")
    course = cmap.get(cid, "?")
    qcourse[course] += 1
print("توزيع الأسئلة على الدورات:")
for k, v in qcourse.most_common():
    print(f"  {k}: {v}")
print()

# مفاهيم كل دورة (عينة)
if isinstance(concepts, list):
    by_course = {}
    for c in concepts:
        by_course.setdefault(cmap.get(c.get("id"), "?"), []).append(c)
    for course, cs in sorted(by_course.items()):
        titles = [c.get("title") or c.get("name") or "?" for c in cs]
        print(f"== دورة {course} ({len(cs)} مفهوم): {', '.join(titles[:8])}{'...' if len(titles)>8 else ''}")
print()

# ===== المسائل الحسابية الحقيقية (أنماط صارمة) =====
STRICT = [
    (r"[\u0660-\u06690-9]\s*[\+\×\*\÷\/\-\u2212]\s*[\u0660-\u06690-9]", "تعبير حسابي بأرقام: ٥ + ٣"),
    (r"(احسب|أحسب|إحسب|احسبي|أحسبي)\s", "فعل احسب"),
    (r"(ما\s+ناتج|ما\s+هو\s+ناتج|ناتج\s+(جمع|طرح|ضرب|قسمة|الجمع|الطرح|الضرب|القسمة))", "ناتج عملية"),
    (r"(كم\s+(يساوي|ناتج|مجموع|يتبقى|عدد\s+الأشهر|عدد\s+الأيام)\s)", "كم يساوي/مجموع"),
    (r"(زائد|ناقص|مضروب[ة]*\s*في|مقسوم[ة]*\s*على|مرة\s|مرات\s)", "زائد/ناقص/مضروب في"),
    (r"(درهم|ريال|دينار|جنيه|شيكل)\s*", "عملة مالية"),
    (r"(اشترى|شترى|باعَ|باعت|يباع|يكسب|يربح|يخسر|الربح|الخسارة|سعر|ثمن)\s", "سياق بيع وشرح"),
    (r"(سيارة|سيارات|قطار|قطارات|حافلة|طائرة)\s*(تتحرك|تسير|يسير|تقطع|سرعتها|سرعته|تدخل|تخرج)", "سرعة مواصلات"),
    (r"(حوض|صندوق|علبة|كيس)\s*(يحتوي|فيه|به|ممتلئ)", "صناديق وأكواب"),
    (r"(تفاحة|تفاحات|برتقالة|قلم|أقلام|كرة|كرات|كتاب[ة]*\s)\s*(و|ثمن|سعر|ممن)", "عدّ أشياء"),
]

def opt_text(o):
    if isinstance(o, dict):
        return o.get("text") or o.get("label") or ""
    return str(o)

hits_list = []
for q in questions:
    text = (q.get("question") or "").strip()
    opts = " | ".join(opt_text(o) for o in (q.get("options") or []))
    full = text + " ‖ " + opts
    hits = set()
    for pat, label in STRICT:
        if re.search(pat, full):
            hits.add(label)
    if hits:
        hits_list.append((q, sorted(hits)))

print(f"===== أسئلة حسابية حقيقية مرشحة: {len(hits_list)} =====")
cnt = Counter()
for q, hits in hits_list:
    for h in hits:
        cnt[h] += 1
for k, v in cnt.most_common():
    print(f"  {k}: {v}")
print()
print("===== عينات كاملة (أول 15) =====")
for q, hits in hits_list[:15]:
    cid = q.get("conceptId")
    print(f"[{','.join(hits)}] ({cid}) {q.get('question','')[:110]}")
    print(f"    خيارات: {' | '.join(opt_text(o) for o in (q.get('options') or [])[:4])[:100]}")
    print()

# ===== فحوصات الجودة العامة =====
import unicodedata
latin = re.compile(r"[A-Za-z]")
west_digits = re.compile(r"[0-9]")
bad_correct = 0
empty_fields = 0
dupes = Counter()
for q in questions:
    text = q.get("question") or ""
    opts = [opt_text(o) for o in (q.get("options") or [])]
    if not text.strip() or not opts or len([o for o in opts if o.strip()]) < 2:
        empty_fields += 1
    c = q.get("correct")
    if not isinstance(c, int) or c < 0 or c >= len(opts):
        bad_correct += 1
    dupes[text.strip()] += 1

latin_qs = [q for q in questions if latin.search(q.get("question") or "") or any(latin.search(opt_text(o)) for o in (q.get("options") or []))]
wdigit_qs = [q for q in questions if west_digits.search(q.get("question") or "")]
dup_count = sum(v for v in dupes.values() if v > 1)

print("===== فحوصات الجودة =====")
print(f"أسئلة بحروف لاتينية: {len(latin_qs)}")
print(f"أسئلة بأرقام غربية (0-9): {len(wdigit_qs)}")
print(f"أسئلة بحقول ناقصة: {empty_fields}")
print(f"أسئلة بمؤشر إجابة خاطئ: {bad_correct}")
print(f"أسئلة مكررة نصياً: {dup_count}")
if latin_qs[:5]:
    for q in latin_qs[:5]:
        print(f"  LAT: {q.get('question','')[:80]}")
if wdigit_qs[:5]:
    for q in wdigit_qs[:5]:
        print(f"  WDIG: {q.get('question','')[:80]}")
