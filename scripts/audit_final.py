# -*- coding: utf-8 -*-
"""تحقق نهائي: اتساق الإجابة الصحيحة مع isCorrect + جودة دورة AI1"""
import json
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

with open("public/data/qbank.json", encoding="utf-8") as f:
    d = json.load(f)

questions = d["questions"]
concepts = d["concepts"]

# 1) اتساق correct ↔ isCorrect
mismatch = 0
no_true = 0
multi_true = 0
for q in questions:
    opts = q.get("options") or []
    trues = [o for o in opts if o.get("isCorrect")]
    if len(trues) == 0:
        no_true += 1
    elif len(trues) > 1:
        multi_true += 1
    corr = q.get("correct")
    if not trues or (isinstance(corr, str) and corr.strip() != trues[0].get("text", "").strip()):
        mismatch += 1

print(f"أسئلة بلا إجابة صحيحة: {no_true}")
print(f"أسئلة بإجابتين صحيحتين: {multi_true}")
print(f"أسئلة لا يطابق فيها correct النص المعلَّم: {mismatch}")
print()

# 2) دورة AI1 — المحتوى
ai_concepts = [c for c in concepts if c.get("courseId") == "AI1"]
ai_qids = {c["id"] for c in ai_concepts}
ai_questions = [q for q in questions if q.get("conceptId") in ai_qids]
print(f"== دورة AI1: {len(ai_concepts)} مفهوم، {len(ai_questions)} سؤال ==")
for c in ai_concepts:
    print(f"  • {c.get('title')}")
print()
print("عينة أسئلة AI1:")
for q in ai_questions[:6]:
    tr = next((o["text"] for o in q["options"] if o.get("isCorrect")), "?")
    print(f"[{q['type']}/{q['difficulty']}] {q['question'][:100]}")
    print(f"   الصحيح: {tr[:80]}")
    print()

# 3) توزيع نوع/صعوبة لكل دورة
print("توزيع الأسئلة حسب الدورة والصعوبة:")
cmap = {c["id"]: c.get("courseId", "?") for c in concepts}
cnt = Counter()
for q in questions:
    cnt[cmap.get(q.get("conceptId"), "?")] += 1
for k, v in sorted(cnt.items()):
    print(f"  {k}: {v}")

# 4) ids فريدة؟
qids = [q["id"] for q in questions]
cids = [c["id"] for c in concepts]
print(f"\nمعرفات أسئلة فريدة: {len(set(qids))}/{len(qids)}")
print(f"معرفات مفاهيم فريدة: {len(set(cids))}/{len(cids)}")
