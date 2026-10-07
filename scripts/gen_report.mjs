// توليد تقرير الميزات بصيغة docx — عربي RTL — وصفة غلاف R1 بلوحة WM-1
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, SectionType, TableOfContents,
  TableLayoutType, PageBreak,
} = require("docx");
import fs from "fs";
import { CONTENT } from "./report_content.mjs";

// ─── ثوابت ───
const P = { // WM-1 Warm Teal — education
  bg: "F4F1E9", primary: "15857A", accent: "FF6A3B",
  cover: { titleColor: "15857A", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0" },
  table: { headerBg: "15857A", headerText: "FFFFFF", accentLine: "15857A", innerLine: "D5D0C8", surface: "F0EDE5" },
};
const FONT = { ascii: "Arial", hAnsi: "Arial", cs: "Arial" };
const BLACK = "000000";
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const PAGE = { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1417, right: 1701 } };

// ─── مساعدات عربية ───
function ar(text, o = {}) {
  const sz = o.size || 24;
  return new TextRun({
    text, font: FONT, color: o.color || BLACK,
    size: sz, sizeComplexScript: sz,
    bold: !!o.bold, boldComplexScript: !!o.bold,
    italics: !!o.italics, italicsComplexScript: !!o.italics,
    rightToLeft: true,
  });
}
function pBody(text, o = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: o.after ?? 140 },
    children: [ar(text, o)],
  });
}
function heading(text, level) {
  const sizes = { 1: 32, 2: 28, 3: 26 };
  const lv = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 };
  return new Paragraph({
    heading: lv[level], bidirectional: true,
    spacing: { before: level === 1 ? 400 : 280, after: 160, line: 340, lineRule: "atLeast" },
    children: [ar(text, { bold: true, size: sizes[level], color: P.primary })],
  });
}
function tableTitle(text) {
  return new Paragraph({
    bidirectional: true, keepNext: true,
    spacing: { before: 120, after: 100 },
    children: [ar(text, { bold: true, size: 21, color: P.primary })],
  });
}
function cellP(text, o = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: o.align || AlignmentType.START,
    spacing: { line: 276 },
    children: [ar(text, { size: o.size || 21, bold: !!o.bold, color: o.color || BLACK })],
  });
}
function makeTable({ header, rows, widths, headerSize = 21, dataSize = 21 }) {
  const mk = (texts, isHeader, i) => new TableCell({
    width: { size: widths[i], type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: P.table.headerBg }
      : { type: ShadingType.CLEAR, fill: "FFFFFF" },
    children: [cellP(texts, {
      bold: isHeader, size: isHeader ? headerSize : dataSize,
      color: isHeader ? P.table.headerText : BLACK,
      align: isHeader ? AlignmentType.CENTER : AlignmentType.START,
    })],
  });
  return new Table({
    visuallyRightToLeft: true,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: P.table.accentLine },
      left: NONE, right: NONE,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => mk(h, true, i)) }),
      ...rows.map((r, ri) => new TableRow({
        cantSplit: true,
        children: r.map((c, i) => {
          const cell = mk(c, false, i);
          return cell;
        }),
      })),
    ],
  });
}

