#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تحليل تقرير الإحالات: كم حالة قابلة للتبديل الآلي الآمن (الجملة تصف محتوى الصحيح)؟"""
import json

rep = json.load(open('review/r5_ref_report.json', encoding='utf-8'))
B = rep['attribution_mismatch']

auto_ok = [x for x in B if x.get('best') == x['correct_pos'] and x['overlap'].get(str(x['correct_pos']), x['overlap'].get(x['correct_pos'], 0)) >= 2]
manual = [x for x in B if x not in auto_ok]

print('إسنادات خاطئة:', len(B))
print('قابلة لتبديل آلي آمن (أفضل تطابق = موضع الصواب):', len(auto_ok))
print('تحتاج قراراً يدوياً:', len(manual))

# توزيع الفارق بين الموضع المشار إليه والصحيح
from collections import Counter
diff = Counter(x['ref_pos'] - x['correct_pos'] for x in B)
print('توزيع الفارق (المشار إليه - الصحيح):', dict(sorted(diff.items())))

# توزيع قوة التطابق في الحالات الآلية
ovs = sorted((x['overlap'].get(str(x['correct_pos']), x['overlap'].get(x['correct_pos'],0)) for x in auto_ok), reverse=True)
print('توزيع قوة التطابق للحالات الآلية (أعلى 10):', ovs[:10], '| الأدنى:', ovs[-5:] if ovs else [])

# عينة من الحالات اليدوية للمعاينة
json.dump({'auto': auto_ok, 'manual': manual}, open('review/r5_attr_split.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('حفظ التقسيم في review/r5_attr_split.json')

# C) نفي الصحيح — عينة
C = rep['negation_of_correct']
print('\n--- عينة من نفي الصحيح (3):')
for x in C[:3]:
    print(f"  {x['id']} صحيح=خ{x['correct_pos']}: {x['sent'][:130]}")
