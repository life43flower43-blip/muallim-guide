# -*- coding: utf-8 -*-
"""patch2: تراجع عن تسميتين مزدوجتين في 15 + إكمال نقل 10 أسماء في 17 + شذوذ §56 في 16 + إعادة بناء الجداول والملخصات."""
import re
from pathlib import Path

BASE = Path('/home/z/my-project/docs')

def split_top(s):
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

def find_section(lines, i):
    for j in range(i, -1, -1):
        m = re.match(r'^## (\d+)\.', lines[j])
        if m: return int(m.group(1)), j
    return None, None

def section_span(lines, i):
    _, start = find_section(lines, i)
    end = start + 1
    while end < len(lines) and not lines[end].startswith('## '):
        end += 1
    return start, end

def move_to_mukarrir(lines, name, src):
    """نقل من مختار إلى مكرر. يعيد True إن حدث نقل."""
    for i, ln in enumerate(lines):
        if not ln.startswith('**مختار'): continue
        body = re.sub(r'^\*\*مختار \(\d+\):\*\*\s*', '', ln).rstrip('.')
        segs = split_top(body)
        if not any(norm(vis(s)) == norm(name) for s in segs): continue
        assert sum(1 for s in segs if norm(vis(s)) == norm(name)) == 1, f'تكرار {name}'
        start, end = section_span(lines, i)
        # سطر مكرر داخل القسم
        j_muk = next((k for k in range(start, end) if lines[k].startswith('**مكرر')), None)
        n_old = int(re.match(r'^\*\*مختار \((\d+)\):\*\*', ln).group(1))
        segs = [s for s in segs if norm(vis(s)) != norm(name)]
        if segs:
            lines[i] = f'**مختار ({n_old-1}):** ' + '، '.join(segs) + '.'
        else:
            lines[i] = ''
        tag = f'{name} [مكرر — ({src})]'
        if j_muk is not None:
            old = lines[j_muk]
            mm = re.match(r'^(\*\*مكرر[^:]*\()(\d+)(\):\*\*)', old)
            m_old = int(mm.group(2))
            b2 = re.sub(r'^\*\*مكرر[^:]*\(\d+\):\*\*\s*', '', old).rstrip('.')
            lines[j_muk] = f'{mm.group(1)}{m_old+1}{mm.group(3)} ' + b2 + '، ' + tag + '.'
        else:
            lines.insert(i + 1, f'**مكرر/مدمج (1):** {tag}.')
        for k in range(start, end):
            mm = re.match(r'^(> عدّ: )(\d+)( مختارًا \+ )(\d+)( مكررًا = )(\d+)( ✓)$', lines[k])
            if mm:
                lines[k] = f'{mm.group(1)}{int(mm.group(2))-1}{mm.group(3)}{int(mm.group(4))+1}{mm.group(5)}{mm.group(6)}{mm.group(7)}'
                break
        return True
    return False

def revert_to_mokhtar(lines, name, src):
    """تراجع: إزالة من مكرر وإرجاع إلى مختار."""
    for i, ln in enumerate(lines):
        if not ln.startswith('**مكرر'): continue
        body = re.sub(r'^\*\*مكرر[^:]*\(\d+\):\*\*\s*', '', ln).rstrip('.')
        segs = split_top(body)
        tgt = [s for s in segs if norm(vis(s)) == norm(name) and f'({src})' in s]
        if not tgt: continue
        assert len(tgt) == 1, f'تراجع {name}: {len(tgt)} مقاطع'
        start, end = section_span(lines, i)
        j_mok = next((k for k in range(start, end) if lines[k].startswith('**مختار')), None)
        assert j_mok is not None, f'لا مختار في القسم ({name})'
        m_old = int(re.match(r'^\*\*مكرر[^:]*\((\d+)\):\*\*', ln).group(1))
        segs = [s for s in segs if not (norm(vis(s)) == norm(name) and f'({src})' in s)]
        lines[i] = f'**مكرر/مدمج ({m_old-1}):** ' + '، '.join(segs) + '.'
        old = lines[j_mok]
        mm = re.match(r'^(\*\*مختار \()(\d+)(\):\*\*)', old)
        b2 = re.sub(r'^\*\*مختار \(\d+\):\*\*\s*', '', old).rstrip('.')
        lines[j_mok] = f'{mm.group(1)}{int(mm.group(2))+1}{mm.group(3)} ' + b2 + '، ' + name + '.'
        for k in range(start, end):
            mm2 = re.match(r'^(> عدّ: )(\d+)( مختارًا \+ )(\d+)( مكررًا = )(\d+)( ✓)$', lines[k])
            if mm2:
                lines[k] = f'{mm2.group(1)}{int(mm2.group(2))+1}{mm2.group(3)}{int(mm2.group(4))-1}{mm2.group(5)}{mm2.group(6)}{mm2.group(7)}'
                break
        return True
    return False

