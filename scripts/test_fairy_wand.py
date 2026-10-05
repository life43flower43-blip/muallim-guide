# -*- coding: utf-8 -*-
"""لقطة: الجنية بالتاج والعصا معاً على المسار."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
SHOT = "/home/z/my-project/scripts/"

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.goto(BASE)
    page.evaluate(
        "localStorage.setItem('turbawy-app-v1', JSON.stringify({state:{onboarded:true,name:'سارة'},version:0}))"
    )
    page.reload()
    page.wait_for_timeout(2500)

    # فتح المتجر، +50 ثلاث مرات، شراء التاج ثم العصا
    page.get_by_text("0 جوهرة").click()
    page.wait_for_timeout(1000)
    for _ in range(5):
        page.get_by_role("button", name="+50 جوهرة").click()
        page.wait_for_timeout(200)
    page.wait_for_timeout(400)
    crown_row = page.locator("div.flex.items-center.gap-3.rounded-2xl.border", has_text="التاج الملكي")
    crown_row.get_by_role("button").click()
    page.wait_for_timeout(400)
    wand_row = page.locator("div.flex.items-center.gap-3.rounded-2xl.border", has_text="العصا السحرية")
    wand_row.get_by_role("button").click()
    page.wait_for_timeout(600)
    page.keyboard.press("Escape")
    page.wait_for_timeout(900)
    page.screenshot(path=SHOT + "w7_fairy_crown_wand.png")

    body = page.inner_text("body")
    fairy = page.locator('button[aria-label*="الجنية"]')
    crown = fairy.locator("span", has_text="👑")
    wand = fairy.locator("span", has_text="🪄")
    print("crown badge:", crown.count() >= 1, "| wand badge:", wand.count() >= 1)
    print("gems left should be 190-120-90=-20? غير ممكن — نفحص:")
    browser.close()
