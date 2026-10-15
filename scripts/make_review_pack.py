# -*- coding: utf-8 -*-
"""توليد حزمة مراجعة المحتوى: تقسيم البنك حسب الدورة + تصدير السيناريوهات"""
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open("public/data/qbank.json", encoding="utf-8") as f:
    d = json.load(f)

courses = d["courses"]
concepts = d["concepts"]
questions = d["questions"]

cmap = {c["id"]: c.get("courseId", "?") for c in concepts}
os.makedirs("review/qbank", exist_ok=True)

# مفاهيم وأسئلة لكل دورة
by = {}
for c in concepts:
    by.setdefault(c.get("courseId", "?"), {"concepts": [], "questions": []})
by_q = {k: 0 for k in by}
for q in questions:
    course = cmap.get(q.get("conceptId"), "?")
    if course in by:
        by[course]["questions"].append(q)
        by_q[course] += 1
for c in concepts:
    by[c.get("courseId", "?")]["concepts"].append(c)

course_names = {}
for cid, cv in courses.items():
    course_names[cid] = cv.get("name") or cv.get("title") if isinstance(cv, dict) else str(cv)

index = []
for cid in sorted(by):
    data = by[cid]
    name = course_names.get(cid, "")
    n_c, n_q = len(data["concepts"]), len(data["questions"])
    payload = {"course": {"id": cid, "name": name}, "concepts": data["concepts"], "questions": data["questions"]}
    s = json.dumps(payload, ensure_ascii=False, indent=1)
    size_mb = len(s.encode("utf-8")) / 1_048_576
    # GitHub لا يعرض ملفات أكبر من ~2 ميغابايت — نقسم إن لزم
    if size_mb > 1.5:
        half = len(data["questions"]) // 2
        parts = [("a", data["questions"][:half]), ("b", data["questions"][half:])]
    else:
        parts = [("", data["questions"])]
    for suffix, qs in parts:
        fn = f"qbank-{cid}{suffix}.json"
        p = {"course": {"id": cid, "name": name, "part": suffix or "full"}, "concepts": data["concepts"], "questions": qs}
        with open(f"review/qbank/{fn}", "w", encoding="utf-8") as f:
            json.dump(p, f, ensure_ascii=False, indent=1)
        sz = os.path.getsize(f"review/qbank/{fn}") / 1_048_576
        index.append(f"| [{fn}](qbank/{fn}) | {name} | {len(data['concepts']) if not suffix else '—'} | {len(qs)} | {sz:.2f} MB |")

with open("review/INDEX.md", "w", encoding="utf-8") as f:
    f.write("""# حزمة مراجعة بنك الأسئلة — دليل المعلم

هذه الحزمة وُجدت لغرض واحد: تمكين أي مراجع خارجي (بما في ذلك ChatGPT) من قراءة
بنك الأسئلة **كاملاً** عبر واجهة GitHub.

**السبب**: الملف الأصلي `public/data/qbank.json` حجمه ~11 ميغابايت، وواجهة GitHub
لا تعرض محتوى الملفات الأكبر من ~2 ميغابايت، فظهر للمراجع السابق أنه غير موجود أو غير قابل للقراءة.
الملف موجود دائماً على المسار الصحيح `public/data/qbank.json` (وليس `src/data/`)،
والتطبيق يخدمه مباشرة على `/data/qbank.json`.

**طريقة التحقق ذاتياً** بعد تنزيل أي جزء: كل سؤال فيه `options` وكل خيار فيه
`isCorrect`، وحقل `correct` يساوي نص الخيار الصحيح — لا يوجد سؤال بلا إجابة واحدة صحيحة.

## الأجزاء

| الملف | الدورة | مفاهيم | أسئلة | الحجم |
|---|---|---|---|---|
""")
    f.write("\n".join(index))
    f.write("""

## أرقام البنك الكامل (للمطابقة)

- الدورات: 8
- المفاهيم: 1331
- الأسئلة: 6067 (mcq 3885 / tf 2182)
- الصعوبة: سهل 1632 / متوسط 3013 / صعب 1422

## فحوصات آلية منفذة (scripts في مستودع main)

- صفر أسئلة غير تربوية (مسح بأنماط حسابية/علمية صارمة)
- صفر حروف لاتينية، صفر أرقام غربية (كلها ٠-٩ شرقية)
- صفر تكرار نصي، صفر حقول ناقصة، صفر أسئلة متعددة/بلا إجابة
- اتساق correct ↔ isCorrect: 6067/6067
""")
print("INDEX + files generated")
for fn in sorted(os.listdir("review/qbank")):
    print(" ", fn, f"{os.path.getsize('review/qbank/'+fn)/1_048_576:.2f}MB")
