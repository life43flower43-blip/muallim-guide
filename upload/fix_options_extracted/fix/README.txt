إصلاح انحياز مواضع الإجابة الصحيحة — انسخ الملفات الثلاثة فوق مشروعك بنفس المسارات:
  src/data/qbank.json                (ترتيب الخيارات + علامة fixedOrder على 432 سؤالًا)
  src/lib/types.ts                   (حقل اختياري fixedOrder)
  src/components/app/QuizSession.tsx (لا يخلط الأسئلة الموسومة fixedOrder)
أو شغّل السكربت على بنكك الحالي:  python3 fix_option_positions.py src/data/qbank.json
