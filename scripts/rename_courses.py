# إعادة تسمية المساقات الجامعية إلى محاور رحلة المعلم — إزالة شكل «الكتاب الجامعي» (أمر المستخدم)
import json

P = "/home/z/my-project/src/data/qbank.json"
d = json.load(open(P, encoding="utf-8"))

NEW = {
    "M1": "فهم نمو الطلاب: الأسس البيولوجية",
    "M2": "عالم المشاعر والذكاء: الأسس النفسية",
    "M3": "كيف يتعلم الطلاب",
    "M4": "تقويم التعلم وقياسه",
    "M5": "التدريس داخل الصف",
    "G1": "المكتبة التربوية العامة",
}
old = d["courses"]
d["courses"] = {k: NEW.get(k, v) for k, v in old.items()}

json.dump(d, open(P, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for k, v in d["courses"].items():
    print(k, "→", v)
