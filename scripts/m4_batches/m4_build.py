# -*- coding: utf-8 -*-
"""محرّضات بناء مفاهيم وأسئلة محور «تقويم التعلم وقياسه» بنفس بنية البنك القائم."""
import json

COURSE_ID = "M4"


def C(cid, chapter, title, explanation, examples, example):
    assert isinstance(examples, list) and len(examples) == 5, "أمثلة المفهوم يجب أن تكون خمسة: " + cid
    return {
        "id": cid,
        "courseId": COURSE_ID,
        "chapter": chapter,
        "title": title,
        "explanation": explanation,
        "examples": examples,
        "example": example,
    }


def MCQ(cid, diff, question, correct, wrong, reason):
    assert len(wrong) == 3, "الأسئلة متعددة الخيارات تحتاج ثلاثة بدائل خاطئة: " + cid
    assert diff in ("سهل", "متوسط"), "صعوبة الاختيار المتعدد سهل أو متوسط فقط: " + cid
    # وضع الإجابة الصحيحة في مواضع متغيرة يخفي نمطًا ثابتًا
    pos = sum(ord(ch) for ch in cid + diff + question[:6]) % 4
    opts = [{"text": correct, "isCorrect": True}]
    opts += [{"text": w, "isCorrect": False} for w in wrong]
    i = pos - 1
    opts[0], opts[i] = opts[i], opts[0]
    return {
        "id": None,
        "conceptId": cid,
        "type": "mcq",
        "difficulty": diff,
        "question": question,
        "options": opts,
        "correct": correct,
        "reason": reason,
        "fixedOrder": None,
    }


def TF(cid, diff, statement, isTrue, reason):
    assert diff in ("متوسط", "صعب"), "صعوبة صح-خطأ متوسط أو صعب فقط: " + cid
    if isTrue:
        opts = [{"text": "صح", "isCorrect": True}, {"text": "خطأ", "isCorrect": False}]
        correct = "صح"
    else:
        opts = [{"text": "صح", "isCorrect": False}, {"text": "خطأ", "isCorrect": True}]
        correct = "خطأ"
    return {
        "id": None,
        "conceptId": cid,
        "type": "tf",
        "difficulty": diff,
        "question": statement,
        "options": opts,
        "correct": correct,
        "reason": reason,
        "fixedOrder": None,
    }
