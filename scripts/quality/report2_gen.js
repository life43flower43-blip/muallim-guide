// تقرير جودة المحتوى والإصلاحات — docx عربي RTL (وصفة R1 / لوحة WM-1)
// لغة مبسطة: جمل قصيرة، بلا توريق، أرقام موثقة من سكربتات الجلسة
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, SectionType, TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");

const PAL = {
  bg: "F4F1E9", primary: "15857A", accent: "FF6A3B",
  cover: { titleColor: "15857A", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0" },
  table: { headerBg: "15857A", headerText: "FFFFFF", accentLine: "15857A", innerLine: "D5D0C8", surface: "F0EDE5" },
};
const AR_FONT = { ascii: "Arial", hAnsi: "Arial", cs: "Arial", eastAsia: "Arial" };
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const AD = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const n = (v) => String(v).replace(/[0-9]/g, (d) => AD[+d]);

function ar(text, o = {}) {
  return new TextRun({ text, rightToLeft: true, sizeComplexScript: true, font: AR_FONT,
    color: o.color || "000000", size: o.size || 24, bold: o.bold || false, italics: o.italics || false });
}
function p(text, o = {}) {
  return new Paragraph({ bidirectional: true, alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: o.after || 120 },
    children: Array.isArray(text) ? text : [ar(text, o)] });
}
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, bidirectional: true, alignment: AlignmentType.START,
    spacing: { before: 360, after: 160, line: 380, lineRule: "atLeast" },
    children: [ar(text, { size: 32, bold: true, color: PAL.primary })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, bidirectional: true, alignment: AlignmentType.START,
    spacing: { before: 240, after: 120, line: 340, lineRule: "atLeast" },
    children: [ar(text, { size: 28, bold: true, color: PAL.primary })] });
}
function caption(text) {
  return new Paragraph({ bidirectional: true, keepNext: true, alignment: AlignmentType.START,
    spacing: { before: 160, after: 80, line: 312 },
    children: [ar(text, { size: 21, bold: true, color: PAL.primary })] });
}
function tbl(headers, rows, widths) {
  const mk = (t, head, w) => new TableCell({
    children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.START, spacing: { line: 300 },
      children: [ar(String(t), { size: head ? 21 : 20, bold: head, color: head ? PAL.table.headerText : "000000" })] })],
    shading: head ? { type: ShadingType.CLEAR, fill: PAL.table.headerBg } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    width: { size: w, type: WidthType.PERCENTAGE },
  });
  return new Table({
    visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: PAL.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: PAL.table.accentLine }, left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: PAL.table.innerLine }, insideVertical: NB },
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((t, i) => mk(t, true, widths[i])) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => mk(t, false, widths[i])) }))],
  });
}
function splitTitleLines(title, cpl) {
  if (title.length <= cpl) return [title];
  const br = new Set([..."،؛: \t-—·/"]);
  const lines = []; let rem = title;
  while (rem.length > cpl) {
    let at = -1;
    for (let i = cpl; i >= Math.floor(cpl * 0.6); i--) if (i < rem.length && br.has(rem[i - 1])) { at = i; break; }
    if (at === -1) { const lim = Math.min(rem.length, Math.ceil(cpl * 1.3)); for (let i = cpl + 1; i < lim; i++) if (br.has(rem[i - 1])) { at = i; break; } }
    if (at === -1) at = cpl;
    lines.push(rem.slice(0, at).trim()); rem = rem.slice(at).trim();
  }
  if (rem) lines.push(rem);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) { const last = lines.pop(); lines[lines.length - 1] += " " + last; }
  return lines;
}
function calcTitleLayout(title, maxW, prefPt = 40, minPt = 24) {
  const cw = (pt) => pt * 13;
  let pt = prefPt, lines;
  while (pt >= minPt) { const c = Math.floor(maxW / cw(pt)); if (c < 2) { pt -= 2; continue; } lines = splitTitleLines(title, c); if (lines.length <= 3) break; pt -= 2; }
  if (!lines || lines.length > 3) { lines = splitTitleLines(title, Math.floor(maxW / cw(minPt))); pt = minPt; }
  return { titlePt: pt, titleLines: lines };
}
function calcCoverSpacing(pr) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasLabel = false,
    metaLineCount = 0, fixedHeight = 400, pageHeight = 16838 } = pr;
  const SAFETY = 1200;
  const usable = pageHeight - SAFETY;
  const content = titleLineCount * (titlePt * 23 + 200) + (hasSubtitle ? 12 * 23 + 600 : 0) +
    (hasLabel ? 9 * 23 + 600 : 0) + metaLineCount * (10 * 23 + 100) + fixedHeight + 900;
  const rest = Math.max(usable - content, 400);
  const bottom = Math.max(Math.floor(rest * 0.45), 800);
  const top = Math.max(Math.floor(rest * 0.45) - Math.max(0, 800 - bottom), 400);
  return { topSpacing: top, bottomSpacing: bottom };
}
function buildCover(cfg) {
  const P = cfg.palette; const padR = 1200, padL = 800;
  const { titlePt, titleLines } = calcTitleLayout(cfg.title, 11906 - padR - padL - 300, 40, 24);
  const sp = calcCoverSpacing({ titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!cfg.subtitle, hasLabel: !!cfg.label, metaLineCount: (cfg.metaLines || []).length, fixedHeight: 400 });
  const accentRight = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const ch = [];
  ch.push(new Paragraph({ spacing: { before: sp.topSpacing } }));
  if (cfg.label) ch.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.START,
    indent: { right: padR, left: padL }, spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    children: [ar(cfg.label, { size: 20, color: P.accent, bold: true })] }));
  for (let i = 0; i < titleLines.length; i++) {
    ch.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.START, indent: { right: padR },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [ar(titleLines[i], { size: titlePt * 2, bold: true, color: P.cover.titleColor })] }));
  }
  if (cfg.subtitle) ch.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.START,
    indent: { right: padR }, spacing: { after: 800, line: 340, lineRule: "atLeast" },
    children: [ar(cfg.subtitle, { size: 24, color: P.cover.subtitleColor })] }));
  for (const line of (cfg.metaLines || [])) {
    ch.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.START,
      indent: { right: padR + 200 }, spacing: { after: 80 }, border: { right: accentRight },
      children: [ar(line, { size: 24, color: P.cover.metaColor })] }));
  }
  ch.push(new Paragraph({ spacing: { before: sp.bottomSpacing } }));
  ch.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.START,
    indent: { right: padR, left: padL },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } }, spacing: { before: 200 },
    children: [ar(cfg.footerRight || "", { size: 16, color: P.cover.footerColor }),
      new TextRun({ text: "                                        ", font: AR_FONT }),
      ar(cfg.footerLeft || "", { size: 16, color: P.cover.footerColor })] }));
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: allNoBorders,
    rows: [new TableRow({ height: { value: 16838, rule: "exact" },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, verticalAlign: "top", children: ch })] })] })];
}
const pageFooter = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: AR_FONT })] })] });
const pageHeader = () => new Header({ children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER,
  children: [ar("جودة المحتوى والإصلاحات — تطبيق دليل المعلم", { size: 18, color: "808080" })] })] });

