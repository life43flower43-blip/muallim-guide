# يبني جدول قناة تيليجرام: لكل يوم معلومة، وسؤالان، ومنشور تعريف، حسب موضوع ذلك اليوم من الأسبوع.
# لا يتكرر سؤال ولا معلومة طوال المدة، ومواضيع الأيام في content/telegram-themes.json
# التشغيل: python3 scripts/build-telegram-schedule.py 2026-11-04 365
import json, sys, datetime, re

start = datetime.date.fromisoformat(sys.argv[1] if len(sys.argv) > 1 else "2026-11-04")
days = int(sys.argv[2] if len(sys.argv) > 2 else 365)
bank = json.load(open("public/data/qbank.json"))
concepts = {c["id"]: c for c in bank["concepts"]}
themes = json.load(open("content/telegram-themes.json"))


def fits(q):
    # حدود تيليجرام: السؤال ٣٠٠ حرف (نترك ١٦ للبادئة)، والخيار ١٠٠، والخيارات من ٢ إلى ١٠
    return (q.get("type") == "mcq" and not q.get("fixedOrder") and len(q["question"]) <= 284
            and 2 <= len(q["options"]) <= 10 and all(len(o["text"]) <= 100 for o in q["options"])
            and sum(o["isCorrect"] for o in q["options"]) == 1 and q["conceptId"] in concepts)


def spread(lst, step):
    # ترتيب ثابت متباعد داخل المحور حتى لا تأتي عناصر الفصل نفسه متتالية
    n = len(lst); out = []; seen = set()
    for i in range(n):
        k = (i * step) % n
        while k in seen:
            k = (k + 1) % n
        seen.add(k); out.append(lst[k])
    return out


def interleave(groups):
    # يدمج المحاور بالتناسب مع حجمها، فتتنوع من أسبوع لآخر
    keyed = []
    for g in groups:
        n = len(g)
        keyed += [((k + 0.5) / n, x) for k, x in enumerate(g)]
    return [x for _, x in sorted(keyed, key=lambda t: t[0])]


cids = sorted({c["courseId"] for c in bank["concepts"]})
qby = {c: spread([q["id"] for q in bank["questions"] if fits(q) and concepts[q["conceptId"]]["courseId"] == c], 37) for c in cids}
tby = {c: spread([x["id"] for x in bank["concepts"] if x["courseId"] == c and x.get("rule") and 40 <= len(x["rule"]) <= 280], 29) for c in cids}
qseqs = [interleave([qby[c] for c in t["courses"]]) for t in themes]
tseqs = [interleave([tby[c] for c in t["courses"]]) for t in themes]
pos_q = [0] * 7; pos_t = [0] * 7
used_q, used_t = set(), set()


def take(seqs, pos, used, k):
    # العنصر التالي غير المستخدم من محاور موضوع اليوم
    seq = seqs[k]
    while pos[k] < len(seq) and seq[pos[k]] in used:
        pos[k] += 1
    assert pos[k] < len(seq), f"نفدت عناصر موضوع {themes[k]['day']}"
    v = seq[pos[k]]; used.add(v); pos[k] += 1
    return v


src = open("src/lib/telegram-promos.ts").read()
kinds = re.findall(r'kind: "(app|site)"', src)
apps = [i for i, k in enumerate(kinds) if k == "app"]
sites = [i for i, k in enumerate(kinds) if k == "site"]

out = []
for d in range(days):
    day = start + datetime.timedelta(days=d)
    k = (day.weekday() + 1) % 7  # الأحد = ٠
    # تعريف بالتطبيق يومًا وبالموقع يومًا، بالترتيب فلا يتكرر منشور قبل أن تمر كلها
    promo = apps[(d // 2) % len(apps)] if d % 2 == 0 else sites[(d // 2) % len(sites)]
    out.append({"date": day.isoformat(), "theme": k, "tip": take(tseqs, pos_t, used_t, k),
                "q1": take(qseqs, pos_q, used_q, k), "q2": take(qseqs, pos_q, used_q, k), "promo": promo})

json.dump(out, open("content/telegram-schedule.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "يومًا، من", out[0]["date"], "إلى", out[-1]["date"])
