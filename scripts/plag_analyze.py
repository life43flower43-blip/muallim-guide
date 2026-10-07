# -*- coding: utf-8 -*-
# تحليل نتائج فحص النسخ: هل ظهرت الجملة الحرفية في أي مصدر ويب؟
import json, re, glob, os

def norm(s):
    s = (s or "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    s = s.replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    s = re.sub(r"[\u064B-\u0652\u0640]", "", s)
    s = re.sub(r"[^\u0621-\u064A\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

PHRASES = {
    "q1": "وتعتمد دراسة الوراثه عند الانسان على مناهج غير التجريب المباشر لاسباب اخلاقيه",
    "q2": "لا يتوقع من طالب جائع او خائف او وحيد ان يركز على تحصيله",
    "q3": "السلوك الانساني يكتسب ويثبت نتيجه ارتباطه ببواعث بيئيه محدده",
    "q4": "حسب معامل الذكاء تقليديا بقسمه العمر العقلي على العمر الزمني",
    "q5": "مراقبه سلوك طفلين توامين متماثلين احدهما في بيئه ريفيه والاخر في مدينه",
    "q6": "لاحظت معلمه الصف الاول ان احد التلاميذ ينهض من مقعده باستمرار اثناء الشرح",
}

for f in sorted(glob.glob("/home/z/my-project/scripts/plagcheck/q*.json")):
    key = os.path.basename(f).split(".")[0]
    phrase = norm(PHRASES.get(key, ""))
    try:
        data = json.load(open(f, encoding="utf-8"))
    except Exception as e:
        print(key, "خطأ قراءة:", e)
        continue
    results = data if isinstance(data, list) else data.get("results", [])
    print("\n=== %s : %d نتيجة ===" % (key, len(results)))
    exact_hits = 0
    for r in results:
        blob = norm(r.get("name", "") + " " + r.get("snippet", ""))
        hit = phrase in blob
        if hit:
            exact_hits += 1
            print("  !! تطابق حرفي:", r.get("host_name"), "-", r.get("url", "")[:80])
    if not results:
        print("  (لا نتائج أصلاً — الجملة غير موجودة على الويب)")
    elif exact_hits == 0:
        # أقرب نتيجة: أعرض أول نتيجتين لعلم الموقف
        for r in results[:2]:
            print("  بلا تطابق حرفي | %s | %s" % (r.get("host_name"), (r.get("snippet") or "")[:90]))
        print("  => النتيجة: الجملة الحرفية غير موجودة في أي مصدر")
