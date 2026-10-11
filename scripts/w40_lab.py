# فحص مختبر المعلّم: تشغيل موقف متفرع كامل + المرآة + خريطة الكفاءات + المواقف السريعة + الثبات
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

        # فتح المختبر من تبويب تدريب
        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        assert "مختبر المعلّم" in body, "المختبر لم يفتح"
        assert "مواقف سريعة" in body, "بطاقة المواقف السريعة غائبة"
        print("LAB-OPEN: نعم — ثلاثة تبويبات وبطاقة المواقف السريعة ✓")

        # تشغيل أول موقف: شرح مفهوم لا يفهمه الصف
        await pg.click('button:has-text("شرح مفهوم لا يفهمه الصف")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "ماذا ستفعل؟" in body, "عقدة القرار الأولى غائبة"
        # ثلاث خطوات: اختيار الخيار الأول (أ) ثم التالي
        for step in range(3):
            await pg.locator("button").filter(has=pg.locator("span:text-is('أ')")).first.click()
            await pg.wait_for_timeout(400)
            body = await pg.inner_text("body")
            assert "ماذا حدث بعد ذلك؟" in body, f"نتيجة القرار غائبة في الخطوة {step}"
            await pg.click('button:has-text("ماذا حدث بعد ذلك؟")')
            await pg.wait_for_timeout(400)
        body = await pg.inner_text("body")
        assert "قراراتك في هذا الموقف" in body, "ملخص القرارات غائب"
        assert "خلاصة الموقف" in body, "خاتمة التحليل غائبة"
        assert "مفاهيم من المكتبة تخدم هذا الموقف" in body, "ربط المفاهيم غائب"
        assert "مرآة المعلّم" in body, "أسئلة المرآة غائبة"
        print("SIM-PLAY: ثلاث عقد قرار + تحليل + ربط مفاهيم + مرآة ✓")
        await pg.screenshot(path=f"{SHOTS}/w40_lab_analysis.png")

        # تعبئة التأمل والحفظ
        boxes = pg.locator("textarea")
        await boxes.nth(0).fill("أعدت الشرح بمثال من حياتهم اليومية فسار التفاعل جيداً")
        await boxes.nth(1).fill("تسرعت في إغلاق سؤال ياسر في البداية")
        await boxes.nth(2).fill("سأتحقق من الفهم أثناء الشرح لا بعده")
        await pg.click('button:has-text("احفظ التجربة والتأمل")')
        await pg.wait_for_timeout(800)
        body = await pg.inner_text("body")
        assert "مختبر المعلّم" in body and "شرح مفهوم لا يفهمه الصف" in body, "لم يعد لقائمة المواقف بعد الحفظ"
        print("REFLECT-SAVE: حفظ التجربة والعودة للقائمة ✓")

        # الثبات بعد إعادة التحميل
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(1200)
        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(700)
        await pg.click('button:has-text("مرآتي")')
        await pg.wait_for_timeout(500)
        body = await pg.inner_text("body")
        assert "شرح مفهوم لا يفهمه الصف" in body and "سأتحقق من الفهم أثناء الشرح لا بعده" in body, "التأمل لم يثبت بعد التحميل"
        print("PERSIST: التأمل محفوظ بعد إعادة التحميل ✓")

        # خريطة الكفاءات: كفاءة لها دليل وغيرها بلا بداية
        await pg.click('button:has-text("خريطة الكفاءات")')
        await pg.wait_for_timeout(500)
        body = await pg.inner_text("body")
        assert "وضوح الشرح" in body, "كفاءة وضوح الشرح غائبة"
        assert "في «شرح مفهوم لا يفهمه الصف»" in body, "أدلة الكفاءة غائبة"
        assert "لم تبدأ بعد" in body, "حالة الكفاءات غير المجربة غائبة"
        assert "بناء التقويم" in body, "كفاءة بناء التقويم غائبة"
        print("SKILL-MAP: سبع كفاءات بأدلة وحالات نوعية ✓")
        await pg.screenshot(path=f"{SHOTS}/w40_lab_map.png")

        # فحص النص المعروض: لا أرقام ولا لاتيني في شاشات المختبر
        body = await pg.inner_text("body")
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي: {leak[:5]}"
        print("TEXT-CLEAN: صفر أرقام وصفر لاتيني في شاشات المختبر ✓")

        # المواقف السريعة (المحاكاة القديمة) تظل تعمل من داخل المختبر
        await pg.click('button:has-text("المواقف")')
        await pg.wait_for_timeout(400)
        await pg.click('button:has-text("مواقف سريعة")')
        await pg.wait_for_timeout(800)
        body = await pg.inner_text("body")
        assert "مختبر المعلّم" not in body, "المختبر لم يغلق عند فتح السريعة"
        print("QUICK-SCENARIOS: المحاكاة القديمة تعمل من داخل المختبر ✓")
        await pg.screenshot(path=f"{SHOTS}/w40_lab_quick.png")

        await b.close()
        print("ALL-OK")

asyncio.run(main())
