# -*- coding: utf-8 -*-
"""دمج دفعات الموجة الثانية لمحور «عالم المشاعر والذكاء» (M2) في بنك المفاهيم
مع إعادة الترقيم والتحقق الكامل والفحص العالمي للتصادمات.
المعرفات تبدأ بعد آخر معرف مستخدم في البنك (D1843 / Q12972) بعد دمج دفعات M5."""
import importlib.util
import json
import re

M2_DIR = "/home/z/my-project/scripts/m2_batches"

BATCHES = [f"batch{i:02d}" for i in range(1, 15)]
QBANK_PATH = "/home/z/my-project/public/data/qbank.json"
D_START = 1844
Q_START = 12973

LATIN = re.compile(r"[A-Za-z]")
LATIN_DIGIT = re.compile(r"[0-9]")
CJK = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf]")


def load_batches():
    """تحميل الدفعات من ملفاتها الصريحة في m2_batches حصرًا
    (لا اعتمادًا على sys.path لأن m4_batches وm5_batches يضمّان ملفات بالأسماء نفسها)."""
    concepts, questions = [], []
    for name in BATCHES:
        path = f"{M2_DIR}/{name}.py"
        spec = importlib.util.spec_from_file_location(f"m2_{name}", path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        cs = getattr(mod, "CONCEPTS")
        qs = getattr(mod, "QUESTIONS")
        if len(qs) != 4 * len(cs):
            raise SystemExit(f"خطأ في {name}: الأسئلة {len(qs)} لا تطابق ٤× المفاهيم {len(cs)}")
        concepts += cs
        questions += qs
        chapters = sorted({c["chapter"] for c in cs})
        print(f"{name}: {len(cs)} مفهومًا، {len(qs)} سؤالًا — {chapters}")
    return concepts, questions


def renumber(concepts, questions):
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


def validate(concepts, questions, existing_titles, existing_stems):
    errors = []
    ids = [c["id"] for c in concepts]
    if len(set(ids)) != len(ids):
        errors.append("معرفات مفاهيم مكررة")
    if len(questions) != 4 * len(concepts):
        errors.append("عدد الأسئلة غير مطابق")

    seen_titles, seen_stems = set(existing_titles), set(existing_stems)

    per_concept = {cid: [] for cid in ids}
    for q in questions:
        per_concept.setdefault(q["conceptId"], []).append(q)

    def texts_of(obj, path=""):
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
        if c.get("courseId") != "M2":
            errors.append(f"{cid}: courseId ليس M2")
        if not c.get("title") or not c.get("chapter"):
            errors.append(f"{cid}: عنوان أو فصل فارغ")
        if c["title"] in seen_titles:
            errors.append(f"{cid}: عنوان مكرر مع البنك أو الدفعات: {c['title']}")
        seen_titles.add(c["title"])
        if len(c.get("explanation", "")) < 350:
            errors.append(f"{cid}: الشرح قصير جدًّا ({len(c.get('explanation', ''))})")
        exs = c.get("examples", [])
        if len(exs) != 5 or any(len(e) < 60 for e in exs):
            errors.append(f"{cid}: الأمثلة ليست خمسة غنية")
        if not c.get("example"):
            errors.append(f"{cid}: الخلاصة مفقودة")
        for p, t in texts_of(c, cid):
            if LATIN.search(t) or CJK.search(t):
                errors.append(f"{p}: حروف أجنبية: {t[:50]}")
            if LATIN_DIGIT.search(t):
                errors.append(f"{p}: أرقام لاتينية: {t[:50]}")
        qs = per_concept.get(cid, [])
        if len(qs) != 4:
            errors.append(f"{cid}: عدد أسئلته {len(qs)}")
            continue
        types = [q["type"] for q in qs]
        if sorted(types) != ["mcq", "mcq", "tf", "tf"]:
            errors.append(f"{cid}: توزيع الأنواع {types}")

    for q in questions:
        qid = q["id"]
        if q["question"] in seen_stems:
            errors.append(f"{qid}: نص سؤال مكرر مع البنك أو الدفعات: {q['question'][:40]}")
        seen_stems.add(q["question"])
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
        if len(q.get("reason", "")) < 120:
            errors.append(f"{qid}: التعليل قصير ({len(q.get('reason', ''))})")
        for p, t in texts_of(q, qid):
            if LATIN.search(t) or CJK.search(t):
                errors.append(f"{p}: حروف أجنبية: {t[:50]}")
            if LATIN_DIGIT.search(t):
                errors.append(f"{p}: أرقام لاتينية: {t[:50]}")

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
    m2 = [c for c in bank["concepts"] if c["courseId"] == "M2"]
    m2q = [q for q in bank["questions"] if q["conceptId"] in {c["id"] for c in m2}]
    m2ch = sorted({c["chapter"] for c in m2})
    print(f"محور M2 الآن: {len(m2)} مفهومًا في {len(m2ch)} فصلًا و{len(m2q)} سؤالًا")


if __name__ == "__main__":
    with open(QBANK_PATH, encoding="utf-8") as f:
        bank = json.load(f)
    existing_titles = {c["title"] for c in bank["concepts"]}
    existing_stems = {q["question"] for q in bank["questions"]}

    cs, qs = load_batches()
    print(f"\nالإجمالي قبل الترقيم: {len(cs)} مفهومًا، {len(qs)} سؤالًا")
    renumber(cs, qs)
    print(f"المعرفات: {cs[0]['id']} ... {cs[-1]['id']} | الأسئلة: {qs[0]['id']} ... {qs[-1]['id']}")
    validate(cs, qs, existing_titles, existing_stems)
    merge(cs, qs)
