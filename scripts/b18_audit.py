# -*- coding: utf-8 -*-
"""تدقيق أثر خلل الاسم الأول: أسماء مختارة في 15/16/17 موجودة فعلًا في مصادر أسبق."""
import re, unicodedata
from pathlib import Path

BASE = Path('/home/z/my-project/docs')

def norm(s):
    s = unicodedata.normalize('NFC', s.strip())
    s = re.sub(r'[\u064B-\u0652\u0670\u0640]', '', s)
    s = re.sub(r'[أإآ]', 'ا', s)
    s = s.replace('ى','ي').replace('ة','ه').replace('ؤ','و').replace('ئ','ي')
    s = re.sub(r'\s+', ' ', s)
    return s.lower().strip()

def clean_name(s):
    s = s.strip().strip('.,؛;:').strip()
    s = re.sub(r'\s*\([^)]*\)\s*$', '', s).strip()
    return s

def is_name(seg):
    s = clean_name(seg)
    if not s or len(s) < 3: return False
    ar = len(re.findall(r'[\u0600-\u06FF]', s))
    lat = len(re.findall(r'[A-Za-z]', s))
    return (ar >= 3 or (lat >= 3 and lat == len(s.replace(' ', '')))) and not s.startswith(('>', '|', '#', '*'))

def parse_csv_line(line):
    return [clean_name(seg) for seg in re.split(r'[،,]', line) if is_name(seg)]

def extract(path):
    """يعيد (قائمة مختارات بالترتيب، مفتاح أول-سطر لكل مختار) بعد إصلاح البادئة."""
    sel = []
    for ln in path.read_text(encoding='utf-8').splitlines():
        t = ln.strip()
        if t.startswith('**مختار'):
            body = re.sub(r'^\*\*مختار[^:]*:\*\*\s*', '', t)
            sel.extend(parse_csv_line(body))
    return sel

RAWS = [(0,'بنك',BASE/'raw/bank_names.txt'),(1,'12',BASE/'taxonomy_batch12_selected.md'),
 (2,'9',BASE/'raw/batch9_raw.md'),(3,'10',BASE/'raw/batch10_raw.md'),(4,'11',BASE/'raw/batch11_raw.md'),
 (5,'8',BASE/'raw/batch8_raw.md'),(6,'7',BASE/'raw/batch7_raw.md'),(7,'6',BASE/'raw/batch6_raw.md'),
 (8,'5',BASE/'raw/batch5_raw.md'),(9,'4',BASE/'batch4_selected.md'),(10,'3',BASE/'batch3_selected.md'),
 (11,'2',BASE/'raw/batch2_raw.md'),(12,'1',BASE/'raw/batch1_raw.md'),(13,'13',BASE/'batch13_selected.md'),
 (14,'14',BASE/'batch14_selected.md')]

def build_ref(pairs):
    ref = {}
    for _, sid, path in pairs:
        text = path.read_text(encoding='utf-8')
        names = []
        for ln in text.splitlines():
            t = ln.strip()
            if not t or t.startswith('#'): continue
            if t.startswith('**مختار'):
                names.extend(parse_csv_line(re.sub(r'^\*\*مختار[^:]*:\*\*\s*', '', t)))
            elif t.startswith('**مكرر'):
                lead0 = re.sub(r'^\*\*مكرر[^:]*:\*\*\s*', '', t)
                for mm in re.finditer(r'[\[«]([^\]»]+)[\]»]', t):
                    seg = re.sub(r'^(مكرر|مدمج ضمن|محتمل مكرر)\s*[—-]?\s*', '', mm.group(1))
                    names.extend(parse_csv_line(seg))
                lead = re.sub(r'\[[^\]]*\]', '،', lead0)
                names.extend(parse_csv_line(lead))
            elif t.startswith(('>', '|', '-', '*', 'جدول', 'عدد الأقسام', 'التحقق', 'ملاحظات', 'قواعد', 'توجيه', 'نقاط', 'قرارات', 'النتيجة', 'الملخص', 'ملخص')):
                continue
            else:
                names.extend(parse_csv_line(t))
        for n in names:
            k = norm(n)
            if k and len(k) >= 4:
                ref.setdefault(k, (sid, n))
    return ref

prior = list(RAWS)
for sid_label, fname in [('15','batch15_selected.md'), ('16','batch16_selected.md'), ('17','batch17_selected.md')]:
    ref = build_ref(prior)
    sel = extract(BASE / fname)
    wrong = []
    for n in sel:
        k = norm(n)
        if k in ref and len(k) >= 4:
            wrong.append((n, ref[k]))
    print(f'== {sid_label}: مختارات {len(sel)} | موجودة أصلًا: {len(wrong)}')
    for n, (src, orig) in wrong:
        print(f'   - {n} ⟵ [{orig}] ({src})')
    prior.append((99, sid_label, BASE / fname))
