# -*- coding: utf-8 -*-
"""مسح نصوص src (سلاسل حرفية) بحثًا عن أنماط عربية مكسورة / لاتيني / أرقام مشرقية / CJK.
يستخرج السلاسل الحرفية من ملفات ts/tsx ويفحصها بقواعد ACAD."""
import re, glob, json, sys

FILES = glob.glob('/home/z/my-project/src/**/*.{ts,tsx}', recursive=True)
# قواعد العطب النحوي (على النص بعد تطبيع الحروف)
BROKEN = [
    (r'\b(\w{3,}) \1\b', 'كلمة مكررة متلاصقة'),
    (r'الصحيح صحيح', 'قالب آلي «الصحيح صحيح»'),
    (r'مما (?:قياس|نقل|يجعل)', '«مما» بفعل ناقص السياق'),
    (r'\bولي ألم\b', 'عبارة مكسورة'),
    (r'المشارقة', 'كلمة غير موجودة'),
    (r'أشيار', 'كلمة غير موجودة'),
    (r'من من ', 'تكرار حرف جر'),
    (r'بعد بعد ', 'تكرار ظرف'),
    (r'واحدة واحدة', 'تكرار'),
    (r'\bشاهدت الأم \w+؟', 'ترتيب مختلط محتمل'),
    (r'(?:خيارات|الخيارات) الأخرى خاطئة', 'قالب آلي فظ'),
    (r'المشتت', 'قالب ترجمة حرفية (مشتتات)'),
]
CJK = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]')
LATIN_ADJ = re.compile(r'[\u0600-\u06FF][A-Za-z]|[A-Za-z][\u0600-\u06FF]')  # لاتيني ملاصق لعربي
AR_DIGIT = re.compile(r'[0-9]')

def strings_of(text):
    """يستخرج محتوى السلاسل داخل علامات اقتباس مفردة/مزدوجة/مقلوبة — تقريب كافٍ للفحص."""
    out = []
    for m in re.finditer(r'"((?:[^"\\]|\\.)*)"|\'((?:[^\'\\]|\\.)*)\'|`([^`]*)`', text):
        s = m.group(1) or m.group(2) or m.group(3) or ''
        # فك تسلسلات الهروب الشائعة
        s = s.replace('\\n', ' ').replace('\\"', '"').replace("\\'", "'")
        if len(s.strip()) < 4:
            continue
        # استبعد ما يشبه كود/مسارات
        if re.fullmatch(r'[\w\-/@#$%^&*()+=.,:;!?{}\[\]]+', s.strip()) and not re.search(r'[\u0600-\u06FF]', s):
            continue
        out.append(s)
    return out

def norm(s):
    return re.sub(r'[\u064B-\u0652\u0640]', '', s)

hits = []
for f in FILES:
    if 'personas' not in f and '/app/' not in f and '/lib/' not in f:
        continue
    try:
        text = open(f, encoding='utf-8').read()
    except Exception:
        continue
    rel = f.replace('/home/z/my-project/', '')
    for i, line in enumerate(text.split('\n'), 1):
        for s in strings_of(line):
            n = norm(s)
            for pat, label in BROKEN:
                if re.search(pat, n):
                    hits.append((rel, i, label, s.strip()[:120]))
            if CJK.search(s):
                hits.append((rel, i, 'CJK', s.strip()[:120]))
            if LATIN_ADJ.search(s):
                hits.append((rel, i, 'لاتيني ملاصق', s.strip()[:120]))

# إحصاء مصطلح التلميذ/الطالب في البنك
q = json.load(open('/home/z/my-project/src/data/qbank.json'))
tl = st = 0
for x in q['questions']:
    blob = x['question'] + x.get('reason', '') + ' '.join(o['text'] for o in x['options'])
    tl += len(re.findall(r'تلاميذ|تلميذ', blob))
    st += len(re.findall(r'طلاب|طالب', blob))
for c in q['concepts']:
    blob = c['title'] + c['explanation'] + c.get('example', '')
    tl += len(re.findall(r'تلاميذ|تلميذ', blob))
    st += len(re.findall(r'طلاب|طالب', blob))

print(f'=== إصابات النصوص: {len(hits)} ===')
for h in hits[:80]:
    print(' | '.join(h))
print(f'=== مصطلح: تلميذ/تلاميذ = {tl} مقابل طالب/طلاب = {st} ===')
