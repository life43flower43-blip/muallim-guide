# -*- coding: utf-8 -*-
"""دلتا2: Q14033 (الرابع لا الثالث) + Q1274 (إزاحة +1 كاملة)"""
import json, sys

sys.stdout.reconfigure(encoding="utf-8")
QB = "/home/z/my-project/public/data/qbank.json"

DELTA2 = [
    ("Q14033", "r", "وهذا عين الخيار الثالث؛", "وهذا عين الخيار الرابع؛"),
    ("Q14033", "r", "فالخيار الثالث وحده معنى الحشو وعلاجه", "فالخيار الرابع وحده معنى الحشو وعلاجه"),
    ("Q1274", "r", "الخيار الأول خاطئ لأن العاطفة هنا ليست دافعة أولية بل ناتجة عن إدراك جمالي. الخيار الثاني خاطئ لأنه ليس انفعالًا اجتماعيًا بل شخصيًا مرتبطًا بالفن. الخيار الثالث خاطئ لأنه ليس عاطفة أخلاقية بل جمالية.",
     "الخيار الثاني خاطئ لأن العاطفة هنا ليست دافعة أولية بل ناتجة عن إدراك جمالي. الخيار الثالث خاطئ لأنه ليس انفعالًا اجتماعيًا بل شخصيًا مرتبطًا بالفن. الخيار الرابع خاطئ لأنه ليس عاطفة أخلاقية بل جمالية."),
]

def main():
    data = json.load(open(QB, encoding="utf-8"))
    qs = {q["id"]: q for q in data["questions"]}
    ok, bad = 0, []
    for qid, field, old, new in DELTA2:
        q = qs[qid]
        if q["reason"].count(old) != 1:
            bad.append((qid, old[:40], f"count={q['reason'].count(old)}"))
            continue
        q["reason"] = q["reason"].replace(old, new)
        ok += 1
    json.dump(data, open(QB, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"دلتا2: {ok} نجح")
    if bad:
        print("فاشل:", bad); sys.exit(2)

if __name__ == "__main__":
    main()
