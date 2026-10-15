#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
الماسح الشامل v2 — تصنيف على مستوى الشطر (clause):
- تقسيم الجملة عند الفواصل المنقوطة والفواصل، مع إلحاق الشطر المتابِع (ب«و») بالإحالة السابقة.
- إشارات إسناد ونفي محسنة، مع معالجة نفي «لا» والإبطاء «لكن/قد يكون».
- كشف أسئلة إطار «الخطأ/الاستثناء» التي يصح فيها مدح خيار غير المفتاح.
الإخراج: review/r5_ref_report2.json
"""
import json, re

BANK = 'public/data/qbank.json'
OUT = 'review/r5_ref_report2.json'
DIAC = re.compile(r'[\u064B-\u0652\u0670\u0640]')

def norm(s):
    s = DIAC.sub('', s or '')
    return s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي').replace('ة', 'ه')

ORD_WORDS = {'الاول': 1, 'الثاني': 2, 'الثالث': 3, 'الرابع': 4, 'الخامس': 5,
             'الاولي': 1, 'الثانيه': 2, 'الثالثه': 3, 'الرابعه': 4, 'الخامسه': 5}
PAT_MAIN = re.compile(r'(الخيار|الاجابه|البيان|البديل|العباره|الجواب|الاداء|الاختيار)\s*(?:رقم\s*)?(الاولي?|الثانيه?|الثالثه?|الرابعه?|الخامسه?|[1-5])')
# ترتيبي محذوف الاسم في سياق تعداد («والثالث يعطي...» بعد ذكر الخيار الثاني)
PAT_BARE = re.compile(r'(?:^|[\s،؛,])(?:وال|فال|بال|ال)(الاولي?|الثانيه?|الثالثه?|الرابعه?|الخامسه?)(?=[\s،؛,.]|$)')

# إشارات إسناد إيجابية (بعد تطبيعها)
ATTR_CUES = ['عين الخيار', 'عين الاجابه', 'هو الصواب', 'هي الصواب', 'وجه الصواب', 'يكمن الصواب',
             'الاجابه الصحيحه', 'الخيار الصحيح', 'الاجابه الاصح', 'الاصح', 'الانسب', 'الادق',
             'الافضل', 'الاشمل', 'الاعمق', 'صحيح', 'صواب', 'سليم', 'دقيق', 'يعبر عن', 'يعبر',
             'يطابق', 'يجمع', 'يوازن', 'يلتزم', 'يتوافق', 'يفسر', 'يوضح المعنى',
             'يعكس', 'يوصف', 'يوفر', 'يحقق', 'يلبي', 'يغطي', 'يجيب', 'يعطي تعريف', 'يوظف',
             'توظيف سليم', 'عين', 'يستوفي', 'يفضل', 'الاولويه', 'يصف هذا', 'يصفه', 'بدقه',
             'وحده', 'وحدها']
# أفعال تجعل «وحده/وحدها» ساخرة لا إسنادية: «ينسبها للتمارين وحدها»
PEJORATIVE_WITH_ALONE = ['ينسب', 'يحصر', 'يعتمد', 'يقصر', 'يحبس', 'يترك', 'يرد', 'يرجع', 'يخزّل', 'يعزو']
NEG_CUES = ['خاطئ', 'خطا', 'لا يصح', 'لا تعبر', 'لا تعبر عن', 'غير صحيح', 'غير دقيق', 'مخالف',
            'بعيد', 'لا ينطبق', 'ينفي', 'يسقط', 'سقوط', 'لا يصلح', 'ليس', 'لا يمثل', 'لا يعكس',
            'لا يجوز', 'بلا سند', 'لا يوافق', 'تناقض', 'مضلل', 'لا تتوفر', 'تفلت', 'لا يرتبط',
            'لا يخص', 'لا يوصف', 'لا يعد', 'لا يبرر', 'عكس المقصود', 'عكس الحقيقه', 'عكس',
            'ينكر', 'خلاف الحقيقه', 'خلاف', 'يقلب', 'يلغي', 'يهمل', 'يتجاهل', 'يرد المشكله',
            'تفاقم', 'يلفت', 'خارج', 'يحصر', 'يزرع', 'يقطع', 'يربك', 'يفقد', 'يخالف', 'يخلط',
            'يعود الى الفهم الخاطئ', 'خلط', 'لا يجيب', 'غير تربوي', 'يفرض', 'يحمّل', 'يحمل المسووليه',
            'غير مرتبط', 'يضع', 'عبء', 'يزعم', 'يدعي', 'يلغم', 'مصيبه', 'توهم', 'توهه',
            'لا يفي', 'يظلم', 'يستهزئ', 'يتسرب', 'لا يتناسب', 'مبالغه', 'مبالغ', 'اقصر',
            'اكثر من اللازم', 'غامض', 'مبهم', 'يستبعد', 'مرفوض', 'لا يناسب', 'يوحي',
            'يضمر', 'يقلل', 'سقوطه', 'يرفض', 'غير وارد', 'شاذ', 'يفترض', 'لا يفس', 'بلا مسوغ',
            'يخل', 'يغفل', 'يهدر', 'يضيع', 'يقلب', 'يشوه', 'يحرف', 'لا يليق', 'يعوق', 'يعيق']
QUALIFIERS = ['لكن', 'غير ان', 'قد يكون صحيحا', 'قد يكون صح', 'بيد ان', 'الا ان']

SENT_SPLIT = re.compile(r'[.؟!؛\n]')
CLAUSE_SPLIT = re.compile(r'[،,]')

def content_toks(s):
    s = norm(s)
    s = re.sub(r'[^\u0600-\u06FF\s]', ' ', s)
    toks = []
    for w in s.split():
        w = re.sub(r'^(وال|فال|بال|كال|ال|لل|و|ف|ب|ل)', '', w)
        w = re.sub(r'(ون|ين|ان|هم|ها|ه|نا|كم|يه|ي)$', '', w) if len(w) > 4 else w
        if len(w) >= 3:
            toks.append(w)
    return set(toks)

def overlap(a_toks, b_text):
    return len(a_toks & content_toks(b_text))

def has_negated_cue(snorm, cue):
    """هل توجد الإشارة دون سابقة نفي مباشرة؟"""
    for m in re.finditer(re.escape(cue), snorm):
        pre = snorm[max(0, m.start() - 4):m.start()]
        if pre.strip().endswith('لا') or pre.strip().endswith('غير'):
            continue
        return True
    return False

def classify_clause(cl):
    """يعيد 'attr' | 'neg' | 'desc' — القطبية من شطر الإحالة نفسه فقط"""
    sn = norm(cl)
    has_neg = any(has_negated_cue(sn, c) for c in NEG_CUES)
    has_attr = False
    for c in ATTR_CUES:
        if has_negated_cue(sn, c):
            # «وحده/وحدها» مع فعل ساخر = نفي لا إسناد
            if c in ('وحده', 'وحدها') and any(p in sn for p in PEJORATIVE_WITH_ALONE):
                continue
            has_attr = True
            break
    has_qual = any(q in sn for q in QUALIFIERS)
    if has_attr and has_qual:
        return 'neg'          # «قد يكون صحيحا لكن...» = إبطاء ناف
    if has_attr and not has_neg:
        return 'attr'
    if has_neg:
        return 'neg'
    return 'desc'

d = json.load(open(BANK, encoding='utf-8'))
rep = {'meta': {}, 'attr_mismatch': [], 'neg_of_correct': [], 'desc_displaced': [],
       'mistake_framing': [], 'freeze_needed': [], 'tf_contradiction': []}
counts = {'attr': 0, 'neg': 0, 'desc': 0, 'mf': 0}

for q in d['questions']:
    qtype = q.get('type')
    reason = q.get('reason') or ''
    correct = q.get('correct') or ''

    if qtype != 'mcq':
        sn = norm(reason)
        is_true = norm(correct) in ('صح', 'صواب', 'صحيح', 'صحيحه', 'صوابا', 'صحيحا')
        # الحكم الختامي: آخر جملة فقط
        tail = sn.split('.')[-1] if '.' in sn else sn
        tail = sn[-200:]
        # بلاغة الردع: «ومن يرى العبارة خطأً يفترض...» تدعم العبارة لا تنقضها
        refute_rhetoric = 'من يري العباره' in tail
        if is_true and not refute_rhetoric and re.search(r'العباره خاطئه|العباره خطا|عباره خاطئه', tail):
            rep['tf_contradiction'].append({'id': q['id'], 'correct': correct, 'tail': reason[-180:]})
        elif (not is_true) and not refute_rhetoric and re.search(r'فالعباره صحيحه|العباره صحيحه تماما|العباره صحيحه وسليمه', tail):
            rep['tf_contradiction'].append({'id': q['id'], 'correct': correct, 'tail': reason[-180:]})
        continue

    opts = q.get('options', [])
    if len(opts) < 2:
        continue
    try:
        cpos = next(i + 1 for i, o in enumerate(opts) if o.get('isCorrect'))
    except StopIteration:
        continue
    correct_text = opts[cpos - 1]['text']
    qtext = norm(q.get('question') or '')
    # أسئلة «حدد الخطأ/الاستثناء»: مدح خيار آخر «صحيح» ليس تناقضاً
    mistake_framing = bool(re.search(r'الخطا الشائع|ما الخطا|اين الخطا|اى ما يلي يمثل الخطا|يمثل الخطا|الاستثناء|ما عدا|الغير صحيحه|غير صحيحه في|ليس من|يخالف|تخالف|يتناقض مع|تتناقض مع|يعد عيبا|عيبا للمنهج|عيوب المنهج|الميزه|المزيه', qtext))

    mentions = []  # (pos, clause_text, kind)
    for sent in SENT_SPLIT.split(reason):
        if not sent.strip():
            continue
        clauses = CLAUSE_SPLIT.split(sent)
        cur = None  # آخر (pos, chunk) لإلحاق المتابِعات
        pending_idx = None
        chunks = []
        seen_any_mention = any(PAT_MAIN.search(norm(c)) for c in clauses)
        for cl in clauses:
            cn = norm(cl)
            m = PAT_MAIN.search(cn)
            pos = None
            if m:
                num = m.group(2)
                pos = int(num) if num.isdigit() else ORD_WORDS.get(norm(num))
                if not (pos and pos <= len(opts)):
                    pos = None
            if pos is None and seen_any_mention:
                mb = PAT_BARE.search(cn)
                if mb:
                    pos = ORD_WORDS.get(mb.group(1))
                    if pos and not (1 <= pos <= len(opts)):
                        pos = None
            if pos:
                chunks.append([pos, cl, cl])   # [pos، الشطر الخاص، الشطر المدمج]
                pending_idx = len(chunks) - 1
                continue
            if pending_idx is not None and cn.lstrip().startswith('و'):
                chunks[pending_idx][2] += '،' + cl   # المدمج للمحتوى فقط — القطبية تبقى للشطر الخاص
            else:
                chunks.append([None, cl, cl])
                pending_idx = None
        for pos, own_cl, merged in chunks:
            if pos is None:
                continue
            kind = classify_clause(own_cl)
            mentions.append((pos, own_cl, kind, merged, sent.strip()))

    if not mentions:
        continue
    if not q.get('fixedOrder'):
        rep['freeze_needed'].append(q['id'])

    for pos, own_cl, kind, merged, whole in mentions:
        # إدعاء حصري («وحده/وحدها/عين/هو الصواب») لا يُقمع بإطار الخطأ —
        # لأنه ينص على أن الخيار المشار إليه هو الجواب نفسه
        exclusive = any(c in norm(own_cl) for c in ('وحده', 'وحدها', 'عين الخيار', 'عين الاجابه',
                                                    'هو الصواب', 'هي الصواب'))
        if kind == 'attr' and pos != cpos:
            if mistake_framing and not exclusive:
                rep['mistake_framing'].append({'id': q['id'], 'ref_pos': pos, 'correct_pos': cpos,
                                               'clause': own_cl, 'reason': reason,
                                               'option_texts': [o['text'] for o in opts]})
                counts['mf'] += 1
                continue
            ct = content_toks(merged)
            ov = {p: overlap(ct, opts[p - 1]['text']) for p in range(1, len(opts) + 1)}
            rep['attr_mismatch'].append({'id': q['id'], 'ref_pos': pos, 'correct_pos': cpos,
                                         'clause': own_cl, 'sentence': whole, 'reason': reason,
                                         'correct_text': correct_text,
                                         'option_texts': [o['text'] for o in opts],
                                         'overlap': ov, 'best': max(ov, key=ov.get)})
            counts['attr'] += 1
        elif kind == 'neg' and pos == cpos:
            if mistake_framing:
                continue  # نفي المفتاح في إطار «الخطأ» متوقع
            rep['neg_of_correct'].append({'id': q['id'], 'ref_pos': pos, 'correct_pos': cpos,
                                          'clause': own_cl, 'sentence': whole, 'reason': reason,
                                          'correct_text': correct_text,
                                          'option_texts': [o['text'] for o in opts]})
            counts['neg'] += 1
        elif kind == 'desc' and pos != cpos:
            ct = content_toks(merged)
            if not ct:
                continue
            ov = {p: overlap(ct, opts[p - 1]['text']) for p in range(1, len(opts) + 1)}
            best = max(ov, key=ov.get)
            if ov.get(best, 0) >= 3 and best != pos and ov[best] >= 2 * max(ov.get(pos, 0), 1):
                rep['desc_displaced'].append({'id': q['id'], 'ref_pos': pos, 'correct_pos': cpos,
                                              'best': best, 'clause': own_cl, 'sentence': whole,
                                              'reason': reason, 'correct_text': correct_text,
                                              'option_texts': [o['text'] for o in opts], 'overlap': ov})
                counts['desc'] += 1

rep['meta'] = {'counts': counts, 'freeze_needed': len(rep['freeze_needed'])}
json.dump(rep, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('عدادات:', counts)
print('B إسناد خاطئ:', len(rep['attr_mismatch']))
print('C نفي الصحيح:', len(rep['neg_of_correct']))
print('D وصف مزاح:', len(rep['desc_displaced']))
print('إطار الخطأ (لا تُعد تناقضاً):', len(rep['mistake_framing']))
print('تجميد مطلوب:', len(rep['freeze_needed']))
print('TF تناقض:', len(rep['tf_contradiction']))
