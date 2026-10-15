# -*- coding: utf-8 -*-
"""دلتا-إصلاح للحالات الثلاث المتبقية من جولة 4"""
import json, sys

sys.stdout.reconfigure(encoding="utf-8")
QB = "/home/z/my-project/public/data/qbank.json"

DELTA = [
    ("Q1578", "r",
     "مما يوضح مرحلة الإنتاج في التعلم بالملاحظة.",
     "مما يجمع الانتباه إلى النموذج وترجمة الملاحظة إلى سلوك، وهو عين الخيار الأول."),
    ("Q14033", "r", "وهذا عين الخيار الأول؛", "وهذا عين الخيار الثالث؛"),
    ("Q14033", "r", "فالخيار الأول وحده معنى الحشو وعلاجه", "فالخيار الثالث وحده معنى الحشو وعلاجه"),
    ("Q14049", "r", "وهذا عين الخيار الأول؛", "وهذا عين الخيار الرابع؛"),
    ("Q14049", "r", "فالخيار الأول وحده يصف جوهر الحبكة", "فالخيار الرابع وحده يصف جوهر الحبكة"),
]

def main():
    data = json.load(open(QB, encoding="utf-8"))
    qs = {q["id"]: q for q in data["questions"]}
    ok, bad = 0, []
    for qid, field, old, new in DELTA:
        q = qs[qid]
        target = q["reason"] if field == "r" else q["question"]
        if target.count(old) != 1:
            bad.append((qid, old[:40], f"count={target.count(old)}"))
            continue
        if field == "r":
            q["reason"] = target.replace(old, new)
        else:
            q["question"] = target.replace(old, new)
        ok += 1
    json.dump(data, open(QB, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"دلتا: {ok} نجح")
    if bad:
        print("فاشل:", bad); sys.exit(2)

if __name__ == "__main__":
    main()
