# -*- coding: utf-8 -*-
"""مطابقة الدفعة 16 ضد: البنك + المختار (12، 3، 4، 13، 14، 15) + الخام (1، 2، 5-11)."""
import re, unicodedata
from pathlib import Path

BASE = Path('/home/z/my-project/docs')

def norm(s: str) -> str:
    s = unicodedata.normalize('NFC', s.strip())
    s = re.sub(r'[\u064B-\u0652\u0670\u0640]', '', s)
    s = re.sub(r'[أإآ]', 'ا', s)
    s = s.replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
    s = re.sub(r'\s+', ' ', s)
    return s.lower().strip()

def clean_name(s: str) -> str:
    s = s.strip().strip('.,؛;:').strip()
    s = re.sub(r'\s*\([^)]*\)\s*$', '', s).strip()
    return s

def is_name(seg: str) -> bool:
    s = clean_name(seg)
    if not s or len(s) < 3:
        return False
    ar = len(re.findall(r'[\u0600-\u06FF]', s))
    lat = len(re.findall(r'[A-Za-z]', s))
    return (ar >= 3 or (lat >= 3 and lat == len(s.replace(' ', '')))) and not s.startswith(('>', '|', '#', '*'))

def parse_csv_line(line: str):
    out = []
    for seg in re.split(r'[،,]', line):
        if is_name(seg):
            out.append(clean_name(seg))
    return out

b16 = []
cur = None
for ln in (BASE / 'raw/batch16_raw.md').read_text(encoding='utf-8').splitlines():
    m = re.match(r'^## (\d+)\.\s+(.+?)(?:\s*\((\d+)\))?\s*$', ln)
    if m:
        cur = (int(m.group(1)), m.group(2).strip(), [])
        b16.append(cur)
        continue
    if cur is None or ln.startswith('#'):
        continue
    cur[2].extend(parse_csv_line(ln))

SOURCES = [
    (0,  'بنك', BASE / 'raw/bank_names.txt'),
    (1,  '12',   BASE / 'taxonomy_batch12_selected.md'),
    (2,  '9',    BASE / 'raw/batch9_raw.md'),
    (3,  '10',   BASE / 'raw/batch10_raw.md'),
    (4,  '11',   BASE / 'raw/batch11_raw.md'),
    (5,  '8',    BASE / 'raw/batch8_raw.md'),
    (6,  '7',    BASE / 'raw/batch7_raw.md'),
    (7,  '6',    BASE / 'raw/batch6_raw.md'),
    (8,  '5',    BASE / 'raw/batch5_raw.md'),
    (9,  '4',    BASE / 'batch4_selected.md'),
    (10, '3',    BASE / 'batch3_selected.md'),
    (11, '2',    BASE / 'raw/batch2_raw.md'),
    (12, '1',    BASE / 'raw/batch1_raw.md'),
    (13, '13',   BASE / 'batch13_selected.md'),
    (14, '14',   BASE / 'batch14_selected.md'),
    (15, '15',   BASE / 'batch15_selected.md'),
]

ref = {}
for pri, sid, path in SOURCES:
    text = path.read_text(encoding='utf-8')
    names = []
    for ln in text.splitlines():
        t = ln.strip()
        if not t or t.startswith('#'):
            continue
        if t.startswith('**مختار'):
            body = t.split(':', 1)[1] if ':' in t else ''
            names.extend(parse_csv_line(body))
        elif t.startswith('**مكرر'):
            # أسماء الأهداف داخل الأقواس + الأسماء المؤدية قبل الأقواس (كلها أسماء قائمة في الموسوعة)
            for mm in re.finditer(r'[\[«]([^\]»]+)[\]»]', t):
                seg = mm.group(1)
                seg = re.sub(r'^(مكرر|مدمج ضمن|محتمل مكرر)\s*[—-]?\s*', '', seg)
                for part in parse_csv_line(seg):
                    names.append(part)
            lead = re.sub(r'\[[^\]]*\]', '،', t.split(':', 1)[1] if ':' in t else '')
            names.extend(parse_csv_line(lead))
        elif t.startswith(('>', '|', '-', '*', 'جدول', 'عدد الأقسام', 'التحقق', 'ملاحظات', 'قواعد', 'توجيه', 'نقاط', 'قرارات', 'النتيجة', 'الملخص', 'ملخص')):
            continue
        else:
            names.extend(parse_csv_line(t))
    added = 0
    for n in names:
        k = norm(n)
        if not k or len(k) < 4:
            continue
        ref.setdefault(k, []).append((pri, sid, n))
        added += 1
    print(f'-- مصدر {sid}: {added} اسمًا')

within = {}
for sno, title, names in b16:
    for n in names:
        within.setdefault(norm(n), []).append((sno, n))

rep = []
total = sel = dup = 0
for sno, title, names in b16:
    lines = [f'## {sno}. {title} ({len(names)})']
    for n in names:
        total += 1
        k = norm(n)
        hits = ref.get(k, [])
        best = min(hits, key=lambda h: h[0]) if hits else None
        allsrc = ','.join(f"{h[1]}" for h in sorted(set((h[0], h[1]) for h in hits))) if hits else ''
        w = within.get(k, [])
        wt = f' | داخل16: أقسام {",".join(str(x[0]) for x in w)}' if len(w) > 1 else ''
        if best:
            dup += 1
            lines.append(f'  [D] {n} ⟵ {best[1]} ({best[2]}){(" + " + allsrc) if len(hits)>1 else ""}{wt}')
        else:
            sel += 1
            lines.append(f'  [K] {n}{wt}')
    rep.append('\n'.join(lines))

Path('/home/z/my-project/scripts/b16_report.txt').write_text('\n\n'.join(rep), encoding='utf-8')
print(f'\nإجمالي الأسماء: {total} | بلا تطابق تام: {sel} | تطابق تام: {dup}')
