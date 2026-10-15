#!/usr/bin/env python3
"""مسح شامل: تعارض الترتيب بين الشرح والإجابة + الأخطاء اللغوية المتناثرة"""
import json, re, unicodedata

QB = "/home/z/my-project/public/data/qbank.json"
ORD = {"الأول":1,"الثاني":2,"الثالث":3,"الرابع":4,"الخامس":5}

def strip_tashkeel(s):
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")

def main():
    data = json.load(open(QB, encoding="utf-8"))
    qs = data["questions"]

    # ===== 1) تعارض «عين الخيار X» مع موضع الإجابة الصحيحة =====
    ordinal_conflicts = []
    for q in qs:
        if q.get("type") != "mcq":
            continue
        opts = q.get("options", [])
        correct_idx = next((i for i, o in enumerate(opts) if o.get("isCorrect")), None)
        if correct_idx is None:
            continue
        reason = strip_tashkeel(q.get("reason", "") or "")
        for m in re.finditer(r"عين\s+الخيار\s+(الأول|الثاني|الثالث|الرابع|الخامس)", reason):
            claimed = ORD[m.group(1)]
            if claimed != correct_idx + 1:
                ordinal_conflicts.append((q["id"], correct_idx + 1, claimed, m.group(0)))

    print(f"=== تعارضات «عين الخيار»: {len(ordinal_conflicts)} ===")
    for qid, cpos, claimed, snippet in ordinal_conflicts:
        print(f"  {qid}: الصحيح فعلياً = الخيار {cpos} | الشرح يدّعي = {snippet}")

    # ===== 2) «الإجابة الصحيحة هو الخيار X» أو «الخيار X هو الإجابة الصحيحة» =====
    claim_conflicts = []
    for q in qs:
        if q.get("type") != "mcq":
            continue
        opts = q.get("options", [])
        correct_idx = next((i for i, o in enumerate(opts) if o.get("isCorrect")), None)
        if correct_idx is None:
            continue
        reason = strip_tashkeel(q.get("reason", "") or "")
        for m in re.finditer(r"(?:الإجابة\s*(?:الصحيحة)?\s*(?:هو|هي)?\s*|)الخيار\s+(الأول|الثاني|الثالث|الرابع|الخامس)\s+(?:هو|هي)?\s*(?:عين|الإجابة الصحيحة|الصحيح)", reason):
            claimed = ORD[m.group(1)]
            if claimed != correct_idx + 1:
                claim_conflicts.append((q["id"], correct_idx + 1, claimed, m.group(0)))

    print(f"=== تعارضات صيغ «الإجابة الصحيحة هو الخيار»: {len(claim_conflicts)} ===")
    for qid, cpos, claimed, snippet in claim_conflicts:
        print(f"  {qid}: الصحيح فعلياً = الخيار {cpos} | الشرح يدّعي = {snippet}")

    # ===== 3) أخطاء لغوية موثقة في أي حقل نصي =====
    typos = {
        "لاجع": "لاذع",
        "تتلمع": "تتملق",
        "سلوخ": "سلوك",
        "قواصم": "؟ (مصطلح غير واضح)",
        "تقرار حركي": "قرار حركي",
        "القرصنة": "القضم (في سياق Q1167)",
        "سميته الحدية": "؟ (مصطلح غير واضح)",
        "يجنيها المرشدة": "تجنيها المرشدة",
    }
    print("=== الأخطاء اللغوية في البنك كله ===")
    for bad, fix in typos.items():
        hits = []
        for q in qs:
            blob = " | ".join([
                q.get("question", "") or "",
                " ".join(o.get("text", "") or "" for o in q.get("options", [])),
                q.get("reason", "") or "",
            ])
            if bad in blob:
                fields = []
                if bad in (q.get("question", "") or ""): fields.append("سؤال")
                if any(bad in (o.get("text", "") or "") for o in q.get("options", [])): fields.append("خيار")
                if bad in (q.get("reason", "") or ""): fields.append("شرح")
                hits.append((q["id"], ",".join(fields)))
        print(f"  «{bad}» ← «{fix}»: {len(hits)} موضعاً {hits[:12]}")

    # ===== 4) مسافات مفقودة شائعة (حرفان ملتصقان) =====
    glued = re.findall(r"الانفعال\S{0,20}", " ".join((q.get("reason", "") or "") for q in qs))
    bad_glued = [g for g in set(glued) if re.search(r"الانفعال[^\s،؛.\)\"]{4,}", g) and not re.match(r"الانفعال(ات|ي|يه|يات)?[^\u0621-\u064a]", g)]
    print(f"=== كلمات ملتصقة «الانفعال+X»: {len(set(bad_glued))} ===")
    for g in sorted(set(bad_glued))[:10]:
        print(f"  {g[:50]}")

if __name__ == "__main__":
    main()
