# -*- coding: utf-8 -*-
"""عينة عشوائية موثقة (100 سؤال، بذرة ثابتة) + تحليل تربوي بنيوي للبنك"""
import json
import random
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

SEED = 20261016  # بذرة معلنة — إعادة التوليد بنفس البذرة تعطي العينة نفسها
N = 100

with open("public/data/qbank.json", encoding="utf-8") as f:
    d = json.load(f)

courses, concepts, questions = d["courses"], d["concepts"], d["questions"]
cmap = {c["id"]: c for c in concepts}
course_of = {c["id"]: c.get("courseId", "?") for c in concepts}

# ===== 1) العينة العشوائية الموثقة =====
rng = random.Random(SEED)
sample = rng.sample(questions, N)
sample.sort(key=lambda q: q["id"])

out = {
    "meta": {
        "seed": SEED,
        "size": N,
        "population": len(questions),
        "method": "random.Random(seed).sample(questions, 100) ثم فرز بالمعرف",
        "reproduce": "python3 -c \"import json,random;d=json.load(open('public/data/qbank.json',encoding='utf-8'));print(json.dumps(random.Random(20261016).sample(d['questions'],100),ensure_ascii=False,indent=1))\"",
    },
    "questions": [
        {
            "id": q["id"],
            "course": course_of.get(q["conceptId"], "?"),
            "concept": {
                "id": q["conceptId"],
                "title": cmap.get(q["conceptId"], {}).get("title", ""),
                "chapter": cmap.get(q["conceptId"], {}).get("chapter", ""),
            },
            "type": q["type"],
            "difficulty": q["difficulty"],
            "question": q["question"],
            "options": [{"text": o["text"], "isCorrect": o["isCorrect"]} for o in q["options"]],
            "correct": q["correct"],
            "reason": q["reason"],
        }
        for q in sample
    ],
}
with open("review/sample-100.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print(f"sample-100.json: {len(sample)} سؤالاً — بذرة {SEED}")

# ===== 2) تحليل تربوي بنيوي على البنك كاملاً =====
# أ) المستوى المعرفي من صيغة السؤال: تطبيق/تحليل مقابل تذكر
APP_PAT = re.compile(r"(طالب|طالبة|معلم|المعلم|لاحظت|قرر|قررت|موقف|أثناء|في صف|سأل|قام طالب|يواجه|تلاحظ|قسّم|طبق|رصد)")
RECALL_PAT = re.compile(r"(ما (تعريف|المقصود|المراد|أهم|وظيفة|الفرق|النوع|النوعية|الخاصية|المعيار|الأساس)|يُعرَّف|تعريف |من مؤسسي|متى|في أي عام|أي مصطلح)")
app, rec, other = 0, 0, 0
for q in questions:
    t = q["question"]
    if APP_PAT.search(t):
        app += 1
    elif RECALL_PAT.search(t):
        rec += 1
    else:
        other += 1

print(f"\nالمستوى المعرفي (تقديري من صيغة الساق):")
print(f"  مواقف تطبيقية/تحليلية: {app} ({app*100//len(questions)}%)")
print(f"  تذكر مباشر: {rec} ({rec*100//len(questions)}%)")
print(f"  أخرى/وسيطة: {other} ({other*100//len(questions)}%)")

# ب) جودة المشتتات (مؤشرات بنائية): تفاوت الأطوال، خيارات مكررة، عدد الخيارات
def opt_text(o):
    return o["text"] if isinstance(o, dict) else str(o)

short_opts = 0
dup_opts = 0
len_ratio_bad = 0
opts_count = Counter()
for q in questions:
    opts = [opt_text(o) for o in q["options"]]
    opts_count[len(opts)] += 1
    if len(set(opts)) != len(opts):
        dup_opts += 1
    if any(len(o) < 3 for o in opts):
        short_opts += 1
    corr = next((o for o in q["options"] if isinstance(o, dict) and o.get("isCorrect")), None)
    if corr:
        others = [len(opt_text(o)) for o in q["options"] if not (isinstance(o, dict) and o.get("isCorrect"))]
        if others:
            lo = min(others)
            lc = len(opt_text(corr))
            if lc > 0 and (lo == 0 or lc / lo > 6 or lc < 8):
                len_ratio_bad += 1

print(f"\nبنية الخيارات:")
print(f"  توزيع عدد الخيارات: {dict(opts_count)}")
print(f"  أسئلة بخيارات مكررة نصياً: {dup_opts}")
print(f"  أسئلة بخيارات قصيرة جداً (<3 أحرف): {short_opts}")
print(f"  أسئلة طول إجابتها الصحيحة يختلف جذرياً عن المشتتات (مؤشر كشف سهل): {len_ratio_bad}")

# ج) التوازن: أسئلة لكل مفهوم
per_concept = Counter(q["conceptId"] for q in questions)
counts = list(per_concept.values())
print(f"\nالتوازن (أسئلة لكل مفهوم):")
print(f"  مفاهيم: {len(per_concept)} | متوسط: {sum(counts)/len(counts):.2f} | أدنى: {min(counts)} | أعلى: {max(counts)}")
print(f"  مفاهيم بأقل من 3 أسئلة: {sum(1 for c in counts if c < 3)}")
print(f"  مفاهيم بلا أسئلة: {len(concepts) - len(per_concept)}")

# د) الشروح: طول التفسير
rlens = [len(q.get("reason", "")) for q in questions]
print(f"\nالتفسيرات:")
print(f"  متوسط طول التفسير: {sum(rlens)/len(rlens):.0f} حرفاً | أدنى: {min(rlens)} | أقصر من 60 حرفاً: {sum(1 for r in rlens if r < 60)}")

with open("review/pedagogy-structure.json", "w", encoding="utf-8") as f:
    json.dump({
        "cognitive": {"application_scenario": app, "recall_direct": rec, "intermediate_other": other, "note": "تصنيف تقديري بأنماط نصية — ليس بديلاً عن مراجعة بشرية"},
        "options": {"count_distribution": dict(opts_count), "duplicate_option_questions": dup_opts, "very_short_option_questions": short_opts, "length_gap_flagged": len_ratio_bad},
        "balance": {"concepts": len(per_concept), "avg_q_per_concept": round(sum(counts)/len(counts), 2), "min": min(counts), "max": max(counts), "under3": sum(1 for c in counts if c < 3)},
        "reasons": {"avg_len": round(sum(rlens)/len(rlens)), "under60": sum(1 for r in rlens if r < 60)},
    }, f, ensure_ascii=False, indent=1)
print("\npedagogy-structure.json written")
