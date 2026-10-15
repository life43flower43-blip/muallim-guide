# -*- coding: utf-8 -*-
# ماسح الجودة الشامل — قراءة فقط: بنك المحتوى + سلاسل الواجهة
# ١) إملاء بقاموس رمزي دقيق  ٢) تباين ة/ه استدلالي من المعجم ذاته  ٣) عامية  ٤) مؤشرات ترابط الجمل
import json, re, os, random
from collections import Counter, defaultdict

BANK = "/home/z/my-project/public/data/qbank.json"
SRC = "/home/z/my-project/src"
OUT = "/home/z/my-project/scripts/quality/out"
os.makedirs(OUT, exist_ok=True)
random.seed(20261015)

d = json.load(open(BANK, encoding="utf-8"))
concepts, questions = d["concepts"], d["questions"]

# ---------- قاموس الإملاء الرمزي (خاطئ → صواب) — استبدال آمن بقيمة الرمز الكامل ----------
CURATED = {
    # كلمات ربط ووظائف (همزة قطع محذوفة)
    "ان": "أن", "او": "أو", "اذا": "إذا", "الى": "إلى", "ايضا": "أيضا", "انما": "أنما",
    "احيانا": "أحيانا", "ابدا": "أبدا", "الا": "إلا", "ايا": "إيا",
    # صفات وتفضيل وكميات (همزة قطع)
    "اكثر": "أكثر", "اكثرها": "أكثرها", "افضل": "أفضل", "اهم": "أهم", "اهمية": "أهمية",
    "اهمها": "أهمها", "اشد": "أشد", "احد": "أحد", "احدى": "إحدى", "اجمل": "أجمل",
    "اعظم": "أعظم", "اكبر": "أكبر", "اصغر": "أصغر", "اشهر": "أشهر", "اقل": "أقل",
    "احسن": "أحسن", "اسهل": "أسهل", "اسوا": "أسوأ", "اول": "أول", "اولى": "أولى",
    "اولا": "أولا", "اخر": "آخر", "اخرى": "أخرى", "اخرين": "آخرين", "اثر": "أثر",
    "اثره": "أثره", "اثرها": "أثرها", "اثار": "آثار", "امر": "أمر", "امور": "أمور",
    "انجز": "أنجز", "انهى": "أنهى", "اسئلة": "أسئلة", "اسئله": "أسئلة", "اسماء": "أسماء",
    "اصل": "أصل", "اصول": "أصول", "اقوال": "أقوال", "افعال": "أفعال", "اقسام": "أقسام",
    "ارقام": "أرقام", "اسلوب": "أسلوب", "اسره": "أسرة", "اساليب": "أساليب",
    "اجل": "أجل", "اجلها": "أجلها", "امام": "أمام", "امن": "أمن", "اهداف": "أهداف",
    "هدفها": "هدفها",
    # إ همزة قطع
    "اجابة": "إجابة", "اجابات": "إجابات", "اجوبه": "إجوبة", "اشارة": "إشارة",
    "ارسال": "إرسال", "اضافة": "إضافة", "اصابة": "إصابة", "اجراء": "إجراء",
    "ادخال": "إدخال", "اثبات": "إثبات",
    # همزة وصل زائدة (إ بدل ا)
    "إختبار": "اختبار", "إختبارات": "اختبارات", "إستخدام": "استخدام", "إستعمال": "استعمال",
    "إستراتيجية": "استراتيجية", "إستراتيجيات": "استراتيجيات", "إستبيان": "استبيان",
    "إجتماع": "اجتماع", "إتفاق": "اتفاق", "إتجاه": "اتجاه", "إختيار": "اختيار",
    "إختصاص": "اختصاص", "إثنان": "اثنان", "إثنين": "اثنين",
    # همزات شائعة أخرى
    "مسئول": "مسؤول", "مسئولة": "مسؤولة", "مسئولية": "مسؤولية", "شئ": "شيء",
    "لاكن": "لكن", "هاذا": "هذا", "هاذه": "هذه", "ذالك": "ذلك", "لكى": "لكي", "فى": "في",
    # عامية ذات بديل ميكانيكي واضح
    "يغلط": "يخطئ", "بالغلط": "بالخطأ", "الغلط": "الخطأ", "الغلطات": "الأخطاء",
    "اغلاط": "أخطاء",
}

# عامية تُرصد ولا تُصلح آلياً (الاستبدال يتطلب إعادة صياغة سياقية)
COLLOQUIAL = ["عشان", "مفيش", "دلوقتي", "كده", "ازاي", "اللى", "برضه", "خالص",
              "حاجة", "هيك", "شوي", "كتير", "هلق", "هسا", "باين", "لسا",
              "عايز", "عايزة", "احنا", "شغلة", "مليح", "منيح"]

