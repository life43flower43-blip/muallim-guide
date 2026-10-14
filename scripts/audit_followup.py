#!/usr/bin/env python3
# متابعة عميقة للنتائج الحرجة — تحليل فقط
import json, re
from collections import Counter, defaultdict
from difflib import SequenceMatcher

d = json.load(open("/home/z/my-project/public/data/qbank.json", encoding="utf-8"))
courses, concepts, questions = d["courses"], d["concepts"], d["questions"]
con_by_id = {c["id"]: c for c in concepts}

def norm(s):
    s = (s or "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
    return re.sub(r"\s+", " ", s).strip()

print("== أ) الأسئلة الحرجة الثلاثة (تضارب المفتاح) ==")
for qid in ["Q9249", "Q9314", "Q9810"]:
    q = next(x for x in questions if x["id"] == qid)
    true_opt = next((o["text"] for o in q["options"] if o.get("isCorrect")), None)
    print(f"\n{qid} ({con_by_id[q['conceptId']]['title']}):")
    print(f"  نص السؤال: {q['question'][:90]}")
    print(f"  correct (نص): {q.get('correct')}")
    print(f"  isCorrect (بديل): {true_opt}")

print("\n== ب) الأسئلة الثمانية (الإجابة داخل نص السؤال) ==")
for qid in ["Q947", "Q2110", "Q8013", "Q8015", "Q9052", "Q9053", "Q11205", "Q11485"]:
    q = next(x for x in questions if x["id"] == qid)
    true_opt = next((o["text"] for o in q["options"] if o.get("isCorrect")), "")
    print(f"{qid} ({q['conceptId']}): «{q['question'][:70]}» ← الإجابة: «{true_opt[:40]}»")

print("\n== ج) توزيع المفتاح لأسئلة الاختيار من متعدد فقط ==")
mcq = [q for q in questions if q.get("type") == "mcq"]
dist = Counter(next((i for i, o in enumerate(q["options"]) if o.get("isCorrect")), -1) for q in mcq)
print(f"عددها {len(mcq)} — توزيع أ/ب/ج/د: {[dist.get(i,0) for i in range(4)]}")

print("\n== د) مفاهيم تبدو منفلتة من مجال مساقها (كلمات مفتاحية عابرة للمساقات) ==")
CROSS = {
    "M1": ["تقويم", "اختبار", "طريقة تدريس", "إدارة الصف", "ذكاء عاطفي", "المعدل", "جامع"],
    "M2": ["تقويم", "جدول المواصفات", "المعدل التراكمي", "منهج", "تدريس"],
    "M3": ["المعدل", "جدول المواصفات", "صدق", "ثبات"],
    "M4": ["نمو", "بياجيه", "الذكاء", "طريقة تدريس", "إدارة الصف"],
    "M5": ["جدول المواصفات", "معامل السهولة", "ألفا كرونباخ", "منحنى طبيعي", "درجات معيارية"],
}
for cid, kws in CROSS.items():
    for c in concepts:
        if c["courseId"] != cid:
            continue
        t = c["title"]
        for kw in kws:
            if kw in t:
                print(f"  {cid}: {c['id']} «{t}» (مفتاح: {kw}) — فصل: {c['chapter']}")
                break

print("\n== هـ) تفتت الفصول داخل المساق نفسه (أسماء متقاربة قد تفرق موضوعاً واحداً) ==")
for cid in courses:
    chs = sorted(set(c["chapter"] for c in concepts if c["courseId"] == cid))
    for i in range(len(chs)):
        for j in range(i + 1, len(chs)):
            a, b = norm(chs[i]), norm(chs[j])
            r = SequenceMatcher(None, a, b).ratio()
            if r >= 0.75 or (a in b) or (b in a):
                n1 = sum(1 for c in concepts if c["courseId"] == cid and c["chapter"] == chs[i])
                n2 = sum(1 for c in concepts if c["courseId"] == cid and c["chapter"] == chs[j])
                print(f"  {cid}: «{chs[i]}» ({n1}) ↔ «{chs[j]}» ({n2}) — تشابه {r:.2f}")

print("\n== و) أزواج الأسئلة شبه المتطابقة داخل المفهوم (التفاصيل) ==")
for qid1, qid2 in [("Q1537", "Q1543"), ("Q1141", "Q1146"), ("Q598", "Q604"), ("Q1700", "Q1701")]:
    q1 = next(x for x in questions if x["id"] == qid1)
    q2 = next(x for x in questions if x["id"] == qid2)
    print(f"  {qid1}↔{qid2} في {q1['conceptId']} ({con_by_id[q1['conceptId']]['title']}):")
    print(f"    أ: {q1['question'][:80]}")
    print(f"    ب: {q2['question'][:80]}")

print("\n== ز) المكرر الحرفي بين D1442/D1447 وD1443/D1448 (ماهية المفهومين) ==")
for did in ["D1442", "D1447", "D1443", "D1448"]:
    c = con_by_id.get(did)
    if c:
        print(f"  {did}: «{c['title']}» — {c['courseId']}/{c['chapter']} — أسئلة: {sum(1 for q in questions if q['conceptId']==did)}")

print("\n== ح) المفهومان المكررا العنوان (تشابه المحتوى) ==")
for a, b in [("D1001", "D1257"), ("D1101", "C040")]:
    ca, cb = con_by_id[a], con_by_id[b]
    print(f"  {a} «{ca['title']}» [{ca['courseId']}/{ca['chapter']}] ↔ {b} «{cb['title']}» [{cb['courseId']}/{cb['chapter']}]")
    print(f"    تشابه الشرح: {SequenceMatcher(None, norm(ca['explanation']), norm(cb['explanation'])).ratio():.2f}")

print("\n== ط) سياق «درستي» و«الغلط» (هل هي داخل حوار مسموح؟) ==")
for qid in ["Q2140", "Q9916", "Q9980", "Q11149", "Q13830"]:
    q = next(x for x in questions if x["id"] == qid)
    blob = q["question"] + " " + " ".join(o["text"] for o in q["options"]) + " " + q.get("reason", "")
    for w in ["درستي", "الغلط"]:
        i = blob.find(w)
        if i >= 0:
            print(f"  {qid}: …{blob[max(0,i-40):i+40]}…")
            break
for did in ["D1438", "D2058"]:
    c = con_by_id[did]
    blob = c["title"] + " " + c["explanation"]
    i = blob.find("الغلط")
    print(f"  {did} «{c['title']}»: …{blob[max(0,i-40):i+40]}…")

print("\n== ي) أسئلة ثنائية الخيارات: مفتاح صح/خطأ المتوازن ==")
tf = [q for q in questions if q.get("type") == "tf"]
dist2 = Counter(next((o["text"] for o in q["options"] if o.get("isCorrect")), "?") for q in tf)
print(f"عددها {len(tf)} — توزيع المفتاح: {dict(dist2)}")
