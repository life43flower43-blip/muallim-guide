#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""بوابة الجودة النهائية بعد جولة الإصلاحات R5."""
import json, re, collections

BANK = 'public/data/qbank.json'
d = json.load(open(BANK, encoding='utf-8'))
qs = d['questions']
issues = []

# 1) البنية العامة
ids = [q['id'] for q in qs]
dup = [i for i, c in collections.Counter(ids).items() if c > 1]
if dup:
    issues.append(f'معرفات مكررة: {dup[:10]}')
empty_q = [q['id'] for q in qs if not (q.get('question') or '').strip()]
if empty_q:
    issues.append(f'أسئلة فارغة: {empty_q[:10]}')

# 2) correct ↔ isCorrect لكل الأسئلة
bad_key = []
for q in qs:
    opts = q.get('options', [])
    ci = [i for i, o in enumerate(opts) if o.get('isCorrect')]
    if len(ci) != 1:
        bad_key.append((q['id'], f'عدد الصحيح={len(ci)}'))
        continue
    if q.get('type') == 'mcq':
        if opts[ci[0]]['text'] != q.get('correct'):
            bad_key.append((q['id'], 'correct ≠ نص الخيار الصحيح'))
    else:
        if q.get('correct') not in ('صح', 'خطأ'):
            bad_key.append((q['id'], f'correct غير صالح: {q.get("correct")!r}'))
        for o in opts:
            if o['text'] not in ('صح', 'خطأ'):
                bad_key.append((q['id'], f'خيار TF غير قياسي: {o["text"]!r}'))
                break
if bad_key:
    issues.append(f'مفاتيح غير متسقة: {bad_key[:10]} (المجموع {len(bad_key)})')

# 3) تفسيرات فارغة أو قصيرة جدًا بعد التعديلات
short = [q['id'] for q in qs if len((q.get('reason') or '').strip()) < 40]
if short:
    issues.append(f'تفسيرات قصيرة/فارغة: {short[:10]} (المجموع {len(short)})')

# 4) أسئلة معدلة: التحقق من نصوصها الجديدة
check = {
    'Q011': ['ستة وأربعين كروموسوماً'],
    'Q641': ['أربع وستون كروموسوماً'],
    'Q604': ['ربع النباتات قزمة تقريباً'],
    'Q1010': ['تقسيم الطلاب إلى مجموعات حسب مستوى الفهم'],
    'Q652': ['موضع وراثي محدد'],
    'Q846': ['منعكس فسيولوجي'],
    'Q673': ['أقصى ما تسمح به المنهجية'],
    'Q1591': ['مدى انتباه الطفل'],
    'Q1167': ['التحقق من سلامة الطفل'],
}
# تحقق C006 (مفهوم)
c006 = next((c for c in d['concepts'] if c['id'] == 'C006'), None)
if not c006 or 'ستة وأربعين كروموسوماً' not in (c006.get('explanation') or ''):
    issues.append('C006: لم يُصحح عدد الكروموسومات')
Qm = {q['id']: q for q in qs}
for qid, needles in check.items():
    q = Qm.get(qid)
    if not q:
        issues.append(f'{qid}: مفقود!')
        continue
    blob = ' '.join([q.get('question',''), q.get('reason',''), q.get('correct','')] +
                    [o['text'] for o in q.get('options', [])])
    for nd in needles:
        if nd not in blob:
            issues.append(f'{qid}: النص الجديد غير موجود: {nd}')

# 5) الماسح النهائي للإحالات (استدعاء الماسح v3 عبر import محمي)
import subprocess, sys
r = subprocess.run([sys.executable, 'scripts/r5_scan_refs2.py'], capture_output=True, text=True)
print(r.stdout.strip())
if r.returncode != 0:
    issues.append('الماسح انهار: ' + r.stderr[-200:])

# 6) مفاتيح محدثة: تحقق أن الخيار الصحيح واحد في كل سؤال أُعيد بناؤه
for qid in ['Q652', 'Q679', 'Q593', 'Q673', 'Q846', 'Q708', 'Q1167']:
    q = Qm[qid]
    n = sum(1 for o in q['options'] if o.get('isCorrect'))
    if n != 1:
        issues.append(f'{qid}: isCorrect count={n}')

print()
if issues:
    print('❌ ملاحظات بوابة الجودة:')
    for i in issues:
        print(' -', i)
    raise SystemExit(1)
print('✅ بوابة الجودة: البنية والمفاتيح والنصوص المحدثة كلها سليمة')
