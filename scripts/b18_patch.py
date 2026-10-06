# -*- coding: utf-8 -*-
"""ترقيع أثر خلل الاسم الأول في batch15/16/17_selected.md + إصلاح شذوذ القسم 56 في 16."""
import re
from pathlib import Path

BASE = Path('/home/z/my-project/docs')

def split_top(s):
    """تقسيم على ، مع حماية الأقواس المعقوفة [...]"""
    out, buf, depth = [], [], 0
    for ch in s:
        if ch == '[': depth += 1
        elif ch == ']': depth -= 1
        if ch in '،,' and depth == 0:
            out.append(''.join(buf).strip()); buf = []
        else:
            buf.append(ch)
    out.append(''.join(buf).strip())
    return [x for x in out if x]

def vis(seg):
    return re.sub(r'\[[^\]]*\]', '', seg).strip().strip('.').strip()

def norm(s):
    s = re.sub(r'[\u064B-\u0652\u0640]', '', s)
    s = s.replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ة','ه').replace('ى','ي')
    return re.sub(r'\s+', ' ', s).strip()

# (ملف، الاسم، المصدر الأسبق)
EDITS = [
 ('batch15_selected.md', 'فجوة الانتقال', 4),
 ('batch15_selected.md', 'دراسة الحالة', 13),
 ('batch15_selected.md', 'الإرشاد المهني', 14),
 ('batch15_selected.md', 'تعليم اللاجئين', 13),
 ('batch16_selected.md', 'التوقعات الوالدية', 13),
 ('batch16_selected.md', 'الاستعداد الأكاديمي', 15),
 ('batch17_selected.md', 'قلق الاختبار', 15),
 ('batch17_selected.md', 'الذاكرة الحسية', 13),
 ('batch17_selected.md', 'الذاكرة قصيرة المدى', 13),
 ('batch17_selected.md', 'منحنى النسيان', 13),
 ('batch17_selected.md', 'التواصل البصري', 16),
 ('batch17_selected.md', 'شدة التدخل', 13),
 ('batch17_selected.md', 'الادعاء', 13),
 ('batch17_selected.md', 'مؤشرات النجاح', 15),
 ('batch17_selected.md', 'الاستقلالية المهنية', 16),
 ('batch17_selected.md', 'الابتكار التعليمي', 16),
 ('batch17_selected.md', 'التواصل', 16),
]

CLUSTERS = {}  # ملف -> [(أول، آخر، عنوان الصف)]
for fn in ['batch15_selected.md', 'batch16_selected.md', 'batch17_selected.md']:
    rows = []
    for ln in (BASE / fn).read_text(encoding='utf-8').splitlines():
        m = re.match(r'^\| (.+?) \((\d+)-(\d+)\) \| (\d+) \| (\d+) \|$', ln.strip())
        if m:
            rows.append((int(m.group(2)), int(m.group(3)), ln, m))
    CLUSTERS[fn] = rows

