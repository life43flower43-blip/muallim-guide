#!/usr/bin/env python3
"""إعادة بناء البنك على الأساس الصحيح: بنك ACAD الأكاديمي + إصلاحات FIX-1 القيّمة فقط.
١) البنك الأساس: qbank.json.bak_before_fix (ما بعد ACAD — صفر «مشتتات» وأمثلة مكتملة).
٢) إعادة توزيع مواضع الإجابة الصحيحة + وسم fixedOrder (سكربت المرفق).
٣) دفعة batch01 (٢٠ سؤالًا انحياز طول + ٦ حروف مشوهة) بفحوصها الصارمة.
٤) إصلاح أخطاء التأنيث «الخيار الأولى/الثانية…» بتذكير الاسم والفعل والصفة (عكس حل المرفق
   الذي أعاد قالب «المشتتة» المحذوف).
٥) بطارية تحقق شاملة.
"""
import json, re, subprocess, sys, collections

ROOT = "/home/z/my-project"
QB = f"{ROOT}/src/data/qbank.json"
BAK = f"{ROOT}/src/data/qbank.json.bak_before_fix"
FIX = f"{ROOT}/upload/fix_options_1_extracted/fix"

# ---------- الخطوة ١: الأساس من النسخة الاحتياطية (بعد ACAD) ----------
subprocess.run(["cp", BAK, QB], check=True)
print("١) رُدّ الأساس: بنك ACAD الأكاديمي")

# ---------- الخطوة ٢: إعادة توزيع المواضع + fixedOrder ----------
r = subprocess.run([sys.executable, f"{FIX}/fix_option_positions.py", QB],
                   capture_output=True, text=True)
print("٢) fix_option_positions:")
print(r.stdout.strip())
if r.returncode != 0:
    print(r.stderr); sys.exit(1)

# ---------- الخطوة ٣: دفعة batch01 — تطبيق مخصص ذكي ----------
# القاعدة: opts+reason للأسئلة ما زال انحياز طولها قائمًا (>١.٣٥)،
# وإصلاحات الحروف الأجنبية (q/rep/reason) للأسئلة ما زالت مشوهة،
# وتُتخطى الأجزاء التي سبق أن أصلحتها مهمة ACAD (نصها القديم لم يعد موجودًا).
import importlib.util, statistics
FOREIGN = re.compile(r"[A-Za-z\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u3040-\u30FF\u3400-\u9FFF]")
spec = importlib.util.spec_from_file_location("patch01", f"{FIX}/patches/batch01.py")
patch_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch_mod)
PATCH = patch_mod.PATCH

d = json.load(open(QB, encoding="utf-8"))
Q = {q["id"]: q for q in d["questions"]}

def ratio(q):
    return len(next(o for o in q["options"] if o["isCorrect"])["text"]) / statistics.mean(
        len(o["text"]) for o in q["options"] if not o["isCorrect"])

applied, skipped, errs_b = [], [], []
for qid, p in PATCH.items():
    q = Q[qid]
    r0 = ratio(q) if q["type"] == "mcq" else None
    need_opts = q["type"] == "mcq" and "opts" in p and ratio(q) > 1.35
    need_foreign = FOREIGN.search(
        q["question"] + q.get("reason", "") + "".join(o["text"] for o in q["options"])
    )
    if not need_opts and not need_foreign:
        skipped.append(qid)
        continue
    # أجزاء التعديل
    if "q" in p:
        q["question"] = p["q"]
    for i, t in p.get("opts", {}).items():
        o = q["options"][int(i)]
        o["text"] = t
        if o["isCorrect"]:
            q["correct"] = t
    for old, new in p.get("rep", []):
        if old in q.get("reason", ""):
            q["reason"] = q["reason"].replace(old, new)
    if "reason" in p and (need_opts or FOREIGN.search(q.get("reason", ""))):
        q["reason"] = p["reason"]
    # بوابات الجودة
    blob = q["question"] + q.get("reason", "") + "".join(o["text"] for o in q["options"])
    if FOREIGN.search(blob):
        errs_b.append(f"{qid}: ما زالت حروفًا أجنبية")
    if q["type"] == "mcq":
        if len({o["text"] for o in q["options"]}) != len(q["options"]):
            errs_b.append(f"{qid}: خيارات مكررة")
        if next(o for o in q["options"] if o["isCorrect"])["text"] != q["correct"]:
            errs_b.append(f"{qid}: correct غير مطابق")
        if ratio(q) > 1.35:
            errs_b.append(f"{qid}: نسبة الطول {ratio(q):.2f}")
        if len(q.get("reason", "")) < 150:
            errs_b.append(f"{qid}: شرح <١٥٠")
    applied.append((qid, f"{r0:.2f}→{ratio(q):.2f}" if r0 else ""))

