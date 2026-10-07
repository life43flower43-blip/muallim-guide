# تحقق حزمة التطوير: الوضع الليلي + النسخ الاحتياطي/الاستعادة + النطق + استئناف الجلسة
import asyncio, shutil, re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"
BK = f"{SHOTS}/w33_backup.json"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        # إخفاء شارة أدوات تطوير Next التي تعترض النقر أسفل يسار
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1500)

        # ---- الوضع الليلي ----
        await pg.click('nav button[aria-label="حسابي"]')
        await pg.wait_for_timeout(900)
        dark_before = await pg.evaluate("document.documentElement.classList.contains('dark')")
        await pg.click('button:has-text("الوضع الليلي")')
        await pg.wait_for_timeout(600)
        dark_after = await pg.evaluate("document.documentElement.classList.contains('dark')")
        print("DARK toggle:", dark_before, "->", dark_after)
        await pg.screenshot(path=f"{SHOTS}/w33_dark_account.png", full_page=True)
        await pg.click('nav button[aria-label="الرئيسية"]')
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=f"{SHOTS}/w33_dark_home.png")
        # رجوع للنهاري لاختبار بقية الميزات على الوضع الافتراضي
        await pg.click('nav button[aria-label="حسابي"]')
        await pg.wait_for_timeout(700)
        await pg.click('button:has-text("الوضع الليلي")')
        await pg.wait_for_timeout(500)
        print("DARK off:", await pg.evaluate("document.documentElement.classList.contains('dark')"))

        # ---- نسخ احتياطي ----
        async with pg.expect_download() as dl:
            await pg.click('button:has-text("نسخ احتياطي")')
        d = await dl.value
        await d.save_as(BK)
        raw = open(BK, encoding="utf-8").read()
        print("BACKUP ok:", '"app": "turbawy"' in raw or '"app":"turbawy"' in raw, "| bytes:", len(raw))

        # ---- استعادة ----
        async with pg.expect_file_chooser() as fc:
            await pg.click('button:has-text("استعادة")')
        ch = await fc.value
        await ch.set_files(BK)
        await pg.wait_for_timeout(1200)
        body = await pg.inner_text("body")
        print("RESTORE toast:", "تمت استعادة تقدمك بنجاح" in body)

        # ---- النطق: بطاقة مفهوم من المكتبة ----
        await pg.click('nav button[aria-label="المكتبة"]')
        await pg.wait_for_timeout(900)
        await pg.click('button:has-text("نمو الطلاب")')
        await pg.wait_for_timeout(700)
        await pg.click('button:has-text("الوراثة والسلوك")')
        await pg.wait_for_timeout(700)
        # أول بطاقة مفهوم في المستوى الثالث
        cards = pg.locator("main button").filter(has=pg.locator("span, p"))
        await cards.last.click()
        await pg.wait_for_timeout(1200)
        body = await pg.inner_text("body")
        speak_btns = await pg.locator('button[aria-label="استمع للشرح"], button[aria-label="استمع للمثال"]').count()
        print("TTS buttons on concept detail:", speak_btns, "| detail open:", "الشرح" in body)
        await pg.screenshot(path=f"{SHOTS}/w33_concept_tts.png", full_page=True)
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(500)

        # ---- استئناف الجلسة المقطوعة ----
        await pg.click('nav button[aria-label="الرئيسية"]')
        await pg.wait_for_timeout(600)
        await pg.click('button[aria-label="أتدرّب"]')
        await pg.wait_for_timeout(900)
        await pg.click('button:has-text("اختبار سريع")')
        await pg.wait_for_timeout(1400)
        for i in range(2):  # أجب عن سؤالين
            await pg.click('button:has(span:text-is("أ"))')
            await pg.wait_for_timeout(300)
            await pg.click('button:has-text("تحقق")')
            await pg.wait_for_timeout(700)
            await pg.click('button:has-text("متابعة")')
            await pg.wait_for_timeout(700)
        # انقطاع حقيقي: تحديث الصفحة كأن التطبيق أُغلق (الخروج الصريح يمسح اللقطة عمدًا)
        await pg.reload(wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        await pg.click('button[aria-label="أتدرّب"]')
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        print("RESUME card visible:", "أكمل جلستك السابقة" in body)
        await pg.screenshot(path=f"{SHOTS}/w33_resume_card.png")
        await pg.click('button:has-text("أكمل جلستك السابقة")')
        await pg.wait_for_timeout(1400)
        width = await pg.locator(".progress-fill").get_attribute("style")
        print("RESUMED progress width:", width, "(expected ~20% بعد سؤالين من عشرة)")
        await pg.screenshot(path=f"{SHOTS}/w33_resumed_session.png")
        await b.close()

asyncio.run(main())
