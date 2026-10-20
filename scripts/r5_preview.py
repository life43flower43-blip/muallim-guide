#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""معاينة موسعة لحالات الإسناد الخاطئ لاتخاذ قرار الإصلاح."""
import json, sys

rep = json.load(open('review/r5_ref_report.json', encoding='utf-8'))
B = rep['attribution_mismatch']
n = int(sys.argv[1]) if len(sys.argv) > 1 else 12
start = int(sys.argv[2]) if len(sys.argv) > 2 else 0

def ov(x, p):
    return x['overlap'].get(str(p), x['overlap'].get(p, 0))

for x in B[start:start+n]:
    print(f"◆ {x['id']}  المشار إليه=خ{x['ref_pos']}  الصحيح=خ{x['correct_pos']}  overlap={x['overlap']} best=خ{x['best']}")
    print(f"  جملة الإسناد: {x['sent'][:220]}")
    print(f"  خ{ x['ref_pos']} (المشار إليه): {x['option_texts'][x['ref_pos']-1][:110]}")
    print(f"  خ{ x['correct_pos']} (الصحيح): {x['option_texts'][x['correct_pos']-1][:110]}")
    print()
