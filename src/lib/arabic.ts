// طبقة تنسيق الأعداد العربية — صيغ الجمع الصحيحة حسب الرقم (نقد البند 5)
// القاعدة: 1 → «سؤال واحد»، 2 → «سؤالان»، 3-10 → «أسئلة» (جمع)،
// 11 فأكثر والصفر → المفرد المنصوب «سؤالًا» — والأرقام تُعرض بالأرقام العربية المشرقية ٠١٢٣
// (قرار المستخدم: الأرقام اللاتينية وسط النص العربي تكسر ترتيب الكلمات وتشوّه اللغة).

export interface CountForms {
  one: string; // صيغة العدد واحد (مضمّنة): «سؤال واحد»
  two: string; // صيغة المثنى: «سؤالان»
  few: string; // جمع الاثنين إلى العشرة: «أسئلة»
  many: string; // المفرد المنصوب لما بعد العشرة وللصفر: «سؤالًا»
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩" as const;

/** تحويل الأرقام اللاتينية إلى أرقام عربية مشرقية (٠١٢٣٤٥٦٧٨٩) — للنصوص والعدديات على حد سواء */
export function ad(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

/** يركّب الرقم مع صيغته العربية الصحيحة — إن كانت الصيغة تضم العدد (واحد/اثنان) فلا يُضاف رقم */
export function arCount(n: number, f: CountForms): string {
  if (n === 1) return f.one;
  if (n === 2) return f.two;
  if (n >= 3 && n <= 10) return `${ad(n)} ${f.few}`;
  return `${ad(n)} ${f.many}`;
}

// ---------- قواميس الصيغ الجاهزة ----------

export const QUESTION_FORMS: CountForms = {
  one: "سؤال واحد",
  two: "سؤالان",
  few: "أسئلة",
  many: "سؤالًا",
};

export const QUESTION_DUE_FORMS: CountForms = {
  one: "سؤال واحد مستحق",
  two: "سؤالان مستحقان",
  few: "أسئلة مستحقة",
  many: "سؤالًا مستحقًا",
};

/** للمفعول به أو بعد حرف جر (عن/من): «أجبت عن سؤالين» */
export const QUESTION_OBJ_FORMS: CountForms = {
  one: "سؤال واحد",
  two: "سؤالين",
  few: "أسئلة",
  many: "سؤالًا",
};

/** بعد حرف الجر «من»: «أنجزت 3 من 5 أسئلة» — نفس صيغ الجر */
export const QUESTION_GEN_FORMS: CountForms = QUESTION_OBJ_FORMS;

/** «إعادة …»: مع عبارة الخطأ الكاملة بحسب العدد */
export const QUESTION_MISTAKE_FORMS: CountForms = {
  one: "سؤال واحد أخطأت فيه",
  two: "سؤالين أخطأت فيهما",
  few: "أسئلة أخطأت فيها",
  many: "سؤالًا أخطأت فيه",
};

export const CONCEPT_FORMS: CountForms = {
  one: "مفهوم واحد",
  two: "مفهومان",
  few: "مفاهيم",
  many: "مفهومًا",
};

export const SCENARIO_FORMS: CountForms = {
  one: "موقف واحد",
  two: "موقفان",
  few: "مواقف",
  many: "موقفًا",
};

/** موقف صفّي مع النعوت المتوافقة: «10 مواقف صفية» / «15 موقفًا صفّيًا» */
export const SCENARIO_ADJ_FORMS: CountForms = {
  one: "موقف واحد صفّي",
  two: "موقفين صفّيين",
  few: "مواقف صفية",
  many: "موقفًا صفّيًا",
};

export const POINT_FORMS: CountForms = {
  one: "نقطة واحدة",
  two: "نقطتان",
  few: "نقاط",
  many: "نقطة",
};

export const GEM_FORMS: CountForms = {
  one: "جوهرة واحدة",
  two: "جوهرتان",
  few: "جواهر",
  many: "جوهرة",
};

export const DAY_FORMS: CountForms = {
  one: "يوم واحد",
  two: "يومان",
  few: "أيام",
  many: "يومًا",
};

export const ERROR_FORMS: CountForms = {
  one: "خطأ واحد",
  two: "خطآن",
  few: "أخطاء",
  many: "خطأ",
};

export const CARD_FORMS: CountForms = {
  one: "بطاقة واحدة تعليمية",
  two: "بطاقتان تعليميتان",
  few: "بطاقات تعليمية",
  many: "بطاقة تعليمية",
};
