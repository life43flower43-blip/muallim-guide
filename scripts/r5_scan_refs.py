#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
الماسح الشامل (الجولة 5 من الاستجابة للمراجع الخارجي):
يصنف كل إحالة رقمية إلى خيارات داخل تفسيرات MCQ، ويكشف:
  B) إسناد الصواب إلى خيار غير الصحيح (تناقض إحالة)
  C) نفي الخيار الصحيح نفسه (التفسير يقول إنه خاطئ!)
  D) إزاحة الإحالات الوصفية (الجملة تصف محتوى خيار آخر بدقة أعلى)
  F) أسئلة تفسيرها يحيل على أرقام وترتيبها غير مجمّد (تُخلط عند العرض)
كذلك فحص سريع لأسئلة الصح/الخطأ: تفسير يختم بعكس الجواب.
الإخراج: review/r5_ref_report.json + ملخص.
"""
import json, re, unicodedata, collections

BANK = 'public/data/qbank.json'
OUT = 'review/r5_ref_report.json'

DIAC = re.compile(r'[\u064B-\u0652\u0670\u0640]')  # تشكيل وتطويل

def norm(s):
    s = DIAC.sub('', s or '')
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي').replace('ة', 'ه')
    return s

ORD_WORDS = {
    'الاول': 1, 'الثاني': 2, 'الثالث': 3, 'الرابع': 4, 'الخامس': 5,
    'الاولي': 1, 'الثانيه': 2, 'الثالثه': 3, 'الرابعه': 4, 'الخامسه': 5,
}
# نمط أساسي: كلمة خيار/إجابة/بيان/بديل/عبارة + ترتيبي
PAT_MAIN = re.compile(r'(الخيار|الاجابه|البيان|البديل|العباره|الجواب|الاداء|الاختيار)\s*(?:رقم\s*)?(الاولي?|الثانيه?|الثالثه?|الرابعه?|الخامسه?|[1-5])')
# نمط ثانوي: ترتيبي مستقل + وحده/وحدها أو صواب صريح
PAT_STANDALONE = re.compile(r'(?:وال|فال|ال)(الاولي?|الثانيه?|الثالثه?|الرابعه?)\s+(?:وحدها?|هو الصواب|هي الصواب|هو الصح|هي الصح|صحيح|سليم|دقيق|الانسب|الادق|الافضل|يجيب|يعطي)')

ATTR_CUES = ['عين', 'وحده', 'وحدها', 'صواب', 'صحيح', 'سليم', 'دقيق', 'الانسب', 'الادق', 'الافضل',
             'يجيب', 'يعطي التعريف', 'يوازن', 'يطابق', 'يجمع', 'يعبر', 'يعبر عن', 'يلتزم', 'يعتمد',
             'يغطي', 'يحقق', 'وجه الصواب', 'يكمن الصواب', 'الاجابه الصحيحه', 'الخيار الصحيح',
             'هو المطلوب', 'المطلوب', 'الافضل', 'يفضل', 'اصح', 'الاصح', 'توظيف', 'الاساس']
NEG_CUES = ['خاطئ', 'خطا', 'لا يصح', 'لا تعبر', 'لا تعبر عن', 'غير صحيح', 'غير دقيق', 'مخالف',
            'بعيد', 'لا ينطبق', 'ينفي', 'يسقط', 'سقوط', 'لا يصلح', 'ليس', 'لا يمثل', 'لا يعكس',
            'لا يجوز', 'بلا سند', 'لا يوافق', 'تناقض', 'مضلل', 'لا تتوفر', 'لا يعب ر', 'تفلت',
            'لا يرتبط', 'لا يخص', 'لا يوصف', 'لا يعد', 'لا يبرر', 'عكس المقصود', 'لا يشكل']

SENT_SPLIT = re.compile(r'[.؟!؛\n]')

def sentences(text):
    return [s.strip() for s in SENT_SPLIT.split(text) if s.strip()]

def tokenize(s):
    s = norm(s)
    s = re.sub(r'[^\u0600-\u06FF\s]', ' ', s)
    toks = []
    for w in s.split():
        w = re.sub(r'^(وال|فال|بال|كال|ال|لل|و|ف|ب|ل)', '', w)
        w = re.sub(r'(ون|ين|ان|هم|ها|ه|نا|كم|ية|ي)$', '', w) if len(w) > 4 else w
        if len(w) >= 3:
            toks.append(w)
    return toks

STOP = set('في من على عن الى الى ان أو او التي الذي هذا هذه ذلك تلك هو هي كل ما لا لم لن قد ثم مع عند اما اما أيضا ايضا بين حتى غير بعد قبل مثل نفس عبر دون بدون سواء خلال حول لدي لذا لذلك بحسب وفق كذلك فقط إلا الا'.split())

def content_toks(s):
    return set(t for t in tokenize(s) if t not in STOP and len(t) >= 3)

def overlap(a_toks, b_text):
    b = content_toks(b_text)
    return len(a_toks & b)

d = json.load(open(BANK, encoding='utf-8'))
report = {'meta': {}, 'attribution_mismatch': [], 'negation_of_correct': [], 'descriptive_displaced': [],
          'ambiguous': [], 'freeze_needed': [], 'tf_reason_contradiction': []}

counts = collections.Counter()
mcq = tf = 0
for q in d['questions']:
    if q.get('type') == 'mcq':
        mcq += 1
    else:
        tf += 1
    reason = q.get('reason') or ''
    correct = q.get('correct') or ''

    if q.get('type') == 'tf' or (q.get('type') != 'mcq'):
        # فحص الصح/الخطأ: الختام يقول العكس
        snorm = norm(reason)
        is_true_q = norm(correct) in ('صواب', 'صحيح', 'صحيحه', 'صوابا')
        if is_true_q and re.search(r'العباره خاطئه|العباره خطا|عباره خاطئه', snorm):
            report['tf_reason_contradiction'].append({'id': q['id'], 'correct': correct,
                'tail': reason[-160:]})
        if (not is_true_q) and re.search(r'العباره صحيحه|صحيحه تماما', snorm) and len(reason) > 40:
            report['tf_reason_contradiction'].append({'id': q['id'], 'correct': correct,
                'tail': reason[-160:]})
        continue

    opts = q.get('options', [])
    if len(opts) < 2:
        continue
    try:
        cpos = next(i + 1 for i, o in enumerate(opts) if o.get('isCorrect'))
    except StopIteration:
        continue
    correct_text = opts[cpos - 1]['text']

    found_any = False
    attributed = collections.defaultdict(list)   # pos -> [sent idx]
    negated = collections.defaultdict(list)
    descriptive = collections.defaultdict(list)

    for si, sent in enumerate(sentences(reason)):
        snorm = norm(sent)
        matches = list(PAT_MAIN.finditer(snorm))
        if not matches:
            m2 = PAT_STANDALONE.search(snorm)
            if m2:
                word = m2.group(1)
                pos = ORD_WORDS.get(word)
                if pos and pos <= len(opts):
                    # ترتيبي مستقق بسياق صواب — اعتبره إسناداً
                    if pos != cpos:
                        report['attribution_mismatch'].append(
                            {'id': q['id'], 'kind': 'standalone', 'ref': m2.group(0),
                             'ref_pos': pos, 'correct_pos': cpos, 'sent': sent,
                             'reason': reason, 'correct_text': correct_text,
                             'option_texts': [o['text'] for o in opts]})
                        counts['standalone_attr_mismatch'] += 1
                        found_any = True
            continue
        for m in matches:
            word, num = m.group(1), m.group(2)
            if num.isdigit():
                pos = int(num)
            else:
                pos = ORD_WORDS.get(norm(num))  # البحث بالترتيبي وليس بكلمة «الخيار»
            if not pos or pos > len(opts):
                continue
            found_any = True
            # تصنيف الجملة
            has_neg = any(c in snorm for c in NEG_CUES)
            has_attr = any(c in snorm for c in ATTR_CUES)
            if has_attr and not has_neg:
                attributed[pos].append(si)
            elif has_neg:
                negated[pos].append(si)
            else:
                descriptive[pos].append(si)

    if not found_any:
        continue

    # F) تجميد الترتيب إذا احتوى التفسير أي إحالة
    if not q.get('fixedOrder'):
        report['freeze_needed'].append(q['id'])

    # B) إسناد صواب لخيار غير الصحيح
    for pos, sis in attributed.items():
        if pos != cpos:
            # محتوى الجملة أقرب لأي خيار؟
            sent_toks = content_toks(' '.join(sentences(reason)[s] for s in sis))
            ov = {p: overlap(sent_toks, opts[p - 1]['text']) for p in range(1, len(opts) + 1)}
            report['attribution_mismatch'].append(
                {'id': q['id'], 'kind': 'attribution', 'ref_pos': pos, 'correct_pos': cpos,
                 'sent': ' || '.join(sentences(reason)[s] for s in sis),
                 'reason': reason, 'correct_text': correct_text,
                 'option_texts': [o['text'] for o in opts],
                 'overlap': ov,
                 'best': max(ov, key=ov.get)})
            counts['attr_mismatch'] += 1

    # C) نفي الخيار الصحيح
    for pos, sis in negated.items():
        if pos == cpos:
            report['negation_of_correct'].append(
                {'id': q['id'], 'kind': 'negation', 'ref_pos': pos, 'correct_pos': cpos,
                 'sent': ' || '.join(sentences(reason)[s] for s in sis),
                 'reason': reason, 'correct_text': correct_text,
                 'option_texts': [o['text'] for o in opts]})
            counts['neg_of_correct'] += 1

    # D) وصف مزاح: الجملة الوصفية أقرب محتوىً لخيار آخر من الخيار المشار إليه
    for pos, sis in descriptive.items():
        if pos == cpos:
            continue  # وصف للصحيح بلا صيغة إسناد — لا ضرر
        sent_toks = content_toks(' '.join(sentences(reason)[s] for s in sis))
        if not sent_toks:
            continue
        ov = {p: overlap(sent_toks, opts[p - 1]['text']) for p in range(1, len(opts) + 1)}
        best = max(ov, key=ov.get)
        if ov.get(best, 0) >= 3 and ov[best] >= 2 * max(ov.get(pos, 0), 1) and best != pos:
            report['descriptive_displaced'].append(
                {'id': q['id'], 'kind': 'descriptive', 'ref_pos': pos, 'correct_pos': cpos,
                 'best': best, 'sent': ' || '.join(sentences(reason)[s] for s in sis),
                 'reason': reason, 'correct_text': correct_text,
                 'option_texts': [o['text'] for o in opts], 'overlap': ov})
            counts['desc_displaced'] += 1

    # أ) إسناد لعدة مواضع = غموض
    if len(attributed) > 1:
        report['ambiguous'].append({'id': q['id'], 'attributed': sorted(attributed),
                                    'correct_pos': cpos, 'reason': reason})

report['meta'] = {'mcq': mcq, 'tf': tf, 'counts': dict(counts),
                  'freeze_needed': len(report['freeze_needed'])}
json.dump(report, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

print('MCQ:', mcq, '| TF/آخر:', tf)
print('عدادات:', dict(counts))
print('يحتاج تجميد ترتيب:', len(report['freeze_needed']))
print('B) إسناد خاطئ:', len(report['attribution_mismatch']))
print('C) نفي الصحيح:', len(report['negation_of_correct']))
print('D) وصف مزاح:', len(report['descriptive_displaced']))
print('TF تناقض ختام:', len(report['tf_reason_contradiction']))
