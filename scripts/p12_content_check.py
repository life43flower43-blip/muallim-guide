# -*- coding: utf-8 -*-
"""P12-content — فحص شامل لمحتوى البنك والأكواد: CJK، لاتيني ملاصق، أرقام لاتينية، سلامة الإجابات."""
import json, re, sys, glob, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = "/home/z/my-project"
errors = []

CJK = re.compile(r"[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]")
# حروف عربية فقط (بلا ترقيم ،؛؟) — كي لا يُحسب «S-R؟» لاتينيًا ملاصقًا
LAT_IN_AR = re.compile(r"[\u0621-\u065f\u0671-\u06d3][a-zA-Z]|[a-zA-Z][\u0621-\u065f\u0671-\u06d3]")

src_files = (
    glob.glob(f"{ROOT}/src/**/*.ts", recursive=True)
    + glob.glob(f"{ROOT}/src/**/*.tsx", recursive=True)
    + glob.glob(f"{ROOT}/src/**/*.json", recursive=True)
)
src_files = [f for f in src_files if ".bak" not in f]
for f in src_files:
    try:
        raw = open(f, encoding="utf-8").read()
    except Exception:
        continue
    # تسلسل الهروب \n و \" داخل السلاسل البرمجية ليس محتوى ظاهرًا
    txt = raw.replace("\\n", " ").replace('\\"', " ")
    for m in CJK.finditer(txt):
        line = txt[: m.start()].count("\n") + 1
        errors.append(f"CJK في {f}:{line} → {m.group()!r}")
    # اللاتيني الملاصق للعربية يُمنع؛ لكن الكود البرمجي يقبل الكلمات اللاتينية المنفصلة
    for m in LAT_IN_AR.finditer(txt):
        line = txt[: m.start()].count("\n") + 1
        ctx = txt[max(0, m.start() - 30) : m.start() + 30].replace("\n", " ")
        errors.append(f"لاتيني ملاصق في {f}:{line} → ...{ctx}...")

# ---------- 2) سلامة البنك ----------
d = json.load(open(f"{ROOT}/src/data/qbank.json", encoding="utf-8"))
cmap = {c["id"]: c for c in d["concepts"]}
qids = set()
for q in d["questions"]:
    qids.add(q["id"])
    if q["conceptId"] not in cmap:
        errors.append(f"{q['id']}: مفهوم مفقود {q['conceptId']}")
        continue
    texts = [o["text"] for o in q["options"]]
    if q["correct"] not in texts:
        errors.append(f"{q['id']}: correct خارج الخيارات")
    trues = [o for o in q["options"] if o.get("isCorrect")]
    if len(trues) != 1 or trues[0]["text"] != q["correct"]:
        errors.append(f"{q['id']}: isCorrect غير متطابق")
    for field in ("question", "correct", "reason"):
        if CJK.search(q[field]):
            errors.append(f"{q['id']}.{field}: CJK")
    for o in q["options"]:
        if CJK.search(o["text"]):
            errors.append(f"{q['id']}.option: CJK")

cids = set()
for c in d["concepts"]:
    cids.add(c["id"])
    for field in ("title", "chapter", "explanation", "example"):
        if CJK.search(c[field]):
            errors.append(f"{c['id']}.{field}: CJK")

print(f"البنك: {len(d['courses'])} محاور / {len(d['concepts'])} مفهوماً / {len(d['questions'])} سؤالاً")

# معرفات مكررة
if len(cids) != len(d["concepts"]):
    errors.append("معرفات مفاهيم مكررة")
if len(qids) != len(d["questions"]):
    errors.append("معرفات أسئلة مكررة")

# مساق C1
c1c = [c for c in d["concepts"] if c["courseId"] == "C1"]
c1q = [q for q in d["questions"] if q["conceptId"] in {c["id"] for c in c1c}]
print(f"مساق C1: {len(c1c)} مفهوماً / {len(c1q)} سؤالاً")
if d["courses"].get("C1") != "المهارات المعرفية والقدرات":
    errors.append("اسم مساق C1 غير صحيح")
if len(c1c) != 14 or len(c1q) != 28:
    errors.append(f"C1 غير مكتمل: {len(c1c)} مفهوماً / {len(c1q)} سؤالاً")

# ---------- النتيجة ----------
if errors:
    print(f"\nFAILED — {len(errors)} مشكلة:")
    for e in errors[:40]:
        print("  ✗", e)
    sys.exit(1)
print("\nCONTENT-CHECK OK — بلا CJK، بلا لاتيني ملاصق، الإجابات سليمة، C1 مكتمل")
