# -*- coding: utf-8 -*-
"""
مدقق رقع الدفعة ب٣: يقرأ patch_b3.json ويقارنه بـ b_pool.json وb_ids3.json.
يطبع حالة كل رقعة ثم الخلاصة، ويخرج برمز 0 عند سلامة كل الشروط و1 عند أي مخالفة.
"""
import json
import sys

BASE = '/home/z/my-project/scripts/optfix'
IDS_FILE = f'{BASE}/b_ids3.json'
POOL_FILE = f'{BASE}/b_pool.json'
PATCH_FILE = f'{BASE}/patch_b3.json'

EXPECTED_COUNT = 33
FORBIDDEN_PHRASES = ["كل ما سبق", "جميع ما سبق", "لا شيء مما سبق", "ولا مما سبق", "جميع ما ذكر"]
DIGITS = "0123456789٠١٢٣٤٥٦٧٨٩"
LATIN = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
QUOTES = "\"\u201c\u201d"
WS_CHARS = "\n\r\t"


def char_allowed(c: str) -> bool:
    """يسمح بالحرف العربي وعلاماته وعلامات ترقيمه (٠٦٠ج–٠٦٥ف) ومدّ القرة والمسافة فقط."""
    if c == ' ':
        return True
    o = ord(c)
    return 0x060C <= o <= 0x065F or o == 0x0670


def text_issues(t: str):
    iss = []
    if any(d in t for d in DIGITS):
        iss.append('يحوي رقماً')
    if any(l in t for l in LATIN):
        iss.append('يحوي حرفاً لاتينياً')
    if any(q in t for q in QUOTES):
        iss.append('يحوي تنصيصاً مزدوجاً')
    if any(w in t for w in WS_CHARS):
        iss.append('يحوي سطراً جديداً')
    bad = sorted({c for c in t if not char_allowed(c)})
    if bad:
        iss.append('رموز غير مسموحة: ' + ' '.join(bad))
    for p in FORBIDDEN_PHRASES:
        if p in t:
            iss.append('عبارة ممنوعة: ' + p)
    return iss


def main() -> int:
    ids = json.load(open(IDS_FILE, encoding='utf-8'))
    pool = {q['id']: q for q in json.load(open(POOL_FILE, encoding='utf-8'))}
    patches = json.load(open(PATCH_FILE, encoding='utf-8')).get('patches', [])

    problems = []

    if len(patches) != EXPECTED_COUNT:
        problems.append(f'عدد الرقع {len(patches)} لا يساوي {EXPECTED_COUNT}')
    if [p.get('id') for p in patches] != list(ids):
        problems.append('المعرفات لا تطابق قائمة b_ids3 أو ترتيبها')
    missing = [i for i in ids if i not in {p.get('id') for p in patches}]
    if missing:
        problems.append('معرفات مفقودة: ' + ' '.join(missing))

    seen_distractors = {}
    for p in patches:
        pid = p.get('id', '؟')
        errs = []
        opts = p.get('options', [])

        if pid not in pool:
            errs.append('المعرف غير موجود في البنك')
        elif len(opts) != 4:
            errs.append(f'عدد الخيارات {len(opts)} بدل أربعة')
        else:
            pool_opts = pool[pid]['options']
            ci = next(i for i, o in enumerate(pool_opts) if o.get('isCorrect'))
            correct_text = pool_opts[ci]['text']

            ncorrect = sum(1 for o in opts if o.get('isCorrect') is True)
            if ncorrect != 1:
                errs.append(f'عدد الخيارات الصحيحة {ncorrect} بدل واحد')
            if not (0 <= ci < len(opts)) or not opts[ci].get('isCorrect') or opts[ci].get('text') != correct_text:
                errs.append(f'الصحيح غير مطابق حرفياً أو ليس في موضعه الأصلي ({ci})')

            lc = len(correct_text)
            for i, o in enumerate(opts):
                t = o.get('text', '')
                errs.extend(f'خيار{i}: {m}' for m in text_issues(t))
                if o.get('isCorrect') is not True:
                    lw, wc = len(t), len(t.split())
                    lo, hi = 0.7 * lc, 1.3 * lc
                    if not (lo - 1e-9 <= lw <= hi + 1e-9):
                        errs.append(f'خيار{i}: طوله {lw} خارج هامش [{lo:.1f}..{hi:.1f}] للصحيح {lc}')
                    if not (5 <= wc <= 25):
                        errs.append(f'خيار{i}: كلماته {wc} خارج ٥..٢٥')
                    if t in seen_distractors:
                        errs.append(f'خيار{i}: نسخة حرفية من بديل في {seen_distractors[t]}')
                    else:
                        seen_distractors[t] = pid

            texts = [o.get('text', '') for o in opts]
            if len(set(texts)) != len(texts):
                errs.append('تكرار نصين متطابقين داخل السؤال')

        if errs:
            problems.append(pid)
            print(f'{pid}: مخالف — ' + ' | '.join(errs))
        else:
            print(f'{pid}: سليم')

    if problems:
        print(f'\nفشل التحقق: {len(problems)} رقعة بها مخالفات')
        return 1
    print(f'\nتم التحقق كاملاً: {EXPECTED_COUNT} رقعة سليمة، كل الشروط مستوفاة')
    return 0


if __name__ == '__main__':
    sys.exit(main())
