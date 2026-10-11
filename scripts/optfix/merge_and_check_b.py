# دمج دفعات patch_b والتحقق المستقل النهائي قبل التطبيق
import json, sys, re

ROOT = "/home/z/my-project"
bank = json.load(open(f"{ROOT}/src/data/qbank.json"))
by_id = {q["id"]: q for q in bank["questions"]}
pool = {q["id"]: q for q in json.load(open(f"{ROOT}/scripts/optfix/b_pool.json"))}

patches = []
for part in ("b1", "b2", "b3"):
    data = json.load(open(f"{ROOT}/scripts/optfix/patch_{part}.json"))
    patches.extend(data["patches"])

has_digit = re.compile(r"[\d\u0660-\u0669\u06F0-\u06F9\u066B\u066C]")
has_latin = re.compile(r"[A-Za-z]")
has_sym = re.compile(r"[\u{1F000}-\u{1FAFF}\u2190-\u2BFF\uFE0F]".replace(r"\u{", r"\U").replace("}", "") if False else r"[\U0001F000-\U0001FAFF\u2190-\u2BFF\uFE0F]")
bad_form = re.compile(r"جميع ما سبق|كل ما سبق|لا شيء مما سبق|ولا مما سبق|جميع ما ذكر")

rej = []
for p in patches:
    errs = []
    q = by_id.get(p["id"])
    if not q:
        rej.append((p["id"], "غير موجود بالبنك")); continue
    if q["type"] != "mcq":
        errs.append("ليس اختيارياً")
    src = pool.get(p["id"], q)
    ci_bank = next(i for i, o in enumerate(src["options"]) if o["isCorrect"])
    opts = p["options"]
    if len(opts) != 4:
        errs.append("خيارات ليست أربعة")
    trues = sum(1 for o in opts if o.get("isCorrect") is True)
    if trues != 1:
        errs.append(f"صحيح {trues}")
    ci_p = next((i for i, o in enumerate(opts) if o.get("isCorrect")), -1)
    if ci_p != ci_bank:
        errs.append("موضع الصحيح تغير")
    if ci_p >= 0 and opts[ci_p]["text"] != src["options"][ci_bank]["text"]:
        errs.append("نص الصحيح تغير")
    cl = len(src["options"][ci_bank]["text"])
    texts = [o["text"] for o in opts]
    for i, t in enumerate(texts):
        if has_digit.search(t): errs.append(f"رقم بالخيار {i}")
        if has_latin.search(t): errs.append(f"لاتيني بالخيار {i}")
        if has_sym.search(t): errs.append(f"رمز بالخيار {i}")
        if '"' in t: errs.append(f"تنصيص بالخيار {i}")
        if re.search(r"[\n\r\t]", t): errs.append(f"سطر جديد بالخيار {i}")
        if bad_form.search(t): errs.append(f"صيغة ممنوعة بالخيار {i}")
        if i != ci_p and cl and abs(len(t) - cl) / cl > 0.30:
            errs.append(f"هامش طول {i}: {round(abs(len(t)-cl)/cl*100)}٪")
    if len(set(texts)) != 4:
        errs.append("تكرار داخل السؤال")
    if errs:
        rej.append((p["id"], "، ".join(errs)))

# لا تكرار بديل حرفي عبر الأسئلة
seen = {}
for p in patches:
    for o in p["options"]:
        if o.get("isCorrect"):
            continue
        if o["text"] in seen and seen[o["text"]] != p["id"]:
            rej.append((p["id"], "بديل منسوخ حرفياً من سؤال آخر"))
        seen[o["text"]] = p["id"]

ids_req = set()
for part in ("b1", "b2", "b3"):
    ids_req |= set(json.load(open(f"{ROOT}/scripts/optfix/b_ids{part[1]}.json")))
ids_have = {p["id"] for p in patches}
missing = ids_req - ids_have
extra = ids_have - ids_req
if missing: rej.append(("—", f"ناقص: {sorted(missing)[:5]}"))
if extra: rej.append(("—", f"زائد: {sorted(extra)[:5]}"))

ar = lambda n: str(n).translate(str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩"))
print(f"patch_b: مقبول {ar(len(patches)-len(rej))} | مرفوض {ar(len(rej))}")
for rid, why in rej[:12]:
    print(" —", rid, ":", why)

if rej:
    sys.exit(1)
json.dump({"patches": patches}, open(f"{ROOT}/scripts/optfix/patch_b.json", "w"), ensure_ascii=False)
print("تم حفظ patch_b.json")
