# -*- coding: utf-8 -*-
"""اختبار متصفح لميزة الجنية والجواهر والمتجر في تطبيق تربوي."""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
SHOT = "/home/z/my-project/scripts/"

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    # 1) تهيئة مستخدم مسجل دخوله بلا جواهر
    page.goto(BASE)
    page.evaluate(
        "localStorage.setItem('turbawy-app-v1', JSON.stringify({state:{onboarded:true,name:'سارة'},version:0}))"
    )
    page.reload()
    page.wait_for_timeout(2500)

    # 2) الرئيسية: الجنية موجودة على المسار + شارة الجواهر = 0
    fairy = page.locator('button[aria-label*="الجنية"]')
    assert fairy.count() == 1, f"fairy count={fairy.count()}"
    print("OK: الجنية ظاهرة على المسار")
    body = page.inner_text("body")
    assert "0 جوهرة" in body, "gems chip missing"
    print("OK: شارة الجواهر تظهر = 0")

    page.screenshot(path=SHOT + "w7_fairy_home.png")

    # 3) فتح المتجر من شارة الجواهر
    page.get_by_text("0 جوهرة").click()
    page.wait_for_timeout(1200)
    assert "متجر الجواهر" in page.inner_text("body"), "shop not opened"
    print("OK: المتجر يفتح")

    # 4) أزرار التجربة (نسخة التطوير فقط) ظاهرة وتعمل
    assert "أدوات تجربة" in page.inner_text("body"), "dev tools missing"
    page.get_by_role("button", name="+50 جوهرة").click()
    page.get_by_role("button", name="+50 جوهرة").click()
    page.get_by_role("button", name="+50 جوهرة").click()
    page.wait_for_timeout(600)
    body = page.inner_text("body")
    assert "150" in body, f"gems not 150: {body[:300]}"
    print("OK: أزرار التجربة تمنح الجواهر (0 -> 150)")
    page.screenshot(path=SHOT + "w7_shop_devtools.png")

    # 5) شراء التاج (120) ثم فحص الحالة
    buy_btn = page.locator("div", has=page.get_by_text("التاج الملكي", exact=False)).get_by_role("button").last
    # الأدق: زر الشراء داخل صف التاج
    crown_row = page.locator("div.flex.items-center.gap-3.rounded-2xl.border", has_text="التاج الملكي")
    crown_row.get_by_role("button").click()
    page.wait_for_timeout(800)
    body = page.inner_text("body")
    assert "ملبسة — انزعها" in body, "crown not bought/equipped"
    assert "30" in body, "gems should be 30 after crown"
    print("OK: شراء التاج 120 -> بقي 30 جوهرة، والتاج ملبس تلقائياً")
    page.screenshot(path=SHOT + "w7_shop_crown.png")

    # 6) إغلاق المتجر والعودة للمسار: شارة التاج بجانب الجنية
    page.keyboard.press("Escape")
    page.wait_for_timeout(800)
    page.screenshot(path=SHOT + "w7_fairy_crown_badge.png")
    badge = page.locator('button[aria-label*="الجنية"] span', has_text="👑")
    assert badge.count() >= 1, "crown badge missing on fairy"
    print("OK: شارة التاج 👑 ظاهرة بجانب الجنية في المسار")

    # 7) الثبات بعد إعادة التحميل
    page.reload()
    page.wait_for_timeout(2500)
    badge = page.locator('button[aria-label*="الجنية"] span', has_text="👑")
    assert badge.count() >= 1, "crown badge lost after reload"
    body = page.inner_text("body")
    assert "30 جوهرة" in body, "gems not persisted"
    print("OK: الثبات بعد إعادة التحميل (30 جوهرة + التاج)")

    if errors:
        print("CONSOLE/PAGE ERRORS:")
        for e in errors[:10]:
            print("  -", e[:200])
    else:
        print("NO console errors")
    browser.close()
    print("ALL TESTS PASSED")