delta = {}  # ملف -> [مختار-، مكرر+، واصل-]
for fn, name, src in EDITS:
    path = BASE / fn
    lines = path.read_text(encoding='utf-8').splitlines()
    hits = []
    for i, ln in enumerate(lines):
        if ln.startswith('**مختار') and re.search(r'(?:^|\s|،|,)' + re.escape(name) + r'(?:\s|،|,|$|\[)', ln.replace('**مختار (','').replace('):**','')) :
            pass
    # بحث أدق: قسمة علوية لكل سطر مختار
    hits = []
    for i, ln in enumerate(lines):
        if ln.startswith('**مختار'):
            body = re.sub(r'^\*\*مختار \(\d+\):\*\*\s*', '', ln).rstrip('.')
            for seg in split_top(body):
                if norm(vis(seg)) == norm(name):
                    hits.append((i, seg))
    assert len(hits) == 1, f'{fn}: {name} ورد {len(hits)} مرة في مختار'
    i, seg = hits[0]
    # رقم القسم الحالي
    sno = None
    for j in range(i, -1, -1):
        m = re.match(r'^## (\d+)\.', lines[j])
        if m:
            sno = int(m.group(1)); break
    assert sno, f'لا قسم لـ {name} في {fn}'
    # 1) إزالة من مختار وإنقاص العدد
    old = lines[i]
    m = re.match(r'^(\*\*مختار \()(\d+)(\):\*\*)', old)
    n_old = int(m.group(2)); n_new = n_old - 1
    body = re.sub(r'^\*\*مختار \(\d+\):\*\*\s*', '', old).rstrip('.')
    segs = split_top(body)
    segs = [s for s in segs if norm(vis(s)) != norm(name)]
    pre = f'**مختار ({n_new}):** '
    lines[i] = pre + '، '.join(segs) + '.' if segs else ''
    # 2) إضافة إلى مكرر نفس القسم
    j_muk = None
    k = i + 1
    while k < len(lines) and not lines[k].startswith('## '):
        if lines[k].startswith('**مكرر'):
            j_muk = k
        k += 1
    tag = f'{name} [مكرر — ({src})]'
    if j_muk is not None:
        old = lines[j_muk]
        mm = re.match(r'^(\*\*مكرر[^:]*\()(\d+)(\):\*\*)', old)
        m_old = int(mm.group(2))
        body = re.sub(r'^\*\*مكرر[^:]*\(\d+\):\*\*\s*', '', old).rstrip('.')
        lines[j_muk] = f'{mm.group(1)}{m_old+1}{mm.group(3)} ' + body + '، ' + tag + '.'
        m_delta = 1
    else:
        # أدخل سطر مكرر جديد بعد سطر مختار (أو بعد آخر سطر محتوى قبل عدّ)
        ins = i + 1
        while ins < len(lines) and lines[ins].startswith('>'):
            break
        lines.insert(i + 1, f'**مكرر/مدمج (1):** {tag}.')
        m_delta = 1
    # 3) عدّ
    for k in range(i, min(i + 6, len(lines))):
        mm = re.match(r'^(> عدّ: )(\d+)( مختارًا \+ )(\d+)( مكررًا = )(\d+)( ✓)$', lines[k])
        if mm:
            a, b, t = int(mm.group(2)) - 1, int(mm.group(4)) + 1, int(mm.group(6))
            lines[k] = f'{mm.group(1)}{a}{mm.group(3)}{b}{mm.group(5)}{t}{mm.group(7)}'
            break
    d = delta.setdefault(fn, [0, 0, 0])
    d[0] += 1; d[1] += 1
    # 4) صف العنقود
    for a0, b0, ln, m in CLUSTERS[fn]:
        if a0 <= sno <= b0:
            new = f'| {m.group(1)} ({a0}-{b0}) | {int(m.group(4))-1} | {int(m.group(5))+1} |'
            idx = lines.index(ln)
            lines[idx] = new
            break
    path.write_text('\n'.join(lines), encoding='utf-8')
    print(f'✔ {fn} §{sno}: {name} → مكرر ({src})')

# 5) شذوذ القسم 56 في 16
p16 = BASE / 'batch16_selected.md'
txt = p16.read_text(encoding='utf-8')
old_line = '**مختار (8):** تعريف القرار، البدائل، تحليل المخاطر [محتمل مكرر — قسم إدارة المخاطر (12، ب) يُحسم مرجعيًا]، تحليل التكلفة، القرار تحت اليقين، القرار تحت المخاطرة، القرار تحت عدم اليقين، القرار المبني على البيانات.'
new_line = '**مختار (7):** تعريف القرار، البدائل، تحليل المخاطر [محتمل مكرر — قسم إدارة المخاطر (12) — يُحسم مرجعيًا]، تحليل التكلفة، القرار تحت اليقين، القرار تحت المخاطرة، القرار تحت عدم اليقين، القرار المبني على البيانات.'
assert old_line in txt, 'سطر الشذوذ غير موجود'
txt = txt.replace(old_line, new_line)
txt = txt.replace('> عدّ: 8 مختارًا + 4 مكررًا = 12 ✓', '> عدّ: 7 مختارًا + 4 مكررًا = 11 ✓')
d = delta.setdefault('batch16_selected.md', [0, 0, 0]); d[0] += 1; d[2] += 1
# صف عنقود القسم 56
for a0, b0, ln, m in CLUSTERS['batch16_selected.md']:
    if a0 <= 56 <= b0:
        new = f'| {m.group(1)} ({a0}-{b0}) | {int(m.group(4))-1} | {int(m.group(5))} |'
        txt = txt.replace(ln, new)
        break
p16.write_text(txt, encoding='utf-8')
print('✔ 16 §56: إصلاح الشذوذ (8→7)')

# 6) تحديث الملخصات
SUM = {'batch15_selected.md': (910, 692, 1602), 'batch16_selected.md': (1092, 1252, 2344), 'batch17_selected.md': (694, 1970, 2664)}
for fn, (sel0, dup0, tot0) in SUM.items():
    d = delta.get(fn, [0, 0, 0])
    sel_n, dup_n, tot_n = sel0 - d[0], dup0 + d[1], tot0 - d[2]
    p = BASE / fn
    txt = p.read_text(encoding='utf-8')
    txt = re.sub(r'^## ملخص: واصل \d+ \| مختار \d+ \| مكرر/مدمج \d+',
                 f'## ملخص: واصل {tot_n} | مختار {sel_n} | مكرر/مدمج {dup_n}', txt, count=1, flags=re.M)
    txt = re.sub(r'\| \*\*الإجمالي\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \|',
                 f'| **الإجمالي** | **{sel_n}** | **{dup_n}** |', txt, count=1)
    p.write_text(txt, encoding='utf-8')
    print(f'✔ ملخص {fn}: مختار {sel_n} | مكرر {dup_n} | واصل {tot_n}')
