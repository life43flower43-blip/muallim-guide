# -*- coding: utf-8 -*-
"""تشخيص: ماذا يظهر بعد فتح مساق في المكتبة؟"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 420, "height": 860})
    pg.goto("http://localhost:3000", timeout=30000)
    pg.wait_for_timeout(2200)
    try: pg.add_style_tag(content="nextjs-portal{display:none!important}")
    except Exception: pass
    if pg.locator("input").first.is_visible():
        try: pg.fill("input", "سارة")
        except Exception: pass
        try: pg.click('button:has-text("لنبدأ الرحلة")', timeout=4000)
        except Exception: pass
        pg.wait_for_timeout(1000)
    pg.click('button[aria-label="المكتبة"]'); pg.wait_for_timeout(1500)
    print("=== المكتبة (نص أول 500) ===")
    print(pg.inner_text("body")[:500].replace("\n", " | "))
    pg.locator("text=نمو الطلاب").first.click(); pg.wait_for_timeout(1500)
    print("\n=== بعد فتح المساق (نص أول 700) ===")
    print(pg.inner_text("body")[:700].replace("\n", " | "))
    pg.screenshot(path="scripts/w56_dbg_course.png")
    n_btns = pg.locator("main button, body button").count()
    print("\nعدد الأزرار:", n_btns)
    for i in range(min(n_btns, 12)):
        t = pg.locator("button").nth(i).inner_text()[:60].replace("\n", " / ")
        vis = pg.locator("button").nth(i).is_visible()
        print(f"  [{i}] vis={vis} {t}")
    b.close()
