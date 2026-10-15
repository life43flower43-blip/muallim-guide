#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تحقق ذاتي شامل لموجة أنماط الشخصيات pers_2.json"""
import json, re, sys

PATH = "/home/z/my-project/scripts/waves/pers_2.json"
d = json.load(open(PATH, encoding="utf-8"))
errors, warns = [], []

# 1) البنية العليا
assert set(d.keys()) == {"chapter", "concepts", "questions"}, "مفاتيح عليا غير مطابقة"
if d["chapter"] != "أنماط الشخصيات": errors.append("chapter غير صحيح")
cons, qs = d["concepts"], d["questions"]
if len(cons) != 10: errors.append(f"المفاهيم {len(cons)} وليست ١٠")

# 2) المفاهيم
cids = ["P201","P202","P203","P204","P205","P206","P207","P208","P209","P210"]
if [c["id"] for c in cons] != cids: errors.append("تسلسل معرفات المفاهيم غير صحيح")
if len(set(c["id"] for c in cons)) != 10: errors.append("معرفات مفاهيم مكررة")

def wc(t): return len(t.split())
def sc(t):
    # عدد الجمل: نهايات الجمل . ؟ ! (يُزيل نقط الحذف والميلات)
    parts = re.findall(r"[.!؟]+", t)
    return len(parts)

latin = re.compile(r"[A-Za-z]")
forbidden = ["جميع ما سبق", "لا شيء مما سبق"]

for c in cons:
    if c["courseId"] != "M2": errors.append(f"{c['id']}: courseId ليس M2")
    if c["chapter"] != "أنماط الشخصيات": errors.append(f"{c['id']}: chapter غير صحيح")
    if "title" not in c or not c["title"]: errors.append(f"{c['id']}: بلا عنوان")
    expl = c["explanation"]
    w, s = wc(expl), sc(expl)
    tag = f"{c['id']} explanation"
    if not (100 <= w <= 160): errors.append(f"{tag}: {w} كلمة (المطلوب ١٠٠-١٦٠)")
    if not (3 <= s <= 5): errors.append(f"{tag}: {s} جمل (المطلوب ٣-٥)")
    if latin.search(expl) or latin.search(c["title"]): errors.append(f"{c['id']}: لاتيني في العنوان/الشرح")
    if not c.get("examples") or len(c["examples"]) != 2: errors.append(f"{c['id']}: القصص ليست اثنتين")
    else:
        for i, ex in enumerate(c["examples"], 1):
            we = wc(ex)
            if not (30 <= we <= 60): errors.append(f"{c['id']} مثال{i}: {we} كلمة (المطلوب ٣٠-٦٠)")
            if latin.search(ex): errors.append(f"{c['id']} مثال{i}: لاتيني")
            if expl.count("«") != expl.count("»"): pass
    for field, txt in (("شرح", expl), ("عنوان", c["title"])):
        if txt.count("«") != txt.count("»"): errors.append(f"{c['id']}: تنصيص غير متوازن في {field}")

# 3) الأسئلة
if not (35 <= len(qs) <= 40): errors.append(f"عدد الأسئلة {len(qs)} خارج ٣٥-٤٠")
qids = [q["id"] for q in qs]
if len(set(qids)) != len(qids): errors.append("معرفات أسئلة مكررة")
per_concept = {}
diff_count = {"سهل": 0, "متوسط": 0, "صعب": 0}
tf_count = mcq_count = 0
for q in qs:
    qid = q["id"]
    per_concept[q["conceptId"]] = per_concept.get(q["conceptId"], 0) + 1
    if q["conceptId"] not in cids: errors.append(f"{qid}: conceptId غير موجود")
    m = re.fullmatch(r"QP(2\d\d)-\d", qid)
    if not m: errors.append(f"{qid}: نمط المعرف غير صحيح")
    elif m.group(1) != q["conceptId"][1:]: errors.append(f"{qid}: المعرف لا يطابق المفهوم")
    if q["type"] not in ("mcq", "tf"): errors.append(f"{qid}: نوع غير صالح")
    if q["difficulty"] not in diff_count: errors.append(f"{qid}: صعوبة غير صالحة")
    else: diff_count[q["difficulty"]] += 1
    if q["fixedOrder"] is not True: errors.append(f"{qid}: fixedOrder ليس true")
    opts = q["options"]
    texts = [o["text"] for o in opts]
    flags = [o["isCorrect"] for o in opts]
    if sum(bool(f) for f in flags) != 1: errors.append(f"{qid}: isCorrect ليس واحداً")
    correct_idx = flags.index(True) if True in flags else -1
    if q["type"] == "mcq":
        mcq_count += 1
        if len(opts) != 4: errors.append(f"{qid}: mcq بخيارات {len(opts)}")
        if len(set(texts)) != len(texts): errors.append(f"{qid}: خيارات متطابقة")
        if correct_idx >= 0 and q["correct"] != texts[correct_idx]: errors.append(f"{qid}: correct لا يطابق الخيار الصحيح حرفياً")
    else:
        tf_count += 1
        if len(opts) != 2: errors.append(f"{qid}: tf بخيارات {len(opts)}")
        if set(texts) != {"صح", "خطأ"}: errors.append(f"{qid}: tf غير موحد صح/خطأ")
        if q["correct"] not in ("صح", "خطأ"): errors.append(f"{qid}: correct غير صالح لـ tf")
        elif q["correct"] != texts[correct_idx]: errors.append(f"{qid}: correct لا يطابق نص tf")
    # نصوص
    all_text = " ".join([q["question"], q["correct"], q["reason"]] + texts)
    if latin.search(all_text): errors.append(f"{qid}: محارف لاتينية في النصوص")
    for fr in forbidden:
        if fr in all_text: errors.append(f"{qid}: عبارة محظورة «{fr}»")
    if q["question"].count("«") != q["question"].count("»"): errors.append(f"{qid}: تنصيص غير متوازن في السؤال")
    if q["reason"].count("«") != q["reason"].count("»"): errors.append(f"{qid}: تنصيص غير متوازن في التعليل")
    wr = wc(q["reason"])
    if not (40 <= wr <= 90): errors.append(f"{qid}: reason {wr} كلمة (المطلوب ٤٠-٩٠)")
    if re.search(r"[0-9]", all_text): errors.append(f"{qid}: أرقام لاتينية")
    # حصر أرقام مشرقية إن وجدت
    if re.search(r"[٠-٩]", all_text): pass  # مسموح

for cid in cids:
    n = per_concept.get(cid, 0)
    if not (3 <= n <= 4): errors.append(f"{cid}: عدد أسئلته {n} خارج ٣-٤")

print(f"المفاهيم: {len(cons)} | الأسئلة: {len(qs)} (mcq={mcq_count}, tf={tf_count})")
print(f"الصعوبة: {diff_count}")
print(f"أسئلة كل مفهوم: {per_concept}")
print("أخطاء:", len(errors))
for e in errors: print(" -", e)
sys.exit(1 if errors else 0)
