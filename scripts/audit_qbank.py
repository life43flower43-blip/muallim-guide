# -*- coding: utf-8 -*-
"""تدقيق بنك الأسئلة: كشف الأسئلة غير التربوية وسيئة الصياغة"""
import json
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open("public/data/qbank.json", encoding="utf-8") as f:
    d = json.load(f)

courses = d["courses"]
concepts = d["concepts"]
questions = d["questions"]

print(f"الدورات: {len(courses)} | المفاهيم: {len(concepts)} | الأسئلة: {len(questions)}")
print()

# بنية سؤال واحد
q0 = questions[0]
print("مفاتيح السؤال:", list(q0.keys()))
print()

# أسماء الدورات
if isinstance(courses, dict):
    for cid, c in courses.items():
        name = c.get("name") or c.get("title") or "?" if isinstance(c, dict) else str(c)
        print(f"  [{cid}] {name}")
else:
    for c in courses:
        name = c.get("name") or c.get("title") or "?"
        print(f"  [{c.get('id','?')}] {name}")
print()

# ---------- أنماط الأسئلة الحسابية / غير التربوية ----------
MATH_PATTERNS = [
    (r"\d+\s*[\+\-\*×÷\/]\s*\d+", "عملية حسابية: أ + ب"),
    (r"كم\s*(يساوي|ناتج|يكون)", "كم يساوي/ناتج"),
    (r"(احسب|إحسب|أحسب|اكتب ناتج|ما ناتج|ناتج الضرب|ناتج الجمع|ناتج القسمة|ناتج الطرح)", "أمر حساب: احسب/ناتج"),
    (r"(\d+)\s*(ناقص|زائد|مضروب|مقسوم)\s*(\d+)", "ناقص/زائد/مضروب/مقسوم"),
    (r"٪|%", "علامة نسبة مئوية"),
    (r"\b\d+\s*درهم\b|\b\d+\s*ريال\b|\b\d+\s*جنيه\b", "عملة مالية"),
    (r"(يكسب|يربح|يخسر|شري|باع|اشترى|ثمن|سعر|التكلفة|الربح|الخسارة|السعر)", "سياق تجاري/ربح"),
    (r"(سيارة|قطار|طائرة|دراجة)\s*(تتحرك|سرعة|يسير|تسير)", "سياق سرعة/مواصلات"),
    (r"(مثلث|مستطيل|مربع|دائرة|زاوية|محيط|مساحة|قطر|نصف قطر)", "هندسة"),
    (r"(كسر|عشري|بسط|مقام|جذر|أس|قوة)", "كسور وأسس"),
    (r"(جمع|طرح|قسمة|ضرب)\s*(الأعداد|الكسور|الأعداد الصحيحة)", "عمليات على أعداد"),
    (r"(معادلة|المعادلة|متغير|دالة|رسم بياني|إحداثيات|محور)", "جبر ودوال"),
    (r"(احتمال|إحصاء|متوسط|وسيط|منوال|مدى|تكرار)", "إحصاء واحتمال"),
    (r"(طول|عرض)\s*(المستطيل|المربع|المثلث|القطعة)", "طول وعرض أشكال"),
    (r"(يبلغ|تبلغ)\s*(طوله|طولها|مساحته|مساحتها|سرعته|سرعتها)", "قياسات فيزيائية"),
    (r"(خلية|نواة|DNA|RNA|بروتين|إنزيم|بكتيريا|فيروس|نبات|حيوان|عضو|جهاز الدوران|جهاز الهضم|التمثيل الضوئي|البلاستيدات)", "أحياء"),
    (r"(ذرة|جزيء|تفاعل|كيميائي|حمض|قاعدة|عنصر|مركب|اتحاد|فلز|فلزات|معادن)", "كيمياء"),
    (r"(قوة|تسارع|سرعة|طاقة|حرارة|كهرباء|مغناطيس|ضوء|صوت|جاذبية|كتلة|زخم)", "فيزياء"),
    (r"(كوكب|شمس|قمر|مجموعة شمسية|نجوم|مجرة|دوران|أطلال|فلك)", "فلك"),
    (r"(تاريخ|معركة|فاتح|خلافة|خليفة|حرب|ثورة|عهد|حضارة|آثار)", "تاريخ"),
    (r"(خريطة|قارة|بحر|نهر|جبل|مناخ|طقس|سكان|مدينة\s|بلد\s|دولة\s)", "جغرافيا"),
]

# قاعدة عامة: أي سؤال سطره يحوي رقمين وعملية حسابية
word_counts = {}
flagged = []
for q in questions:
    text = (q.get("q") or q.get("text") or q.get("question") or "").strip()
    body = text
    opts = q.get("options") or q.get("choices") or []
    body_for_math = text
    hits = set()
    for pat, label in MATH_PATTERNS:
        if re.search(pat, body_for_math):
            hits.add(label)
    if hits:
        flagged.append((q, sorted(hits), text[:90]))

print(f"===== أسئلة مُعلَّمة بأنماط غير تربوية: {len(flagged)} =====")
from collections import Counter
cnt = Counter()
for q, hits, _ in flagged:
    for h in hits:
        cnt[h] += 1
for label, n in cnt.most_common():
    print(f"  {label}: {n}")
print()

print("===== عينات (أول 25) =====")
for q, hits, t in flagged[:25]:
    cid = q.get("cid") or q.get("conceptId") or "?"
    print(f"[{','.join(hits)}] (مفهوم {cid}) {t}")
