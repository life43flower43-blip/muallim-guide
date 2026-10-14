#!/usr/bin/env python3
# تدقيق جودة بنك الأسئلة — تقرير كامل إلى scripts/audit_out/data_findings.md + JSON
# هذه المهمة للتحليل فقط: لا تعديل أي ملف بيانات.
import json, os, re
from collections import Counter, defaultdict
from difflib import SequenceMatcher

PATH = "/home/z/my-project/public/data/qbank.json"
OUT = "/home/z/my-project/scripts/audit_out"
os.makedirs(OUT, exist_ok=True)

d = json.load(open(PATH, encoding="utf-8"))
courses = d["courses"]
concepts = d["concepts"]
questions = d["questions"]

F = []

def add(sev, section, msg):
    F.append({"sev": sev, "section": section, "msg": msg})

def norm(s):
    s = (s or "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def sim(a, b):
    return SequenceMatcher(None, a, b).ratio()

def q_texts(q):
    return [o.get("text", "") if isinstance(o, dict) else str(o) for o in q.get("options", [])]

def q_correct_idx(q):
    opts = q.get("options", [])
    for i, o in enumerate(opts):
        if isinstance(o, dict) and o.get("isCorrect"):
            return i
    return -1

con_by_id = {c["id"]: c for c in concepts}
q_per_concept = Counter(q["conceptId"] for q in questions)
chapters = defaultdict(list)
for c in concepts:
    chapters[(c["courseId"], c["chapter"])].append(c)

# ============ 1) البنية العامة ============
nq_c = [q_per_concept.get(c["id"], 0) for c in concepts]
add("INFO", "بنية", f"مساقات: {len(courses)}، مفاهيم: {len(concepts)}، أسئلة: {len(questions)}، فصول: {len(chapters)}")
add("INFO", "بنية", f"أسئلة لكل مفهوم — بلا أسئلة: {sum(1 for x in nq_c if x == 0)}، أقل من ٣: {sum(1 for x in nq_c if 0 < x < 3)}، المتوسط: {sum(nq_c)/len(nq_c):.2f}")
add("INFO", "بنية", f"توزيع المفتاح (أ/ب/ج/د): {[sum(1 for q in questions if q_correct_idx(q) == i) for i in range(4)]}")
diff = Counter(q.get("difficulty", "؟") for q in questions)
add("INFO", "بنية", f"توزيع الصعوبة: {dict(diff)}")
typ = Counter(q.get("type", "؟") for q in questions)
add("INFO", "بنية", f"توزيع النوع: {dict(typ)}")

thin_chapters = [(k, len(v)) for k, v in chapters.items() if len(v) < 5]
for (cid, ch), n in sorted(thin_chapters, key=lambda x: x[1]):
    add("MID", "ثغرات-هيكلية", f"فصل رقيق ({n} مفاهيم فقط): «{ch}» في {cid}")

# ============ 2) المكرر — المفاهيم ============
title_map = defaultdict(list)
for c in concepts:
    title_map[norm(c["title"])].append(c)
exact_dup_titles = {k: v for k, v in title_map.items() if len(v) > 1}
add("HIGH" if exact_dup_titles else "OK", "مكرر-مفاهيم", f"عناوين مفاهيم مكررة حرفياً: {len(exact_dup_titles)}")
for t, lst in sorted(exact_dup_titles.items()):
    locs = [" / ".join([x["courseId"], x["chapter"]]) for x in lst]
    add("HIGH", "مكرر-مفاهيم", f"«{t}» في: " + " | ".join(locs) + f" — {[x['id'] for x in lst]}")

by_ch = defaultdict(list)
for c in concepts:
    by_ch[(c["courseId"], c["chapter"])].append(c)
near_pairs = []
for k, lst in by_ch.items():
    for i in range(len(lst)):
        for j in range(i + 1, len(lst)):
            r = sim(norm(lst[i]["title"]), norm(lst[j]["title"]))
            if r >= 0.80:
                near_pairs.append((r, lst[i], lst[j], "نفس الفصل"))
near_pairs.sort(reverse=True, key=lambda x: x[0])
add("INFO", "مكرر-مفاهيم", f"أزواج متشابهة (≥٠٫٨٠) داخل الفصل نفسه: {len(near_pairs)}")
for r, a, b, scope in near_pairs[:35]:
    add("HIGH", "مكرر-مفاهيم", f"تشابه {r:.2f} ({scope}): «{a['title']}» {a['id']} ↔ «{b['title']}» {b['id']} في «{a['chapter']}» ({a['courseId']})")

# ============ 3) المكرر — الأسئلة ============
q_text_map = defaultdict(list)
for q in questions:
    q_text_map[norm(q["question"])].append(q)
exact_dup_q = {k: v for k, v in q_text_map.items() if len(v) > 1}
add("HIGH" if exact_dup_q else "OK", "مكرر-أسئلة", f"نصوص أسئلة مكررة حرفياً: {len(exact_dup_q)}")
for t, lst in list(sorted(exact_dup_q.items(), key=lambda kv: -len(kv[1])))[:25]:
    ids = [(q["id"], q["conceptId"]) for q in lst]
    add("HIGH", "مكرر-أسئلة", f"«{t[:70]}…» ×{len(lst)} — {ids}")

q_by_concept = defaultdict(list)
for q in questions:
    q_by_concept[q["conceptId"]].append(q)
near_q = []
for cid, lst in q_by_concept.items():
    for i in range(len(lst)):
        for j in range(i + 1, len(lst)):
            r = sim(norm(lst[i]["question"]), norm(lst[j]["question"]))
            if r >= 0.90:
                near_q.append((r, lst[i], lst[j]))
near_q.sort(reverse=True, key=lambda x: x[0])
add("INFO", "مكرر-أسئلة", f"أزواج شبه متطابقة (≥٠٫٩٠) داخل المفهوم: {len(near_q)}")
for r, a, b in near_q[:20]:
    add("MID", "مكرر-أسئلة", f"تشابه {r:.2f} في {a['conceptId']}: {a['id']} ↔ {b['id']} — «{a['question'][:60]}…»")

# ============ 4) سلامة الإحالة والحقول ============
orphans = [q for q in questions if q["conceptId"] not in con_by_id]
add("CRIT" if orphans else "OK", "سلامة", f"أسئلة يتيمة بلا مفهوم: {len(orphans)}" + (f" — {[q['id'] for q in orphans[:10]]}" if orphans else ""))

bad_n = [q for q in questions if len(q.get("options", [])) != 4]
add("HIGH" if bad_n else "OK", "سلامة", f"أسئلة بخيارات غير رباعية: {len(bad_n)}" + (f" — {[q['id'] for q in bad_n[:10]]}" if bad_n else ""))

mismatch = []
for q in questions:
    idx = q_correct_idx(q)
    if idx < 0:
        mismatch.append((q["id"], "بلا isCorrect", q.get("correct", "")))
    elif norm(q["options"][idx].get("text", "")) != norm(q.get("correct", "")):
        mismatch.append((q["id"], "correct ≠ isCorrect", q.get("correct", "")[:40]))
add("CRIT" if mismatch else "OK", "سلامة", f"تضارب بين حقل correct وعلم isCorrect: {len(mismatch)}" + (f" — {mismatch[:10]}" if mismatch else ""))

empty_reason = [q["id"] for q in questions if not (q.get("reason") or "").strip()]
short_reason = [q["id"] for q in questions if 0 < len((q.get("reason") or "").strip()) < 60]
add("HIGH" if empty_reason else "OK", "تغذية راجعة", f"أسئلة بلا تعليل: {len(empty_reason)} {empty_reason[:8]}؛ تعليل قصير جداً: {len(short_reason)} {short_reason[:8]}")

short_q = [q["id"] for q in questions if len((q.get("question") or "").strip()) < 15]
add("MID", "جودة نص", f"أسئلة نصها أقل من ١٥ حرفاً: {len(short_q)} — {short_q[:8]}")

no_exp = [c["id"] for c in concepts if len((c.get("explanation") or "").strip()) < 100]
add("MID", "جودة نص", f"مفاهيم بشرح أقل من ١٠٠ حرف: {len(no_exp)} — {no_exp[:8]}")

def ex_text(c):
    ex = c.get("examples")
    if isinstance(ex, list):
        return " ".join(str(x) for x in ex)
    return str(ex or "") + " " + str(c.get("example") or "")

empty_ex = [c["id"] for c in concepts if not ex_text(c).strip()]
add("MID", "جودة نص", f"مفاهيم بلا أمثلة: {len(empty_ex)} — {empty_ex[:8]}")

# ============ 5) جودة المفتاح والبدائل ============
dup_options = []
for q in questions:
    opts = [norm(t) for t in q_texts(q)]
    if any(v > 1 for v in Counter(opts).values()):
        dup_options.append(q["id"])
add("HIGH", "جودة بدائل", f"أسئلة بخيارين متطابقين بعد التطبيع: {len(dup_options)} — {dup_options[:12]}")

answer_in_q = []
for q in questions:
    idx = q_correct_idx(q)
    if idx >= 0:
        ans = norm(q["options"][idx].get("text", ""))
        if len(ans) >= 4 and ans in norm(q["question"]):
            answer_in_q.append(q["id"])
add("HIGH", "جودة بدائل", f"أسئلة تحتوي الإجابة الصحيحة حرفياً في نصها: {len(answer_in_q)} — {answer_in_q[:12]}")

bias = []
for q in questions:
    ls = [len(t) for t in q_texts(q)]
    if len(ls) == 4 and max(ls) > 0 and min(ls) / max(ls) < 0.35 and max(ls) - min(ls) > 40:
        bias.append(q["id"])
add("LOW", "جودة بدائل", f"أسئلة بانحياز طولي قوي بين البدائل: {len(bias)} — {bias[:10]}")

# ============ 6) النظافة اللغوية ============
LATIN = re.compile(r"[A-Za-z]")
CJK = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff]")
latin_q = [q["id"] for q in questions if LATIN.search(q.get("question", "") + "".join(q_texts(q)) + q.get("reason", ""))]
latin_c = [c["id"] for c in concepts if LATIN.search(c.get("title", "") + c.get("explanation", ""))]
cjk_c = [c["id"] for c in concepts if CJK.search(c.get("title", "") + c.get("explanation", ""))]
add("CRIT" if latin_q else "OK", "لغة", f"أسئلة تحوي أحرفاً لاتينية: {len(latin_q)} — {latin_q[:12]}")
add("CRIT" if latin_c else "OK", "لغة", f"مفاهيم تحوي أحرفاً لاتينية: {len(latin_c)} — {latin_c[:12]}")
add("CRIT" if cjk_c else "OK", "لغة", f"مفاهيم تحوي CJK: {len(cjk_c)} — {cjk_c[:12]}")

