#!/bin/bash
# بحث شامل: مشاكل الطلبة التربويين حول العالم -> ميزات
# يُنفَّذ بالتوازي عبر z-ai CLI ويحفظ النتائج في scripts/research_out2/
OUT=/home/z/my-project/scripts/research_out2
mkdir -p "$OUT"

run() {
  local name="$1"; local query="$2"; local num="${3:-10}"
  if [ -s "$OUT/$name.json" ]; then echo "SKIP: $name"; return; fi
  timeout 60 z-ai function -n web_search -a "{\"query\": \"$query\", \"num\": $num}" -o "$OUT/$name.json" 2>"$OUT/$name.err" || echo "FAIL: $name"
  echo "OK: $name"
}
MAXJ=${MAXJ:-3}
jm() { while [ "$(jobs -r | wc -l)" -ge "$MAXJ" ]; do sleep 0.5; done; }

# ---------- المحور 1: مشاكل طلبة كليات التربية / إعداد المعلم عالمياً ----------
jm; run p01_pre_service_challenges "challenges faced by pre-service teachers research worldwide" 10 &
jm; run p02_teaching_practicum "problems student teachers face during teaching practice practicum" 10 &
jm; run p03_theory_practice_gap "theory practice gap teacher education research" 8 &
jm; run p04_classroom_mgmt_fear "student teachers lack classroom management confidence research" 8 &
jm; run p05_arabic_teachers_students "مشاكل طلاب كليات التربية أثناء الدراسة" 10 &
jm; run p06_arabic_practicum "تحديات التدريب الميداني طلاب المعلم" 10 &
jm; run p07_efficiency_exams "teacher licensing exam preparation challenges candidates" 8 &
jm; run p08_new_teachers_struggle "new teachers struggle first years attrition statistics" 8 &
jm; run p09_teacher_self_efficacy "teacher self-efficacy building during preparation research" 8 &
wait
# ---------- المحور 2: مشاكل الطلبة العامة في التعلم (عالمية) ----------
jm; run p10_learning_problems "most common problems students face in learning worldwide" 10 &
jm; run p11_forgetting_curve "students forget what they learn statistics retention problem" 8 &
jm; run p12_procrastination "student procrastination statistics solutions research" 8 &
jm; run p13_exam_anxiety "test anxiety statistics students coping strategies" 8 &
jm; run p14_study_skills "students don't know how to study poor study skills research" 8 &
jm; run p15_time_management "university students time management problems research" 8 &
jm; run p16_motivation_loss "student motivation loss burnout university research" 8 &
jm; run p17_distraction_focus "smartphone distraction studying focus students research" 8 &
wait
# ---------- المحور 3: مشاكل دراسية محددة قابلة للتحويل لميزات ----------
jm; run p18_mcq_test_taking "multiple choice test taking strategies students skills" 8 &
jm; run p19_note_taking "note taking problem students lectures research" 8 &
jm; run p20_cramming "cramming vs spaced practice students research" 8 &
jm; run p21_reading_academic "academic reading difficulties university students research" 8 &
jm; run p22_writing_essays "academic writing difficulties students assignments research" 8 &
jm; run p23_presentation_fear "glossophobia fear public speaking university students statistics" 8 &
jm; run p24_study_groups "benefits peer study groups accountability learning research" 8 &
jm; run p25_sleep_health "student sleep deprivation academic performance research" 8 &
wait
# ---------- المحور 4: الدافعية والاستمرارية واللغة العربية ----------
jm; run p26_streak_gamification "streaks gamification learning apps effectiveness duolingo research" 8 &
jm; run p27_arabic_study_apps "تطبيقات الدراسة العربية مراجعة التغذي الراجع" 8 &
jm; run p28_goal_setting "goal setting students academic achievement research" 8 &
jm; run p29_active_recall "active recall effectiveness research students" 8 &
jm; run p30_ai_tutoring "AI tutoring benefits students personalized learning research 2025" 8 &
wait
echo "=== DONE ==="
ls -la "$OUT" | wc -l
