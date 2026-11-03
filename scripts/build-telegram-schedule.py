# يبني جدول قناة تيليجرام لسنة كاملة: لكل يوم معلومة، وسؤالان، ومنشور تعريف.
# لا يتكرر سؤال ولا معلومة خلال السنة، ويتنوع المحور من يوم لآخر.
# التشغيل: python3 scripts/build-telegram-schedule.py 2026-11-04 365
import json, sys, datetime, re

start = datetime.date.fromisoformat(sys.argv[1] if len(sys.argv) > 1 else "2026-11-04")
days = int(sys.argv[2] if len(sys.argv) > 2 else 365)
bank = json.load(open("public/data/qbank.json"))
concepts = {c["id"]: c for c in bank["concepts"]}

# حدود تيليجرام: السؤال ٣٠٠ حرف (نترك ١٦ للبادئة)، والخيار ١٠٠، والخيارات ٢ إلى ١٠
def fits(q):
    return (q.get("type") == "mcq" and not q.get("fixedOrder") and len(q["question"]) <= 284
            and 2 <= len(q["options"]) <= 10 and all(len(o["text"]) <= 100 for o in q["options"])
            and sum(o["isCorrect"] for o in q["options"]) == 1 and q["conceptId"] in concepts)

def spread(lst, step):
    # ترتيب ثابت متباعد داخل المحور حتى لا تأتي عناصر الفصل نفسه متتالية
    n = len(lst); out = []; seen = set()
    for i in range(n):
        k = (i * step) % n
        while k in seen: k = (k + 1) % n
        seen.add(k); out.append(lst[k])
    return out

def interleave(groups):
    # يدمج المحاور بالتناسب مع حجمها، فتتنوع المحاور يومًا بعد يوم ولا يتكرر عنصر
    keyed = []
    for g in groups.values():
        n = len(g)
        keyed += [((k + 0.5) / n, x) for k, x in enumerate(g)]
    return [x for _, x in sorted(keyed, key=lambda t: t[0])]

by_course = lambda items, cid: [x for x in items if cid(x)]
cids = sorted({c["courseId"] for c in bank["concepts"]})
qseq = interleave({c: spread([q["id"] for q in bank["questions"] if fits(q) and concepts[q["conceptId"]]["courseId"] == c], 37) for c in cids})
tseq = interleave({c: spread([x["id"] for x in bank["concepts"] if x["courseId"] == c and x.get("rule") and 40 <= len(x["rule"]) <= 280], 29) for c in cids})

src = open("src/lib/telegram-promos.ts").read()
kinds = re.findall(r'kind: "(app|site)"', src)
apps = [i for i, k in enumerate(kinds) if k == "app"]; sites = [i for i, k in enumerate(kinds) if k == "site"]

out = []
for d in range(days):
    day = start + datetime.timedelta(days=d)
    promo = apps[(d // 2) % len(apps)] if d % 2 == 0 else sites[(d // 2) % len(sites)]
    out.append({"date": day.isoformat(), "tip": tseq[d], "q1": qseq[2 * d], "q2": qseq[2 * d + 1], "promo": promo})

qs = [x["q1"] for x in out] + [x["q2"] for x in out]
assert len(set(qs)) == len(qs), "تكرار في الأسئلة"
assert len(set(x["tip"] for x in out)) == len(out), "تكرار في المعلومات"
json.dump(out, open("content/telegram-schedule.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "يومًا، من", out[0]["date"], "إلى", out[-1]["date"])