LATIN_DIGIT = re.compile(r"[0-9]")
dig_q = [q["id"] for q in questions if LATIN_DIGIT.search(q.get("question", ""))]
dig_opts = [q["id"] for q in questions if any(LATIN_DIGIT.search(t) for t in q_texts(q))]
dig_c = [c["id"] for c in concepts if LATIN_DIGIT.search(c.get("title", ""))]
add("MID", "لغة", f"أسئلة بأرقام لاتينية في نصها: {len(dig_q)} — {dig_q[:10]}؛ في بدائلها: {len(dig_opts)} — {dig_opts[:10]}؛ عناوين مفاهيم: {len(dig_c)} — {dig_c[:10]}")

DOUBLE_SPACE = re.compile(r"  +")
SPACE_BEFORE_PUNCT = re.compile(r"\s+[,،.؛:!؟]")
REPEAT_PUNCT = re.compile(r"[،.؟!]{2,}")
TATWEEL = re.compile("ـ")
ds_q = sum(1 for q in questions if DOUBLE_SPACE.search(q.get("question", "")))
sbp_q = [q["id"] for q in questions if SPACE_BEFORE_PUNCT.search(q.get("question", "") + q.get("reason", ""))]
rp_q = [q["id"] for q in questions if REPEAT_PUNCT.search(q.get("question", ""))]
tat_q = [q["id"] for q in questions if TATWEEL.search(q.get("question", ""))]
add("LOW", "تنسيق", f"مسافات مزدوجة: {ds_q}؛ مسافة قبل ترقيم: {len(sbp_q)} — {sbp_q[:8]}؛ ترقيم مكرر: {len(rp_q)} — {rp_q[:8]}؛ تطويل: {len(tat_q)} — {tat_q[:8]}")

