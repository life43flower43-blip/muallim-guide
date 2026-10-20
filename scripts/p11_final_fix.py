# -*- coding: utf-8 -*-
"""P11 — السكربت الرئيسي: إصلاح الأخطاء الإملائية والنحوية + توحيد التنصيص «» + حذف مخلفات generated."""
import json, re, sys, shutil, os

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'

# ---------- 1) الإصلاحات المستهدفة (كل واحد يجب أن يظهر مرة واحدة) ----------
FIXES = [
    ("أن تمسك طرفي طرفي سلك كهربائي طويل", "أن تمسك طرفي سلك كهربائي طويل"),
    ("يفهم الأوامال الشفهية", "يفهم الأوامر الشفهية"),
    ("يُشخص يوسف بـ عسر القراءة النمائي، فيبدأ المعلمات بتدريبه",
     "يُشخَّص يوسف بعسر القراءة النمائي، فيبدأ المعلمة بتدريبه"),
    ("في هياجه وشتته وانتباهه المنخفض", "في هياجه وشتته وانخفاض انتباهه"),
    ("فرط النشاط الدرقية ينتج", "فرط نشاط الدرقية ينتج"),
    ("لعبة إستراتيجية", "لعبة استراتيجية"),
    ("وتختفي أحياناً (منتنحية)", "وتختفي أحياناً (متنحية)"),
    ("قامت طالبة الصف التاسع عشر نورة بتصميم روبوت يرشح النباتات",
     "قامت طالبة الصف التاسع نورة بتصميم روبوت يسقي النباتات"),
    ("وتعلمت من أخطائه الأولى كيف تحسد دقة الحسابات وتحسين الخوارزميات",
     "وتعلمت من أخطائه الأولى كيف تحسّن دقة الحسابات والخوارزميات"),
    ("وقد تضاف إليها دعم من المجتمع المحلي", "وقد يضاف إليها دعم من المجتمع المحلي"),
    ("وقد تضاف إليها دعم محلي أو شراكات", "وقد يضاف إليها دعم محلي أو شراكات"),
    ("حول كيفية البحث الكترونيًا", "حول كيفية البحث الإلكتروني"),
    ("لتميين الصور حسب أنواعها", "لتصنيف الصور حسب أنواعها"),
    ("المدرسة البرجماتية", "المدرسة البراغماتية"),
    ("حتى لو كانت المعلمات متوفرة", "حتى لو كانت المعلومات متوفرة"),
    ("أما المقاعد والافتتاحيات قرارات يومية لا ختامية",
     "أما ترتيب المقاعد والتغذية اليومية فقرارات يومية لا ختامية"),
    ("ومحكات الحكم واضحة، ثم القرار", "وضوح محكات الحكم، ثم القرار"),
    ("هي حقل صدق المحتوى", "هي أساس صدق المحتوى"),
    ("عندما تبدأ المعلمات بتمثيل قصة حركية", "عندما تبدأ المعلمة بتمثيل قصة حركية"),
    ("دور النخامية كـ'سيدة الغدد'", "دور النخامية بوصفها «سيدة الغدد»"),
]

# ---------- 2) تحويل التنصيص اللاتيني إلى «» ----------
def convert_quotes(s):
    """يحوّل أزواج "…" و '…' داخل قيمة نصية إلى «…». يعيد النص وعدد التحولات."""
    n = 0
    s2 = re.sub(r'"([^"\n]{1,240})"', '«\\1»', s)
    n += len(re.findall(r'"[^"\n]{1,240}"', s))
    # فواصل مفردة: محتوى عربي بين '…'
    s2 = re.sub(r"'([^'\n]{1,240})'", '«\\1»', s2)
    return s2, n

d = json.load(open(QB, encoding='utf-8'))

def walk_edit(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items(): walk_edit(v, f'{p}.{k}')
    elif isinstance(o, list):
        for i, v in enumerate(o): walk_edit(v, f'{p}[{i}]')
    elif isinstance(o, str):
        s = o
        for old, new in FIXES:
            if old in s: s = s.replace(old, new)
        s2, _ = convert_quotes(s)
        # تسوية متبقيات فردية للإبلاغ عنها
        yield_rest.append(s2 != o)
        return s2 if s2 != o else o

# تنفيذ يدوي أدق بدل walk_edit المعقد:
def fix_value(s):
    for old, new in FIXES:
        if old in s: s = s.replace(old, new)
    s = re.sub(r'"([^"\n]{1,240})"', '«\\1»', s)
    s = re.sub(r"'([^'\n]{1,240})'", '«\\1»', s)
    return s

count = {'str': 0}
def process(o):
    if isinstance(o, dict):
        return {k: process(v) for k, v in o.items()}
    if isinstance(o, list):
        return [process(v) for v in o]
    if isinstance(o, str):
        ns = fix_value(o)
        if ns != o: count['str'] += 1
        return ns
    return o

d2 = process(d)
print(f'سلاسل عدّلت: {count["str"]}')

# تنبيه: أي قيمة ما زال فيها تنصيص لاتيني فردي
def walk(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items(): yield from walk(v, f'{p}.{k}')
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from walk(v, f'{p}[{i}]')
    elif isinstance(o, str): yield p, o

leftover_d = [(p, s) for p, s in walk(d2) if '"' in s]
leftover_s = [(p, s) for p, s in walk(d2) if "'" in s]
print(f'تنصيص مزدوج متبقٍ: {len(leftover_d)} | مفرد متبقٍ: {len(leftover_s)}')
for p, s in (leftover_d + leftover_s)[:12]:
    print(f'  {p}: {s[:100]}')

# تحقق إملائي نهائي
CJK = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]')
cjk = [(p, s[:80]) for p, s in walk(d2) if CJK.search(s)]
print(f'CJK متبقٍ: {len(cjk)}')
for bad in cjk[:8]: print('  ', bad)
for w in ['الأوامال', 'منتنحية', 'البرجماتية', 'تميين', 'الكترونيًا', 'تحسد', 'طرفي طرفي', 'إستراتيجية']:
    n = sum(1 for _, s in walk(d2) if w in s)
    if n: print(f'  !! بقي {w}: {n}')

# كتابة الملف
json.dump(d2, open(QB, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('قُلب البنك أُعيدت كتابته.')

# حذف مخلفات generated (غير مستوردة إطلاقًا)
gen = f'{ROOT}/src/data/generated'
if os.path.isdir(gen):
    n = sum(len(fs) for _, _, fs in os.walk(gen))
    shutil.rmtree(gen)
    print(f'حُذف src/data/generated بالكامل ({n} ملفًا)')
print('FINAL-OK')
