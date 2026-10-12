#!/usr/bin/env python3
"""تلخيص نتائج البحث: استخراج العناوين والمقتطفات في ملف مركّز للقراءة."""
import json, glob, os

OUT = "/home/z/my-project/scripts/research_out2"
files = sorted(glob.glob(f"{OUT}/*.json"))
digest = []
for f in files:
    name = os.path.basename(f).replace(".json", "")
    try:
        data = json.load(open(f, encoding="utf-8"))
    except Exception as e:
        digest.append(f"## {name} [PARSE ERROR: {e}]")
        continue
    if isinstance(data, dict):
        data = data.get("results", data.get("data", []))
    digest.append(f"\n{'='*70}\n## {name} ({len(data)} نتيجة)")
    for r in data[:8]:
        t = (r.get("name") or "")[:110]
        s = (r.get("snippet") or "").replace("\n", " ")[:260]
        u = (r.get("url") or "")[:90]
        digest.append(f"- {t}\n  {s}\n  {u}")

text = "\n".join(digest)
open(f"{OUT}/_digest.md", "w", encoding="utf-8").write(text)
print(f"digest written: {len(text)} chars, {len(files)} files")
