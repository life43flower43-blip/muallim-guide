# -*- coding: utf-8 -*-
"""مدقق patch_b1.json مقابل b_pool.json وb_ids1.json.
يطبع حالة كل رقعة ثم حكم الملف كاملاً، ويخرج برمز 0 عند النجاح الكامل."""
import json, os, sys
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
PATCH = os.path.join(BASE, 'patch_b1.json')
POOL = os.path.join(BASE, 'b_pool.json')
IDS = os.path.join(BASE, 'b_ids1.json')

AR_DIGITS_EAST = set('\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669')
AR_DIGITS_EXT = set('\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9')
WEST_DIGITS = set('0123456789')
LATIN = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
DOUBLE_QUOTES = set('"\u201c\u201d')
BANNED_PHRASES = ['كل ما سبق', 'جميع ما سبق', 'لا شيء مما سبق', 'ولا مما سبق', 'جميع ما ذكر']

def char_violations(text):
    """أي محرف غير الحرف العربي أو المسافة يعد مخالفة (يشمل الأرقام واللاتيني والإيموجي والرموز والتنصيص وأسطر جديدة)."""
    bad = []
    for ch in text:
        if ch == ' ':
            continue
        ok = ('\u0621' <= ch <= '\u063a') or ('\u0641' <= ch <= '\u064a') or ('\u064b' <= ch <= '\u065f') or ('\u0671' <= ch <= '\u06d3') or ch in '\u060c\u061f\u0640\u0670'
        if not ok:
            tag = 'رقم شرقي' if ch in AR_DIGITS_EAST | AR_DIGITS_EXT else (
                  'رقم غربي' if ch in WEST_DIGITS else (
                  'حرف لاتيني' if ch in LATIN else (
                  'تنصيص مزدوج' if ch in DOUBLE_QUOTES else (
                  'سطر جديد' if ch in '\n\r\t' else 'رمز/محرف غير عربي'))))
            bad.append('%r(%s)' % (ch, tag))
    return bad

def words(text):
    return [w for w in text.split(' ') if w]

def main():
    with open(POOL, encoding='utf-8') as f:
        pool = {q['id']: q for q in json.load(f)}
    with open(IDS, encoding='utf-8') as f:
        ids = json.load(f)
    with open(PATCH, encoding='utf-8') as f:
        data = json.load(f)

    problems = []
    patches = data.get('patches', [])
    if len(patches) != len(ids):
        problems.append('عدد الرقع %d بدل %d' % (len(patches), len(ids)))
    patch_ids = [p.get('id') for p in patches]
    if patch_ids != ids:
        problems.append('معرفات الرقع أو ترتيبها لا يطابق b_ids1.json')
    if len(set(patch_ids)) != len(patch_ids):
        problems.append('تكرار معرفات داخل الملف')

    wrong_texts_global = Counter()
    ok_count = 0
    for p in patches:
        pid = p.get('id', '؟؟')
        errs = []
        q = pool.get(pid)
        if q is None:
            errs.append('المعرف غير موجود في b_pool.json')
        else:
            popts = q['options']
            p_ci = [k for k, o in enumerate(popts) if o['isCorrect']][0]
            opts = p.get('options', [])
            if len(opts) != 4:
                errs.append('عدد الخيارات %d بدل 4' % len(opts))
            else:
                ci = [k for k, o in enumerate(opts) if o.get('isCorrect')]
                if len(ci) != 1:
                    errs.append('عدد الخيارات الصحيحة %d بدل 1' % len(ci))
                else:
                    ci = ci[0]
                    if ci != p_ci:
                        errs.append('موضع الصحيح %d بدل %d' % (ci, p_ci))
                    if opts[ci]['text'] != popts[p_ci]['text']:
                        errs.append('نص الصحيح غير مطابق حرفياً')
                texts = [o.get('text', '') for o in opts]
                if len(set(texts)) != len(texts):
                    errs.append('تكرار نص داخل السؤال')
                for ph in BANNED_PHRASES:
                    for t in texts:
                        if ph in t:
                            errs.append('عبارة ممنوعة: %s' % ph)
                L = len(popts[p_ci]['text'])
                for k, t in enumerate(texts):
                    if k == ci:
                        continue
                    ln = len(t)
                    if not (0.7 * L <= ln <= 1.3 * L):
                        errs.append('طول بديل %d خارج الهامش: %d مقابل الصحيح %d (نسبة %.0f%%)' % (k, ln, L, 100.0 * ln / L))
                    wc = len(words(t))
                    if not (5 <= wc <= 25):
                        errs.append('بديل %d بعدد كلمات %d خارج 5-25' % (k, wc))
                    cv = char_violations(t)
                    if cv:
                        errs.append('بديل %d يحوي محارب ممنوعة: %s' % (k, ' '.join(cv[:5])))
                    if t != t.strip() or '  ' in t:
                        errs.append('بديل %d بمسافات زائدة' % k)
                    wrong_texts_global[t] += 1
        if errs:
            for e in errs:
                print('FAIL %s: %s' % (pid, e))
        else:
            print('OK   %s' % pid)
            ok_count += 1

    reused = {t: c for t, c in wrong_texts_global.items() if c > 1}
    if reused:
        for t in reused:
            print('FAIL GLOBAL: بديل منسوخ حرفياً في أكثر من سؤال: %s' % t[:40])
    else:
        print('OK   GLOBAL: لا تكرار حرفي للبدائل الخاطئة بين الأسئلة')

    print('---')
    total_ok = ok_count and not reused and not [p for p in problems]
    if problems:
        for pr in problems:
            print('FAIL FILE: %s' % pr)
    passed = (ok_count == len(ids)) and (len(patches) == len(ids)) and not reused and not problems
    if passed:
        print('ALL CHECKS PASSED: %d/%d رقعة سليمة والملف كله مطابق للشروط' % (ok_count, len(ids)))
        sys.exit(0)
    else:
        print('CHECKS FAILED: سليم %d من %d' % (ok_count, len(ids)))
        sys.exit(1)

if __name__ == '__main__':
    main()
