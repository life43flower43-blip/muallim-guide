#!/usr/bin/env python3
# جرد محتوى الاختبارات وأنواعها وتصميمها في البنك (البنية: courses كقاموس، concepts وquestions قوائم)
import json

PATH = "/home/z/my-project/public/data/qbank.json"
d = json.load(open(PATH, encoding="utf-8"))
courses = d["courses"]
concepts = d["concepts"]
questions = d["questions"]

def norm(s):
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    s = s.replace("ة", "ه").replace("ى", "ي")
    return s

KW = ["اختبار", "اختبارات", "تقويم", "تقييم", "قياس", "امتحان", "فحص", "درجات", "تصحيح", "صدق", "ثبات", "مقالي", "موضوعي", "جدول المواصفات"]
SUBTOPICS = {
    "مراحل الاختبارات (تشخيصي/بنائي/ختامي)": ["تشخيصي", "بنائي", "تكويني", "ختامي", "نهائي", "قبلي", "بعدي"],
    "اختبارات مقننة ومرجعية": ["مقنن", "محكي المرجع", "معياري المرجع"],
    "الأسئلة الموضوعية": ["اختيار من متعدد", "الصح والخطأ", "صح وخطا", "المزاوجة", "المزاوجه", "إكمال", "اكمال", "الاجابة القصيرة", "الفراغ", "الترتيب"],
    "الأسئلة المقالية": ["مقالي", "مقالية"],
    "جدول المواصفات": ["جدول المواصفات", "مواصفات الاختبار", "مصفوفة المحتوى", "خريطة الاختبار"],
    "الصدق": ["صدق"],
    "الثبات": ["ثبات"],
    "الذاتية/الموضوعية في التصحيح": ["ذاتية", "موضوعية"],
    "صياغة الفقرات": ["صياغة", "كتابة الفقرات", "إعداد الفقرات", "بناء الفقرات", "صياغة السؤال", "صياغة الاختبار", "بناء الاختبار", "إعداد الاختبار", "تصميم الاختبار", "تصميم الاختبارات"],
    "التحليل الإحصائي للفقرات": ["تحليل الفقرات", "معامل السهولة", "معامل الصعوبة", "معامل التمييز", "التمييز", "السهولة", "الصعوبة"],
    "أدوات التقويم الأخرى (أداء/ملاحظة/ملف إنجاز)": ["تقييم الاداء", "تقويم الاداء", "بطاقة الملاحظة", "سلم التقدير", "الاسلالم", "قائمة الرجوع", "ملف الانجاز", "البورتفوليو", "ادوات التقويم", "حكم", "مقاييس"],
    "العينات والخطأ في القياس": ["الخطأ المعياري", "العينة", "خطأ القياس"],
}

found = {}
sub_hits = {k: [] for k in SUBTOPICS}
for con in concepts:
    cid = con["courseId"]; ch = con["chapter"]; t = con["title"]; nt = norm(t)
    course_name = courses.get(cid, cid)
    if any(norm(k) in nt or norm(k) in norm(ch) for k in KW):
        found.setdefault((course_name, ch), []).append(t)
    for sub, keys in SUBTOPICS.items():
        if any(norm(k) in nt for k in keys):
            sub_hits[sub].append(f"{t}")

print("=== المساقات ===")
for cid, name in courses.items():
    n = sum(1 for c in concepts if c["courseId"] == cid)
    chapters = sorted(set(c["chapter"] for c in concepts if c["courseId"] == cid))
    print(f"  {cid}: {name} — {len(chapters)} فصلاً، {n} مفهوماً")

print(f"\n=== مفاهيم عنوانها أو فصلها يخص القياس والتقويم والاختبارات: {sum(len(v) for v in found.values())} ===")
for (cname, chtitle), titles in sorted(found.items()):
    print(f"\n[{cname} / {chtitle}] ({len(titles)})")
    for t in titles:
        print(f"   - {t}")

print(f"\n=== تفصيل المحاور الفرعية (بالعناوين) ===")
for sub, hits in sub_hits.items():
    print(f"\n{sub}: {len(hits)}")
    for h in hits[:15]:
        print(f"   - {h}")
    if len(hits) > 15:
        print(f"   ... و{len(hits)-15} أخرى")

# مفاهيم M4 كلها (الفصول)
print("\n=== فصول M4 بالكامل ===")
m4ch = {}
for c in concepts:
    if c["courseId"] == "M4":
        m4ch.setdefault(c["chapter"], []).append(c["title"])
for ch in sorted(m4ch):
    print(f"\n[{ch}] ({len(m4ch[ch])} مفهوماً)")
    for t in m4ch[ch]:
        print(f"   - {t}")

qcount = sum(1 for q in questions if any(norm(k) in norm(q.get("question", "")) for k in KW))
print(f"\n=== أسئلة نصها يذكر القياس/التقويم/الاختبار: {qcount} من {len(questions)} ===")
