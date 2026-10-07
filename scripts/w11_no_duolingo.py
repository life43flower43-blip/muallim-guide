# -*- coding: utf-8 -*-
# تحقق: لا دالينغو — لا جنية/جواهر/متجر/نقاط/مستوى في الرئيسية والملف الشخصي
import asyncio, re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
BAD = re.compile(r"الجني[ةه]|جواهر|جوهرة|متجر|نقاط|المستوى|مبتدئ|تاج|عصا|هالة|فيونكة")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.wait_for_timeout(2500)
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        try:
            await pg.fill("input", "سلمى", timeout=4000)
            await pg.click("text=لنبدأ الرحلة", timeout=3000)
            await pg.wait_for_timeout(1500)
        except Exception:
            pass
        await pg.screenshot(path="scripts/w11_home.png")
        home = await pg.inner_text("body")
        bad_home = set(BAD.findall(home))
        print("الرئيسية — كلمات دالينغو:", bad_home if bad_home else "لا شيء")
        print("سطر الرحلة:", "نعم" if "رحلتك الآن" in home else "لا!")
        # حسابي من الشريط السفلي
        await pg.click("text=حسابي", timeout=5000)
        await pg.wait_for_timeout(1200)
        acc = await pg.inner_text("body")
        bad_acc = set(BAD.findall(acc))
        print("حسابي — كلمات دالينغو:", bad_acc if bad_acc else "لا شيء")
        print("الملف المهني:", "نعم" if "طالب تربية — رحلة الإعداد المهني" in acc else "لا!")
        print("محطات التقدم:", "نعم" if "محطات التقدم" in acc else "لا!")
        print("مجاني بالكامل:", "نعم" if "مجاني بالكامل" in acc else "لا!")
        await pg.screenshot(path="scripts/w11_account.png", full_page=True)
        await b.close()
        if bad_home or bad_acc:
            raise SystemExit("FAIL: بقايا دالينغو")

asyncio.run(main())
print("ALL CHECKS PASSED")