// ─── تخطيط عنوان الغلاف (عربي: عرض الحرف ≈ pt×13) ───
function splitTitleLines(title, cpl) {
  if (title.length <= cpl) return [title];
  const words = title.split(" ");
  const lines = []; let cur = "";
  for (const w of words) {
    const cand = cur ? cur + " " + w : w;
    if (cand.length <= cpl) cur = cand;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > 1 && lines[lines.length - 1].length <= 4) {
    const last = lines.pop();
    lines[lines.length - 1] += " " + last;
  }
  return lines;
}
function calcTitleLayoutAr(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charW = (pt) => pt * 13;
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = Math.floor(maxWidthTwips / charW(titlePt));
    if (cpl < 4) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitTitleLines(title, Math.floor(maxWidthTwips / charW(minPt))); titlePt = minPt; }
  return { titlePt, titleLines: lines };
}
function calcCoverSpacing(prm) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
    metaLineCount = 0, fixedHeight = 400, pageHeight = 16838 } = prm;
  const SAFETY = 1200;
  const usable = pageHeight - SAFETY;
  const titleH = titleLineCount * (titlePt * 23 + 200);
  const subH = hasSubtitle ? (12 * 23 + 600) : 0;
  const lblH = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaH = metaLineCount * (10 * 23 + 100);
  const implicit = 3 * 300;
  const content = titleH + subH + lblH + metaH + fixedHeight + implicit;
  const remaining = Math.max(usable - content, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(remaining * 0.45), rawBottom = Math.floor(remaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(remaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

// ─── غلاف R1 معرب (بداية السطر يمين) ───
function buildCoverR1RTL(cfg) {
  const C = P.cover;
  const padL = 1100, padR = 1100;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayoutAr(cfg.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const sp = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!cfg.subtitle, hasEnglishLabel: !!cfg.label,
    metaLineCount: (cfg.metaLines || []).length, fixedHeight: 400,
  });
  const accentBar = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const ch = [];
  ch.push(new Paragraph({ spacing: { before: sp.topSpacing } }));
  if (cfg.label) { // شارة لاتينية زخرفية أعلى الغلاف مع خط سفلي بلون التمييز
    ch.push(new Paragraph({
      indent: { left: padL, right: padR }, alignment: AlignmentType.RIGHT, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({ text: cfg.label.split("").join(" "), size: 18, color: P.accent, font: FONT, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    ch.push(new Paragraph({
      bidirectional: true, indent: { left: padL, right: padR },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [ar(titleLines[i], { bold: true, size: titleSize, color: C.titleColor })],
    }));
  }
  if (cfg.subtitle) {
    ch.push(new Paragraph({
      bidirectional: true, indent: { left: padL, right: padR }, spacing: { after: 800, line: 340, lineRule: "atLeast" },
      children: [ar(cfg.subtitle, { size: 24, color: C.subtitleColor })],
    }));
  }
  for (const line of (cfg.metaLines || [])) {
    ch.push(new Paragraph({
      bidirectional: true, indent: { left: padL, right: padR + 200 }, spacing: { after: 80, line: 300, lineRule: "atLeast" },
      border: { right: accentBar },
      children: [ar(line, { size: 22, color: C.metaColor })],
    }));
  }
  ch.push(new Paragraph({ spacing: { before: sp.bottomSpacing } }));
  ch.push(new Paragraph({
    bidirectional: true, indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      ar(cfg.footerLeft || "", { size: 18, color: C.footerColor }),
      new TextRun({ text: "                                        ", font: FONT }),
      ar(cfg.footerRight || "", { size: 18, color: C.footerColor }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, verticalAlign: "top", children: ch })],
    })],
  })];
}

// ─── ترويسة وتذييل ───
function pageFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT })],
    })],
  });
}
function bodyHeader() {
  return new Header({
    children: [new Paragraph({
      bidirectional: true, alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 4 } },
      children: [ar(CONTENT.meta.headerText, { size: 18, color: "808080" })],
    })],
  });
}

