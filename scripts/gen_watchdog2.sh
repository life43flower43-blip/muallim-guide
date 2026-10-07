#!/bin/bash
# حلقة مُوصِلة: تعيد تشغيل توليد الأمثلة دوريًا — يستأنف كل تشغيل من نقاط الحفظ
# يتوقف عندما تكتمل كل المفاهيم (_done.flag) أو بعد ٦٠ دورة
cd /home/z/my-project
rm -f src/data/generated/ex/_done.flag
echo "[watchdog] start $(date)" >> src/data/generated/ex/watchdog.log
for i in $(seq 1 60); do
  if [ -f src/data/generated/ex/_done.flag ]; then
    echo "[watchdog] COMPLETE at cycle $i $(date)" >> src/data/generated/ex/watchdog.log
    break
  fi
  echo "[watchdog] cycle $i $(date)" >> src/data/generated/ex/watchdog.log
  GEN_CONC=1 GEN_DEADLINE_MS=420000 node scripts/gen_examples.mjs >> src/data/generated/ex/nohup.log 2>&1
  # دمج فوري لما اكتمل — الدمج آمن ومتكرر (يلمس المفاهيم المكتملة فقط)
  node scripts/merge_examples.mjs >> src/data/generated/ex/nohup.log 2>&1
  sleep 90
done
echo "[watchdog] end $(date)" >> src/data/generated/ex/watchdog.log
