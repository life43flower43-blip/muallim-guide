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
  many: "خطأً",
};

/** بعد فعل أو حرف جر: «راجع خطأين»، «من خطأين» */
export const ERROR_OBJ_FORMS: CountForms = {
  one: "خطأ واحد",
  two: "خطأين",
  few: "أخطاء",
  many: "خطأً",
};

export const ERROR_DUE_FORMS: CountForms = {
  one: "خطأ واحد مستحق",
  two: "خطآن مستحقان",
  few: "أخطاء مستحقة",
  many: "خطأً مستحقًا",
};

export const CHAPTER_FORMS: CountForms = {
  one: "فصل واحد",
  two: "فصلان",
  few: "فصول",
  many: "فصلًا",
};

/** بعد «من»: «أتقنت ٣ من ٥ فصول» */
export const CHAPTER_GEN_FORMS: CountForms = {
  one: "فصل واحد",
  two: "فصلين",
  few: "فصول",
  many: "فصلًا",
};

export const MINUTE_FORMS: CountForms = {
  one: "دقيقة واحدة",
  two: "دقيقتان",
  few: "دقائق",
  many: "دقيقة",
};

export const EXAMPLE_FORMS: CountForms = {
  one: "مثال واحد",
  two: "مثالان",
  few: "أمثلة",
  many: "مثالًا",
};

export const CARD_FORMS: CountForms = {
  one: "بطاقة واحدة تعليمية",
  two: "بطاقتان تعليميتان",
  few: "بطاقات تعليمية",
  many: "بطاقة تعليمية",
};

export const WORD_FORMS: CountForms = {
  one: "كلمة واحدة",
  two: "كلمتان",
  few: "كلمات",
  many: "كلمة",
};

// ---------- الصياغة الأكاديمية: تقسيم الفقرات وتفكيك التعليل وسياق الشاهد ----------

/** تقسيم نص عربي طويل إلى فقرات قراءة مريحة على حدود الجُمل (٢–٣ جمل لكل فقرة) */
export function splitArParagraphs(text: string): string[] {
  const t = (text ?? "").trim();
  if (!t) return [];
  const sentences = t.split(/(?<=[.؟!…])\s+/).filter(Boolean);
  if (sentences.length < 3 || t.length < 220) return [t];
  const paras: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length > 130) {
      paras.push(cur.trim());
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur.trim()) paras.push(cur.trim());
  return paras.length ? paras : [t];
}

/**
 * تفكيك التعليل الأكاديمي إلى شقّين:
 * «أساس الصواب» ثم «موقف البدائل» (كل جملة تبدأ بإبطال خيار) — ليُعرض كل شق بعنوانه.
 * ملاحظة: \b لا يعمل مع العربية في جافاسكربت — تُستخدم lookahead عند حدود الكلمات.
 */
export function splitReason(reason: string): { base: string; rest: string | null } {
  const t = (reason ?? "").trim();
  if (!t) return { base: "", rest: null };
  const sentences = t.split(/(?<=[.؛])\s+/).filter(Boolean);
  const AR = "(?![\\u0621-\\u064a])"; // ليس متبوعًا بحرف عربي — بديل \b الآمن مع العربية
  const REJECT = new RegExp(
    "^(أما[ ]|ولا يصح|وتسقط|وتبقى|وباقي[ ]" +
      "|و?الخيار[ ](الأول|الثاني|الثالث|الرابع)" + AR +
      "|و?الخيارات[ ](الأخرى|البديلة|الأولى|الثانية|الثالثة|الرابعة)" + AR +
      "|و?الخياران" + AR + "|و?الخيارين" + AR +
      "|البدائل[ ]|المشتتات)"
  );
  for (let i = 1; i < sentences.length; i++) {
    if (REJECT.test(sentences[i])) {
      const base = sentences.slice(0, i).join(" ").trim();
      const rest = sentences.slice(i).join(" ").trim();
      if (base.length >= 25 && rest.length >= 20) return { base, rest };
      break;
    }
  }
  return { base: t, rest: null };
}

/** سياق الشاهد التطبيقي: تُستنتج المرحلة أو البيئة من مفردات المثال نفسه */
export function exampleContext(ex: string): string {
  const t = ex ?? "";
  if (/روضة|رياض[ ]الأطفال/.test(t)) return "الروضة";
  if (/ابتدائي/.test(t)) return "الابتدائي";
  if (/المتوسطة|المرحلة[ ]المتوسطة|متوسطة/.test(t)) return "المتوسط";
  if (/ثانوي/.test(t)) return "الثانوي";
  if (/جامعة|الجامعي/.test(t)) return "الجامعي";
  if (/في[ ]المنزل|والدته?[ ]|والدة|الأسرة|الأب[ ]|الأم[ ]/.test(t)) return "المنزل";
  return "ميداني";
}
