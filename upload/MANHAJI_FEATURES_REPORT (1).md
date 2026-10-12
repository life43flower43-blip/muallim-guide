# Manhaji App — تقرير الميزات التقنيّة والتعليميّة

## نظرة عامة
تطبيق Manhaji هو منصّة تعلّم اللغات التفاعليّة، مبنيّة على Next.js 16 + Prisma + PostgreSQL. تعلّم اللغات عبر دروس مسرحيّة (scene-based lessons) بدلاً من البطاقات التقليديّة.

---

## 1. نظام الدورات (Course System)

### البنية
- كل لغة دورة مستقلّة بمجلدها الخاص: `src/lib/courses/{lang}/`
- كل دورة تحتوي: `kit.ts` (helpers) + `index.ts` (تسجيل المواضيع) + ملفات المواضيع
- نوع `CourseId` في `src/lib/courses/index.ts` يحدّد اللغات المتاحة
- كل لغة تُسجّل في `COURSES` record مع: id, flag, name, dir (rtl/ltr), locale

### اللغات الحاليّة (5 لغات)
| اللغة | الكود | العلم | المواضيع | المراحل |
|-------|------|-------|---------|---------|
| الإسبانية | es | 🇪🇸 | 27 | 181 |
| الإيطالية | it | 🇮🇹 | 35 | 210 |
| الصينية | zh | 🇨🇳 | 24 | 232 |
| اليابانية | ja | 🇯🇵 | 27 | 270 |
| الهندية | hi | 🇮🇳 | 22 | 198 |
| **المجموع** | | | **135** | **1091** |

### إضافة لغة جديدة
1. أنشئ مجلد `src/lib/courses/{code}/`
2. أنشئ `kit.ts` (انسخ من `src/lib/courses/hi/kit.ts` وغيّر target و Triple)
3. أنشئ `index.ts` (سجّل المواضيع على `q1-l1` إلى `q1-l35`)
4. أنشئ ملفات المواضيع (كل ملف = موضوع بـ 10 مراحل)
5. أضف اللغة إلى `CourseId` و `COURSES` في `src/lib/courses/index.ts`
6. أضف استيراداً في `src/lib/path-topics.ts`
7. أضف اختبارات في `src/lib/__tests__/courses.test.ts`

---

## 2. نظام الدروس المسرحيّة (Scene Lessons)

### بنية الدرس (SceneLesson)
كل درس يتكوّن من:
```typescript
{
  id: string           // معرّف فريد
  target: string       // كود اللغة ('es', 'it', 'zh', 'ja', 'hi')
  emoji: string        // رمز تعبيري
  title: Gloss         // العنوان بـ 3 لغات (الهدف + الإنجليزيّة + العربيّة)
  setting: Gloss       // السياق
  scene: SceneLine[]   // 5 أسطر حواريّة
  chunks: Chunk[]      // 8+ عبارات تعليميّة
  dialogues: Dialogue[] // حوار إضافي
  pattern: GrammarPattern // قاعدة نحويّة
  transfer: TransferScene // مشهد تطبيق
  produce: ProduceSpec // تمرين كتابي
  drills: DrillSpec[]  // 3 تمارين اختيار من متعدّد
}
```

### بنية العبارة (Chunk)
```typescript
{
  text: string         // النص باللغة الهدف
  emoji: string        // رمز تعبيري
  gloss: Gloss         // الترجمة (en + ar)
  usage: Gloss         // شرح الاستخدام
  examples: Array<{text: string, gloss: Gloss}> // مثالان
}
```

### قواعد الاختبارات
1. نص العبارة يجب أن يظهر **حرفياً** في كلا المثالين
2. 3 خيارات فريدة في كل تمرين، الإجابة الصحيحة أولاً
3. لا أحرف عربيّة في نص اللغة الهدف
4. على الأقل 8 عبارات لكل درس (للوصول إلى 18+ تحدّياً)
5. `mustInclude` يجب أن يظهر في `model`
6. `grammar.explanation` يجب أن يكون مصفوفة `['en', 'ar']`

---

## 3. نظام المسار المنزلي (Home Path)

### بنية الأيقونات
- المسار المنزلي يحتوي على 35+ أيقونة (`q1-l1` إلى `q1-l35`)
- كل أيقونة تمثّل موضوعاً تعليميّاً
- `topicStages(homeLessonId, course)` يعيد مراحل الموضوع للغة المختارة
- إذا لم يكن للموضوع مراحل في لغة معيّنة، يعود `null` (يظهر "coming soon")

### تسجيل المواضيع
```typescript
// src/lib/courses/{lang}/index.ts
export const {LANG}_TOPIC_STAGES: Record<string, SceneLesson[]> = {
  'q1-l1': SALUDOS,      // A1
  'q1-l2': NUMEROS,
  // ...
  'q1-l16': PASADO,      // A2
  'q1-l20': CONGIUNTIVO, // B1
  'q1-l24': CONGIUNTIVO_PASSATO, // B2
  'q1-l28': CONCORDANZA_TEMPI,   // C1
  'q1-l32': CAMBI_REGISTRO,     // C2
}
```

---

## 4. نظام التحدّيات (Challenges)

