#!/usr/bin/env python3
"""دمج FIX-1: تبنّي أسئلة البنك المُصلح من الملف المرفق مع الإبقاء على المفاهيم الحالية.
- الأسئلة المرفقة: مواضع الإجابة متوازنة (٢٥٪ × ٤) + fixedOrder على ٤٣٢ سؤالًا + دفعة batch01 + صقل لغوي.
- المفاهيم الحالية: أفضل صياغة (المرفق فيها أخطاء مطبعية وسيناريوهات مفككة في ٨ مفاهيم).
فحوص صارمة قبل الحفظ: صحيح وحيد، correct مطابق، لا حروف أجنبية، لا تكرار خيارات، fixedOrder سليم.
"""
import json, re, sys

CUR = "/home/z/my-project/src/data/qbank.json.bak_before_fix"
NEW = "/home/z/my-project/upload/fix_options_1_extracted/fix/src/data/qbank.json"
OUT = "/home/z/my-project/src/data/qbank.json"
FOREIGN = re.compile(r"[A-Za-z\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u3040-\u30FF\u3400-\u9FFF]")

cur = json.load(open(CUR, encoding="utf-8"))
new = json.load(open(NEW, encoding="utf-8"))

# الأسئلة من المرفق، والمفاهيم والمحاور من الحالي
merged = {"courses": cur["courses"], "concepts": cur["concepts"], "questions": new["questions"]}

Q = merged["questions"]
CIDS = {c["id"] for c in merged["concepts"]}
errs = []
for q in Q:
    qid = q["id"]
    if q["conceptId"] not in CIDS:
        errs.append(f"{qid}: conceptId غير موجود {q['conceptId']}")
    txt = q["question"] + q.get("reason", "") + "".join(o["text"] for o in q["options"])
    if FOREIGN.search(txt):
        errs.append(f"{qid}: حروف أجنبية")
    if q["type"] == "mcq":
        if sum(o["isCorrect"] for o in q["options"]) != 1:
            errs.append(f"{qid}: صحيح غير وحيد")
        if len({o["text"] for o in q["options"]}) != len(q["options"]):
            errs.append(f"{qid}: خيارات مكررة")
        corr = next(o for o in q["options"] if o["isCorrect"])
        if corr["text"] != q["correct"]:
            errs.append(f"{qid}: correct غير مطابق")
        # fixedOrder لا يكون إلا لسؤال يشير لترتيب الخيارات في شرحه
        if q.get("fixedOrder") and q.get("reason") is None:
            errs.append(f"{qid}: fixedOrder بلا شرح")
    else:
        if "fixedOrder" in q:
            errs.append(f"{qid}: fixedOrder على غير اختيار من متعدد")

if errs:
    print("أخطاء — أوقف الحفظ:")
    for e in errs[:40]:
        print(" ", e)
    sys.exit(1)

json.dump(merged, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# إحصاء ختامي
import collections
c = collections.Counter()
for q in Q:
    if q["type"] == "mcq":
        c[next(i for i, o in enumerate(q["options"]) if o["isCorrect"])] += 1
tot = sum(c.values())
print("تم الدمج والحفظ:", len(Q), "سؤالًا |", len(merged["concepts"]), "مفهومًا")
ABJD = "أبجد"
for i in range(4):
    print(f"  موضع {ABJD[i]}: {c[i]} ({c[i]*100/tot:.1f}%)")
print("fixedOrder:", sum(1 for q in Q if q.get("fixedOrder")))
