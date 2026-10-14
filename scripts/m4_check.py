# -*- coding: utf-8 -*-
"""فحص ذاتي صارم لدفعة واحدة من دفعات توسعة محور «تقويم التعلم وقياسه».
الاستخدام: python3 scripts/m4_check.py m4_batches/batch01.py
يطبع SELF-CHECK OK عند السلامة الكاملة، أو يرمي استثناء بتفاصيل الأخطاء."""
import importlib.util
import re
import sys

LATIN = re.compile(r"[A-Za-z]")
CJK = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf]")
LATIN_DIGIT = re.compile(r"[0-9]")
FORBIDDEN_WORDS = ["تلميذ", "%"]

ORDER = [("mcq", "سهل"), ("mcq", "متوسط"), ("tf", "متوسط"), ("tf", "صعب")]


def sentences(text):
    parts = re.split(r"[.؟!]", text)
    return [p for p in parts if p.strip()]


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


def main(path):
    spec = importlib.util.spec_from_file_location("batch", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["batch"] = mod
    try:
        spec.loader.exec_module(mod)
    except Exception as e:
        raise SystemExit(f"فشل تحميل الدفعة: {e}")

    errors = []
    concepts = mod.CONCEPTS
    questions = mod.QUESTIONS
    n = len(concepts)
    if len(questions) != 4 * n:
        errors.append(f"عدد الأسئلة {len(questions)} لا يطابق ٤× المفاهيم {n}")

    # فحص المفاهيم
    titles = []
    for idx, c in enumerate(concepts):
        cid = c["id"]
        titles.append(c["title"])
        if c.get("courseId") != "M4":
            errors.append(f"مفهوم {idx}: courseId ليس M4")
        if not c.get("chapter") or not c.get("title"):
            errors.append(f"مفهوم {idx}: فصل أو عنوان فارغ")
        expl = c.get("explanation", "")
        if len(expl) < 350:
            errors.append(f"مفهوم {idx} «{c['title']}»: الشرح قصير ({len(expl)} حرفًا < ٣٥٠)")
        ns = len(sentences(expl))
        if ns < 4 or ns > 6:
            errors.append(f"مفهوم {idx} «{c['title']}»: جمل الشرح {ns} وليست من ٤ إلى ٦")
        exs = c.get("examples", [])
        if len(exs) != 5 or any(len(e) < 60 for e in exs):
            errors.append(f"مفهوم {idx} «{c['title']}»: الشواهد ليست خمسة كل منها ≥٦٠ حرفًا")
        ex = c.get("example", "")
        if not (30 <= len(ex) <= 130):
            errors.append(f"مفهوم {idx} «{c['title']}»: الخلاصة طولها {len(ex)} وليست ٣٠-١٣٠")
        for p, t in texts_of(c, f"مفهوم{idx}"):
            if LATIN.search(t):
                errors.append(f"{p}: حروف لاتينية: {t[:50]}")
            if CJK.search(t):
                errors.append(f"{p}: حروف صينية: {t[:50]}")
            if LATIN_DIGIT.search(t):
                errors.append(f"{p}: أرقام لاتينية: {t[:50]}")
            for w in FORBIDDEN_WORDS:
                if w in t:
                    errors.append(f"{p}: كلمة محظورة «{w}»: {t[:50]}")

    if len(set(titles)) != len(titles):
        errors.append("عناوين مفاهيم مكررة داخل الدفعة")

    # فحص الأسئلة: كل أربعة أسئلة متتالية لمفهوم واحد بالترتيب المعتمد
    stems = set()
    for ci in range(n):
        qs = questions[4 * ci: 4 * ci + 4]
        for qi, (q, (typ, diff)) in enumerate(zip(qs, ORDER)):
            tag = f"س{ci + 1}-{qi + 1}"
            if q["type"] != typ:
                errors.append(f"{tag}: النوع {q['type']} والمتوقع {typ}")
            if q["difficulty"] != diff:
                errors.append(f"{tag}: الصعوبة {q['difficulty']} والمتوقع {diff}")
            if q["conceptId"] != concepts[ci]["id"]:
                errors.append(f"{tag}: conceptId لا يطابق مفهومه")
            opts = q["options"]
            flags = [o["isCorrect"] for o in opts]
            if sum(flags) != 1:
                errors.append(f"{tag}: عدد الصحيح {sum(flags)}")
                continue
            correct_text = next(o["text"] for o in opts if o["isCorrect"])
            if q["correct"] != correct_text:
                errors.append(f"{tag}: حقل correct لا يطابق نص الخيار الصحيح")
            if q["type"] == "mcq":
                if len(opts) != 4:
                    errors.append(f"{tag}: خيارات {len(opts)}")
                if len(set(o["text"] for o in opts)) != 4:
                    errors.append(f"{tag}: خيارات مكررة")
            else:
                if len(opts) != 2:
                    errors.append(f"{tag}: خيارات صح-خطأ غير سليمة")
                if q["correct"] not in ("صح", "خطأ"):
                    errors.append(f"{tag}: قيمة صح-خطأ غير سليمة")
            # النمط المعتمد: أول صح-خطأ عبارته صحيحة والثاني خاطئة
            if q["type"] == "tf" and qi in (2, 3):
                expected = "صح" if qi == 2 else "خطأ"
                if q["correct"] != expected:
                    errors.append(f"{tag}: نمط صح-خطأ مخالف (المتوقع {expected})")
            if len(q.get("reason", "")) < 120:
                errors.append(f"{tag}: التعليل قصير ({len(q.get('reason', ''))} حرفًا < ١٢٠)")
            if len(q.get("question", "")) < 15:
                errors.append(f"{tag}: نص السؤال قصير جدًّا")
            if q["question"] in stems:
                errors.append(f"{tag}: نص سؤال مكرر داخل الدفعة")
            stems.add(q["question"])
            for p, t in texts_of(q, tag):
                if LATIN.search(t):
                    errors.append(f"{p}: حروف لاتينية: {t[:50]}")
                if CJK.search(t):
                    errors.append(f"{p}: حروف صينية: {t[:50]}")
                if LATIN_DIGIT.search(t):
                    errors.append(f"{p}: أرقام لاتينية: {t[:50]}")
                for w in FORBIDDEN_WORDS:
                    if w in t:
                        errors.append(f"{p}: كلمة محظورة «{w}»: {t[:50]}")

    # موازنة صح/خطأ
    tfs = [q for q in questions if q["type"] == "tf"]
    trues = sum(1 for q in tfs if q["correct"] == "صح")
    if trues != len(tfs) - trues:
        errors.append(f"توازن صح/خطأ مخالف: {trues} صح مقابل {len(tfs) - trues} خطأ")

    # توزيع الصعوبة
    from collections import Counter
    dist = Counter(q["difficulty"] for q in questions)
    print("توزيع الصعوبة:", dict(dist))

    if errors:
        print(f"\n!!! أخطاء الدفعة ({len(errors)}) !!!")
        for e in errors[:40]:
            print(" -", e)
        raise SystemExit(1)
    print("SELF-CHECK OK")


if __name__ == "__main__":
    main(sys.argv[1])