### أنواع التحدّيات
- `fill-1`, `fill-2`: ملء الفراغات
- `order-1`: ترتيب الكلمات
- `transfer-1`: تطبيق القاعدة في سياق جديد
- `produce`: تمرين كتابي
- `new-N`: تحدّيات إضافيّة

### بناء التحدّيات
```typescript
buildSceneChallenges(lesson, locale) → Challenge[]
```
تُبنى تلقائيّاً من مكوّنات الدرس (chunks, grammar, transfer, produce, drills).

---

## 5. نظام الترجمة (i18n)

### اللغات المدعومة
- العربيّة (ar) — RTL
- الإنجليزيّة (en) — LTR
- الفرنسيّة (fr), الألمانيّة (de), الإسبانيّة (es)
- الإيطاليّة (it), الصينيّة (zh), اليابانيّة (ja), الهنديّة (hi)
- الروسيّة (ru), التركيّة (tr), البرتغاليّة (pt), الكوريّة (ko)
- وغيرها (30+ لغة)

### آلية العمل
- `useCourse()` يعيد اللغة الحاليّة
- `useChooseCourse()` يبدّل اللغة + الواجهة
- عند اختيار لغة، الواجهة كلّها تتبدّل للغة المختارة
- ترجمات الواجهة في `src/locales/{code}.json`

---

## 6. نظام الجواهر (Gems System)

- `gemTransaction` table في Prisma
- كسب الجواهر من إكمال الدروس
- إنفاق الجواهر في المتجر
- `src/lib/gems-migration.ts` للترحيل

---

## 7. نظام التقدّم (Progress)

### نماذج Prisma
- `LessonProgress`: تقدّم الطالب في كل درس
- `ChallengeAttempt`: محاولات التحدّيات
- `ChallengeSession`: جلسات التحدّي
- `WorldProgress`: تقدّم العالم

### API Routes
- `/api/progress/complete-lesson`: إكمال درس
- `/api/challenges/start-session`: بدء جلسة تحدّي
- `/api/world-progress/record-attempt`: تسجيل محاولة

---

## 8. نظام الصوت (Audio System)

- `src/lib/lesson-audio-manifest.json`: قائمة بمعرّفات الدروس التي لها صوت
- صوت لكل درس يتمّ إضافته عبر `Add lesson audio` commits
- النظام يتحقّق من وجود الصوت قبل التشغيل

---

## 9. نظام التدريب (Practice)

### أنواع التدريب
- اختبارات قصيرة (unit tests) من دروس الوحدة
- مراجعة الأخطاء السابقة
- تدريب مستمرّ

### `buildUnitTest(unit, locale)`
يبني اختباراً من دروس الوحدة، يستخدم دروس اللغة المختارة فقط.

---

## 10. البنية التقنيّة

### التقنيات
- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui, Framer Motion
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Google OAuth + JWT (jose)
- **AI**: Google Generative AI (Gemini) + OpenAI
- **Audio**: Web Audio API
- **State**: Zustand

### البنية
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # صفحات المصادقة
│   ├── (main)/            # الصفحات الرئيسيّة
│   └── admin/             # لوحة الإدارة
├── lib/
│   ├── courses/           # دورات اللغات
│   │   ├── es/            # الإسبانية
│   │   ├── it/            # الإيطاليّة
│   │   ├── zh/            # الصينيّة
│   │   ├── ja/            # اليابانيّة
│   │   ├── hi/            # الهنديّة
│   │   └── index.ts       # تسجيل كل اللغات
│   ├── __tests__/         # الاختبارات
│   ├── arabic-path.ts     # مسار اللغة العربيّة
│   ├── path-topics.ts     # ربط المواضيع بالأيقونات
│   ├── scene-lessons.ts  # تعريفات الدروس
│   ├── lesson-challenges.ts # بناء التحدّيات
│   └── practice.ts        # نظام التدريب
├── components/            # مكوّنات React
└── locales/               # ملفات الترجمة
```

---

## 11. كيف يبني المطوّر محتوى تعليميّاً جديداً

### لإنشاء موضوع جديد (10 مراحل):
1. أنشئ ملف `src/lib/courses/{lang}/a1-nuevo.ts`
2. استخدم `stage()` من `kit.ts` لإنشاء 10 مراحل
3. كل مرحلة تحتاج: id, emoji, title, setting, scene (5 أسطر), phrases (8+), talk, grammar, transfer, write, drills
4. صدّر: `export const LANG_NUEVO: SceneLesson[] = [...]`
5. سجّل في `index.ts`: `'q1-lN': LANG_NUEVO`
6. شغّل الاختبارات: `npx vitest run src/lib/__tests__/courses.test.ts`

### القواعد الحاسمة:
- نص العبارة يجب أن يظهر حرفياً في المثالين
- لا أحرف عربيّة في نص اللغة الهدف
- `say()` تُغلق بـ `),` وليس `],`
- `grammar.explanation` مصفوفة `['en', 'ar']`
- `mustInclude` يظهر في `model`

---

## 12. الإحصاء النهائي

| المعلومة | العدد |
|----------|-------|
| اللغات التعليميّة | 5 |
| المواضيع التعليميّة | 135 |
| المراحل التعليميّة | 1091 |
| العبارات (chunks) | ~8728 |
| الاختبارات | 1556 |
| لغات الواجهة | 30+ |
| التقنيات | 15+ |
