#!/bin/bash
# اختبار تحدّي الأقران — يجيب عن الأسئلة تلقائيًا حتى شاشة النتيجة
# الاستخدام: bash peer_solve.sh [أقصى عدد جولات]

ROUNDS="${1:-10}"
for i in $(seq 1 "$ROUNDS"); do
  OUT=$(agent-browser snapshot -i -c 2>/dev/null)
  if echo "$OUT" | grep -q "تحدٍّ جديد"; then
    echo "RESULT_REACHED"
    exit 0
  fi
  REF=$(echo "$OUT" | grep -E '"(السؤال التالي|عرض المقارنة)"' | sed -E 's/.*\[ref=(e[0-9]+)\].*/\1/' | head -1)
  if [ -n "$REF" ]; then
    agent-browser click "$REF" >/dev/null 2>&1
    sleep 0.7
    continue
  fi
  OPT=$(echo "$OUT" | grep 'button "' | grep -vE 'خروج|تحقق|عرض المقارنة|السؤال التالي|تحدٍّ جديد|انسخ|شارك|إغلاق|عودة|استمع' | sed -E 's/.*\[ref=(e[0-9]+)\].*/\1/' | head -1)
  if [ -n "$OPT" ]; then
    agent-browser click "$OPT" >/dev/null 2>&1
    sleep 0.5
  fi
  CHECK=$(agent-browser snapshot -i -c 2>/dev/null | grep '"تحقق"' | grep -v disabled | sed -E 's/.*\[ref=(e[0-9]+)\].*/\1/' | head -1)
  if [ -n "$CHECK" ]; then
    agent-browser click "$CHECK" >/dev/null 2>&1
    sleep 0.6
  fi
done
echo "DONE_ROUNDS=$ROUNDS"
