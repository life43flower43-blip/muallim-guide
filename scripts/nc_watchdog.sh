#!/bin/bash
# حلقة توليد المفاهيم المفقودة — تعيد المحاولة كل ٩٠ ثانية وتدمج بعد كل دورة
# تتوقف عند اكتمال كل المفاهيم (nc/_done.flag) أو بعد ٤٠٠ دورة (≈ يومان من إعادة المحاولة)
cd /home/z/my-project
echo "[nc-watchdog] start $(date)" >> src/data/generated/nc/watchdog.log
for i in $(seq 1 400); do
  if [ -f src/data/generated/nc/_done.flag ]; then
    echo "[nc-watchdog] COMPLETE at cycle $i $(date)" >> src/data/generated/nc/watchdog.log
    break
  fi
  echo "[nc-watchdog] cycle $i $(date)" >> src/data/generated/nc/watchdog.log
  GEN_CONC=1 GEN_DEADLINE_MS=420000 node scripts/gen_newconcepts.mjs >> src/data/generated/nc/nohup.log 2>&1
  node scripts/merge_newconcepts.mjs >> src/data/generated/nc/nohup.log 2>&1
  sleep 90
done
echo "[nc-watchdog] end $(date)" >> src/data/generated/nc/watchdog.log
