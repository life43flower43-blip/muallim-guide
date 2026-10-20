#!/bin/bash
# فحص النسخ: بحث ويب عن جمل حرفية من بنك الأسئلة
cd /home/z/my-project
mkdir -p scripts/plagcheck
z-ai function -n web_search -a '{"query": "\"وتعتمد دراسة الوراثة عند الإنسان على مناهج غير التجريب المباشر لأسباب أخلاقية\"", "num": 8}' -o scripts/plagcheck/q1.json
z-ai function -n web_search -a '{"query": "\"لا يُتوقع من طالب جائع أو خائف أو وحيد أن يركز على تحصيله\"", "num": 8}' -o scripts/plagcheck/q2.json
z-ai function -n web_search -a '{"query": "\"السلوك الإنساني يكتسب ويثبت نتيجة ارتباطه ببواعث بيئية محددة\"", "num": 8}' -o scripts/plagcheck/q3.json
z-ai function -n web_search -a '{"query": "\"حُسب معامل الذكاء تقليدياً بقسمة العمر العقلي على العمر الزمني\"", "num": 8}' -o scripts/plagcheck/q4.json
z-ai function -n web_search -a '{"query": "\"مراقبة سلوك طفلين توأمين متماثلين أحدهما في بيئة ريفية والآخر في مدينة\"", "num": 8}' -o scripts/plagcheck/q5.json
z-ai function -n web_search -a '{"query": "\"لاحظت معلمة الصف الأول أن أحد التلاميذ ينهض من مقعده باستمرار أثناء الشرح\"", "num": 8}' -o scripts/plagcheck/q6.json
echo DONE