# -*- coding: utf-8 -*-
# معاينة عينات من qbank.json لمراجعة أصالة المحتوى
import json, random, sys

P = "/home/z/my-project/src/data/qbank.json"
qb = json.load(open(P, encoding="utf-8"))
cons = qb["concepts"]
qs = qb["questions"]
print("المفاهيم:", len(cons), "| الأسئلة:", len(qs))
print("مفاتيح المفهوم:", list(cons[0].keys()))

# مفاهيم بأمثلة متعددة (المولدة حديثا)
with_ex = [c for c in cons if c.get("examples") and len(c["examples"]) >= 5]
print("مفاهيم بأمثلة خمسة:", len(with_ex))

# أطول الشروحات (أكثر العبارات خصوصية — الأجدى لفحص النسخ)
def elen(c):
    return len(c.get("explanation") or "")
top = sorted(with_ex or cons, key=elen, reverse=True)[:6]

random.seed(7)
for c in top[:3] + random.sample(cons, 2):
    print("\n" + "=" * 60)
    print("المفهوم:", c.get("name"), "| المحور:", c.get("course"))
    print("-- الشرح --")
    print(c.get("explanation"))
    ex = c.get("examples")
    if ex:
        print("-- الأمثلة (%d) --" % len(ex))
        for i, e in enumerate(ex, 1):
            print(f"  {i}) {e}")
    else:
        print("-- المثال الواحد --")
        print(c.get("example"))

# عينة أسئلة من مفهوم غني
target = top[0]["id"] if top else cons[0]["id"]
tq = [q for q in qs if q.get("conceptId") == target]
print("\n" + "=" * 60)
print("أسئلة مفهوم «%s» (%d):" % (top[0].get("name"), len(tq)))
for q in tq[:6]:
    print("\n* [%s/صعوبة %s] %s" % (q.get("qtype"), q.get("diff"), q.get("question")))
    if q.get("a"):
        for k in "abcd":
            print("   %s) %s" % (k, q.get(k)))
    print("   الجواب:", q.get("correct"))
