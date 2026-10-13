إصلاح انحياز مواضع الإجابة الصحيحة — انسخ الملفات الثلاثة فوق مشروعك بنفس المسارات:
  src/data/qbank.json                (ترتيب الخيارات + علامة fixedOrder على 432 سؤالًا)
  src/lib/types.ts                   (حقل اختياري fixedOrder)
  src/components/app/QuizSession.tsx (لا يخلط الأسئلة الموسومة fixedOrder)
أو شغّل السكربت على بنكك الحالي:  python3 fix_option_positions.py src/data/qbank.json

--- تحديث الدفعة ١ ---
src/data/qbank.json الآن يتضمن أيضًا إصلاح ٢٠ سؤالًا (الأسوأ طولًا) و٦ أسئلة بحروف مشوّهة.
apply_patch.py + patches/batch01.py: لتطبيق الدفعة على بنك آخر:  python3 apply_patch.py src/data/qbank.json patches/batch01.py
worklog_append_source.md: نسخة من سجل العمل بعد إضافة مهمة FIX-1 (ألحق آخر مقطع منه بسجلك).