TOKEN = re.compile(r"[\u0621-\u064A0-9]+")

def fields_of_q(q):
    return [("نص السؤال", q.get("question", "")),
            ("الخيارات", " | ".join(o.get("text", "") if isinstance(o, dict) else str(o) for o in q.get("options", []))),
            ("التعليل", q.get("reason", ""))]

def fields_of_c(c):
    ex = " ".join(str(x) for x in c["examples"]) if isinstance(c.get("examples"), list) else str(c.get("examples") or c.get("example") or "")
    return [("العنوان", c.get("title", "")), ("الشرح", c.get("explanation", "")), ("الأمثلة", ex)]

# ---------- بناء المعجم الكلي لتباين ة/ه ----------
vocab = Counter()
for q in questions:
    for _, t in fields_of_q(q):
        vocab.update(TOKEN.findall(t))
for c in concepts:
    for _, t in fields_of_c(c):
        vocab.update(TOKEN.findall(t))

H_WHITELIST = {"له", "به", "هو", "هي", "فيه", "فيها", "منه", "منها", "عنه", "عنها",
               "عليه", "عليها", "إليه", "إليها", "اليه", "اليها", "لديه", "معه", "معها",
               "لهم", "بهم", "عليهم", "لها", "بها", "فهو", "فهي", "وهو", "وهي", "وله",
               "وبه", "أنه", "أنها", "إنه", "إنها", "وأنه", "وأنها", "ولديه", "ولهذا"}

hetza = []
for tok, freq in vocab.items():
    if len(tok) >= 6 and tok.endswith("ه") and tok not in H_WHITELIST and freq >= 2:
        alt = tok[:-1] + "ة"
        if vocab.get(alt, 0) >= 3 and vocab[alt] > freq:
            hetza.append((tok, alt, freq, vocab[alt]))
hetza.sort(key=lambda x: -x[2])

# ---------- الفحص ----------
spell_hits = defaultdict(list)
collo_hits = defaultdict(list)
for q in questions:
    for field, t in fields_of_q(q):
        for tok in TOKEN.findall(t):
            if tok in CURATED:
                spell_hits[CURATED[tok]].append(f"{q['id']}({field})")
        for w in COLLOQUIAL:
            if re.search(rf"\b{w}\b", t):
                collo_hits[w].append(q["id"])
for c in concepts:
    for field, t in fields_of_c(c):
        for tok in TOKEN.findall(t):
            if tok in CURATED:
                spell_hits[CURATED[tok]].append(f"{c['id']}({field})")
        for w in COLLOQUIAL:
            if re.search(rf"\b{w}\b", t):
                collo_hits[w].append(c["id"])

# ---------- مؤشرات الترابط ----------
CONNECT = ("و", "ف", "ثم", "لكن", "بل", "بينما", "إذ", "أي", "أما", "حيث", "كما",
           "لذلك", "ومع", "علاوة", "إضافة", "ومن", "ومنها", "وهكذا", "بالتالي", "إذن", "وهذا", "وهذه")

def sents(t):
    return [s.strip() for s in re.split(r"[.؟!؛]\s*", t or "") if s.strip()]

coher = []
FORMULAIC = ("يُعد", "يعد", "يعتبر", "تعتبر", "يُعرف", "يعرف", "من المعروف", "يشير مفهوم")
formulaic_openers = 0
for c in concepts:
    t = c.get("explanation", "")
    ss = sents(t)
    if ss and any(ss[0].startswith(f) for f in FORMULAIC):
        formulaic_openers += 1
    if len(ss) < 2:
        continue
    flags = []
    lens = [len(s.split()) for s in ss]
    if max(lens) > 35:
        flags.append(f"جملة ممدودة ({max(lens)} كلمة)")
    frag = sum(1 for L in lens[1:] if L < 4)
    if frag:
        flags.append(f"جمل مبتورة: {frag}")
    allw = [w for s in ss for w in s.split()]
    g = Counter(" ".join(allw[i:i+4]) for i in range(len(allw) - 3))
    rep4 = sum(v - 1 for v in g.values() if v > 1)
    if rep4:
        flags.append(f"تكرار عبارات داخل النص: {rep4}")
    if t.count("«") != t.count("»"):
        flags.append("تنصيص غير متوازن")
    starts = [s.split()[0] if s.split() else "" for s in ss[1:]]
    conn = sum(1 for w in starts if w.startswith(tuple(CONNECT)))
    if len(starts) >= 2 and conn / len(starts) < 0.34:
        flags.append(f"انقطاع ربط ({conn}/{len(starts)})")
    over = [w for w, v in Counter(w for w in allw if len(w) >= 5).items() if v >= 3]
    if over:
        flags.append("تكرار مفردات: " + "، ".join(over[:3]))
    if flags:
        coher.append({"id": c["id"], "kind": "مفهوم", "course": c["courseId"],
                      "flags": flags, "score": len(flags), "excerpt": t[:120]})
