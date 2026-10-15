# -*- coding: utf-8 -*-
"""تطبيق إصلاحات جولة المراجعة 4 على qbank.json — بدقة وتحقق"""
import json, re, sys, shutil

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, "/home/z/my-project/scripts")
from fix_r4_table import FIXES
from fix_r4_table2 import FIXES2, FAMILY_A, FAMILY_B, GLOBAL_SWEEP

QB = "/home/z/my-project/public/data/qbank.json"

def main():
    with open(QB, encoding="utf-8") as f:
        data = json.load(f)
    qs = {q["id"]: q for q in data["questions"]}
    applied, failed = 0, []

    def replace_in(field_name, old, new, target):
        nonlocal applied
        if old not in target:
            failed.append((field_name, "غير موجود", old[:60]))
            return target
        if target.count(old) != 1:
            failed.append((field_name, f"متكرر {target.count(old)}", old[:60]))
            return target
        applied += 1
        return target.replace(old, new)

    # ===== 1) الإصلاحات المحددة =====
    for qid, field, old, new in FIXES + FIXES2:
        q = qs.get(qid)
        if q is None:
            failed.append((qid, "سؤال مفقود", ""))
            continue
        if field == "q":
            q["question"] = replace_in(f"{qid}.question", old, new, q["question"])
        elif field == "r":
            q["reason"] = replace_in(f"{qid}.reason", old, new, q.get("reason") or "")
        elif field.startswith("o") and field[1:].isdigit():
            idx = int(field[1:])
            opt = q["options"][idx]
            opt["text"] = replace_in(f"{qid}.options[{idx}]", old, new, opt["text"])
            # إن كان هذا الخيار هو الصحيح،زامن correct
            if opt.get("isCorrect") and q.get("correct") == old:
                q["correct"] = new
                applied += 1
        elif field == "correct":
            q["correct"] = replace_in(f"{qid}.correct", old, new, q.get("correct") or "")
        elif field == "flip":
            # نقل الصواب إلى الخيار الذي نصه old
            new_correct = old
            hit = False
            for opt in q["options"]:
                opt["isCorrect"] = (opt["text"] == new_correct)
                if opt["isCorrect"]:
                    hit = True
            if not hit:
                failed.append((qid, "flip: الخيار غير موجود", new_correct))
            else:
                q["correct"] = new_correct
                applied += 1

    # ===== 2) عائلة A و B: إحالة «الخيار الأول» الموهومة → الموضع الفعلي =====
    for qid in FAMILY_A + FAMILY_B:
        q = qs[qid]
        cpos = next(i + 1 for i, o in enumerate(q["options"]) if o.get("isCorrect"))
        reason = q.get("reason") or ""
        n_first = reason.count("الخيار الأول")
        if n_first != 1:
            failed.append((qid, f"عائلةA/B: «الخيار الأول» وردت {n_first}", ""))
            continue
        tag = "عين الخيار الأول" if "عين الخيار الأول" in reason else "فالخيار الأول"
        if tag not in reason:
            failed.append((qid, "عائلةA/B: الصيغة غير موجودة", ""))
            continue
        q["reason"] = reason.replace(tag, tag.replace("الأول", "الأول" if False else ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس"][cpos]))
        applied += 1

    # ===== 3) التنظيف اللغوي العام =====
    def sweep(text):
        for bad, good in GLOBAL_SWEEP:
            text = text.replace(bad, good)
        return text

    swept = 0
    for q in data["questions"]:
        before = (q.get("question",""), json.dumps(q.get("options",[]), ensure_ascii=False), q.get("reason",""))
        q["question"] = sweep(q.get("question") or "")
        for opt in q.get("options", []):
            opt["text"] = sweep(opt.get("text") or "")
        q["reason"] = sweep(q.get("reason") or "")
        q["correct"] = sweep(q.get("correct") or "")
        after = (q["question"], json.dumps(q["options"], ensure_ascii=False), q["reason"])
        if before != after:
            swept += 1

    # ===== 4) تحقق البنية =====
    errs = []
    for q in data["questions"]:
        correct_opts = [o for o in q["options"] if o.get("isCorrect")]
        if len(correct_opts) != 1:
            errs.append(f"{q['id']}: عدد الخيارات الصحيحة = {len(correct_opts)}")
        elif correct_opts[0]["text"] != q.get("correct"):
            errs.append(f"{q['id']}: correct لا يطابق الخيار الصحيح")
    if errs:
        print("أخطاء بنيوية:", errs[:10]); sys.exit(1)

    with open(QB, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print(f"تم تطبيق {applied} إصلاحاً | أسئلة تأثرت بالتنظيف العام: {swept}")
    if failed:
        print(f"فشل {len(failed)} — يحتاج مراجعة:")
        for item in failed:
            print("  ", item)
        sys.exit(2)
    print("كل الإصلاحات طُبقت بنجاح دون أي فشل")

if __name__ == "__main__":
    main()
