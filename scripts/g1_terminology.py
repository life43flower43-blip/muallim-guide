# -*- coding: utf-8 -*-
"""G1/TERMINO — توحيد مصطلح التلميذ/الطالب على مستوى البنك وكل نصوص التطبيق.
القرار: «طالب» هو الغالب (٢٧٨٨ مقابل ٥٣٨) — توحيد كامل بتحويل صرفي آمن:
  تلميذ → طالب (يشمل: التلميذ، تلميذة، تلميذان، تلميذين، تلميذتي…)
  تلاميذ → طلاب (يشمل: التلاميذ، تلاميذنا…)
مع نسخة احتياطية وتحقق صرفي بعدي."""
import json, re, shutil, glob, sys

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'
BAK = f'{ROOT}/scripts/fix1_baks/qbank_pre_termino.json'

shutil.copy(QB, BAK)

MAP = [('تلاميذ', 'طلاب'), ('تلميذ', 'طالب')]

def convert(s: str) -> tuple[str, int]:
    n = 0
    for a, b in MAP:
        if a in s:
            n += s.count(a)
            s = s.replace(a, b)
    return s, n

# ١) البنك — تحويل شجري لكل قيم السلاسل ما عدا مفاتيح الهوية
SKIP_KEYS = {'id', 'conceptId', 'courseId', 'type', 'difficulty', 'fixedOrder'}
def walk(obj):
    global bank_hits
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in SKIP_KEYS:
                continue
            if isinstance(v, str):
                obj[k], n = convert(v); bank_hits += n
            else:
                walk(v)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str):
                obj[i], n = convert(v); bank_hits += n
            else:
                walk(v)

q = json.load(open(QB, encoding='utf-8'))
bank_hits = 0
for x in q['questions']:
    walk(x)
for c in q['concepts']:
    walk(c)
json.dump(q, open(QB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ٢) ملفات الشيفرة ذات النصوص التربوية
TS_FILES = ['src/lib/lab-scenarios-a.ts', 'src/lib/lab-scenarios-b.ts', 'src/lib/lab-scenarios-c.ts',
            'src/lib/lab-exam.ts', 'src/lib/challenges.ts', 'src/lib/scenarios.ts', 'src/lib/firstday.ts',
            'src/lib/socratic.ts', 'src/lib/peer.ts', 'src/lib/personas.ts']
ts_hits = 0
for rel in TS_FILES:
    p = f'{ROOT}/{rel}'
    try:
        t = open(p, encoding='utf-8').read()
    except FileNotFoundError:
        continue
    t2, k = convert(t)
    if k:
        open(p, 'w', encoding='utf-8').write(t2)
        ts_hits += k

# ٣) تحقق صرفي بعدي
raw = open(QB, encoding='utf-8').read()
bad = []
for pat in [r'تلميذ', r'تلاميذ', r'طلابة(?![تة])', r'الطالبب', r'طالبب', r'الطلابا(?![ء-ي])']:
    ms = re.findall(pat, raw)
    if ms:
        bad.append((pat, len(ms)))
# صيغ سليمة يجب أن توجد
must = ['طالبة', 'طالبان', 'الطلاب']
missing = [m for m in must if m not in raw]
print('bank_hits:', bank_hits, '| ts_hits:', ts_hits)
print('bad_leftover:', bad, '| missing_expected:', missing)
src_txt = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(f'{ROOT}/src/**/*.ts*', recursive=True))
print('src_leftover_talmez:', len(re.findall(r'تلميذ|تلاميذ', src_txt)))
if bad or missing:
    # رجّع النسخة عند فشل التحقق
    shutil.copy(BAK, QB)
    print('VERIFICATION FAILED — bank restored')
    sys.exit(1)
print('TERMINO OK')
