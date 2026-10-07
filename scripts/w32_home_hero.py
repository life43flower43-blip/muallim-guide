# تحقق الرئيسية الجديدة: زر دائري بأمواج + إزالة مفهوم اليوم و«رحلتك إلى الاحتراف» والتكرارات
import asyncio, re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

MUST = ["ابدأ الاختبار", "(عدد لا متناهي من الأسئلة)", "الأساس", "أعرف", "أُدرّس", "أواجه", "أتدرّب", "أصبح معلّمًا", "تربوي"]
BAN = ["مفهوم اليوم", "رحلتك إلى الاحتراف", "رحلتك الآن", "ابدأ جلسة اليوم", "ابدأ الآن", "صباح المعرفة", "طالب التربية", "أكمل من حيث توقفت", "مكتبة المفاهيم"]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.wait_for_timeout(1500)
        body = await pg.inner_text("body")
        # اجتياز شاشة الترحيب الأولى إن ظهرت (ملف تعريف جديد)
        if "ما اسمك" in body:
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1800)
            body = await pg.inner_text("body")
        body_flat = re.sub(r"\s+", " ", body)

        missing = [m for m in MUST if m not in body_flat]
        leaked = [x for x in BAN if x in body_flat]
        print("MISSING:", missing or "none")
        print("LEAKED:", leaked or "none")

        # الزر الدائري موجود فعلاً (button aria-label)
        btn = pg.locator('button[aria-label="ابدأ الاختبار"]')
        print("CIRCLE-BUTTON:", await btn.count())
        box = await btn.bounding_box()
        print("BUTTON-BOX:", box and {"w": round(box["width"]), "h": round(box["height"])})

        await pg.screenshot(path=f"{SHOTS}/w32_home_hero.png")
        await pg.screenshot(path=f"{SHOTS}/w32_home_full.png", full_page=True)

        # الضغط على الزر يفتح جلسة الاختبار المكثف
        await btn.click()
        await pg.wait_for_timeout(2200)
        body2 = re.sub(r"\s+", " ", await pg.inner_text("body"))
        print("SESSION-OPEN hint:", "الاختبار المكثف" in body2 or "مكثف" in body2)
        await pg.screenshot(path=f"{SHOTS}/w32_session.png")
        await b.close()

asyncio.run(main())
