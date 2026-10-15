#!/usr/bin/env python3
"""طباعة كل مرشحات العائلة C كاملة (سؤال+خيارات+شرح) للمراجعة اليدوية"""
import json, sys

QB = "/home/z/my-project/public/data/qbank.json"
IDS = sys.argv[1].split(",") if len(sys.argv) > 1 else []

data = json.load(open(QB, encoding="utf-8"))
for q in data["questions"]:
    if q["id"] in IDS:
        ci = next((i for i, o in enumerate(q.get("options", [])) if o.get("isCorrect")), None)
        print("=" * 60)
        print(f"{q['id']} (الصحيح=مؤشر{ci})")
        print("Q:", q.get("question", "")[:180])
        for i, o in enumerate(q.get("options", [])):
            mark = " ✔✔" if o.get("isCorrect") else ""
            print(f"  [{i}] {o.get('text','')[:100]}{mark}")
        print("R:", (q.get("reason", "") or "")[:450])