for q in questions:
    t = q.get("reason", "")
    ss = sents(t)
    if len(ss) < 2:
        continue
    flags = []
    lens = [len(s.split()) for s in ss]
    if max(lens) > 35:
        flags.append(f"جملة ممدودة ({max(lens)} كلمة)")
    allw = [w for s in ss for w in s.split()]
    g = Counter(" ".join(allw[i:i+4]) for i in range(len(allw) - 3))
    rep4 = sum(v - 1 for v in g.values() if v > 1)
    if rep4:
        flags.append(f"تكرار عبارات داخل النص: {rep4}")
    starts = [s.split()[0] if s.split() else "" for s in ss[1:]]
    conn = sum(1 for w in starts if w.startswith(tuple(CONNECT)))
    if len(starts) >= 2 and conn / len(starts) < 0.34:
        flags.append(f"انقطاع ربط ({conn}/{len(starts)})")
    if flags:
        coher.append({"id": q["id"], "kind": "تعليل", "course": None,
                      "flags": flags, "score": len(flags), "excerpt": t[:120]})
coher.sort(key=lambda x: -x["score"])

# ---------- سلاسل الواجهة ----------
AR_RUN = re.compile(r"[\"'`]([^\"'`\n]*[\u0600-\u06FF][^\"'`\n]*)[\"'`]")
ui_hits = defaultdict(list)
ui_files = 0
for root, _, files in os.walk(SRC):
    for fn in files:
        if not fn.endswith((".ts", ".tsx")):
            continue
        path = os.path.join(root, fn)
        try:
            txt = open(path, encoding="utf-8").read()
        except Exception:
            continue
        ui_files += 1
        for m in AR_RUN.finditer(txt):
            s = m.group(1)
            for tok in TOKEN.findall(s):
                if tok in CURATED:
                    line = txt[:m.start()].count("\n") + 1
                    ui_hits[CURATED[tok]].append(f"{fn}:{line}")

result = {
    "spelling": {k: {"count": len(v), "refs": v[:12]} for k, v in
                 sorted(spell_hits.items(), key=lambda kv: -len(kv[1]))},
    "spelling_total_items": len({r.split("(")[0] for v in spell_hits.values() for r in v}),
    "colloquial": {k: {"count": len(v), "refs": v[:8]} for k, v in
                   sorted(collo_hits.items(), key=lambda kv: -len(kv[1]))},
    "hetza_candidates": [{"wrong": w, "right": r, "wrong_freq": f, "right_freq": rf}
                         for w, r, f, rf in hetza[:60]],
    "coherence": {"flagged": len(coher), "worst": coher[:45]},
    "formulaic_openers": {"count": formulaic_openers, "of": len(concepts)},
    "ui": {"files": ui_files, "hits": {k: {"count": len(v), "refs": v[:10]} for k, v in
                                       sorted(ui_hits.items(), key=lambda kv: -len(kv[1]))}},
}
json.dump(result, open(f"{OUT}/quality_findings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print("=== إملاء (رمزي دقيق) ===")
for k, v in list(result["spelling"].items())[:28]:
    print(f"  «{k}»: {v['count']} — {v['refs'][:5]}")
print("إجمالي الوحدات المتأثرة:", result["spelling_total_items"])
print("\n=== ة/ه تبايني (مرشح، يُراجع يدوياً) ===")
for h in hetza[:25]:
    print(f"  «{h[0]}» → «{h[1]}» (خاطئ {h[2]} / صواب {h[3]})")
print("\n=== عامية ===")
for k, v in list(result["colloquial"].items())[:15]:
    print(f"  «{k}»: {v['count']}")
print("\n=== ترابط ===")
print("مفاهيم مرصودة:", len([c for c in coher if c['kind'] == 'مفهوم']), "/ تعليلات:", len([c for c in coher if c['kind'] == 'تعليل']))
print("افتتاحيات قالبية:", formulaic_openers, "من", len(concepts))
for c in coher[:8]:
    print(f"  [{c['id']} {c['kind']}] {'؛ '.join(c['flags'])}")
print("\n=== واجهة ===")
for k, v in list(result["ui"]["hits"].items())[:15]:
    print(f"  «{k}»: {v['count']} — {v['refs'][:4]}")
