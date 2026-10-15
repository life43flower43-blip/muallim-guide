#!/usr/bin/env python3
# معالجة ختامية: إزالة pgNumType الفارغ + تبديل تذييلات ROMAN/arabic (نفس منطق toc.md)
import re, shutil, zipfile, os, sys
DOCX = sys.argv[1]
TMP = "/home/z/my-project/scripts/quality/out/_tmp_docx"
if os.path.exists(TMP): shutil.rmtree(TMP)
os.makedirs(TMP)
with zipfile.ZipFile(DOCX) as z: z.extractall(TMP)
dp = os.path.join(TMP, "word", "document.xml")
doc = open(dp, encoding="utf-8").read()
n = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
open(dp, "w", encoding="utf-8").write(doc)
print("removed empty pgNumType:", n)
refs = re.findall(r'<w:footerReference w:type="default" r:id="(rId\d+)"/>', doc)
rels = open(os.path.join(TMP, "word", "_rels", "document.xml.rels"), encoding="utf-8").read()
id2f = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="(footer\d+\.xml)"', rels))
order = [id2f[r] for r in refs if r in id2f]
def patch(fname, fmt):
    p = os.path.join(TMP, "word", fname)
    xml = open(p, encoding="utf-8").read()
    xml2, k = re.subn(r'(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)', rf'\1 PAGE \\* {fmt} \\* MERGEFORMAT \2', xml)
    open(p, "w", encoding="utf-8").write(xml2)
    print(fname, "->", fmt, k)
if order: patch(order[0], "ROMAN")
for f in order[1:]: patch(f, "arabic")
out = DOCX + ".new"
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(TMP):
        for f in files:
            full = os.path.join(root, f)
            z.write(full, os.path.relpath(full, TMP))
shutil.move(out, DOCX)
shutil.rmtree(TMP)
print("OK repacked")
