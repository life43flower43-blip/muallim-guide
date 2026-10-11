# فحص اكتشاف المختبر: بطاقة «مختبر المعلّم» في الرئيسية + فتحها منه + توحيد أتدرّب + النظافة النصية
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1200)

        # الشاشة الأولى: بطاقة المختبر بشارة جديد ظاهرة دون تمرير
        body = await pg.inner_text("body")
        assert "مختبر المعلّم" in body, "بطاقة المختبر غائبة عن الرئيسية"
        assert "جديد" in body, "شارة جديد غائبة"
        assert "خريطة كفاءات" in body, "وصف المختبر غائب"
        await pg.screenshot(path=f"{SHOTS}/w43_home_card.png")
        print("HOME-CARD: بطاقة مختبر المعلّم بشارة جديد ظاهرة في الرئيسية ✓")

        # الفتح من البطاقة مباشرة
        await pg.click('button:has-text("مختبر المعلّم")')
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        assert "مواقف سريعة" in body, "المختبر لم يفتح من البطاقة"
        for tab in ["الاستقلال", "الخريطة", "مرآتي"]:
            assert tab in body, f"تبويب {tab} غائب"
        print("LAB-FROM-CARD: المختبر فتح من بطاقة الرئيسية بأربعة تبويبات ✓")
        await pg.screenshot(path=f"{SHOTS}/w43_lab_list.png")

        # تشغيل موقف كامل من البطاقة: قرارات وتحليل وحفظ تأمل
        await pg.click('button:has-text("شرح مفهوم لا يفهمه الصف")')
        await pg.wait_for_timeout(700)
        for step in range(3):
            await pg.locator("button").filter(has=pg.locator("span:text-is('أ')")).first.click()
            await pg.wait_for_timeout(400)
            await pg.click('button:has-text("ماذا حدث بعد ذلك؟")')
            await pg.wait_for_timeout(400)
        boxes = pg.locator("textarea")
        await boxes.nth(0).fill("أعدت الشرح بمثال من حياتهم اليومية فسار التفاعل جيداً")
        await boxes.nth(1).fill("تسرعت في إغلاق سؤال طالب في البداية")
        await boxes.nth(2).fill("سأتحقق من الفهم أثناء الشرح لا بعده")
        await pg.click('button:has-text("احفظ التجربة والتأمل")')
        await pg.wait_for_timeout(800)
        print("SIM-PLAY: موقف كامل بثلاث عقد قرار وتأمل محفوظ ✓")

        # إغلاق المختبر من زره ثم العودة للرئيسية ثم محور أتدرّب يفتح المختبر نفسه
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        await pg.locator('button[aria-label="أتدرّب"]').click()
        await pg.wait_for_timeout(800)
        body = await pg.inner_text("body")
        assert "مواقف سريعة" in body, "محور أتدرّب لم يفتح المختبر"
        print("WORLD-TRAIN: محور أتدرّب يفتح المختبر توحيداً مع زر الشريط ✓")

        # النظافة النصية في الرئيسية والمختبر: صفر أرقام وصفر لاتيني
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي بالرئيسية: {leak[:5]}"
        print("TEXT-CLEAN: صفر أرقام وصفر لاتيني في الرئيسية ✓")

        # إعادة التحميل: البطاقة تظل والثبات قائم
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(1200)
        body = await pg.inner_text("body")
        assert "مختبر المعلّم" in body, "البطاقة لم تثبت بعد التحميل"
        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(700)
        await pg.click('button:has-text("الخريطة")')
        await pg.wait_for_timeout(500)
        body = await pg.inner_text("body")
        assert "وضوح الشرح" in body, "أدلة الكفاءات لم تثبت بعد التحميل"
        print("PERSIST: البطاقة والأدلة ثابتة بعد إعادة التحميل ✓")
        await pg.screenshot(path=f"{SHOTS}/w43_map_after.png")

        await b.close()
        print("ALL-OK")

asyncio.run(main())
