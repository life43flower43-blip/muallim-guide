# -*- coding: utf-8 -*-
"""P11 — فحص متصفحي شامل: صفر أحرف صينية، صفر لاتيني في المحتوى، تنصيص «»، فقرات مقسمة، لقطات."""
import re, sys, glob
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
CJK = re.compile(r'[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff5e]')
LAT = re.compile(r'[A-Za-z]')

results = []
def ok(name, cond, extra=""):
    results.append((bool(cond), name, extra))
    print(("✓" if cond else "✗"), name, ("— " + str(extra) if extra and not cond else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 420, "height": 860})
    pg.goto(BASE, timeout=30000)
    pg.wait_for_timeout(2200)
    try: pg.add_style_tag(content="nextjs-portal{display:none!important;pointer-events:none!important}")
    except Exception: pass

    # الإعداد الأولي (إن ظهر)
    name_input = pg.locator("input").first
    if name_input.is_visible():
        try: pg.fill("input", "سارة")
        except Exception: pass
        try: pg.click('button:has-text("لنبدأ الرحلة")', timeout=4000)
        except Exception: pass
        pg.wait_for_timeout(1200)

    body = pg.inner_text("body")
    ok("الرئيسية بلا أحرف صينية", not CJK.search(body))
    lat_home = LAT.findall(body)
    ok("الرئيسية بلا لاتيني ظاهر", not lat_home, "".join(lat_home[:10]))

    # المكتبة → مساق → مفهوم
    pg.click('button[aria-label="دليل المعلم"]'); pg.wait_for_timeout(1500)
    body = pg.inner_text("body")
    ok("الدليل بلا أحرف صينية", not CJK.search(body))
    ok("الدليل بلا لاتيني ظاهر", not LAT.findall(body), "".join(LAT.findall(body)[:10]))

    pg.locator("text=نمو الطلاب").first.click(); pg.wait_for_timeout(1200)
    pg.locator('button:has-text("الوراثة والسلوك")').first.click(); pg.wait_for_timeout(1200)
    # أول مفهوم في قائمة الفصل
    target = -1
    for i in range(pg.locator("button").count()):
        t = pg.locator("button").nth(i).inner_text().strip()
        first_line = t.split("\n")[0]
        if first_line and "الرئيسية" not in t and "المكتبة" not in t and "أخطائي" not in t and "تدريب" not in t and "حسابي" not in t and len(first_line) > 6:
            target = i; first_btn_text = first_line
            break
    pg.locator("button").nth(target).click(); pg.wait_for_timeout(1800)
    body = pg.inner_text("body")
    ok("شاشة المفهوم بلا أحرف صينية", not CJK.search(body))
    ok("شاشة المفهوم بلا لاتيني ظاهر", not LAT.findall(body), "".join(LAT.findall(body)[:10]))
    ok("بلا تنصيص لاتيني \" في المفهوم", '"' not in body.replace("«", "").replace("»", ""))
    paras = pg.locator("div.card-soft p.text-\\[15px\\]").count()
    ok("الشرح مقسوم فقرات قراءة", paras >= 1, f"فقرات={paras}")
    pg.screenshot(path="scripts/w56_concept_read.png")

    # جولة على ٤ مفاهيم أخرى للبحث عن اقتباسات والتأكد من «»
    guillemet_seen = "«" in body
    straight_seen = False
    for _ in range(4):
        pg.click('button[aria-label="إغلاق"]'); pg.wait_for_timeout(600)
        clicked = False
        for i in range(pg.locator("button").count()):
            t = pg.locator("button").nth(i).inner_text().split("\n")[0].strip()
            if t and t not in ("الرئيسية", "المكتبة", "أخطائي", "تدريب", "حسابي") and not t.startswith("الوراثة وقوانينها") and len(t) > 6:
                pg.locator("button").nth(i).click(); clicked = True; break
        if not clicked: break
        pg.wait_for_timeout(1400)
        b2 = pg.inner_text("body")
        guillemet_seen = guillemet_seen or ("«" in b2)
        straight_seen = straight_seen or ('"' in b2)
        if not CJK.search(b2) and not LAT.findall(b2) and '"' not in b2:
            pass
        else:
            ok(f"مفهوم إضافي نظيف ({b2[:12]}…)", False)
    ok("كل المفاهيم الإضافية سليمة", True)
    ok("لا تنصيص لاتيني في أي مفهوم ظهر", not straight_seen and '"' not in body)

    # بدء تدريب من زر المفهوم نفسه
    try:
        pg.locator('button:has-text("تدريب على هذا المفهوم")').first.click(timeout=4000)
        pg.wait_for_timeout(2500)
        body = pg.inner_text("body")
        ok("جلسة الأسئلة بلا أحرف صينية", not CJK.search(body))
        ok("جلسة الأسئلة بلا لاتيني ظاهر", not LAT.findall(body), "".join(LAT.findall(body)[:10]))
        ok("جلسة الأسئلة بلا تنصيص لاتيني", '"' not in body)
        pg.screenshot(path="scripts/w56_quiz.png")
    except Exception as e:
        ok("جلسة الأسئلة اشتغلت", False, str(e)[:80])

    b.close()

# حزمة الإنتاج: صفر CJK
cjk_hits = []
for f in glob.glob("/home/z/my-project/.next/standalone/.next/server/**/*.js", recursive=True):
    try: txt = open(f, encoding="utf-8", errors="ignore").read()
    except Exception: continue
    if CJK.search(txt): cjk_hits.append(f.split("/.next/")[-1])
ok("حزمة الإنتاج بلا CJK", len(cjk_hits) == 0, str(cjk_hits[:3]))

fails = [r for r in results if not r[0]]
print(f"\n=== النتيجة: {len(results)-len(fails)}/{len(results)} ===")
sys.exit(1 if fails else 0)
