# يدمج إضافات المحتوى (content/bank/*.json) في بنك الأسئلة public/data/qbank.json
# يمكن تشغيله أكثر من مرة: يحذف أولًا ما سبق دمجه بالمعرّفات نفسها ثم يضيفه من جديد.
import json, glob

P = "public/data/qbank.json"
bank = json.load(open(P))
for f in sorted(glob.glob("content/bank/*.json")):
    add = json.load(open(f))
    # ملف لمحور جديد فيه "course"، أو ملف إضافات لمحاور موجودة بحقل courseId في كل مفهوم
    cid = add["course"]["id"] if "course" in add else None
    if cid:
        bank["courses"][cid] = add["course"]["name"]
    ids = {c["id"] for c in add["concepts"]}
    bank["concepts"] = [c for c in bank["concepts"] if c["id"] not in ids]
    bank["questions"] = [q for q in bank["questions"] if q["conceptId"] not in ids]
    for c in add["concepts"]:
        bank["concepts"].append({"id": c["id"], "courseId": c.get("courseId", cid), "chapter": c["chapter"], "title": c["title"], "explanation": c["explanation"],
                                 "examples": c["examples"], "example": c["examples"][0], "rule": c["rule"]})
    n = {}
    for cidc, diff, text, opts, correct, reason in add["questions"]:
        n[cidc] = n.get(cidc, 0) + 1
        bank["questions"].append({"id": f"Q{cidc}-{n[cidc]}", "conceptId": cidc, "type": "mcq", "difficulty": diff, "question": text,
                                  "options": [{"text": o, "isCorrect": i == correct} for i, o in enumerate(opts)], "correct": opts[correct], "reason": reason})
    for ch, m in add.get("maps", {}).items():
        bank.setdefault("maps", {})[f"{cid}::{ch}"] = m
    print(f, len(add["concepts"]), "مفهومًا،", len(add["questions"]), "سؤالًا")
json.dump(bank, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
