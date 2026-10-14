# -*- coding: utf-8 -*-
"""دمج دفعات توسعة محور «كيف يتعلم الطلاب» في بنك المفاهيم مع إعادة الترقيم والتحقق الكامل."""
import json
import re
import sys

sys.path.insert(0, "/home/z/my-project/scripts/m3_batches")

BATCHES = [f"batch{i:02d}" for i in range(1, 15)]
QBANK_PATH = "/home/z/my-project/src/data/qbank.json"
D_START = 1401
Q_START = 11001

# الحروف اللاتينية ممنوعة في كل نص المحتوى (المعرفات استثناء)
LATIN = re.compile(r"[A-Za-z]")
LATIN_DIGIT = re.compile(r"[0-9]")


def load_batches():
    concepts, questions = [], []
    for name in BATCHES:
        mod = __import__(name)
        cs = getattr(mod, "CONCEPTS")
        qs = getattr(mod, "QUESTIONS")
        if len(qs) != 4 * len(cs):
            raise SystemExit(f"خطأ في {name}: الأسئلة {len(qs)} لا تطابق 4× المفاهيم {len(cs)}")
        concepts += cs
        questions += qs
        print(f"{name}: {len(cs)} مفهومًا، {len(qs)} سؤالًا")
    return concepts, questions


def renumber(concepts, questions):
    # إعادة ترقيم المفاهيم متسلسلةً ثم ربط الأسئلة (كل 4 أسئلة متتالية لمفهوم واحد بترتيب الملفات)
    mapping = []
    for i, c in enumerate(concepts):
        new_id = f"D{D_START + i}"
        mapping.append(new_id)
        c["id"] = new_id
    for i, q in enumerate(questions):
        owner = i // 4
        q["conceptId"] = mapping[owner]
        q["id"] = f"Q{Q_START + i}"
    return concepts, questions


