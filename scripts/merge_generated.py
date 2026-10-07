# دمج المحتوى المولد (٥ أمثلة + أسئلة جديدة لكل مفهوم) في qbank.json مع فحص تكرار نهائي شامل
import json, re, os, glob, shutil, datetime

ROOT = "/home/z/my-project"
P = os.path.join(ROOT, "src/data/qbank.json")
GEN = os.path.join(ROOT, "src/data/generated")

# ---------- تطبيع عربي وفحص تشابه (نفس منهجية التوليد) ----------
def norm_ar(s):
    s = (s or "").strip()
    s = re.sub(r"[\u064B-\u0652\u0640]", "", s)
    s = (s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
          .replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي"))
    s = re.sub(r"[^\u0621-\u064A0-9]", " ", s)
    return re.sub(r"\s+", " ", s).lower()

STOP = set("في من على عن الى إلى التي الذي هذا هذه ذلك مع او أو ثم حتى كل بعض غير نعم لا هل ما ماذا كيف لماذا عندما بين بينما عبر لدى لكن لكنه بل إذ إذا لان لأن ان أن يكون تكون كان كانت هي هو هم هن أنت أنا نحن وقد ولم لما له لها لهم فيه فيها منها منه عليه عليها".split())
def toks(s):
    return [w for w in norm_ar(s).split() if len(w) > 2 and w not in STOP]

def jac(a, b):
    A, B = set(a), set(b)
    if not A or not B:
        return 0.0
    inter = len(A & B)
    return inter / (len(A) + len(B) - inter)

# ---------- تحميل ----------
d = json.load(open(P, encoding="utf-8"))
concepts = {c["id"]: c for c in d["concepts"]}
questions = d["questions"]
max_q = max(int(q["id"][1:]) for q in questions)

print(f"قبل الدمج: مفاهيم {len(concepts)} — أسئلة {len(questions)}")

# أسئلة موجودة لكل مفهوم (للفحص)
existing_toks = {}
for q in questions:
    existing_toks.setdefault(q["conceptId"], []).append(toks(q["question"]))

new_examples = 0
new_questions = []
skipped_concepts = []
dup_dropped = 0

for f in sorted(glob.glob(os.path.join(GEN, "C*.json"))):
    cid = os.path.basename(f)[:-5]
    c = concepts.get(cid)
    if not c:
        continue
    try:
        g = json.load(open(f, encoding="utf-8"))
    except Exception as e:
        print(f"تعذر قراءة {cid}: {e}")
        continue
    exs = [e.strip() for e in (g.get("examples") or []) if isinstance(e, str) and 60 <= len(e.strip()) <= 800]
    if len(exs) >= 5:
        c["examples"] = exs[:5]
        new_examples += 1
    else:
        skipped_concepts.append(cid + f"(أمثلة={len(exs)})")

    qs = g.get("questions") or []
    accepted = 0
    for q in qs:
        text = (q.get("question") or "").strip()
        opts = q.get("options")
        ci = q.get("correctIndex")
        diff = q.get("difficulty")
        reason = (q.get("reason") or "").strip()
        if not text or not isinstance(opts, list) or len(opts) != 4:
            continue
        if not all(isinstance(o, str) and o.strip() for o in opts):
            continue
        if not isinstance(ci, int) or not (0 <= ci <= 3):
            continue
        if diff not in ("سهل", "متوسط", "صعب"):
            diff = "متوسط"
        # فحص التكرار ضد البنك كله + الجديد
        t = toks(text)
        dup = False
        for et in existing_toks.get(cid, []):
            if jac(et, t) > 0.72:
                dup = True
                break
        if not dup:
            for nq in new_questions:
                if nq["conceptId"] == cid and jac(existing_toks.get(cid, []) and toks(nq["question"]) or t, t) > 0.72:
                    dup = True
                    break
        if dup:
            dup_dropped += 1
            continue
        max_q += 1
        opts = [o.strip() for o in opts]
        new_questions.append({
            "id": f"Q{max_q}",
            "conceptId": cid,
            "type": "mcq",
            "difficulty": diff,
            "question": text,
            "options": [{"text": o, "isCorrect": i == ci} for i, o in enumerate(opts)],
            "correct": opts[ci],
            "reason": reason or "الإجابة الصحيحة تنطبق على المفهوم، أما بقية الخيارات فتنطبق على مفاهيم أخرى أو على فهم خاطئ شائع.",
        })
        existing_toks.setdefault(cid, []).append(t)
        accepted += 1

# ---------- فحص تكرار شامل نهائي (الموجود القديم داخلياً) ----------
print(f"\nنتيجة الدمج:")
print(f"- مفاهيم حصلت على أمثلة خمسة: {new_examples} من {len(concepts)}")
print(f"- أسئلة جديدة أُضيفت: {len(new_questions)}")
print(f"- أسئلة أُسقطت للتشابه مع الموجود: {dup_dropped}")
if skipped_concepts:
    print(f"- مفاهيم ناقصة (تُستكمل بجولة إعادة تشغيل التوليد): {len(skipped_concepts)}")
    print("  أمثلة:", ", ".join(skipped_concepts[:15]))

# ---------- كتابة النسخة الجديدة (نسخة احتياطية أولاً) ----------
bak = P + ".bak_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copyfile(P, bak)
print(f"\nنسخة احتياطية: {bak}")

d["questions"] = questions + new_questions
json.dump(d, open(P, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

total = len(d["questions"])
per_concept = {}
for q in d["questions"]:
    per_concept[q["conceptId"]] = per_concept.get(q["conceptId"], 0) + 1
mn = min(per_concept.values()); mx = max(per_concept.values())
avg = total / len(per_concept)
print(f"\nبعد الدمج: أسئلة {total} — لكل مفهوم: أدنى {mn} — أقصى {mx} — متوسط {avg:.1f}")

with_ex = sum(1 for c in d["concepts"] if c.get("examples"))
print(f"مفاهيم بأمثلة متعددة: {with_ex} من {len(d['concepts'])}")