unbal_q = [q["id"] for q in questions if q.get("question", "").count("«") != q.get("question", "").count("»")]
add("LOW", "تنسيق", f"أسئلة بعلامات تنصيص غير متوازنة: {len(unbal_q)} — {unbal_q[:10]}")

# ============ 7) الإملاء — قائمة أخطاء شائعة ============
MISSPELL = {
    "إختبار": "اختبار", "إختبارات": "اختبارات", "إستخدام": "استخدام", "إستعمال": "استعمال",
    "إستراتيجية": "استراتيجية", "إستراتيجيات": "استراتيجيات", "إستبيان": "استبيان",
    "إثنان": "اثنان", "إثنين": "اثنين", "إثمار": "اثمار", "إجتماع": "اجتماع",
    "إتفاق": "اتفاق", "إتجاه": "اتجاه", "إختيار": "اختيار", "إختصاص": "اختصاص",
    "مسئول": "مسؤول", "مسئولية": "مسؤولية", "شئ ": "شيء ", "لاكن": "لكن",
    "هاذا": "هذا", "هاذه": "هذه", "اللة": "الله", "انشاءالله": "إن شاء الله",
    "إحنا": "نحن", "منشان": "من أجل", "الغلط": "الخطأ", "درستي": "دراستي",
    "أفكار ": "أفكار ", "متأكده": "متأكدة", "الانجاز": "الإنجاز", "إبداعى": "إبداعي",
    "المعلمه": "المعلمة", "الطالبه": "الطالبة", "المدرسه": "المدرسة", "الصفه": "الصفة",
}
spell_hits = defaultdict(list)
for q in questions:
    blob = q.get("question", "") + " " + " ".join(q_texts(q)) + " " + q.get("reason", "")
    for wrong in MISSPELL:
        if wrong.strip() and wrong in blob:
            spell_hits[wrong].append(f"{q['id']}({q['conceptId']})")
