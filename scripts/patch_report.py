#!/usr/bin/env python3
"""معالجة لاحقة للتقرير: ترقيع حقول رقم الصفحة (ROMAN/arabic) وحذف pgNumType الفارغ."""
import re, sys, zipfile, shutil, pathlib

DOC = pathlib.Path("/home/z/my-project/download/تحليل-ميزات-تطبيق-مساعد-إعداد-المعلم.docx")
TMP = pathlib.Path("/home/z/my-project/scripts/_report_tmp")

def main():
    if TMP.exists():
        shutil.rmtree(TMP)
    TMP.mkdir(parents=True)
    with zipfile.ZipFile(DOC) as z:
        z.extractall(TMP)

    docx_xml = (TMP / "word/document.xml").read_text("utf-8")
    # ١) حذف pgNumType الفارغ (مشكلة WPS في قسم الغلاف)
    docx_xml, n_removed = re.subn(r"<w:pgNumType/>", "", docx_xml)
    (TMP / "word/document.xml").write_text(docx_xml, "utf-8")
    print(f"pgNumType فارغ محذوف: {n_removed}")

    # ٢) ترتيب أقسام التذييل: أول sectPr يحتوي footerReference = المحتويات (ROMAN)، ثم المتن (arabic)
    rels = (TMP / "word/_rels/document.xml.rels").read_text("utf-8")
    rid_to_target = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
    sectprs = re.findall(r"<w:sectPr[\s\S]*?</w:sectPr>", docx_xml)
    footer_order = []
    for sp in sectprs:
        for rid in re.findall(r'<w:footerReference[^>]*r:id="([^"]+)"', sp):
            t = rid_to_target.get(rid, "")
            if "footer" in t and t not in footer_order:
                footer_order.append(t)
    print("ترتيب التذييلات:", footer_order)

    fmts = ["ROMAN", "arabic"]  # الأول = قسم المحتويات، الثاني = المتن
    patched = 0
    for i, target in enumerate(footer_order):
        fpath = TMP / "word" / target.lstrip("/")
        if not fpath.exists():
            continue
        xml = fpath.read_text("utf-8")
        fmt = fmts[i] if i < len(fmts) else "arabic"
        xml, n = re.subn(
            r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
            rf"\1 PAGE \\* {fmt} \\* MERGEFORMAT \2",
            xml,
        )
        fpath.write_text(xml, "utf-8")
        patched += n
        print(f"{target}: {fmt} × {n}")
    print(f"إجمالي الترقيعات: {patched}")

    # ٣) إعادة الضغط
    if DOC.exists():
        DOC.unlink()
    with zipfile.ZipFile(DOC, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(TMP.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(TMP).as_posix())
    print("أعيد الضغط:", DOC)

if __name__ == "__main__":
    main()