json.dump(d, open(QB, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("٣) batch01 المخصص:")
for qid, rr in applied:
    print(f"   {qid} {rr}")
print(f"   طُبِّق على {len(applied)} | تُخُطِّي {len(skipped)}: {skipped}")
if errs_b:
    print("   أخطاء:", errs_b); sys.exit(1)

# ---------- الخطوة ٤: إصلاح التأنيث بتذكير العناصر ----------
d = json.load(open(QB, encoding="utf-8"))

ORD = {"الأولى": "الأول", "الثانية": "الثاني", "الثالثة": "الثالث", "الرابعة": "الرابع"}
VERB = {"تنسب": "ينسب", "تنسبه": "ينسبه", "تنسبها": "ينسبها", "تخلط": "يخلط",
        "تقدم": "يقدم", "تشير": "يشير", "تتجاهل": "يتجاهل", "تمثل": "يمثل",
        "تفترض": "يفترض", "تضع": "يضع", "تركز": "يركز", "تتعارض": "يتعارض",
        "تزيد": "يزيد", "تحدد": "يحدد", "تحل": "يحل", "تتعلق": "يتعلق",
        "تربط": "يربط", "تؤدي": "يؤدي", "تكون": "يكون", "تصح": "يصح",
        "تصلح": "يصلح", "تصف": "يصف", "تناسب": "يناسب", "تغفل": "يغفل",
        "تختزل": "يختزل", "تنقل": "ينقل", "تنطلق": "ينطلق", "تحيل": "يحيل",
        "تقدمه": "يقدمه", "تقدمها": "يقدمها", "تشوه": "يشوه", "تضعف": "يضعف"}
ADJ = {"صحيحة": "صحيح", "دقيقة": "دقيق", "عامة": "عام", "وصفية": "وصفي",
       "وليست": "وليس", "ناقصة": "ناقص", "هي": "هو", "لكنها": "لكنه",
       "خاطئة": "خاطئ", "سطحية": "سطحي", "عامة.": "عام."}
NEUTRAL = {"لا", "قد", "ولا", "غير", "هي"}  # تُتخطى ثم يُعالج ما بعدها (هي تُذكَّر خلافًا)

PAT = re.compile(r"الخيار[ ](الأولى|الثانية|الثالثة|الرابعة)((?:[ ]+\S+){0,4})")

def fix_reason(text: str) -> tuple[str, int]:
    n = 0
    def repl(m):
        nonlocal n
        out = ["الخيار", ORD[m.group(1)]]
        n += 1
        toks = m.group(2).split() if m.group(2) else []
        for t in toks:
            base = t.rstrip("،.؛:!")
            if base in VERB:
                out.append(t.replace(base, VERB[base])); continue
            if base in ADJ:
                out.append(t.replace(base, ADJ[base])); continue
            if base in NEUTRAL and base != "هي":
                out.append(t); continue
            break  # كلمة محايدة أو غير معروفة — توقف
        return " ".join(out)
    new = PAT.sub(repl, text)
    return new, n

total_fixes = 0
for q in d["questions"]:
    r2 = q.get("reason", "")
    if "الخيار الأولى" in r2 or "الخيار الثانية" in r2 or "الخيار الثالثة" in r2 or "الخيار الرابعة" in r2:
        new, n = fix_reason(r2)
        if n:
            q["reason"] = new
            total_fixes += n
print(f"٤) إصلاحات التأنيث: {total_fixes} موضعًا")

json.dump(d, open(QB, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------- الخطوة ٥: بطارية التحقق ----------
d = json.load(open(QB, encoding="utf-8"))
qs = d["questions"]
errs = []
FOREIGN = re.compile(r"[A-Za-z\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u3040-\u30FF\u3400-\u9FFF]")
c = collections.Counter()
short_b = sum(1 for q in json.load(open(BAK, encoding="utf-8"))["questions"] if q["type"] == "mcq" and len(q.get("reason", "")) < 150)
for q in qs:
    qid = q["id"]
    txt = q["question"] + q.get("reason", "") + "".join(o["text"] for o in q["options"])
    if FOREIGN.search(txt): errs.append(f"{qid}: حروف أجنبية")
    if re.search(r"المشتت(ة|ات)\b", q.get("reason", "")): errs.append(f"{qid}: قالب مشتتات رجع")  # «المشتتين» لوصف التلاميذ مشروعة
    if re.search(r"الخيار[ ](الأولى|الثانية|الثالثة|الرابعة)", q.get("reason", "")):
        errs.append(f"{qid}: تأنيث متبقٍ")
    if q["type"] == "mcq":
        if sum(o["isCorrect"] for o in q["options"]) != 1: errs.append(f"{qid}: صحيح غير وحيد")
        if next(o for o in q["options"] if o["isCorrect"])["text"] != q["correct"]: errs.append(f"{qid}: correct غير مطابق")
        if len({o["text"] for o in q["options"]}) != len(q["options"]): errs.append(f"{qid}: خيارات مكررة")
        c[next(i for i, o in enumerate(q["options"]) if o["isCorrect"])] += 1

fixed_order = sum(1 for q in qs if q.get("fixedOrder"))
# شرح قصير: بند معلّق معروف في بنك ACAD (أسباب صح وخطأ والمقالي المختصر عمدًا) — معلومة فقط لا بوابة
short_c = sum(1 for q in qs if q["type"] == "mcq" and len(q.get("reason", "")) < 150)
print(f"\n٥) التحقق: {len(qs)} سؤالًا | fixedOrder = {fixed_order}")
print(f"   شرح mcq قصير (<١٥٠): {short_c} (في أساس ACAD: {short_b} — بند معلّق لا ارتداد)")
ABJD = "أبجد"
tot = sum(c.values())
for i in range(4):
    print(f"   موضع {ABJD[i]}: {c[i]} ({c[i]*100/tot:.1f}%)")

# فحوص النجاح
ok_concepts = d["concepts"] == json.load(open(BAK, encoding="utf-8"))["concepts"]
print(f"   المفاهيم مطابقة لما بعد ACAD: {ok_concepts}")
print(f"   أخطاء: {len(errs)}")
for e in errs[:20]:
    print("   ", e)
if errs or not ok_concepts:
    sys.exit(1)
print("\nتم — البنك: أساس ACAD + مواضع متوازنة + batch01 + تذكير الإعراب")