for c in concepts:
    blob = c.get("title", "") + " " + c.get("explanation", "")
    for wrong in MISSPELL:
        if wrong.strip() and wrong in blob:
            spell_hits[wrong].append(c["id"])
for wrong, refs in sorted(spell_hits.items(), key=lambda kv: -len(kv[1])):
    add("HIGH", "إملاء", f"«{wrong}» → «{MISSPELL[wrong]}»: {len(refs)} موضعاً — {refs[:8]}{'…' if len(refs) > 8 else ''}")
if not spell_hits:
    add("OK", "إملاء", "لم يُرصد أي من الأخطاء الشائعة في قائمة الفحص")

# ============ 8) المفاهيم الموضوعة في مكان خاطئ (تقارب دلالي) ============
STOP = set("في من على عن إلى الى مع هذا هذه ذلك التي الذي الذين ما لا لم لن وقد قد كل بعض بين عند لكن ثم أو او حتى إذا اذا كما أن ان إن كان كانت يكون تكون هي هو هم هن أنا أنت نحن أي اي أيضا ايضا غير نفس لدي لدى عبر خلال بعد قبل فوق تحت أمام امام وراء دون سوى إذ إذن بل كيف لماذا متى أين اين هل نعم وهل إلا الا منذ لدن عندما حينما كي لكي بحيث حول نحو بلا بدون ومن فيما وهو وهي فإن فان على عن أنواع أنواعها وعلاقة وتفسير ودلالة وفوائد".split())

def toks(s):
    s = norm(re.sub(r"[^\w\s\u0600-\u06FF]", " ", s or ""))
    return [t for t in s.split() if len(t) >= 4 and t not in STOP]

chap_tokens = {k: set() for k in chapters}
for k, lst in chapters.items():
    for c in lst:
        chap_tokens[k] |= set(toks(c["title"]))
    chap_tokens[k] |= set(toks(k[1]))

misplaced = []
for c in concepts:
    ct = set(toks(c["title"]))
    if not ct:
        continue
    own_key = (c["courseId"], c["chapter"])
    own_score = len(ct & chap_tokens[own_key])
    best_other, best_score = None, 0
    for k, s in chap_tokens.items():
        if k == own_key:
            continue
        sc = len(ct & s)
        if sc > best_score:
            best_score, best_other = sc, k
    if best_other and best_score >= 2 and best_score > own_score * 1.5:
        ev = sorted(ct & chap_tokens[best_other])
        misplaced.append((best_score / max(own_score, 1), c, best_other, ev, own_score))
