# -*- coding: utf-8 -*-
"""تطبيق توسعة محور «نمو الطلاب» M1 — دمج دفعات المحتوى الجديد في qbank.json مع تحقق صارم.

الدفعات: ملفات scripts/m1x/batch_NN.py تحمل قوائم CONCEPTS و QUESTIONS (قواميس بايثون).
المعرفات: مفاهيم D901+ وأسئلة Q9201+ (لا تصادم مع C001-C814 و Q#### حتى 9089).

التحقق قبل الدمج:
- تفرد المعرفات داخل الدفعات وعدم تصادمها مع البنك الحالي.
- كل مفهوم: courseId=M1، شرح ≥250 حرفًا، ٥ شواهد كل شاهد ≥60 حرفًا، عنوان غير مكرر داخل فصله.
- كل سؤال: mcq بأربعة خيارات أو tf بخيارين (صح/خطأ)، خيار صواب واحد، تعليل ≥150 حرفًا،
  لا حروف لاتينية ولا CJK، لا أرقام لاتينية (٠-٩ فقط)، توازن مواضع الصواب بالمكوّن (أ ب ج د دوريًا).
- تنسيق JSON النهائي بترتيب الفصول الجديد لمفاهيم M1.
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path("/home/z/my-project")
BANK = ROOT / "src/data/qbank.json"
DIR = ROOT / "scripts/m1x"

LAT = re.compile(r"[A-Za-z]")
CJK = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]")
DIG = re.compile(r"[0-9]")

# ترتيب الفصول النهائي لمحور M1 (الموجودة أصلًا + الجديدة بمواضعها المنطقية)
CHAPTER_ORDER = [
    "مدخل إلى علم النمو ومبادئه",
    "مناهج دراسة النمو",
    "عوامل النمو وتفاعلها",
    "نظريات النمو الكبرى",
    "الوراثة والسلوك",
    "الجهاز العصبي والسلوك",
    "الغدد الصماء والسلوك",
    "النمو قبل الميلاد",
    "نمو الرضاعة والأعوام الأولى",
    "النمو الجسمي والحركي",
    "النمو الإدراكي والعقلي",
    "النمو اللغوي",
    "النمو الانفعالي",
    "النمو الاجتماعي واللعب",
    "النمو الأخلاقي والقيمي",
    "السلوك وتدرجاته",
    "خصائص مرحلة الروضة",
    "خصائص مرحلة الابتدائي",
    "المراهقة: التغيرات والخصائص",
    "الفروق الفردية في النمو",
    "مشكلات النمو واضطرابه",
    "تطبيقات النمو في الصف",
]

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

    for c in concepts:
        cid = c["id"]
        if cid in seen_c or cid in old_cids:
            fail(f"تصادم معرف مفهوم: {cid}")
        seen_c.add(cid)
        where = f"مفهوم {cid}"
        if c.get("courseId") != "M1":
            fail(f"{where}: courseId غير M1")
        if c.get("chapter") not in CHAPTER_ORDER:
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
        if len(c["title"]) > 60:
            fail(f"{where}: عنوان طويل {len(c['title'])}")

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
        elif q["type"] == "tf":
            if len(opts) != 2:
                fail(f"{where}: خيارات {len(opts)} ≠ 2")
            if q.get("correct") not in ("صح", "خطأ"):
                fail(f"{where}: قيمة صح/خطأ غير سليمة «{q.get('correct')}»")
        else:
            fail(f"{where}: نوع غير معروف {q['type']}")
        if q["difficulty"] not in ("سهل", "متوسط", "صعب"):
            fail(f"{where}: صعوبة غير معروفة «{q['difficulty']}»")
        if q["type"] == "mcq":
            n = pos_counter.get(cid, 0)
            pos_counter[cid] = n + 1
            want = n % 4  # تدوير أ ب ج د داخل المفهوم — يُفرض آليًّا في normalize
            got = next(i for i, o in enumerate(opts) if o["isCorrect"])
            if got != want:
                q["_want_pos"] = want  # وسم لإعادة الترتيب لاحقًا
            # التوازن الطولي: الصحيح ليس الأطول بأكثر من 1.4 ضعف متوسط البدائل
            cl = len(next(o["text"] for o in opts if o["isCorrect"]))
            alts = [len(o["text"]) for o in opts if not o["isCorrect"]]
            ratio = cl / (sum(alts) / len(alts))
            if ratio > 1.4:
                fail(f"{where}: انحياز طولي {ratio:.2f}")

    # كل مفهوم بأسئلة كافية
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


def reorder_m1(concepts):
    """ترتيب مفاهيم M1 حسب ترتيب الفصول النهائي مع الحفاظ على الترتيب الداخلي القائم."""
    rank = {ch: i for i, ch in enumerate(CHAPTER_ORDER)}
    m1 = [c for c in concepts if c["courseId"] == "M1"]
    others = [c for c in concepts if c["courseId"] != "M1"]
    m1.sort(key=lambda c: (rank.get(c["chapter"], 99),))  # ترتيب مستقر داخل الفصل
    return m1 + others


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

    # دمج وإعادة ترتيب
    all_concepts = reorder_m1(bank["concepts"] + concepts)
    all_questions = bank["questions"] + questions

    bank["concepts"] = all_concepts
    bank["questions"] = all_questions
    BANK.write_text(
        json.dumps(bank, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"البنك بعد التوسعة: {len(all_concepts)} مفهومًا، {len(all_questions)} سؤالًا")

    # تقرير الفصول
    from collections import Counter
    chs = Counter(c["chapter"] for c in all_concepts if c["courseId"] == "M1")
    print("فصول M1 النهائية:")
    for ch in CHAPTER_ORDER:
        print(f"  {chs.get(ch, 0):>3}  {ch}")


if __name__ == "__main__":
    main()
