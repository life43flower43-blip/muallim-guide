# -*- coding: utf-8 -*-
"""P11: إصلاح الأحرف الصينية في بنك الأسئلة + حذف الملفات الميتة + مسح سلامة العربية."""
import json, re, os, shutil, sys

ROOT = '/home/z/my-project'
QB = f'{ROOT}/src/data/qbank.json'

CJK = re.compile(r'[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]')

# ---- 1) إصلاحات النصوص الستة (استبدال حرفي دقيق يحفظ تنسيق الملف) ----
FIXES = [
    # C089 — "结果显示" (أظهرت النتائج) + ربط الجمل
    ("ثم أعاد إجراء اختبار تحصيلي موحد.结果显示 أن نسبة النجاح ارتفعت",
     "ثم أعاد إجراء اختبار تحصيلي موحد، وأظهرت النتائج أن نسبة النجاح ارتفعت"),
    # C141 — "陌生" (الغربة)
    ("مما كسر حاجز الغ陌生 بينهما",
     "مما كسر حاجز الغربة بينهما"),
    # C146 — "轮流" (متناوبة) + فعل التوزيع + وصل الجملة
    ("توزع المعلمة رنا على تلاميذ الصف الخامس الابتدائي مهام يومية轮流 لرعاية الفناء المدرسي، حيث يتولى كل طالب مسؤولية ري نبتة معينة أو تنظيف مكان معين. يتعلمون من خلال",
     "وزعت المعلمة رنا على تلاميذ الصف الخامس الابتدائي مهام يومية متناوبة لرعاية الفناء المدرسي، حيث يتولى كل طالب مسؤولية ري نبتة معينة أو تنظيف مكان معين. ويتعلمون من خلال"),
    # C156 — "凝结" (يتكاثف) + «في صف الصف» + «قلم» + دقة التجربة الفيزيائية
    ("في صف الصف الخامس، قلم المعلم خالد الطلاب بحل لغز فيزيائي عن السحب، فلم يذكر الجواب مباشرة، بل طلب منهم صنع تجربة بسيطة باستخدام زجاجة ماء باردة وقطعة قماش، ثم رأوا بخاراً يت凝结 على الجدران، فاستنتجوا بأن السحب هي قطرات ماء في الهواء.",
     "كلَّف المعلم خالد طلابه في الصف الخامس بحل لغز فيزيائي عن السحب، فلم يذكر الجواب مباشرة، بل طلب منهم إجراء تجربة بسيطة باستخدام زجاجة ماء باردة، فلاحظوا قطرات ماء دقيقة تتكاثف على سطح الزجاجة، فاستنتجوا بأن السحب هي قطرات ماء معلقة في الهواء."),
    # C177 — "而是" (بل) + «ابنه» لوالدة = «ابنها» + «لما» الزمنية + وضوح النتيجة
    ("لما علمت والدة الطالب ريان في الصف الرابع الابتدائي بأن ابنه يواجه صعوبة في حفظ جدول الضرب، لم تطلب منه الحفظ عن ظهر قلب،而是 اشترت له بطاقات تعليمية وصممت مسابقة يومية في السيارة، وألحقت به نادياً رياضياً لتعزيز ثقته بنفسه، فشهدت نتائجه تحسناً ملحوظاً بعد شهرين.",
     "عندما علمت والدة الطالب ريان في الصف الرابع الابتدائي بأن ابنها يواجه صعوبة في حفظ جدول الضرب، لم تطلب منه الحفظ عن ظهر قلب، بل اشترت له بطاقات تعليمية وصممت له مسابقة يومية في السيارة، وألحقت به نادياً رياضياً لتعزيز ثقته بنفسه، فشهد مستواه تحسنًا ملحوظًا بعد شهرين."),
    # C181 — "轮流ًا" (التناوب)
    ("واتفقا على أن يتكلم أحدهم عندما يتوقف الآخر، فتعلما轮流ًا أن يستمعا لبعضهما ويكملا الفكرة معًا.",
     "واتفقا على أن يتكلم أحدهم عندما يتوقف الآخر، فتعلما التناوبَ أن يستمع كل منهما إلى صاحبه ويكملا الفكرة معًا."),
]

txt = open(QB, encoding='utf-8').read()
applied = 0
for old, new in FIXES:
    n = txt.count(old)
    if n != 1:
        print(f'!! توقعنا موضعًا واحدًا ووجدنا {n} للنص: {old[:60]}...')
        sys.exit(1)
    txt = txt.replace(old, new)
    applied += 1
open(QB, 'w', encoding='utf-8').write(txt)
print(f'[{applied}/6] إصلاحات نصية طُبقت')

# ---- 2) التحقق من صحة JSON وغياب CJK في البنية كلها ----
d = json.load(open(QB, encoding='utf-8'))

def walk(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items(): yield from walk(v, f'{p}.{k}')
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from walk(v, f'{p}[{i}]')
    elif isinstance(o, str): yield p, o

bad = [(p, s) for p, s in walk(d) if CJK.search(s)]
print(f'مفاهيم: {len(d["concepts"])} | أسئلة: {len(d["questions"])} | سلاسل فيها CJK: {len(bad)}')
for p, s in bad: print('  بقي:', p, s[:120])

# ---- 3) حذف الملفات الميتة (غير مستوردة في أي مكان) ----
removed = []
for f in ['src/data/qbank.bak_optenrich.json', 'src/data/qbank.bak_optorder.json']:
    if os.path.exists(f'{ROOT}/{f}'):
        os.remove(f'{ROOT}/{f}'); removed.append(f)
exdir = f'{ROOT}/src/data/generated/ex'
if os.path.isdir(exdir):
    n = len(os.listdir(exdir)); shutil.rmtree(exdir)
    removed.append(f'src/data/generated/ex/ ({n} ملفًا)')
print('حُذف:', '; '.join(removed))

# ---- 4) مسح نهائي لكل src/ عن CJK ورموز خفية ----
INVIS = re.compile(r'[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]')
issues = []
for dp, _, fs in os.walk(f'{ROOT}/src'):
    for f in fs:
        if not f.endswith(('.ts', '.tsx', '.css', '.json')): continue
        fp = os.path.join(dp, f)
        with open(fp, encoding='utf-8') as fh:
            for i, line in enumerate(fh, 1):
                if CJK.search(line): issues.append(('CJK', fp.replace(ROOT+'/', ''), i, line.strip()[:100]))
                if INVIS.search(line): issues.append(('INVISIBLE', fp.replace(ROOT+'/', ''), i, repr(line.strip()[:80])))
print(f'=== مشاكل متبقية في src/: {len(issues)}')
for t, f, i, s in issues: print(f'  {t} {f}:{i} {s}')
print('DONE-OK' if not issues and not bad else 'DONE-WITH-ISSUES')
