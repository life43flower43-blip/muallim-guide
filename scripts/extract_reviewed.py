#!/usr/bin/env python3
"""استخراج الأسئلة المذكورة في مراجعة ChatGPT للتحقق بنداً بنداً"""
import json, sys

QB = "/home/z/my-project/public/data/qbank.json"

IDS = ["Q661","Q1578","Q1240","Q14021","Q14017","Q14026","Q692","Q597",
       "Q10382","Q1167","Q11044","Q11233","Q13973","Q1852",
       "Q1071","Q13374","Q1931"]

def main():
    with open(QB, encoding="utf-8") as f:
        data = json.load(f)

    concepts = {c.get("id"): c.get("title", "") for c in data["concepts"] if isinstance(c, dict)}
    courses = data["courses"]

    found = {}
    for q in data["questions"]:
        qid = q.get("id")
        if qid in IDS:
            cid = q.get("conceptId", "")
            found[qid] = q

    missing = [i for i in IDS if i not in found]
    print(f"موجود: {len(found)}/17 | مفقود: {missing}")
    print("=" * 70)
    for qid in IDS:
        q = found.get(qid)
        if not q:
            print(f"### {qid}: غير موجود!\n")
            continue
        cid = q.get("conceptId", "")
        # ابحث عن المفهوم والدورة
        cname = concepts.get(cid, "?")
        course = "?"
        for c in data["concepts"]:
            if isinstance(c, dict) and c.get("id") == cid:
                course = courses.get(c.get("courseId", ""), "?")
                break
        print(f"### {qid} | {course} | {cname}")
        print(f"type: {q.get('type')}")
        print(f"Q: {q.get('question','')[:400]}")
        for i, opt in enumerate(q.get("options", [])):
            mark = " ✔✔" if opt.get("isCorrect") else ""
            print(f"  [{i}] {opt.get('text','')[:200]}{mark}")
        print(f"correct: {q.get('correct','')}")
        print(f"reason: {q.get('reason','')[:900]}")
        print("-" * 70)

if __name__ == "__main__":
    main()