misplaced.sort(reverse=True, key=lambda x: x[0])
add("INFO", "انحراف-مفاهيم", f"مرشحات إعادة تصنيف الدلالية (للمراجعة البشرية، لا قراراً آلياً): {len(misplaced)}")
for r, c, other, ev, own in misplaced[:40]:
    add("MID", "انحراف-مفاهيم", f"{c['id']} «{c['title']}» في {c['courseId']}/«{c['chapter']}» (قرب ذاتي {own}) → أقرب فصل {other[0]}/«{other[1]}» (×{r:.1f}) توافق: {ev[:6]}")

# ============ 9) غيابات موضوعية مقابل مجالات اختبارات المعلمين ============
DOMAINS = {
    "نظرية التعلم السلوكية والمعرفية والبنائية": ["سلوكي", "بافلوف", "سكينر", "معرفي", "بياجيه", "فيجوتسكي", "بنائية"],
    "إدارة الصف": ["إدارة الصف", "ادارة الصف", "انضباط", "عقاب", "تعزيز"],
    "الأهداف وإعداد الدروس": ["أهداف", "اهداف", "خطة الدرس", "تخطيط"],
    "طرق التدريس والاستراتيجيات": ["طريقة تدريس", "استراتيجيات", "حوار", "مناقشة", "تعلم تعاوني", "تعلم نشط"],
    "التكنولوجيا التعليمية والتعلم الرقمي": ["تكنولوجيا", "رقمي", "الحاسوب", "التعليم عن بعد"],
    "الصحة النفسية والإرشاد": ["إرشاد", "ارشاد", "صحة نفسية", "قلق"],
    "ذوو الاحتياجات والدمج": ["احتياجات خاصة", "دمج", "إعاقة", "صعوبات التعلم"],
    "التقويم والاختبارات": ["تقويم", "اختبار", "قياس"],
    "الإدارة المدرسية والقيادة": ["إدارة مدرسية", "ادارة مدرسية", "ثقافة تنظيمية", "قيادة"],
    "أخلاقيات المهنة وحقوق الطفل": ["أخلاقيات", "اخلاقيات", "حقوق الطفل", "قوانين"],
    "البحث التربوي": ["بحث تربوي", "منهج تجريبي", "عينات"],
    "المهارات الحياتية ومواطنة القرن الحادي والعشرين": ["مهارات حياتية", "القرن الحادي والعشرين", "مواطنة"],
}
ALL = " ".join(c["title"] + " " + c.get("explanation", "")[:300] for c in concepts)
for dom, kws in DOMAINS.items():
    hits = sum(1 for kw in kws if norm(kw) in norm(ALL))
    if hits < max(1, len(kws) // 3):
        add("MID", "ثغرات-موضوعية", f"مجال ضعيف التغطية: «{dom}» — مفاتيح موجودة {hits}/{len(kws)}")

# ============ إخراج ============
order = {"CRIT": 0, "HIGH": 1, "MID": 2, "LOW": 3, "INFO": 4, "OK": 5}
F.sort(key=lambda x: (order[x["sev"]], x["section"]))
cnt = Counter(f["sev"] for f in F)
md = ["# نتائج تدقيق بنك الأسئلة — تحليل فقط، دون تعديل", "",
      f"**الملخص:** حرج {cnt.get('CRIT',0)} — عالٍ {cnt.get('HIGH',0)} — متوسط {cnt.get('MID',0)} — منخفض {cnt.get('LOW',0)} — معلومات {cnt.get('INFO',0)} — سليم {cnt.get('OK',0)}", ""]
for sev in ["CRIT", "HIGH", "MID", "LOW", "INFO", "OK"]:
    sec = [f for f in F if f["sev"] == sev]
    if not sec:
        continue
    md.append(f"\n## {sev}")
    for f in sec:
        md.append(f"- [{f['section']}] {f['msg']}")
open(f"{OUT}/data_findings.md", "w", encoding="utf-8").write("\n".join(md))
json.dump(F, open(f"{OUT}/data_findings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"OK — findings: {len(F)} | {dict(cnt)}")
