#!/usr/bin/env python3
# معالجة ختامية وفق toc.md: بديل instrText بالتبديل الصحيح وإزالة pgNumType الفارغ
import re, shutil, zipfile, os, sys

DOCX = "/home/z/my-project/download/تقرير-التدقيق-الشامل-تطبيق-دليل-المعلم.docx"
TMP = "/home/z/my-project/scripts/audit_out/_docx_tmp"

if os.path.exists(TMP):
    shutil.rmtree(TMP)
os.makedirs(TMP)
with zipfile.ZipFile(DOCX) as z:
    z.extractall(TMP)

doc_path = os.path.join(TMP, "word", "document.xml")
doc = open(doc_path, encoding="utf-8").read()

# 1) إزالة pgNumType الفارغ (يلخبط WPS)
before = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
open(doc_path, "w", encoding="utf-8").write(doc)
print(f"removed empty pgNumType: {before}")

# 2) خريطة footerReference بالترتيب -> ملفات التذييل
refs = re.findall(r'<w:footerReference w:type="default" r:id="(rId\d+)"/>', doc)
rels = open(os.path.join(TMP, "word", "_rels", "document.xml.rels"), encoding="utf-8").read()
id2file = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="(footer\d+\.xml)"', rels))
order = [id2file[r] for r in refs if r in id2file]
print("footer order:", order)

def patch_footer(fname, fmt):
    path = os.path.join(TMP, "word", fname)
    xml = open(path, encoding="utf-8").read()
    xml2, n = re.subn(
        r'(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)',
        rf'\1 PAGE \\* {fmt} \\* MERGEFORMAT \2',
        xml)
    open(path, "w", encoding="utf-8").write(xml2)
    print(f"{fname}: patched {n} PAGE fields -> {fmt}")

if len(order) >= 1:
    patch_footer(order[0], "ROMAN")   # قسم الفهرس
for f in order[1:]:
    patch_footer(f, "arabic")          # قسم المتن

# 3) إعادة الحزم
out_tmp = DOCX + ".new"
with zipfile.ZipFile(out_tmp, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(TMP):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, TMP)
            z.write(full, rel)
shutil.move(out_tmp, DOCX)
shutil.rmtree(TMP)
print("OK repacked", DOCX)