// ================= المتن =================
const B = [];

B.push(h1("الملخص التنفيذي"));
B.push(p("أمرت بتنفيذ العمل، وأبلغتنا بملاحظتين: جمل كثيرة غير مترابطة يصعب فهمها، وأخطاء إملائية منتشرة في التطبيق. فحصنا الاثنتين على البنك كاملًا وعلى نصوص الواجهة، ثم أصلحنا كل ما هو مؤكد الخطأ، ووقفنا عند ما يحتاج قرارك."));
B.push(p(`أهم النتائج: الواجهة نظيفة إملائيًا بلا استثناء. البنك نظيف من عامية الفصحى ومن همزات القطع تقريبًا، لكنه يحمل خطأين حقيقيين واسعَي الانتشار: مصطلح «التعق» مكان «التعلق» في ` + n(28) + ` موضعًا، وأخطاء تاء مربوطة كُتبت هاءً في مواضع متفرقة. ورصدنا جملًا طويلة متداخلة في شروح، وسجلّناها بانتظار موافقتك على دفعة إعادة صياغة.`));
B.push(p(`كما اكتشفنا أن الحاوية استُعيدت إلى حالة الأمس المساء، ففُقد إصلاح «مرحلة الصفر» المعتمد سابقًا، فأعدنا تطبيقه بالكامل مع إصلاحات اليوم، بنسخة احتياطية وتحقق ذاتي عشرة من عشرة. الخادم الحي يخدم البنك المُصلَح الآن.`));

