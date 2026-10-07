#!/bin/bash
# حارس التوليد: حلقات محاولة/انتظار حتى ٩٠ دقيقة، دمج بعد كل دورة ناجحة،
# توقف تلقائي عند اكتمال المفاهيم الـ٢٧٩ أو انتهاء النافذة.
cd /home/z/my-project
LOG=src/data/generated/progress.log
WINDOW_END=$(( $(date +%s) + 90*60 ))

complete_count() {
  python3 -c "
import json
qb = json.load(open('src/data/qbank.json', encoding='utf-8'))
print(sum(1 for c in qb['concepts'] if len(c.get('examples') or []) >= 5))
"
}

while [ "$(date +%s)" -lt "$WINDOW_END" ]; do
  GEN_CONC=1 GEN_DEADLINE_MS=900000 node scripts/gen_content.mjs
  python3 scripts/merge_generated.py >> "$LOG" 2>&1
  N=$(complete_count)
  echo "[watchdog $(date +%H:%M)] مفاهيم مكتملة: $N من 279"
  if [ "$N" -ge 279 ]; then echo "[watchdog] اكتملت كل المفاهيم"; break; fi
  sleep 600
done
echo "[watchdog] انتهت النافذة أو اكتمل العمل"
