#!/bin/bash
OUT=/home/z/my-project/scripts/research_out2
declare -A Q=(
 [p03_theory_practice_gap]="theory practice gap teacher education research|8"
 [p12_procrastination]="student procrastination statistics solutions research|8"
 [p13_exam_anxiety]="test anxiety statistics students coping strategies|8"
 [p18_mcq_test_taking]="multiple choice test taking strategies students|8"
 [p23_presentation_fear]="fear public speaking university students statistics|8"
 [p24_study_groups]="peer study groups accountability learning research|8"
 [p25_sleep_health]="student sleep deprivation academic performance research|8"
 [p26_streak_gamification]="streaks gamification learning apps effectiveness|8"
 [p27_arabic_study_apps]="تطبيقات الدراسة العربية مراجعة أسئلة|8"
 [p28_goal_setting]="goal setting students academic achievement research|8"
 [p29_active_recall]="active recall spaced repetition effectiveness research|8"
 [p30_ai_tutoring]="AI tutoring personalized learning students research|8"
)
for k in "${!Q[@]}"; do
  [ -s "$OUT/$k.json" ] && continue
  q="${Q[$k]%%|*}"; n="${Q[$k]##*|}"
  timeout 50 z-ai function -n web_search -a "{\"query\": \"$q\", \"num\": $n}" -o "$OUT/$k.json" >/dev/null 2>&1 && echo "OK: $k" || echo "FAIL: $k"
done
echo "=== ALL DONE ==="
