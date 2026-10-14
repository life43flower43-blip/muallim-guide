# -*- coding: utf-8 -*-
"""إصلاح بنية batch04.py: إزالة استدعاءات MCQ/TF المتداخلة داخل قائمة CONCEPTS.
حدود العنصر تُحدَّد بسطر بدايته (أربع مسافات ثم C( أو MCQ( أو TF() وليس سطر نهايته،
لأن أقواس الإغلاق قد تلحق نهاية نص السطر الأخير في العنصر.
الأسئلة الصحيحة موجودة أصلًا في قائمة QUESTIONS بالمحتوى نفسه وبالترتيب نفسه."""
import re

PATH = "/home/z/my-project/scripts/m5_batches/batch04.py"

with open(PATH, encoding="utf-8") as f:
    lines = f.readlines()

start = next(i for i, ln in enumerate(lines) if ln.startswith("CONCEPTS = ["))
end = next(i for i in range(start + 1, len(lines)) if lines[i].rstrip() == "]")

elem_start_re = re.compile(r"^    (C|MCQ|TF)\(")

blocks = []  # (kind, [lines])
current = None
for i in range(start + 1, end):
    ln = lines[i]
    m = elem_start_re.match(ln)
    if m:
        current = (m.group(1), [ln])
        blocks.append(current)
    else:
        if current is None:
            # سطر قبل أول عنصر (نادر) — يُحفظ كما هو
            blocks.append((None, [ln]))
            current_marker = None
        else:
            blocks[-1] = (blocks[-1][0], blocks[-1][1] + [ln])

kept_lines = []
removed = 0
for kind, blk in blocks:
    if kind in ("MCQ", "TF"):
        removed += 1
        continue
    kept_lines.extend(blk)

new_lines = lines[: start + 1] + kept_lines + lines[end:]

with open(PATH, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"أُزيلت {removed} كتلة سؤال من CONCEPTS (المتوقع ٤٠)")
assert removed == 40, "عدد الكتل المزالة غير متوقع — يلزم مراجعة يدوية"
