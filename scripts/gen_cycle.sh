#!/bin/bash
# دورة توليد أمامية واحدة: مهلة داخلية + قاطع دائرة + دمج + عدّاد إنجاز
cd /home/z/my-project
GEN_CONC=1 GEN_DEADLINE_MS=${1:-300000} node scripts/gen_content.mjs 2>&1 | rg "START|CIRCUIT|DEADLINE|DONE|PROGRESS" | tail -4
python3 scripts/merge_generated.py 2>&1 | tail -3
python3 -c "
import json
qb = json.load(open('src/data/qbank.json', encoding='utf-8'))
n = sum(1 for c in qb['concepts'] if len(c.get('examples') or []) >= 5)
print('مفاهيم مكتملة (٥ أمثلة + أسئلة):', n, 'من 279')
"
