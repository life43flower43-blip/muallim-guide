# -*- coding: utf-8 -*-
"""مدقق رقع إثراء البدائل للدفعة ب٢ — يقرأ patch_b2.json وb_pool.json وb_ids2.json ويفحص كل القواعد الصارمة.

شروط التحقق:
- ثلاث وثلاثون رقعة، كل معرفات b_ids2.json حاضرة وبالترتيب نفسه.
- أربعة خيارات لكل رقعة، خيار صحيح واحد.
- نص الصحيح مطابق حرفياً لموقعه في b_pool.json.
- طول كل بديل خاطئ ضمن هامش ٣٠٪ من طول الصحيح (بين ٧٠٪ و١٣٠٪).
- صفر أرقام (شرقية أو غربية) أو حروف لاتينية أو إيموجي أو رموز أو تنصيص مزدوج أو أسطر جديدة في كل النصوص.
- العبارات الممنوعة: كل ما سبق، جميع ما سبق، لا شيء مما سبق، ولا مما سبق، جميع ما ذكر.
- عدد كلمات كل بديل خاطئ بين ٥ و٢٥، ولا تكرار نصوص داخل السؤال، ولا نسخ بديل حرفياً بين سؤالين مختلفين.
"""
import json
import sys

BASE = '/home/z/my-project/scripts/optfix'

FORBIDDEN_PHRASES = ['كل ما سبق', 'جميع ما سبق', 'لا شيء مما سبق', 'ولا مما سبق', 'جميع ما ذكر']
LATIN = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
EASTERN_DIGITS = set('٠١٢٣٤٥٦٧٨٩') | set('۰۱۲۳۴۵۶۷۸۹')


def _is_allowed_char(c: str) -> bool:
    """محرف عربي أو مسافة أو ترقيم عربي أساسي فقط — أقل صفعة من ذلك إيموجي أو رمز أو لاتيني أو رقم."""
    o = ord(c)
    if c == ' ':
        return True
    if 0x0621 <= o <= 0x064A:      # حروف عربية
        return True
    if 0x064B <= o <= 0x0652:      # حركات وتنوين
        return True
    if o == 0x0640:                # تطويل
        return True
    if o == 0x0670:                # ألف خنجرية
        return True
    if c in '،؛؟':                 # ترقيم عربي
        return True
    return False


def check_text(text: str, where: str, errors: list) -> None:
    if '\n' in text or '\r' in text:
        errors.append(f'{where}: يحتوي سطراً جديداً')
    if '"' in text or '«' in text or '»' in text or '“' in text or '”' in text:
        errors.append(f'{where}: يحتوي تنصيصاً مزدوجاً')
    for i, ch in enumerate(text):
        if ch.isdigit() or ch in EASTERN_DIGITS:
            errors.append(f'{where}: يحتوي رقماً ({ch!r}) عند الحرف {i}')
            break
    for ch in text:
        if ch in LATIN:
            errors.append(f'{where}: يحتوي حرفاً لاتينياً ({ch!r})')
            break
    for ph in FORBIDDEN_PHRASES:
        if ph in text:
            errors.append(f'{where}: يحتوي عبارة ممنوعة «{ph}»')
    for i, ch in enumerate(text):
        if not _is_allowed_char(ch):
            errors.append(f'{where}: محرف غير مسموح {ch!r} (U+{ord(ch):04X}) عند الحرف {i}')
            break