def recount(fn):
    """إعادة بناء الجدول الإحصائي والملخص من عدّادات الأقسام."""
    path = BASE / fn
    lines = path.read_text(encoding='utf-8').splitlines()
    cur_range = None
    sums = {}  # (a,b) -> [sel, dup]
    total = [0, 0, 0]
    for ln in lines:
        m = re.match(r'^## (.+?) \((\d+)-(\d+)\)$', ln)
        if m and not re.match(r'^## \d+\.', ln):
            cur_range = (int(m.group(2)), int(m.group(3)))
            continue
        mm = re.match(r'^\*\*مختار \((\d+)\):\*\*', ln)
        if mm and cur_range:
            n = int(mm.group(1))
            sums.setdefault(cur_range, [0, 0]); sums[cur_range][0] += n
            total[0] += n; total[2] += n
            continue
        mm = re.match(r'^\*\*مكرر[^:]*\((\d+)\):\*\*', ln)
        if mm and cur_range:
            n = int(mm.group(1))
            sums.setdefault(cur_range, [0, 0]); sums[cur_range][1] += n
            total[1] += n; total[2] += n
    # استبدال صفوف الجدول
    out = []
    for ln in lines:
        m = re.match(r'^\| (.+?) \((\d+)-(\d+)\) \| \d+ \| \d+ \|$', ln.strip())
        if m:
            a, b = int(m.group(2)), int(m.group(3))
            s, d = sums.get((a, b), [0, 0])
            out.append(f'| {m.group(1)} ({a}-{b}) | {s} | {d} |')
            continue
        m = re.match(r'^\| \*\*الإجمالي\*\* \| \*\*\d+\*\* \| \*\*\d+\*\* \|$', ln.strip())
        if m:
            out.append(f'| **الإجمالي** | **{total[0]}** | **{total[1]}** |')
            continue
        m = re.match(r'^## ملخص: واصل \d+ \| مختار \d+ \| مكرر/مدمج \d+(.*)$', ln)
        if m:
            out.append(f'## ملخص: واصل {total[2]} | مختار {total[0]} | مكرر/مدمج {total[1]}{m.group(1)}')
            continue
        out.append(ln)
    path.write_text('\n'.join(out), encoding='utf-8')
    return total

# ===== 1) تراجعات 15 (تسميات مزدوجة موثقة بملاحظات تمييز) =====
p15 = BASE / 'batch15_selected.md'
lines = p15.read_text(encoding='utf-8').splitlines()
ok1 = revert_to_mokhtar(lines, 'فجوة الانتقال', 4)
ok2 = revert_to_mokhtar(lines, 'الإرشاد المهني', 14)
assert ok1 and ok2, f'فشل التراجع: {ok1} {ok2}'
p15.write_text('\n'.join(lines), encoding='utf-8')
print('✔ تراجع: فجوة الانتقال والإرشاد المهني عادا إلى مختار 15 (تسمية مزدوجة موثقة)')

# ===== 2) إكمال نقل 10 أسماء في 17 =====
p17 = BASE / 'batch17_selected.md'
lines = p17.read_text(encoding='utf-8').splitlines()
MOVES17 = [('الذاكرة الحسية',13),('الذاكرة قصيرة المدى',13),('منحنى النسيان',13),('التواصل البصري',16),
           ('شدة التدخل',13),('الادعاء',13),('مؤشرات النجاح',15),('الاستقلالية المهنية',16),
           ('الابتكار التعليمي',16),('التواصل',16)]
for name, src in MOVES17:
    done = move_to_mukarrir(lines, name, src)
    print(('✔ 17: ' if done else '⊘ 17 (سبق النقل): ') + name)
p17.write_text('\n'.join(lines), encoding='utf-8')

# ===== 3) شذوذ §56 في 16 =====
p16 = BASE / 'batch16_selected.md'
txt = p16.read_text(encoding='utf-8')
old_line = '**مختار (8):** تعريف القرار، البدائل، تحليل المخاطر [محتمل مكرر — قسم إدارة المخاطر (12، ب) يُحسم مرجعيًا]، تحليل التكلفة، القرار تحت اليقين، القرار تحت المخاطرة، القرار تحت عدم اليقين، القرار المبني على البيانات.'
new_line = '**مختار (7):** تعريف القرار، البدائل، تحليل المخاطر [محتمل مكرر — قسم إدارة المخاطر (12) — يُحسم مرجعيًا]، تحليل التكلفة، القرار تحت اليقين، القرار تحت المخاطرة، القرار تحت عدم اليقين، القرار المبني على البيانات.'
if old_line in txt:
    txt = txt.replace(old_line, new_line)
    txt = txt.replace('> عدّ: 8 مختارًا + 4 مكررًا = 12 ✓', '> عدّ: 7 مختارًا + 4 مكررًا = 11 ✓')
    p16.write_text(txt, encoding='utf-8')
    print('✔ 16 §56: إصلاح الشذوذ')
else:
    print('⊘ 16 §56: سبق الإصلاح')

# ===== 4) إعادة بناء الجداول والملخصات =====
for fn in ['batch15_selected.md', 'batch16_selected.md', 'batch17_selected.md']:
    s, d, t = recount(fn)
    print(f'✔ إعادة بناء {fn}: مختار {s} | مكرر {d} | واصل {t}')
