# -*- coding: utf-8 -*-
# دمج موجة أنماط الشخصيات (٣ دفعات) في qbank.json — بمدقق صارم قبل الإدخال
import json, re, os, shutil, time
from collections import Counter

BANK = "/home/z/my-project/public/data/qbank.json"
WAVES = ["scripts/waves/pers_1.json", "scripts/waves/pers_2.json", "scripts/waves/pers_3.json"]
BK = "/home/z/my-project/scripts/backup"
os.makedirs(BK, exist_ok=True)

raw = open(BANK, encoding="utf-8").read()
COMPACT = raw.count("\n") < 50
ts = time.strftime("%Y%m%d_%H%M%S")
bak = f"{BK}/qbank.pre_pers_wave_{ts}.json"
shutil.copy(BANK, bak)

d = json.loads(raw)
concepts, questions = d["concepts"], d["questions"]
have_c = {c["id"] for c in concepts}
have_q = {q["id"] for q in questions}
title_norm = {}
def norm(t):
    t = (t or "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
    return re.sub(r"\s+", " ", t).strip()
for c in concepts:
    title_norm[norm(c["title"])] = c["id"]

TOKEN = re.compile(r"[\u0621-\u064A0-9]+")
LATIN = re.compile(r"[A-Za-z]")
COLLO = {"عشان", "مفيش", "دلوقتي", "كده", "ازاي", "اللى", "برضه", "هيك", "شوي", "كتير"}

errs, warns = [], []
new_c, new_q = [], []
for wf in WAVES:
    w = json.load(open(wf, encoding="utf-8"))
    chapter = w["chapter"]
    ids = {c["id"] for c in w["concepts"]}
    for c in w["concepts"]:
        if c["id"] in have_c: errs.append(f"مفهوم مكرر مع البنك: {c['id']}")
        tn = norm(c["title"])
        if tn in title_norm: errs.append(f"عنوان مكرر: «{c['title']}» = {title_norm[tn]}")
        if LATIN.search(c["title"] + c["explanation"] + " ".join(map(str, c.get("examples", [])))):
            errs.append(f"لاتيني في {c['id']}")
        wc = len(TOKEN.findall(c["explanation"]))
        if not (80 <= wc <= 200): warns.append(f"{c['id']}: شرح {wc} كلمة")
        if c.get("chapter") != chapter: errs.append(f"{c['id']}: فصل غير متسق")
        title_norm[tn] = c["id"]
        new_c.append({"id": c["id"], "courseId": c["courseId"], "chapter": chapter,
                      "title": c["title"], "explanation": c["explanation"], "examples": c.get("examples", [])})
    for q in w["questions"]:
        if q["type"] == "tf":
            for o in q["options"]:
                if o["text"] == "صواب":
                    o["text"] = "صح"
            q["correct"] = next(o["text"] for o in q["options"] if o.get("isCorrect"))
        if q["id"] in have_q: errs.append(f"سؤال مكرر مع البنك: {q['id']}")
        if q["conceptId"] not in ids: errs.append(f"{q['id']}: conceptId غير من دفعته")
        if q["type"] not in ("mcq", "tf"): errs.append(f"{q['id']}: type غير معروف")
        if q["difficulty"] not in ("سهل", "متوسط", "صعب"): errs.append(f"{q['id']}: difficulty غير معروفة")
        opts = q["options"]
        want = 4 if q["type"] == "mcq" else 2
        if len(opts) != want: errs.append(f"{q['id']}: خيارات {len(opts)} لا {want}")
        if q["type"] == "tf" and {o["text"] for o in opts} != {"صح", "خطأ"}:
            errs.append(f"{q['id']}: tf ليس صح/خطأ حرفياً")
        if sum(1 for o in opts if o.get("isCorrect")) != 1: errs.append(f"{q['id']}: isCorrect ليس واحداً")
        correct_idx = next((i for i, o in enumerate(opts) if o.get("isCorrect")), -1)
        if correct_idx >= 0 and opts[correct_idx]["text"] != q.get("correct", ""):
            errs.append(f"{q['id']}: correct لا يطابق الخيار الصحيح")
        blob = q["question"] + " " + q.get("reason", "") + " ".join(o["text"] for o in opts)
        if LATIN.search(blob): errs.append(f"{q['id']}: لاتيني")
        toks = TOKEN.findall(blob)
        if any(t in COLLO for t in toks): errs.append(f"{q['id']}: عامية")
        if q["question"].count("«") != q["question"].count("»"): warns.append(f"{q['id']}: تنصيص")
        wr = len(TOKEN.findall(q.get("reason", "")))
        if not (30 <= wr <= 110): warns.append(f"{q['id']}: تعليل {wr} كلمة")
        new_q.append({"id": q["id"], "conceptId": q["conceptId"], "type": q["type"],
                      "difficulty": q["difficulty"], "question": q["question"],
                      "options": opts, "correct": q.get("correct", ""),
                      "fixedOrder": True, "reason": q.get("reason", "")})

if errs:
    print("أخطاء دامغة — لا دمج:")
    for e in errs[:20]: print("  ✗", e)
    raise SystemExit(1)

d["concepts"].extend(new_c)
d["questions"].extend(new_q)
out = json.dumps(d, ensure_ascii=False, separators=(",", ":")) if COMPACT else json.dumps(d, ensure_ascii=False, indent=1)
open(BANK, "w", encoding="utf-8").write(out)

qc = Counter(q["conceptId"] for q in new_q)
print(f"دمج ناجح: +{len(new_c)} مفهوماً و+{len(new_q)} سؤالاً → البنك {len(d['concepts'])}/{len(d['questions'])}")
print("أسئلة لكل مفهوم جديد:", dict(sorted(qc.items())))
print(f"نسخة احتياطية: {bak}")
if warns:
    print("تنبيهات (لا تمنع):")
    for w_ in warns[:10]: print("  ⚠", w_)