def main() -> int:
    ids2 = json.load(open(f'{BASE}/b_ids2.json', encoding='utf-8'))
    pool = json.load(open(f'{BASE}/b_pool.json', encoding='utf-8'))
    patch = json.load(open(f'{BASE}/patch_b2.json', encoding='utf-8'))

    byid = {q['id']: q for q in pool}
    plist = patch.get('patches', [])
    errors = []

    # ١) العدد
    if len(plist) != 33:
        errors.append(f'عدد الرقع {len(plist)} بدلاً من ٣٣')

    # ٢) المعرفات حاضرة وبالترتيب نفسه، لا زيادة ولا نقصان
    ids_patch = [p.get('id') for p in plist]
    if set(ids_patch) != set(ids2):
        errors.append(f'معرفات ناقصة: {[i for i in ids2 if i not in ids_patch]}')
        errors.append(f'معرفات زائدة: {[i for i in ids_patch if i not in ids2]}')
    elif ids_patch != ids2:
        errors.append('ترتيب الرقع يخالف ترتيب القائمة')

    seen_wrong_global = {}
    passed = 0

    for idx, p in enumerate(plist):
        qid = p.get('id')
        where = f'رقعة {idx + 1} ({qid})'
        local_errors = []
        if qid not in byid:
            errors.append(f'{where}: المعرف ليس في b_pool.json')
            continue
        q = byid[qid]
        opts = p.get('options', [])

        # ٣) أربعة خيارات وصحيح واحد
        if len(opts) != 4:
            local_errors.append(f'عدد الخيارات {len(opts)} بدلاً من ٤')
        corr = [j for j, o in enumerate(opts) if o.get('isCorrect') is True]
        if len(corr) != 1:
            local_errors.append(f'عدد الخيارات الصحيحة {len(corr)} بدلاً من ١')

        if len(opts) == 4 and len(corr) == 1:
            ci = corr[0]
            pool_corr = [j for j, o in enumerate(q['options']) if o.get('isCorrect') is True]

            # ٤) موضع الصحيح ونصه حرفياً
            if len(pool_corr) != 1:
                local_errors.append('السؤال الأصلي بلا صحيح واحد في b_pool.json')
            else:
                if ci != pool_corr[0]:
                    local_errors.append(f'موضع الصحيح {ci} يخالف موضع الأصل {pool_corr[0]}')
                if opts[ci]['text'] != q['options'][pool_corr[0]]['text']:
                    local_errors.append('نص الصحيح غير مطابق حرفياً للأصل')
                if opts[ci]['text'] != q['correct']:
                    local_errors.append('نص الصحيح لا يطابق حقل correct في الأصل')
                check_text(opts[ci]['text'], f'{where} (الصحيح)', local_errors)

            # ٥) هامش الأطوال وفحوص النصوص للبدائل الخاطئة
            L = len(q['correct'])
            lo, hi = 0.7 * L, 1.3 * L
            texts = [o['text'] for o in opts]
            if len(set(texts)) != len(texts):
                local_errors.append('تكرار نصوص متطابقة داخل السؤال الواحد')
            for j, o in enumerate(opts):
                if o.get('isCorrect') is True:
                    continue
                t = o['text']
                check_text(t, f'{where} (بديل {j})', local_errors)
                n = len(t)
                if not (lo <= n <= hi):
                    local_errors.append(
                        f'طول البديل {j} = {n} خارج الهامش [{lo:.1f}، {hi:.1f}] لطول الصحيح {L}')
                wc = len(t.split())
                if not (5 <= wc <= 25):
                    local_errors.append(f'كلمات البديل {j} = {wc} خارج ٥..٢٥')
                if t in seen_wrong_global:
                    local_errors.append(f'البديل {j} نسخة حرفية من بديل في {seen_wrong_global[t]}')
                seen_wrong_global[t] = qid

        if local_errors:
            errors.extend(f'{where}: {e}' for e in local_errors)
        else:
            passed += 1
            print(f'OK  {where}')

    if errors:
        print('\nفشل التحقق — المخالفات:')
        for e in errors:
            print(' -', e)
        print(f'\nالنتيجة: {passed}/{len(plist)} رقعة سليمة')
        return 1

    print(f'\nALL CHECKS PASSED — ٣٣ رقعة، معرفات القائمة كاملة بالترتيب، أربعة خيارات لكل رقعة، '
          f'صحيح واحد مطابق حرفياً بموضعه الأصلي، أطوال البدائل ضمن هامش ٣٠٪، '
          f'صفر أرقام أو لاتيني أو إيموجي أو تنصيص مزدوج أو أسطر جديدة، '
          f'لا تكرار داخل الأسئلة ولا بينها.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