B.push(h1("أولًا: ماذا وجد الفحص؟"));
B.push(h2("الأخطاء الإملائية: أين هي فعليًا؟"));
B.push(p("فحصنا البنك بقاموس رمزٍ مقابل رمز، لا بالبحث النصي الجزئي. فاكتشفنا أن الهمزات سليمة في الغالب: كلمات مثل «أن، أو، إذا، أكثر» مكتوبة صحيحًا إلا في ثلاثة مواضع. والعامية غير موجودة: كلمات مثل «حاجة» و«خالص» جاءت في معناها الفصحي الصحيح. والواجهة (نصوص الشاشات في الكود) سليمة تمامًا."));
B.push(p(`الخطأ الواسع الحقيقي من نوعين. الأول مصطلحي: «التعق» بدل «التعلق» في نظرية بولبي، وهذا خطأ ممنهج في كل محتوى نظرية التعلق تقريبًا. مثال حي: «نمط التعق الآمن يميزه الدوران بين الاستكشاف والعودة». والثاني إملائي: تاء مربوطة كُتبت هاءً، مثل «مشروعه» مكان «مشروعة» و«أستاذه» مكان «أستاذة». هذه الفئة تحتاج حكمًا سياقيًا لأن «مشروعه» قد تكون صحيحة بمعنى «مشروعه الخاص به»، فلم نُصلحها آليًا حفاظًا على سلامة النص، وجزناها بأقواسها كاملة بانتظار حكم آلي عند تجدد الحصة.`));
B.push(h2("ترابط الجمل: أين المشكلة؟"));
B.push(p(`فحصنا كل شرح وتعليل بمؤشرات: طول الجملة، انقطاع الروابط، تكرار العبارات، التوازن في التنصيص. النتيجة: ` + n(783) + ` شرحًا عليها إشارة واحدة على الأقل، وأغلظها جمل تمتد من ` + n(37) + ` إلى ` + n(42) + ` كلمة بلا فاصل، وتكرار مفردة داخل النص الواحد. هذه ليست أخطاء إملائية بل أسلوب توليد متعب للقارئ. وميّزنا بين إشارة تحذير وحكم نهائي: حكم النصوص يحتاج مراجعة لغوية آلية جاهزة لدينا ولم تعمل بعد لانقطاع حصة النموذج.`));

