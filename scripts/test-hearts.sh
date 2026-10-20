#!/bin/bash
# اختبار شاشة نفاد القلوب — يجيب على الخيار الأول في 5 أسئلة من اختبار قياسي
AB="agent-browser"

# 1) إغلاق أي اختبار مفتوح والعودة للتبويب ثم بدء اختبار قياسي (10 أسئلة)
$AB eval "(() => { const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='إغلاق الاختبار'); if(b){b.click();return 'closed';} return 'none open'; })()" > /dev/null
sleep 1
$AB eval "(() => { const tabs=[...document.querySelectorAll('button')]; const t=tabs.find(x=>x.textContent.trim()==='اختبار'); if(t){t.click();return 'tab quiz';} return 'no tab'; })()"
sleep 1
$AB eval "(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('قياسي')); if(b){b.click();return 'started 10-question quiz';} return 'not found'; })()"
sleep 1.5

# 2) حلقة: انقر الخيار الأول ثم متابعة — 6 مرات، مع طباعة عدد القلوب
for i in 1 2 3 4 5 6; do
  HEARTS=$($AB eval "document.querySelector('[aria-label=\"القلوب المتبقية\"] span')?.textContent ?? 'no-hearts'" 2>/dev/null)
  OPT=$($AB eval "(() => { const g=document.querySelector('[role=\"group\"]'); if(!g) return 'no-group'; const b=g.querySelector('button:not([disabled])'); if(!b) return 'no-enabled-option'; b.click(); return 'clicked option'; })()" 2>/dev/null)
  sleep 0.9
  CONT=$($AB eval "(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='متابعة'); if(!b) return 'no-continue'; b.click(); return 'continue clicked'; })()" 2>/dev/null)
  sleep 0.7
  GAMEOVER=$($AB eval "document.body.textContent.includes('نفدت القلوب') ? 'GAMEOVER VISIBLE' : 'not yet'" 2>/dev/null)
  echo "round $i | hearts=$HEARTS | opt=$OPT | $CONT | $GAMEOVER"
done

$AB screenshot /home/z/my-project/.zscripts/shot-7-final-state.png
echo "DONE"
