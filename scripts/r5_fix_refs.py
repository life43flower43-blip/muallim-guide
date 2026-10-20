#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
المصلح الآلي للإحالات (مرحلة 1):
- تبديل الترتيبي المشار إليه بموضع الصواب في الإشادة المحضة الآمنة فقط، بوعي الجنس النحوي.
- كشف التعارض الداخلي (ذكر موضع الصواب نفيًا في موضع آخر) → يدوي.
- تجميد ترتيب الخيارات fixedOrder=true لكل سؤال تفسيره يحيل على أرقام.
- إخراج قوائم المراجعة اليدوية: md/… تحت review/.
لا يلمس correct/isCorrect إطلاقًا.
"""
import json, re, copy, sys

BANK = 'public/data/qbank.json'
OUT = 'review/r5_ref_report2.json'

# ── إعادة استخدام تعريفات الماسح ──
src = open('scripts/r5_scan_refs2.py', encoding='utf-8').read().split('\n')
head = '\n'.join(src[:96])  # حتى قبل d = json.load
head = head.replace("d = json.load(open(BANK, encoding='utf-8'))", "pass")
head = head.replace("rep = {", "_rep = {")
ns = {}
exec(head, ns)
norm = ns['norm']; PAT_MAIN = ns['PAT_MAIN']; PAT_BARE = ns['PAT_BARE']
ORD_WORDS = ns['ORD_WORDS']; classify_clause = ns['classify_clause']
SENT_SPLIT = ns['SENT_SPLIT']; CLAUSE_SPLIT = ns['CLAUSE_SPLIT']
content_toks = ns['content_toks']; overlap = ns['overlap']

# ── أدوات التبديل بوعي الجنس ──
FEM_NOUNS = ('الإجابة', 'الاجابه', 'العبارة', 'العباره', 'الجملة', 'الجمله')
MASC_FORMS = {1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس'}
FEM_FORMS = {1: 'الأولى', 2: 'الثانية', 3: 'الثالثة', 4: 'الرابعة', 5: 'الخامسة'}
PAT_MAIN_RAW = re.compile(r'(الخيار|الإجابة|الاجابه|البيان|البديل|العبارة|العباره|الجواب|الأداء|الاداء|الاختيار)\s*(?:رقم\s*)?(الأولى?|الاولى?|الثانية?|الثانيه?|الثالثة?|الثالثه?|الرابعة?|الرابعه?|الخامسة?|الخامسه?|[1-5])')
PAT_BARE_RAW = re.compile(r'(?:^|[\s،؛,])(?:وال|فال|بال|ال)(الأولى?|الاولى?|الثانية?|الثانيه?|الثالثة?|الثالثه?|الرابعة?|الرابعه?|الخامسة?|الخامسه?)(?=[\s،؛,.]|$)')

def retarget_clause(clause, old_pos, new_pos):
    """يستبدل الترتيبي في الشطر بوعي جنس الاسم. يعيد (شطر جديد، هل نجح)"""
    m = PAT_MAIN_RAW.search(clause)
    noun = m.group(1) if m else ''
    fem = any(n in norm(noun) for n in ('اجابه', 'عباره', 'جمله'))
    forms = FEM_FORMS if fem else MASC_FORMS
    pat = PAT_MAIN_RAW if m else PAT_BARE_RAW
    mm = pat.search(clause)
    if not mm:
        return clause, False
    g = 2 if m else 1
    s, e = mm.span(g)
    old_word = mm.group(g)
    new_word = str(new_pos) if old_word.isdigit() else forms.get(new_pos, MASC_FORMS[new_pos])
    return clause[:s] + new_word + clause[e:], True

def question_mentions(q):
    """استخراج كل إحالات السؤال: (pos، الشطر الخاص، النوع)"""
    opts = q.get('options', [])
    reason = q.get('reason') or ''
    out = []
    for sent in SENT_SPLIT.split(reason):
        if not sent.strip():
            continue
        clauses = CLAUSE_SPLIT.split(sent)
        seen = any(PAT_MAIN.search(norm(c)) for c in clauses)
        chunks = []
        pending = None
        for cl in clauses:
            cn = norm(cl)
            m = PAT_MAIN.search(cn)
            pos = None
            if m:
                num = m.group(2)
                pos = int(num) if num.isdigit() else ORD_WORDS.get(norm(num))
                if not (pos and pos <= len(opts)):
                    pos = None
            if pos is None and seen:
                mb = PAT_BARE.search(cn)
                if mb:
                    pos = ORD_WORDS.get(mb.group(1))
                    if not (pos and 1 <= pos <= len(opts)):
                        pos = None
            if pos:
                chunks.append([pos, cl, cl])
                pending = len(chunks) - 1
                continue
            if pending is not None and cn.lstrip().startswith('و'):
                chunks[pending][2] += '،' + cl
            else:
                chunks.append([None, cl, cl])
                pending = None
        for pos, own, merged in chunks:
            if pos is None:
                continue
            out.append({'pos': pos, 'own': own, 'merged': merged, 'kind': classify_clause(own)})
    return out

# ── التحميل ──
rep = json.load(open(OUT, encoding='utf-8'))
d = json.load(open(BANK, encoding='utf-8'))
Q = {q['id']: q for q in d['questions']}

swap_applied, swap_conflict, manual_attr = [], [], []
for x in rep['attr_mismatch']:
    q = Q[x['id']]
    opts = q['options']
    ref, cp = x['ref_pos'], x['correct_pos']
    ov = x.get('overlap', {})
    def O(p):
        return ov.get(str(p), ov.get(p, 0))
    pure = O(ref) == 0
    best_is_correct = x.get('best') == cp and O(cp) >= O(ref)
    if not (pure or best_is_correct):
        manual_attr.append(x)
        continue
    # كشف التعارض: هل موضع الصواب مذكور نفيًا أو إسنادًا في موضع آخر من التفسير؟
    ms = [m for m in question_mentions(q) if not (m['pos'] == ref and m['own'] == x['clause'])]
    conflict = any(m['pos'] == cp and m['kind'] in ('neg', 'attr') for m in ms)
    other_ref_attr = sum(1 for m in ms if m['pos'] == ref and m['kind'] == 'attr')
    if conflict or other_ref_attr > 0:
        swap_conflict.append(x)
        continue
    new_clause, ok = retarget_clause(x['clause'], ref, cp)
    if not ok or new_clause == x['clause']:
        swap_conflict.append(x)
        continue
    old_reason = q['reason']
    if old_reason.count(x['clause']) != 1:
        swap_conflict.append(x)
        continue
    q['reason'] = old_reason.replace(x['clause'], new_clause, 1)
    swap_applied.append({'id': x['id'], 'from': ref, 'to': cp, 'clause': x['clause'],
                         'new': new_clause})

# ── التجميد ──
freeze_ids = set(rep['freeze_needed']) | {x['id'] for x in rep['attr_mismatch']} | \
             {x['id'] for x in rep['neg_of_correct']} | {x['id'] for x in rep['desc_displaced']}
frozen = 0
for qid in freeze_ids:
    q = Q.get(qid)
    if q and q.get('type') == 'mcq' and not q.get('fixedOrder'):
        q['fixedOrder'] = True
        frozen += 1

json.dump(d, open(BANK, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'تبديلات مطبقة: {len(swap_applied)} | تعارض → يدوي: {len(swap_conflict)} | غير آمنة: {len(manual_attr)}')
print(f'مجمدة الآن: {frozen} (الإجمالي المطلوب: {len(freeze_ids)})')

# ── قوائم المراجعة اليدوية ──
def dump(entries, path, title, show_opts=True):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(f'# {title}\n\n')
        for x in entries:
            f.write(f"## {x['id']}  يشير=خ{x['ref_pos']}  الصحيح=خ{x['correct_pos']}\n")
            f.write(f"- الشطر: {x['clause']}\n")
            f.write(f"- التفسير: {x.get('reason','')}\n")
            if show_opts and 'option_texts' in x:
                for i, t in enumerate(x['option_texts'], 1):
                    f.write(f"- خ{i}: {t}\n")
            f.write('\n')

dump(manual_attr, 'review/r5_manual_attr.md', 'إسنادات تحتاج قرارًا يدويًا (غير آمنة للتبديل)')
dump(swap_conflict, 'review/r5_swap_conflict.md', 'تبديلات أوقفها كشف التعارض — تحتاج قرارًا')
dump(rep['neg_of_correct'], 'review/r5_neg_review.md', 'نفي الخيار الصحيح — تحتاج قرارًا')
dump(rep['desc_displaced'], 'review/r5_desc_review.md', 'إحالات وصفية مزاحة')
dump(rep['mistake_framing'], 'review/r5_mf_review.md', 'إطار الخطأ — تحقق', show_opts=False)

# سجل التبديلات
with open('review/r5_swap_log.md', 'w', encoding='utf-8') as f:
    f.write('# سجل التبديلات الآلية\n\n')
    for x in swap_applied:
        f.write(f"- {x['id']}: خ{x['from']} → خ{x['to']} | «{x['clause']}» → «{x['new']}»\n")

json.dump({'applied': swap_applied, 'conflict': [{'id': x['id']} for x in swap_conflict],
           'manual': [{'id': x['id']} for x in manual_attr]},
          open('review/r5_fix_state.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('قوائم المراجعة في review/r5_*.md')