B.push(h1("ثانيًا: الإصلاحات المنفذة اليوم"));
B.push(p("كل ما في هذا القسم منفذ ومُتحقق منه بفراغات تأكيد حرفية، والرجوع ممكن من النسخة الاحتياطية المؤرخة. لم يُحذف سؤال ولا مفهوم، ولم يتغير أي معرف."));
B.push(caption("الجدول ١: قبل الإصلاح وبعده"));
B.push(tbl(
  ["البند", "قبل", "بعد"],
  [
    ["أسئلة لا يمكن الإجابة عنها صوابًا (Q9249 وQ9314 وQ9810)", n(3), n(0)],
    ["بادئات أ)ب) مدمجة في Q947 وتعداد الخيارات في نصه", "موجود", "مُزال"],
    ["تسرب الإجابة في نص Q2110 وQ11485", n(2), n(0)],
    ["«لإثنان قدراته» المبتورة في Q1091", n(1), n(0)],
    ["مصطلح «التعق» مكان «التعلق»", n(28), n(0)],
    ["استبدالات إملائية رمزية أخرى (بالغلط، الغلطات، مسئولية، الإستراتيجية…)", "—", n(12)],
    ["أسئلة مكررة حرفيًا", n(5) + " مجموعات", n(0)],
    ["أزواج شبه متطابقة (تشابه ٩٠٪ فأكثر)", n(4), n(0)],
    ["عناوين مفاهيم مكررة", n(2), n(0)],
    ["تضارب مفتاح correct مع isCorrect", n(16), n(0)],
  ],
  [56, 22, 22]
));
B.push(p("طريقة إصلاح المكرر: أعدنا كتابة النسخة الثانية من كل مجموعة بسؤال جديد على المفهوم نفسه، ببدائل جديدة وتعليل جديد، مع بقاء المعرف كما هو حتى لا يضيع سجل أخطاء الطلاب. وأعدنا تسمية المفهومين المتطابقين في العنوان: أصبح «مبادئ التعليم المتمايز في الصف» و«الانفعال: مكوناته الجسدية والنفسية»، وشروحهما كما هي."));
B.push(p("ولم نصحح أسلوب الجمل في هذه الجلسة. إعادة صياغة مئات الشروح قرار تحريري يحتاج موافقتك على نطاقه وعينته، وفحص الحكم الآلي جاهز لتحديد الأسوأ أولًا."));

B.push(h1("ثالثًا: ماذا عن فحص النسخ من الإنترنت؟"));
B.push(p("نفذنا سابقًا فحص الأصالة كما حددت: مقاطع من عشر كلمات من عينة طبقية بواقع مئة مفهوم وثلاثمئة سؤال، وبحث مقتبس عبر واجهة بحث رسمية. فحص بنجاح ٢٠٦ مقاطع قبل أن تُغلق حصة البحث بأكثر من تسعين دقيقة. النتيجة: لا تطابق حرفي واحد، ولا تطابق متصل من ست كلمات فأكثر في أكثر من ألف مقتطف."));
B.push(p("بعد استعادة الحاوية فُقدت ملفات نتائج ذلك الفحص، لكن نتيجته موثقة في سجل العمل، وهي تشمل مقاطع من نصوص قبل إصلاحات اليوم. الاستئناف بعد الإصلاح أفضل من مواصلته، لأن النصوص تغيرت، والاستخراج إعادة تشغيل أمر واحد. الواجهة ما زالت مغلقة حتى لحظة إعداد هذا التقرير."));

B.push(h1("رابعًا: المعلق بانتظار قرارك"));
B.push(caption("الجدول ٢: البنود المعلقة وكل ما يلزمها"));
B.push(tbl(
  ["البند", "ما يلزمه", "الوقت التقريبي"],
  [
    ["إعادة صياغة الجمل الممدودة والمتداخلة", "تشغيل الحكم الآلي على العينة الجاهزة، ثم إصلاح الأسوأ بمراجعة تدريجية تبدأ بأسوأ نتيجة", "جلسة إلى جلستين"],
    ["فصل «مشروعه/أستاذه…»: هاء ضمير أم خطأ تاء", "تشغيل حكم آلي على ٦٠ سياقًا جاهزة ثم إصلاح المصنّف خطأً", "أقل من جلسة"],
    ["مراجعة مصطلحات ١٣٠٣ عنوان مفهوم", "سكربت جاهز يقسم العناوين دفعات ويعيد المشكوك فيها فقط", "أقل من جلسة"],
    ["استكمال فحص الأصالة (الأسئلة لم تُفحص بعد)", "تجدد حصة البحث ثم إعادة الاستخراج من النص المصلح", "حسب الحصة"],
    ["صفحة «مصادر ومراجع» في التطبيق", "بناء صفحة وإضافة رابطها، وفحص متصفح وبناء إنتاجي", "جلسة"],
  ],
  [40, 40, 20]
));
B.push(p("لا شيء من هذه البنود بدأ قبل موافقتك. ورتّبناها بحيث يبدأ الأرخص أثرًا: الحكم الآلي يحسم الإملاء الملتبس ويحدد أسوأ جمل فتعرف حجم دفعة إعادة الصياغة قبل الموافقة عليها."));

