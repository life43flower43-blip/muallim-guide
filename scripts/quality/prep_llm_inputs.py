# -*- coding: utf-8 -*-
# تحضير مدخلات الحكم الآلي: عينة الترابط + سياقات ة/ه الملتبسة + العناوين كلها
import json, re, os, random
from collections import Counter

OUT = "/home/z/my-project/scripts/quality/out"
IN = f"{OUT}/llm_inputs"
os.makedirs(IN, exist_ok=True)
random.seed(20261015)

d = json.load(open("/home/z/my-project/public/data/qbank.json", encoding="utf-8"))
concepts, questions = d["concepts"], d["questions"]
qf = json.load(open(f"{OUT}/quality_findings.json", encoding="utf-8"))

# ١) عينة الترابط: أسوأ ٣٠ + عشوائي ٣٠ من الشروح كلها
cm = {c["id"]: c for c in concepts}
sample = []
seen = set()
for w in qf["coherence"]["worst"]:
    if w["kind"] == "مفهوم" and w["id"] in cm and w["id"] not in seen:
        sample.append({"id": w["id"], "text": cm[w["id"]]["explanation"]})
        seen.add(w["id"])
    if len(sample) >= 30:
        break
pool = [c["id"] for c in concepts if c["id"] not in seen and len(c.get("explanation", "")) > 150]
for cid in random.sample(pool, min(30, len(pool))):
    sample.append({"id": cid, "text": cm[cid]["explanation"]})
json.dump(sample, open(f"{IN}/coherence_sample.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ٢) سياقات ة/ه الملتبسة (غير السالفة بالألف واللام)
TOKEN = re.compile(r"[\u0621-\u064A0-9]+")
def full_text(c):
    ex = " ".join(str(x) for x in c["examples"]) if isinstance(c.get("examples"), list) else str(c.get("examples") or "")
    return c.get("title", "") + "\n" + c.get("explanation", "") + "\n" + ex

vocab = Counter()
occ = {}
for c in concepts:
    t = full_text(c)
    toks = TOKEN.findall(t)
    vocab.update(toks)
    for i, tok in enumerate(toks):
        occ.setdefault(tok, []).append((c["id"], t))
for q in questions:
    t = q.get("question", "") + "\n" + q.get("reason", "") + "\n" + " | ".join(
        o.get("text", "") if isinstance(o, dict) else str(o) for o in q.get("options", []))
    vocab.update(TOKEN.findall(t))

H_WHITELIST = {"له", "به", "هو", "هي", "فيه", "فيها", "منه", "منها", "عنه", "عنها",
               "عليه", "عليها", "إليه", "إليها", "اليه", "اليها", "لديه", "معه", "معها",
               "لهم", "بهم", "عليهم", "لها", "بها", "فهو", "فهي", "وهو", "وهي", "وله",
               "وبه", "أنه", "أنها", "إنه", "إنها", "وأنه", "وأنها", "ولديه", "ولهذا"}

contexts = []
for tok, freq in vocab.items():
    if len(tok) >= 6 and tok.endswith("ه") and tok not in H_WHITELIST and freq >= 2 and not tok.startswith("ال"):
        alt = tok[:-1] + "ة"
        if vocab.get(alt, 0) >= 2:
            for cid, t in occ.get(tok, [])[:3]:
                i = t.find(tok)
                ctx = t[max(0, i - 70):i + 70].replace("\n", " ")
                contexts.append({"token": tok, "right": alt, "id": cid, "context": ctx})
            if len(contexts) >= 72:
                break
json.dump(contexts, open(f"{IN}/heta_contexts.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ٣) العناوين كلها
titles = [{"id": c["id"], "title": c.get("title", "")} for c in concepts]
json.dump(titles, open(f"{IN}/titles.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print(f"coherence={len(sample)} heta_contexts={len(contexts)} titles={len(titles)}")
# ال-prefixed safe candidates أيضاً للتقرير
safe_al = []
for tok, freq in vocab.items():
    if len(tok) >= 6 and tok.startswith("ال") and tok.endswith("ه") and freq >= 2 and tok not in H_WHITELIST:
        alt = tok[:-1] + "ة"
        if vocab.get(alt, 0) >= 2:
            safe_al.append((tok, alt, freq, vocab[alt]))
print("ال-prefixed safe candidates:", safe_al[:20], "count:", len(safe_al))
json.dump([{"wrong": w, "right": r, "wf": f, "rf": rf} for w, r, f, rf in safe_al],
          open(f"{IN}/heta_al_safe.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
