#!/usr/bin/env python3
"""مسح ناعم: الشرح يصف الخيار الصحيح بأنه خاطئ، أو يصف خياراً آخر بأنه صحيح"""
import json, re, unicodedata

QB = "/home/z/my-project/public/data/qbank.json"
ORD = {"الأول":1,"الثاني":2,"الثالث":3,"الرابع":4,"الخامس":5}

def strip_t(s):
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")

def main():
    data = json.load(open(QB, encoding="utf-8"))
    calls_correct_wrong = []
    calls_other_correct = []

    for q in data["questions"]:
        if q.get("type") != "mcq":
            continue
        opts = q.get("options", [])
        ci = next((i for i, o in enumerate(opts) if o.get("isCorrect")), None)
        if ci is None:
            continue
        cpos = ci + 1
        reason = strip_t(q.get("reason", "") or "")
        # قسّم على الفواصل والنقاط لجمل قصيرة
        for clause in re.split(r"[.؛،]", reason):
            clause = clause.strip()
            m = re.search(r"الخيار\s+(الأول|الثاني|الثالث|الرابع|الخامس)", clause)
            if not m:
                continue
            claimed = ORD[m.group(1)]
            neg = any(w in clause for w in ["خاطئ","خطأ","لا يصح","لا تصح","مستبعد","غير مرتبط","ينفي","ينفي جوهر","مخالف","يخالف","ينسج على منوال","لا تمس","قلب للسببية","فهم لفظي سطح"])
            pos = any(w in clause for w in ["صحيح","الإجابة الصحيحة","عين","يطابق","يوافق","جوهر النظرية","يجمع هذه"])
            if neg and claimed == cpos:
                calls_correct_wrong.append((q["id"], cpos, clause[:110]))
            elif pos and claimed != cpos and "وليس خطأ" not in clause and "صحيح وليس خطأ" not in clause:
                calls_other_correct.append((q["id"], cpos, claimed, clause[:110]))

    print(f"=== الشرح يصف الإجابة الصحيحة نفسها بأنها خاطئة: {len(calls_correct_wrong)} ===")
    for qid, cpos, c in calls_correct_wrong:
        print(f"  {qid} (الصحيح=خيار{cpos}): {c}")
    print(f"\n=== الشرح ينسب الصواب لخيار غير الصحيح (مرشح، يحتاج بصراً): {len(calls_other_correct)} ===")
    for qid, cpos, claimed, c in calls_other_correct:
        print(f"  {qid} (الصحيح=خيار{cpos}، الشرح يقول خيار{claimed}): {c}")

if __name__ == "__main__":
    main()