// ─── تجميع المتن ───
const M = CONTENT;
const body = [];
body.push(heading("الملخص التنفيذي", 1));
M.execSummary.forEach((t) => body.push(pBody(t)));
body.push(heading("خلفية التقرير وأهدافه ونطاقه", 1));
M.background.forEach((t) => body.push(pBody(t)));
body.push(heading("المنهجية ومصادر المعلومات", 1));
M.methodology.forEach((t) => body.push(pBody(t)));
body.push(heading("جرد الميزات الحالية في التطبيق", 1));
M.inventoryIntro.forEach((t) => body.push(pBody(t)));
body.push(tableTitle(M.inventoryTable.title));
body.push(makeTable({ header: M.inventoryTable.header, rows: M.inventoryTable.rows, widths: [26, 74] }));
body.push(heading("أبرز ميزات تطبيقات المنافسين", 1));
M.competitorsIntro.forEach((t) => body.push(pBody(t)));
M.competitors.forEach((c) => {
  body.push(heading(c.name, 2));
  body.push(pBody(c.body));
});
body.push(tableTitle(M.competitorsTable.title));
body.push(makeTable({ header: M.competitorsTable.header, rows: M.competitorsTable.rows, widths: [16, 52, 32] }));
body.push(heading("مصفوفة الفجوات: ما عندهم وغير موجود عندنا", 1));
M.gapsIntro.forEach((t) => body.push(pBody(t)));
body.push(tableTitle(M.gapsTable.title));
body.push(makeTable({ header: M.gapsTable.header, rows: M.gapsTable.rows, widths: [19, 14, 21, 33, 13], dataSize: 20, headerSize: 20 }));
body.push(heading("التوصيات مقسمة على مراحل", 1));
body.push(heading("المرحلة الأولى: ميزات تُكمل تدفق الاختبار المكثف وصفحة الأخطاء", 2));
M.recommendations.phaseA.forEach((t) => body.push(pBody(t)));
body.push(heading("المرحلة الثانية: تجربة الاستخدام والوصول وأمان التقدم", 2));
M.recommendations.phaseB.forEach((t) => body.push(pBody(t)));
body.push(heading("المرحلة الثالثة: إثراء بعد نضج الأساس", 2));
M.recommendations.phaseC.forEach((t) => body.push(pBody(t)));
body.push(heading("ميزات نتجنبها عمدًا وأسباب ذلك", 2));
M.recommendations.avoid.forEach((t) => body.push(pBody(t)));
body.push(heading("خطة التنفيذ والأولويات والترابط مع المهام الجارية", 1));
M.plan.intro.forEach((t) => body.push(pBody(t)));
body.push(tableTitle(M.plan.table.title));
body.push(makeTable({ header: M.plan.table.header, rows: M.plan.table.rows, widths: [9, 34, 12, 45] }));
M.plan.closing.forEach((t) => body.push(pBody(t)));

// ─── المستند ───
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24, color: BLACK },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: FONT, size: 32, bold: true, color: P.primary }, paragraph: { spacing: { before: 400, after: 160, line: 340 } } },
      heading2: { run: { font: FONT, size: 28, bold: true, color: P.primary }, paragraph: { spacing: { before: 280, after: 120, line: 320 } } },
      heading3: { run: { font: FONT, size: 26, bold: true, color: P.primary }, paragraph: { spacing: { before: 220, after: 100, line: 312 } } },
    },
  },
  sections: [
    { // ١) الغلاف — هوامش صفرية، بلا ترقيم
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1RTL(M.meta),
    },
    { // ٢) المحتويات — ترقيم روماني
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: PAGE.size, margin: PAGE.margin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      footers: { default: pageFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 },
          children: [ar("المحتويات", { bold: true, size: 32, color: P.primary })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({
          bidirectional: true, spacing: { before: 200 },
          children: [ar("ملاحظة: هذا الجدول مولّد بحقول آلية؛ بعد أي تعديل انقر بزر الفأرة الأيمن على الجدول واختر «تحديث الحقل» لضمان دقة أرقام الصفحات.", { italics: true, size: 18, color: "888888" })],
        }),
      ],
    },
    { // ٣) المتن — ترقيم عربي يبدأ من ١
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: PAGE.size, margin: PAGE.margin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: bodyHeader() },
      footers: { default: pageFooter() },
      children: body,
    },
  ],
});

const OUT = "/home/z/my-project/download/تحليل-ميزات-تطبيق-مساعد-إعداد-المعلم.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync("/home/z/my-project/download", { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("OK:", OUT, buf.length, "bytes");
});
