# -*- coding: utf-8 -*-
"""تطبيق توسعة محوري M3 «كيف يتعلم الطلاب» وM2 «الشخصية والذكاء» — دمج دفعات المحتوى في qbank.json مع تحقق صارم.

الدفعات: ملفات scripts/m3x/batch_NN.py تحمل قوائم CONCEPTS وQUESTIONS (قواميس بايثون).
المعرفات: مفاهيم M3 = D1201-D1284، مفاهيم M2 = D1301-D1343، أسئلة = Q9901-Q10408 (لا تصادم؛ أقصى سؤال قائم ٩٨٢٨).

التحقق قبل الدمج:
- تفرد المعرفات داخل الدفعات وعدم تصادمها مع البنك الحالي.
- كل مفهوم: courseId مطابق لجدوله، فصل معروف في ترتيبه، شرح ≥250 حرفًا، ٥ شواهد كل شاهد ≥60 حرفًا، عنوان ≤60 حرفًا.
- كل سؤال: mcq بأربعة خيارات أو tf بخيارين (صح/خطأ)، خيار صواب واحد، تعليل ≥150 حرفًا،
  لا حروف لاتينية ولا CJK، لا أرقام لاتينية (٠-٩ فقط)، توازن طولي للخيارات (نسبة ≤1.4)، تدوير مواضع الصواب آليًّا.
- كل مفهوم ≥4 أسئلة.
- تنسيق JSON النهائي بترتيب الفصول المعلن لكل من M3 وM2 مع بقاء بقية المحاور بترتيبها.
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path("/home/z/my-project")
BANK = ROOT / "src/data/qbank.json"
DIR = ROOT / "scripts/m3x"

LAT = re.compile(r"[A-Za-z]")
CJK = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]")
DIG = re.compile(r"[0-9]")

# ترتيب الفصول النهائي لمحور M3 «كيف يتعلم الطلاب»
M3_CHAPTER_ORDER = [
    "طبيعة التعلم",
    "نظريات التعلم",
    "نظريات التعلم السلوكية",
    "نظريات التعلم المعرفية والبصيرة",
    "نظرية بياجيه المعرفية",
    "فيجوتسكي والبنائية الاجتماعية",
    "الانتباه والإدراك",
    "الذاكرة واستراتيجيات التذكر",
    "التذكر والنسيان",
    "ما وراء المعرفة والتعلم الذاتي",
    "الدافعية والتعلم",
    "أنماط التعلم والفروق الفردية",
    "معوقات التعلم وصعوباته",
    "التعلم النشط واستراتيجياته",
    "تطبيقات التعلم في الصف",
    "التعلم في العصر الرقمي",
]

# ترتيب الفصول النهائي لمحور M2 «عالم المشاعر والذكاء» (الموجودة بترتيبها + الجديدة)
M2_CHAPTER_ORDER = [
    "أساسيات الانفعال",
    "العواطف والانفعالات",
    "الأنماط الانفعالية الأساسية",
    "الانفعالات الأخلاقية والاجتماعية",
    "تنظيم الانفعالات",
    "القلق والخوف المدرسي",
    "نظريات الانفعال",
    "الغرائز",
    "الذكاء",
    "نظريات الذكاء الكبرى",
    "قياس الذكاء",
    "تكوين الشخصية وعواملها",
    "نظريات الشخصية الكبرى",
    "أنواع الشخصية وتصنيفاتها",
    "الشخصية والتعلم",
]

COURSE_OF = {"M3": M3_CHAPTER_ORDER, "M2": M2_CHAPTER_ORDER}

errors: list[str] = []


def fail(msg: str):
    errors.append(msg)
    print("✗", msg)


def clean_text(t: str, where: str):
    if LAT.search(t):
        fail(f"لاتيني في {where}: {LAT.findall(t)[:5]}")
    if CJK.search(t):
        fail(f"CJK في {where}")
    if DIG.search(t):
        fail(f"أرقام لاتينية في {where}: {DIG.findall(t)[:5]}")


def load_batches():
    files = sorted(DIR.glob("batch_*.py"))
    concepts, questions = [], []
    for f in files:
        spec = importlib.util.spec_from_file_location(f.stem, f)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        cs = getattr(mod, "CONCEPTS", [])
        qs = getattr(mod, "QUESTIONS", [])
        print(f"  {f.name}: {len(cs)} مفهومًا، {len(qs)} سؤالًا")
        concepts.extend(cs)
        questions.extend(qs)
    return concepts, questions


def validate(concepts, questions, bank):
    old_cids = {c["id"] for c in bank["concepts"]}
    old_qids = {q["id"] for q in bank["questions"]}
    seen_c, seen_q = set(), set()
    q_per_concept: dict[str, int] = {}
    pos_counter = {}  # مفهوم → عدد mcq لتدوير المواضع
    titles_per_chapter: dict[tuple, set] = {}
    texts_seen = set()

    for c in concepts:
        cid = c["id"]
        if cid in seen_c or cid in old_cids:
            fail(f"تصادم معرف مفهوم: {cid}")
        seen_c.add(cid)
        course = c.get("courseId")
        if course not in COURSE_OF:
            fail(f"مفهوم {cid}: courseId غير معروف {course}")
            continue
        order = COURSE_OF[course]
        where = f"مفهوم {cid}"
        if c.get("chapter") not in order:
            fail(f"{where}: فصل غير معروف «{c.get('chapter')}»")
        clean_text(c["title"], f"{where} العنوان")
        if len(c["explanation"]) < 250:
            fail(f"{where}: شرح قصير {len(c['explanation'])}")
        clean_text(c["explanation"], f"{where} الشرح")
        exs = c.get("examples", [])
        if len(exs) != 5:
            fail(f"{where}: شواهد {len(exs)} ≠ 5")
        for i, ex in enumerate(exs):
            if len(ex) < 60:
                fail(f"{where}: شاهد {i+1} قصير {len(ex)}")
            clean_text(ex, f"{where} شاهد {i+1}")
            if ex in texts_seen:
                fail(f"{where}: شاهد مكرر نصًّا مع مفهوم آخر")
            texts_seen.add(ex)
        if len(c["title"]) > 60:
            fail(f"{where}: عنوان طويل {len(c['title'])}")
        key = (course, c.get("chapter"))
        titles = titles_per_chapter.setdefault(key, set())
        if c["title"] in titles:
            fail(f"{where}: عنوان مكرر داخل فصله «{c['title']}»")
        titles.add(c["title"])
        if not c.get("example") or len(c["example"]) < 30:
            fail(f"{where}: الخلاصة القصيرة مفقودة أو ضيقة")
        clean_text(c.get("example", ""), f"{where} الخلاصة")

    for q in questions:
        qid = q["id"]
        if qid in seen_q or qid in old_qids:
            fail(f"تصادم معرف سؤال: {qid}")
        seen_q.add(qid)
        where = f"سؤال {qid}"
        cid = q["conceptId"]
        if cid not in seen_c:
            fail(f"{where}: مفهوم غير موجود {cid}")
        q_per_concept[cid] = q_per_concept.get(cid, 0) + 1
        clean_text(q["question"], f"{where} النص")
        if q["question"] in texts_seen:
            fail(f"{where}: نص سؤال مكرر")
        texts_seen.add(q["question"])
        clean_text(q.get("reason", ""), f"{where} التعليل")
        if len(q.get("reason", "")) < 150:
            fail(f"{where}: تعليل قصير {len(q.get('reason',''))}")
        opts = q["options"]
        correct_n = sum(1 for o in opts if o["isCorrect"])
        if correct_n != 1:
            fail(f"{where}: خيارات صحيحة {correct_n}")
        if q["type"] == "mcq":
            if len(opts) != 4:
                fail(f"{where}: خيارات {len(opts)} ≠ 4")
            for o in opts:
                if len(o["text"]) < 12:
                    fail(f"{where}: خيار قصير «{o['text'][:20]}»")
                clean_text(o["text"], f"{where} خيار")
            n = pos_counter.get(cid, 0)
            pos_counter[cid] = n + 1
            want = n % 4  # تدوير أ ب ج د داخل المفهوم — يُفرض آليًّا في normalize
            got = next(i for i, o in enumerate(opts) if o["isCorrect"])
            if got != want:
                q["_want_pos"] = want
            cl = len(next(o["text"] for o in opts if o["isCorrect"]))
            alts = [len(o["text"]) for o in opts if not o["isCorrect"]]
            ratio = cl / (sum(alts) / len(alts))
            if ratio > 1.4:
                fail(f"{where}: انحياز طولي {ratio:.2f}")
        elif q["type"] == "tf":
            if len(opts) != 2:
                fail(f"{where}: خيارات {len(opts)} ≠ 2")
            if q.get("correct") not in ("صح", "خطأ"):
                fail(f"{where}: قيمة صح/خطأ غير سليمة «{q.get('correct')}»")
            corr = next((o for o in opts if o["isCorrect"]), None)
            if corr is None or corr["text"] != q.get("correct"):
                fail(f"{where}: عدم تطابق correct مع الخيار الصحيح")
        else:
            fail(f"{where}: نوع غير معروف {q['type']}")
        if q["difficulty"] not in ("سهل", "متوسط", "صعب"):
            fail(f"{where}: صعوبة غير معروفة «{q['difficulty']}»")

    # كل مفهوم بأربع أسئلة بالضبط (mcq ×2 + tf ×2)
    for c in concepts:
        n = q_per_concept.get(c["id"], 0)
        if n < 4:
            fail(f"مفهوم {c['id']}: أسئلة {n} < 4")


def normalize(concepts, questions):
    """فرض تدوير مواضع الصواب آليًّا على الأسئلة الموسومة قبل الدمج."""
    moved = 0
    for q in questions:
        want = q.pop("_want_pos", None)
        if want is None:
            continue
        opts = q["options"]
        ci = next(i for i, o in enumerate(opts) if o["isCorrect"])
        if ci != want:
            o = opts.pop(ci)
            opts.insert(want, o)
            moved += 1
    print(f"  normalize: أُعيد ترتيب مواضع الصواب في {moved} سؤالًا")


def reorder(concepts):
    """ترتيب مفاهيم M3 وM2 حسب ترتيب الفصول النهائي مع الحفاظ على الترتيب الداخلي، وبقية المحاور بترتيبها الأصلي."""
    rank_m3 = {ch: i for i, ch in enumerate(M3_CHAPTER_ORDER)}
    rank_m2 = {ch: i for i, ch in enumerate(M2_CHAPTER_ORDER)}
    m3 = [c for c in concepts if c["courseId"] == "M3"]
    m2 = [c for c in concepts if c["courseId"] == "M2"]
    others = [c for c in concepts if c["courseId"] not in ("M3", "M2")]
    m3.sort(key=lambda c: rank_m3.get(c["chapter"], 99))
    m2.sort(key=lambda c: rank_m2.get(c["chapter"], 99))
    return others + m2 + m3


def main():
    bank = json.loads(BANK.read_text(encoding="utf-8"))
    print(f"البنك قبل التوسعة: {len(bank['concepts'])} مفهومًا، {len(bank['questions'])} سؤالًا")
    concepts, questions = load_batches()
    print(f"الدفعات: {len(concepts)} مفهومًا، {len(questions)} سؤالًا")

    validate(concepts, questions, bank)
    if errors:
        print(f"\nفشل التحقق: {len(errors)} خطأً — لن يُكتب أي ملف")
        sys.exit(1)

    normalize(concepts, questions)

    all_concepts = reorder(bank["concepts"] + concepts)
    all_questions = bank["questions"] + questions

    bank["concepts"] = all_concepts
    bank["questions"] = all_questions
    BANK.write_text(
        json.dumps(bank, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"البنك بعد التوسعة: {len(all_concepts)} مفهومًا، {len(all_questions)} سؤالًا")

    from collections import Counter
    chs = Counter(c["chapter"] for c in all_concepts if c["courseId"] == "M3")
    print("فصول M3 النهائية:")
    for ch in M3_CHAPTER_ORDER:
        print(f"  {chs.get(ch, 0):>3}  {ch}")
    chs2 = Counter(c["chapter"] for c in all_concepts if c["courseId"] == "M2")
    print("فصول M2 النهائية:")
    for ch in M2_CHAPTER_ORDER:
        print(f"  {chs2.get(ch, 0):>3}  {ch}")


if __name__ == "__main__":
    main()