B.push(h1("خامسًا: حدود هذا التقرير"));
B.push(p("ما هو متحقق منه بقياس مباشر: كل أرقام الإصلاح، وتحقق البنك المخدوم على الخادم الحي، وصفر الحرجة في إعادة التدقيق. وما هو مستنتج: قائمة الجمل المرشحة لإعادة الصياغة من مؤشرات إحصائية قبل الحكم الآلي. وما لم يُفحص: دلالة ة/ه الملتبسة حتى يعمل الحكم الآلي، وبقية عينة الأصالة، والتجربة الفعلية مع مستخدمين. وسجلت كل التفاصيل في ملف سجل العمل وملفات النتائج داخل مجلد السكربتات."));

// ================= التجميع =================
const doc = new Document({
  styles: { default: { document: { run: { font: AR_FONT, size: 24, color: "000000", rightToLeft: true, sizeComplexScript: true }, paragraph: { spacing: { line: 312 } } },
    heading1: { run: { font: AR_FONT, size: 32, bold: true, color: PAL.primary }, paragraph: { spacing: { before: 360, after: 160, line: 380 } } },
    heading2: { run: { font: AR_FONT, size: 28, bold: true, color: PAL.primary }, paragraph: { spacing: { before: 240, after: 120, line: 340 } } } } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCover({
        palette: PAL,
        label: "جودة المحتوى — إصلاحات منفذة ومعلق بانتظار قرارك",
        title: "تقرير جودة المحتوى والإصلاحات المنفذة",
        subtitle: "رصد أخطائين أبلغتَ عنهما، وإصلاح المؤكد منها، وتوثيق المعلق — بلا حذف ولا تغيير معرفات",
        metaLines: [
          "المحاولة: " + n(1303) + " مفهوماً و" + n(5947) + " سؤالاً + سلاسل الواجهة",
          "أبرز ما رُصد: مصطلح «التعق» ×" + n(28) + " — تباين ة/ه — جمل ممدودة",
          "الحالة: منفذ ومتحقق — والمعلق ينتظر موافقتك",
          "تاريخ الإصدار: " + n(15) + " أكتوبر " + n(2026),
        ],
        footerRight: "تقرير داخلي لأصحاب المنتج",
        footerLeft: "دليل المعلم — نظام تطوير كفاءة المعلم",
      }) },
    { properties: { type: SectionType.NEXT_PAGE,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1417, right: 1701 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } } },
      footers: { default: pageFooter() },
      children: [
        new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 },
          children: [ar("المحتويات", { size: 32, bold: true })] }),
        new TableOfContents("جدول المحتويات", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({ bidirectional: true, spacing: { before: 200 },
          children: [ar("ملاحظة: الفهرس حقول آلية؛ لتحديث أرقام الصفحات انقر بالزر الأيمن واختر «تحديث الحقل».", { italics: true, size: 18, color: "888888" })] }),
      ] },
    { properties: { type: SectionType.NEXT_PAGE,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1417, right: 1701 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: pageHeader() }, footers: { default: pageFooter() },
      children: B },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = "/home/z/my-project/download/تقرير-جودة-المحتوى-والإصلاحات.docx";
  fs.writeFileSync(out, buf);
  console.log("WROTE", out, buf.length, "bytes");
});
