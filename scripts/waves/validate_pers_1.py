# -*- coding: utf-8 -*-
"""تحقق ذاتي صارم لملف pers_1.json وفق قواعد دفعة PERS-1."""
import json, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, "pers_1.json")
with open(PATH, encoding="utf-8") as f:
    d = json.load(f)

errors, warnings, notes = [], [], []

def wc(s): return len(s.split())
def sentences(s): return [x for x in s.split(".") if x.strip()]

def text_of(node):
    if isinstance(node, str): return [node]
    if isinstance(node, dict): return sum((text_of(v) for v in node.values()), [])
    if isinstance(node, list): return sum((text_of(v) for v in node), [])
    return []

# 1) البنية العليا
if set(d.keys()) != {"chapter", "concepts", "questions"}: errors.append(f"مفاتيح عليا: {list(d.keys())}")
if d["chapter"] != "أنماط الشخصيات": errors.append("اسم الفصل غير صحيح")

cons = d["concepts"]; qs = d["questions"]
if len(cons) != 10: errors.append(f"عدد المفاهيم {len(cons)} لا ١٠")
if not (35 <= len(qs) <= 40): errors.append(f"عدد الأسئلة {len(qs)} خارج ٣٥-٤٠")

cids = [c["id"] for c in cons]
if len(set(cids)) != len(cids): errors.append("معرفات مفاهيم مكررة")
if cids != [f"P{n}" for n in range(101, 111)]: errors.append(f"ترتيب المعرفات: {cids}")

BANNED = ["جميع ما سبق", "كل ما سبق", "لا شيء مما سبق", "جميع السابق", "أياً مما سبق"]
LATIN = re.compile(r"[A-Za-z]"); DIG = re.compile(r"[0-9]")
SQUOTE = re.compile(r'[\'"]')

def lang_check(s, where):
    if LATIN.search(s): errors.append(f"حرف لاتيني في {where}: {s[:60]}")
    if DIG.search(s): errors.append(f"رقم لاتيني في {where}: {s[:60]}")
    if SQUOTE.search(s): errors.append(f"تنصيص مستقيم في {where}: {s[:60]}")
    for b in BANNED:
        if b in s: errors.append(f"عبارة ممنوعة «{b}» في {where}")
    if s.count("«") != s.count("»"): warnings.append(f"تنصيص «» غير متوازن في {where}: {s[:60]}")
    if not s.strip(): errors.append(f"نص فارغ في {where}")

# 2) المفاهيم
from collections import Counter
q_per_concept = Counter()
for c in cons:
    tag = c["id"]
    if c.get("courseId") != "M2": errors.append(f"{tag}: courseId ليس M2")
    if c.get("chapter") != "أنماط الشخصيات": errors.append(f"{tag}: chapter خاطئ")
    for k in ("title", "explanation"): lang_check(c.get(k, ""), f"{tag}.{k}")
    ew = wc(c["explanation"]); es = len(sentences(c["explanation"]))
    notes.append(f"{tag} شرح: {ew} كلمة، {es} جمل")
    if not (100 <= ew <= 160): errors.append(f"{tag}.explanation خارج ١٠٠-١٦٠ ({ew})")
    if not (3 <= es <= 5): errors.append(f"{tag}.explanation جمل غير في ٣-٥ ({es})")
    exs = c.get("examples", [])
    if len(exs) != 2: errors.append(f"{tag}: عدد الأمثلة {len(exs)} لا ٢")
    for i, e in enumerate(exs, 1):
        lang_check(e, f"{tag}.ex{i}")
        w = wc(e)
        notes.append(f"{tag} مثال {i}: {w} كلمة")
        if not (30 <= w <= 60): errors.append(f"{tag}.ex{i} خارج ٣٠-٦٠ ({w})")

# 3) الأسئلة
qids = [q["id"] for q in qs]
if len(set(qids)) != len(qids): errors.append("معرفات أسئلة مكررة")
if not re.fullmatch(r"QP\d{3}-\d", qids[0]): errors.append("نمط المعرف خاطئ")
seen_exact = {}
diffs = Counter(); types = Counter()
for q in qs:
    tag = q["id"]
    if q["conceptId"] not in cids: errors.append(f"{tag}: conceptId غير موجود ({q['conceptId']})")
    q_per_concept[q["conceptId"]] += 1
    if q.get("fixedOrder") is not True: errors.append(f"{tag}: fixedOrder ليس true")
    if q["type"] not in ("mcq", "tf"): errors.append(f"{tag}: type خاطئ")
    if q["difficulty"] not in ("سهل", "متوسط", "صعب"): errors.append(f"{tag}: difficulty خاطئ")
    types[q["type"]] += 1; diffs[q["difficulty"]] += 1
    lang_check(q["question"], f"{tag}.q"); lang_check(q["reason"], f"{tag}.reason")
    for o in q["options"]: lang_check(o["text"], f"{tag}.opt")
    nc = sum(1 for o in q["options"] if o["isCorrect"])
    if nc != 1: errors.append(f"{tag}: عدد isCorrect = {nc}")
    if not (40 <= wc(q["reason"]) <= 90): errors.append(f"{tag}.reason خارج ٤٠-٩٠ ({wc(q['reason'])})")
    if q["type"] == "mcq" and len(q["options"]) != 4: errors.append(f"{tag}: خيارات mcq = {len(q['options'])}")
    if q["type"] == "tf":
        if len(q["options"]) != 2: errors.append(f"{tag}: خيارات tf = {len(q['options'])}")
        elif [o["text"] for o in q["options"]] != ["صح", "خطأ"]: errors.append(f"{tag}: خيارات tf ليست صح/خطأ حرفياً")
    truth = [o["text"] for o in q["options"] if o["isCorrect"]]
    if truth and truth[0] != q["correct"]: errors.append(f"{tag}: correct لا يطابق الخيار الصحيح")
    key = q["question"].strip()
    if key in seen_exact: errors.append(f"{tag}: سؤال مكرر حرفياً مع {seen_exact[key]}")
    seen_exact[key] = tag
    notes.append(f"{tag} ({q['type']},{q['difficulty']}) سؤال {wc(q['question'])} ك، تعليل {wc(q['reason'])} ك، الصحيح موقعه {[o['isCorrect'] for o in q['options']].index(True)}")

for cid in cids:
    if not (3 <= q_per_concept[cid] <= 4): errors.append(f"{cid}: عدد الأسئلة {q_per_concept[cid]} خارج ٣-٤")
    if q_per_concept[cid] == 0: errors.append(f"{cid}: بلا أسئلة")

print("=" * 50)
print(f"مفاهيم: {len(cons)} | أسئلة: {len(qs)} | أنواع: {dict(types)} | صعوبات: {dict(diffs)}")
print("أسئلة لكل مفهوم:", dict(q_per_concept))
if warnings: print("تحذيرات:", len(warnings)); [print(" -", w) for w in warnings]
if errors:
    print(f"أخطاء: {len(errors)}"); [print(" -", e) for e in errors]; sys.exit(1)
print("التحقق ناجح: JSON صالح وكل القواعد مستوفاة")
if "--verbose" in sys.argv:
    print("-" * 50); [print(n) for n in notes]