def validate(concepts, questions):
    errors = []
    ids = [c["id"] for c in concepts]
    if len(set(ids)) != len(ids):
        errors.append("معرفات مفاهيم مكررة")
    if len(questions) != 4 * len(concepts):
        errors.append("عدد الأسئلة غير مطابق")

    # قواميس للفحص
    per_concept = {cid: [] for cid in ids}
    for q in questions:
        per_concept.setdefault(q["conceptId"], []).append(q)

    def texts_of(obj, path=""):
        """يُرجع كل السلاسل النصية في البنية مع مسارها، مستثنيًا حقول المعرفات والتصنيفات."""
        skip = {"id", "courseId", "conceptId", "type", "difficulty", "fixedOrder"}
        if isinstance(obj, str):
            yield path, obj
        elif isinstance(obj, dict):
            for k, v in obj.items():
                if k in skip:
                    continue
                yield from texts_of(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                yield from texts_of(v, f"{path}[{i}]")

    for c in concepts:
        cid = c["id"]
        if c.get("courseId") != "M3":
            errors.append(f"{cid}: courseId ليس M3")
        if not c.get("title") or not c.get("chapter"):
            errors.append(f"{cid}: عنوان أو فصل فارغ")
        expl = c.get("explanation", "")
        if len(expl) < 350:
            errors.append(f"{cid}: الشرح قصير جدًّا ({len(expl)} حرفًا)")
        exs = c.get("examples", [])
        if len(exs) != 5 or any(len(e) < 40 for e in exs):
            errors.append(f"{cid}: الأمثلة ليست خمسة غنية")
        if not c.get("example"):
            errors.append(f"{cid}: المثال الموجز مفقود")
        for p, t in texts_of(c, cid):
            if LATIN.search(t):
                errors.append(f"{p}: يحتوي حروفًا لاتينية: {t[:60]}")
        qs = per_concept.get(cid, [])
        if len(qs) != 4:
            errors.append(f"{cid}: عدد أسئلته {len(qs)}")
            continue
        types = [q["type"] for q in qs]
        if sorted(types) != ["mcq", "mcq", "tf", "tf"]:
            errors.append(f"{cid}: توزيع الأنواع {types}")

    for q in questions:
        qid = q["id"]
        opts = q["options"]
        correct_flags = [o["isCorrect"] for o in opts]
        if sum(correct_flags) != 1:
            errors.append(f"{qid}: عدد الإجابات الصحيحة {sum(correct_flags)}")
            continue
        correct_text = next(o["text"] for o in opts if o["isCorrect"])
        if q["correct"] != correct_text:
            errors.append(f"{qid}: حقل correct لا يطابق الخيار الصحيح")
        if q["type"] == "mcq":
            if len(opts) != 4:
                errors.append(f"{qid}: عدد الخيارات {len(opts)}")
            if q["difficulty"] not in ("سهل", "متوسط"):
                errors.append(f"{qid}: صعوبة غير صالحة {q['difficulty']}")
            texts = [o["text"] for o in opts]
            if len(set(texts)) != len(texts):
                errors.append(f"{qid}: خيارات مكررة")
        elif q["type"] == "tf":
            if len(opts) != 2:
                errors.append(f"{qid}: خيارات صح-خطأ غير سليمة")
            if q["difficulty"] not in ("متوسط", "صعب"):
                errors.append(f"{qid}: صعوبة غير صالحة {q['difficulty']}")
            if q["correct"] not in ("صح", "خطأ"):
                errors.append(f"{qid}: قيمة صح-خطأ غير سليمة")
        else:
            errors.append(f"{qid}: نوع غير معروف {q['type']}")
        for p, t in texts_of(q, qid):
            if LATIN.search(t):
                errors.append(f"{p}: حروف لاتينية: {t[:60]}")
            if LATIN_DIGIT.search(t):
                errors.append(f"{p}: أرقام لاتينية في المحتوى: {t[:60]}")
        if not q.get("reason") or len(q["reason"]) < 40:
            errors.append(f"{qid}: التبرير مفقود أو قصير")

    # تناسق أسماء الفصول
    chapters = {}
    for c in concepts:
        chapters.setdefault(c["chapter"], 0)
        chapters[c["chapter"]] += 1
    print("\nالفصول الجديدة:")
    for ch, n in chapters.items():
        print(f"  [{n}] {ch}")

    if errors:
        print("\n!!! أخطاء التحقق !!!")
        for e in errors[:60]:
            print(" -", e)
        raise SystemExit(f"عدد الأخطاء: {len(errors)}")
    print("\n✔ التحقق سليم بالكامل")


def merge(concepts, questions):
    with open(QBANK_PATH, encoding="utf-8") as f:
        bank = json.load(f)
    existing_c = {c["id"] for c in bank["concepts"]}
    existing_q = {q["id"] for q in bank["questions"]}
    clash_c = existing_c & {c["id"] for c in concepts}
    clash_q = existing_q & {q["id"] for q in questions}
    if clash_c or clash_q:
        raise SystemExit(f"تصادم معرفات: مفاهيم {list(clash_c)[:5]} أسئلة {list(clash_q)[:5]}")

    bank["concepts"] += concepts
    bank["questions"] += questions

    with open(QBANK_PATH, "w", encoding="utf-8") as f:
        json.dump(bank, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n✔ أُدمج: {len(concepts)} مفهومًا و{len(questions)} سؤالًا")
    print(f"البنك الآن: {len(bank['concepts'])} مفهومًا و{len(bank['questions'])} سؤالًا")
    m3 = [c for c in bank["concepts"] if c["courseId"] == "M3"]
    m3q = [q for q in bank["questions"] if q["conceptId"] in {c['id'] for c in m3}]
    print(f"محور M3 الآن: {len(m3)} مفهومًا و{len(m3q)} سؤالًا")


if __name__ == "__main__":
    cs, qs = load_batches()
    print(f"\nالإجمالي قبل الترقيم: {len(cs)} مفهومًا، {len(qs)} سؤالًا")
    renumber(cs, qs)
    print(f"المعرفات: {cs[0]['id']} ... {cs[-1]['id']} | الأسئلة: {qs[0]['id']} ... {qs[-1]['id']}")
    validate(cs, qs)
    merge(cs, qs)
