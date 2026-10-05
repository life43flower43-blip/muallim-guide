#!/usr/bin/env python3
# دمج ملفات الوكلاء rgen_w1..w7 في بنك واحد موحد → src/data/qbank.json
import importlib.util, json, sys, re

COURSES = {
  "M1": "المساق ١: الأسس البيولوجية للسلوك والتعلم",
  "M2": "المساق ٢: الأسس النفسية: الغرائز والعواطف والذكاء",
  "M3": "المساق ٣: علم نفس التعلم",
  "M4": "المساق ٤: القياس والتقويم التربوي",
  "M5": "المساق ٥: تطبيقات تدريس المواد الدراسية",
  "G1": "المكتبة التربوية العامة",
}
G1_CHAPTER_ORDER = ["أ", "ب", "ج", "د", "هـ", "ز", "ح", "ط", "ي", "ك", "ل", "م", "ن", "س", "ع", "ف"]

FILES = ["w1a", "w1b", "w2", "w3", "w4", "w5", "w6a", "w6b", "w7a", "w7b"]

def load(name):
    path = f"/home/z/my-project/scripts/rgen_{name}.py"
    spec = importlib.util.spec_from_file_location(f"rgen_{name}", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.NEW_CONCEPTS, mod.QUESTIONS

def chapter_rank(course, chapter):
    if course == "G1":
        # رتّب فصول المكتبة على أقسام الست عشرة بحرفها الأول بعد «. »
        ch = chapter.split(".")[0].strip() if "." in chapter else chapter
        for i, key in enumerate(G1_CHAPTER_ORDER):
            if ch.startswith(key):
                return i
        return 99
    return 0

all_concepts, all_questions = [], []
counts = {}
for name in FILES:
    cs, qs = load(name)
    counts[name] = (len(cs), len(qs))
    all_concepts += cs
    all_questions += qs

# ---------- تحقق أساسي ----------
errors = []
cids = [c["cid"] for c in all_concepts]
if len(set(cids)) != len(cids):
    dup = {x for x in cids if cids.count(x) > 1}
    errors.append(f"cid مكرر: {dup}")
qtexts = [q["question"] for q in all_questions]
if len(set(qtexts)) != len(qtexts):
    dup = {x for x in qtexts if qtexts.count(x) > 1}
    errors.append(f"نص سؤال مكرر ({len(dup)}): {list(dup)[:3]}")
cidset = set(cids)
for q in all_questions:
    if q["cid"] not in cidset:
        errors.append(f"سؤال لمفهوم غير موجود: {q['cid']}")
for q in all_questions:
    opts = [q.get(k) for k in ("a", "b", "c", "d") if q.get(k)]
    if q["qtype"] == "mcq":
        if len(opts) != 4 or len(set(opts)) != 4:
            errors.append(f"mcq خيارات غير رباعية مميزة: {q['question'][:40]}")
        if q["correct"] not in opts:
            errors.append(f"correct ليس ضمن الخيارات: {q['question'][:40]}")
    else:
        if q["correct"] not in ("صح", "خطأ"):
            errors.append(f"tf correct غير صالح: {q['question'][:40]}")
    if not q.get("reason") or len(q["reason"]) < 100:
        errors.append(f"reason قصيرة: {q['question'][:40]}")
for c in all_concepts:
    if len(c.get("explanation", "")) < 120:
        errors.append(f"explanation قصير: {c['cid']} {c['name'][:30]}")
    if len(c.get("example", "")) < 100:
        errors.append(f"example قصير: {c['cid']} {c['name'][:30]}")
if errors:
    print("MERGE FAILED —", len(errors), "أخطاء:")
    for e in errors[:25]:
        print(" -", e)
    sys.exit(1)

# ---------- إعادة الترقيم ----------
def course_rank(cid_course):
    order = ["M1", "M2", "M3", "M4", "M5", "G1"]
    return order.index(cid_course) if cid_course in order else 99

# ترتيب G1 داخلياً حسب الفصل ثم تسلسل الملفات
sorted_concepts = sorted(
    all_concepts,
    key=lambda c: (
        course_rank(c["course"]),
        chapter_rank(c["course"], c["chapter"]) if c["course"] == "G1" else 0,
    ),
)
# الحفاظ على ترتيب الكتابة داخل كل (مساق، فصل)
seen = {}
final_concepts = []
cid_map = {}
n = 0
for c in sorted_concepts:
    key = (c["course"], c["chapter"])
    idx = seen.get(key, 0)
    seen[key] = idx + 1
    n += 1
    new_id = f"C{n:03d}"
    cid_map[c["cid"]] = new_id
    final_concepts.append({
        "id": new_id,
        "courseId": c["course"],
        "chapter": c["chapter"],
        "title": c["name"],
        "explanation": c["explanation"],
        "example": c["example"],
    })

final_questions = []
m = 0
for q in all_questions:
    m += 1
    qid = f"Q{m:03d}"
    if q["qtype"] == "mcq":
        opts = [{"text": q[k], "isCorrect": q[k] == q["correct"]} for k in ("a", "b", "c", "d")]
    else:
        opts = [
            {"text": "صح", "isCorrect": q["correct"] == "صح"},
            {"text": "خطأ", "isCorrect": q["correct"] == "خطأ"},
        ]
    final_questions.append({
        "id": qid,
        "conceptId": cid_map[q["cid"]],
        "type": q["qtype"],
        "difficulty": q["diff"],
        "question": q["question"],
        "options": opts,
        "correct": q["correct"] if q["qtype"] == "mcq" else q["correct"],
        "reason": q["reason"],
    })

bank = {"courses": COURSES, "concepts": final_concepts, "questions": final_questions}
with open("/home/z/my-project/src/data/qbank.json", "w", encoding="utf-8") as f:
    json.dump(bank, f, ensure_ascii=False, indent=1)

# تحقق نهائي عميق
final_errors = []
qmap = {q["id"]: q for q in final_questions}
for q in final_questions:
    texts = [o["text"] for o in q["options"]]
    if q["correct"] not in texts:
        final_errors.append(q["id"])
    if sum(o["isCorrect"] for o in q["options"]) != 1:
        final_errors.append(q["id"] + " flags")
zero = [c["id"] for c in final_concepts if not any(q["conceptId"] == c["id"] for q in final_questions)]
diffs = {}
for q in final_questions:
    diffs[q["difficulty"]] = diffs.get(q["difficulty"], 0) + 1
tf_bad = [q["id"] for q in final_questions if q["type"] == "tf" and [o["text"] for o in q["options"]] != ["صح", "خطأ"]]

print(f"MERGE OK — {len(final_concepts)} مفهوماً / {len(final_questions)} سؤالاً")
print("توزيع الوكلاء:", counts)
print("الصعوبة:", diffs)
print("أخطاء نهائية:", len(final_errors), "| مفاهيم بلا أسئلة:", len(zero), "| tf غير موحد:", len(tf_bad))
per_course = {}
for c in final_concepts:
    per_course[c["courseId"]] = per_course.get(c["courseId"], 0) + 1
print("حسب المساق:", per_course)
