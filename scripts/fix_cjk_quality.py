# -*- coding: utf-8 -*-
# إصلاح تسربات لغوية (حروف صينية) + أوصاف طبية غير دقيقة في qbank.json وملفات generated
import json, re, glob, shutil, sys, datetime

ROOT = "/home/z/my-project"
QBANK = ROOT + "/src/data/qbank.json"
CJK = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")

# (القديمة، الصحيحة) — ترتيب التنفيذ مهم
FIXES = [
    ("بشكل渐进ي", "بشكل تدريجي"),
    ("طبيب内分泌ي", "طبيب غدد صماء"),
    ("هدى纠正ت", "هدى صححت"),
    ("خاطئة因为她", "خاطئة لأنها"),
    ("والرابعة因为她", "والرابعة لأنها"),
    ("يه尊严هم", "يمسّ كرامتهم"),
    ("بناء巢 آمن", "بناء خلية آمنة"),
    ("بناء巢", "بناء الخلية"),
    ("في الم下一次", "في المرة التالية"),
    # تصحيحات دقة علمية ولغوية مستهدفة
    ("متلازمة تيرهان التي تؤثر على النمو الجسدي والعضلي دون المساس بالقدرات العقلية",
     "اضطراب التناسق الحركي التنموي الذي يؤثر على النمو الحركي الدقيق دون المساس بالقدرات العقلية"),
    ("مرض هنتنغتون الوراثي الذي يظهر في هذه السن", "مرض هنتنغتون الوراثي النادر الذي قد يظهر في سن مبكرة"),
    ("إصابته بورم الدماغ النقيلي الوراثي الذي يؤثر على وظائف المخ", "إصابته بالصداع النصفي الوراثي الذي يؤثر على تركيزه"),
    ("ما الفارز الأساسي", "ما الفارق الأساسي"),
    ("جيدة لكنها لا تنبأ بقدرته", "جيدة لكنها لا تنبئ بقدرته"),
]

counts = {old: 0 for old, _ in FIXES}

def fix_str(s):
    for old, new in FIXES:
        if old in s:
            counts[old] += s.count(old)
            s = s.replace(old, new)
    return s

def walk(obj):
    if isinstance(obj, str):
        return fix_str(obj)
    if isinstance(obj, list):
        return [walk(v) for v in obj]
    if isinstance(obj, dict):
        return {k: walk(v) for k, v in obj.items()}
    return obj

# 1) qbank.json (مع نسخة احتياطية مؤرخة)
stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy(QBANK, QBANK + ".bak_" + stamp)
qb = json.load(open(QBANK, encoding="utf-8"))
qb = walk(qb)
json.dump(qb, open(QBANK, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# 2) ملفات checkpoints في generated
gen_fixed = 0
for f in glob.glob(ROOT + "/src/data/generated/*.json"):
    try:
        data = json.load(open(f, encoding="utf-8"))
    except Exception:
        continue
    before = json.dumps(data, ensure_ascii=False)
    data = walk(data)
    after = json.dumps(data, ensure_ascii=False)
    if after != before:
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        gen_fixed += 1

# 3) تحقق نهائي: صفر حروف صينية/كورية/يابانية في كل مكان
qb2 = open(QBANK, encoding="utf-8").read()
leftover_bank = CJK.findall(qb2)
leftover_gen = {}
for f in glob.glob(ROOT + "/src/data/generated/*.json"):
    hits = CJK.findall(open(f, encoding="utf-8").read())
    if hits:
        leftover_gen[f.split("/")[-1]] = hits

print("== الإصلاحات المنفذة في qbank.json ==")
for old, _ in FIXES:
    if counts[old]:
        print("  %dx  «%s»" % (counts[old], old[:40]))
print("ملفات generated المصلحة:", gen_fixed)
print("متبقٍ في qbank.json:", len(leftover_bank), leftover_bank[:5])
print("متبقٍ في generated:", leftover_gen if leftover_gen else "صفر")

# 4) فحص التسرب الأجنبي الآخر: حروف لاتينية داخل الكلمات العربية (وليس اختصارات مستقلة)
lat_in_ar = re.findall(r"[\u0621-\u064A][A-Za-z]|[A-Za-z][\u0621-\u064A]", qb2)
print("حروف لاتينية ملتصقة بعربية:", len(lat_in_ar), lat_in_ar[:5])

# 5) صلاحية البنية
qb3 = json.load(open(QBANK, encoding="utf-8"))
print("البنية سليمة: %d مفهومًا / %d سؤالًا" % (len(qb3["concepts"]), len(qb3["questions"])))
