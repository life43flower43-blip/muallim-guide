# -*- coding: utf-8 -*-
# دمج مساق C1 «المهارات المعرفية والقدرات» في src/data/qbank.json مع فحص ذاتي صارم
import json, re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

QBANK = "/home/z/my-project/src/data/qbank.json"
C1_NAME = "المهارات المعرفية والقدرات"

from p12_c1_content import CONCEPTS
from p12_c1_questions import QUESTIONS

# ---------- الفحص الذاتي ----------
errors = []

# 1) العدادات وزوج mcq+tf لكل مفهوم
if len(CONCEPTS) != 14:
    errors.append(f"عدد المفاهيم {len(CONCEPTS)} والمرجو 14")
if len(QUESTIONS) != 28:
    errors.append(f"عدد الأسئلة {len(QUESTIONS)} والمرجو 28")
by_c = {}
for q in QUESTIONS:
    by_c.setdefault(q["conceptId"], []).append(q["type"])
for c in CONCEPTS:
    types = sorted(by_c.get(c["id"], []))
    if types != ["mcq", "tf"]:
        errors.append(f"{c['id']}: أنواع الأسئلة {types} بدل mcq+tf")

# 2) correct ضمن الخيارات + isCorrect واحد في mcq
for q in QUESTIONS:
    texts = [o["text"] for o in q["options"]]
    if q["correct"] not in texts:
        errors.append(f"{q['id']}: correct ليس ضمن الخيارات")
    trues = [o for o in q["options"] if o["isCorrect"]]
    if len(trues) != 1:
        errors.append(f"{q['id']}: عدد الإجابات الصحيحة {len(trues)}")
    elif trues[0]["text"] != q["correct"]:
        errors.append(f"{q['id']}: عدم تطابق isCorrect مع correct")

# 3) تفرّد المعرفات والنصوص
cids = [c["id"] for c in CONCEPTS]
qids = [q["id"] for q in QUESTIONS]
if len(set(cids)) != len(cids):
    errors.append("تكرار معرفات المفاهيم")
if len(set(qids)) != len(qids):
    errors.append("تكرار معرفات الأسئلة")
titles = [c["title"] for c in CONCEPTS]
if len(set(titles)) != len(titles):
    errors.append("تكرار عناوين المفاهيم")
qtexts = [q["question"] for q in QUESTIONS]
if len(set(qtexts)) != len(qtexts):
    errors.append("تكرار نصوص الأسئلة")

# 4) الأطوال الدنيا
for c in CONCEPTS:
    if len(c["explanation"]) < 120:
        errors.append(f"{c['id']}: الشرح أقصر من 120 ({len(c['explanation'])})")
    if len(c["example"]) < 100:
        errors.append(f"{c['id']}: المثال أقصر من 100 ({len(c['example'])})")
for q in QUESTIONS:
    if len(q["reason"]) < 150:
        errors.append(f"{q['id']}: السبب أقصر من 150 ({len(q['reason'])})")

# 5) منع الحروف اللاتينية والـ CJK في كل النصوص
CJK = re.compile(r"[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]")
LAT_IN_AR = re.compile(r"[\u0600-\u06ff][a-zA-Z]|[a-zA-Z][\u0600-\u06ff]")
AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"

def check_text(txt, where):
    if CJK.search(txt):
        errors.append(f"{where}: أحرف CJK")
    if LAT_IN_AR.search(txt):
        errors.append(f"{where}: لاتيني ملاصق للعربية")
    for i, ch in enumerate(txt):
        if ch in "0123456789":
            errors.append(f"{where}: رقم لاتيني عند {i}")
            break

for c in CONCEPTS:
    for k in ("title", "chapter", "explanation", "example"):
        check_text(c[k], f"{c['id']}.{k}")
for q in QUESTIONS:
    check_text(q["question"], f"{q['id']}.question")
    check_text(q["correct"], f"{q['id']}.correct")
    check_text(q["reason"], f"{q['id']}.reason")
    for o in q["options"]:
        check_text(o["text"], f"{q['id']}.option")

# 6) توزيع الصعوبة وتوازن صح/خطأ
diff = {"سهل": 0, "متوسط": 0, "صعب": 0}
tf_true = 0
for q in QUESTIONS:
    diff[q["difficulty"]] += 1
    if q["type"] == "tf":
        tf_true += 1 if q["correct"] == "صح" else 0
print(f"SELF: الصعوبة {diff} — tf صح: {tf_true}/14")
if diff["سهل"] < 6 or diff["صعب"] < 5:
    errors.append(f"توزيع الصعوبة غير متوازن {diff}")
if not (4 <= tf_true <= 10):
    errors.append(f"توازن صح/خطأ مختل: {tf_true} صح من 14")

# 7) الفصول الخمسة
chapters = sorted(set(c["chapter"] for c in CONCEPTS))
expected = sorted(["المهارات اللفظية", "المهارات الكمية", "المهارات المنطقية", "المهارات الفضائية", "مهارات تحليل المعلومات"])
if chapters != expected:
    errors.append(f"الفصول {chapters} بدل {expected}")

if errors:
    print("SELF-CHECK FAILED:")
    for e in errors:
        print("  ✗", e)
    sys.exit(1)
print("SELF-CHECK OK — 14 مفهوماً / 28 سؤالاً")

# ---------- الدمج ----------
data = json.load(open(QBANK, encoding="utf-8"))

existing_c = {c["id"] for c in data["concepts"]}
existing_q = {q["id"] for q in data["questions"]}
clash = (set(cids) & existing_c) | (set(qids) & existing_q)
if clash:
    print("تعارض معرفات مع البنك:", clash)
    sys.exit(1)

data["courses"]["C1"] = C1_NAME
for c in CONCEPTS:
    data["concepts"].append({
        "id": c["id"], "courseId": "C1", "chapter": c["chapter"],
        "title": c["title"], "explanation": c["explanation"], "example": c["example"],
    })
for q in QUESTIONS:
    data["questions"].append({
        "id": q["id"], "conceptId": q["conceptId"], "type": q["type"],
        "difficulty": q["difficulty"], "question": q["question"],
        "options": q["options"], "correct": q["correct"], "reason": q["reason"],
    })

with open(QBANK, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print(f"MERGED: courses={len(data['courses'])} concepts={len(data['concepts'])} questions={len(data['questions'])}")
