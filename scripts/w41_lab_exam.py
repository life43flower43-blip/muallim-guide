# فحص اختبار الاستقلال: موقف جديد بلا تلميح ولا تقييم أثناء القرار ← نتيجة بعد الختام ← إثبات في الخريطة
# + خلط عرض خيارات المواقف (كسر نمط الترتيب الثابت) + مرآة بوسم الاختبار + ثبات بعد التحميل
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

async def pick_first(pg):
    await pg.locator("button").filter(has=pg.locator("span:text-is('أ')")).first.click()
    await pg.wait_for_timeout(400)

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

        # فتح المختبر والتحقق من أربعة تبويبات
        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        assert "مختبر المعلّم" in body, "المختبر لم يفتح"
        for t in ["المواقف", "الاستقلال", "الخريطة", "مرآتي"]:
            assert t in body, f"تبويب {t} غائب"
        print("LAB-TABS: أربعة تبويبات بالمختبر ✓")

        # ---- خلط عرض الخيارات: خمس جلسات على موقف واحد، خيار «أ» يجب أن يتبدل موضع الخيار الأفضل ----
        firsts = []
        for run in range(5):
            await pg.click('button:has-text("همسات تشتت الشرح")')
            await pg.wait_for_timeout(600)
            await pg.locator("button").filter(has=pg.locator("span:text-is('أ')")).first.click()
            await pg.wait_for_timeout(350)
            body = await pg.inner_text("body")
            m = re.search(r"قرار (حاسم|مقبول|يحتاج إعادة نظر)", body)
            assert m, "لا تقييم في وضع التدريب"
            firsts.append(m.group(1))
            await pg.click('button:has-text("ماذا حدث بعد ذلك؟")')
            await pg.wait_for_timeout(300)
            await pg.click('button:has-text("خروج من الموقف")')
            await pg.wait_for_timeout(400)
        assert len(set(firsts)) >= 2, f"عرض الخيارات ثابت عبر الجلسات: {firsts}"
        print(f"SHUFFLE: خيار «أ» تقييمه يتجدد عبر الجلسات {firsts} ✓")
        # عودة نظيفة للقائمة بعد الجولات
        body = await pg.inner_text("body")
        if "همسات تشتت الشرح" not in body:
            await pg.click('button:has-text("المواقف")')
            await pg.wait_for_timeout(400)

        # ---- دخول تبويب الاستقلال: شرح الوضع ومواقف جديدة بلا تلميح ----
        await pg.click('button:has-text("الاستقلال")')
        await pg.wait_for_timeout(500)
        body = await pg.inner_text("body")
        assert "إثبات القرار بمعلم داخلك" in body, "شرح وضع الاستقلال غائب"
        assert "رفض يُعلن أمام الصف" in body, "موقف الاستقلال الأول غائب"
        print("EXAM-TAB: تبويب الاستقلال بشرحه ومواقفه الجديدة ✓")

        # ---- تشغيل موقف الاستقلال: بلا كفاءة ظاهرة وبلا تقييم أثناء القرار ----
        await pg.click('button:has-text("رفض يُعلن أمام الصف")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "اختبار استقلال" in body, "شارة اختبار الاستقلال غائبة"
        assert "تحفيز المشاركة" not in body, "تسريب الكفاءة أثناء الاختبار — تلميح!"
        assert "خذ قرارك — التقييم يظهر بعد الختام" in body, "نص القرار الاختباري غائب"
        assert "ماذا ستفعل؟" not in body, "نص التدريب ظهر في وضع الاختبار"
        for step in range(3):
            await pick_first(pg)
            body = await pg.inner_text("body")
            if step < 2:
                assert "قرار حاسم" not in body and "قرار مقبول" not in body, f"تسريب تقييم أثناء الاختبار بالخطوة {step}"
        print("EXAM-BLIND: ثلاث قرارات بلا تقييم وبلا تلميح كفاءة ✓")
        await pg.screenshot(path=f"{SHOTS}/w41_exam_play.png")

        # ---- نتيجة الاختبار بعد الختام: تقييم كامل + خلاصة + مرآة ----
        body = await pg.inner_text("body")
        assert "نتيجة اختبار الاستقلال" in body, "ترويسة النتيجة غائبة"
        assert "قراراتك في هذا الموقف" in body, "قائمة القرارات غائبة بعد الختام"
        assert "خلاصة الموقف" in body, "خلاصة موقف الاختبار غائبة"
        assert "مرآة المعلّم" in body, "مرآة موقف الاختبار غائبة"
        print("EXAM-RESULT: التحليل الكامل يفتح بعد الختام فقط ✓")
        await pg.screenshot(path=f"{SHOTS}/w41_exam_result.png")

        # حفظ نتيجة الاختبار والتأمل
        boxes = pg.locator("textarea")
        await boxes.nth(0).fill("خفضتُ الصوت وأنهيتُ الأمر بجزء يختاره هو نفسه")
        await boxes.nth(1).fill("بدايتي كانت عاجلة ولم أمنح الخيار قبل الامتثال")
        await boxes.nth(2).fill("سأصمم المهمة بخيار شكل الإنجاز من البداية")
        await pg.click('button:has-text("احفظ نتيجة الاختبار والتأمل")')
        await pg.wait_for_timeout(800)
        body = await pg.inner_text("body")
        assert "إثبات القرار بمعلم داخلك" in body, "لم يعد لقائمة الاستقلال بعد الحفظ"
        print("EXAM-SAVE: حفظ نتيجة الاختبار والعودة لقائمة الاستقلال ✓")

        # ---- الخريطة: إثبات الاستقلال يظهر كدليل نوعي ----
        await pg.click('button:has-text("الخريطة")')
        await pg.wait_for_timeout(500)
        body = await pg.inner_text("body")
        assert "اختبار الاستقلال بـ" in body, "إثبات الاستقلال غائب بالخريطة"
        assert "لم تبدأ بعد" in body, "حالة الكفاءات غير المجربة غائبة"
        print("EXAM-PROOF: إثبات الاستقلال ظاهر بالخريطة ✓")
        await pg.screenshot(path=f"{SHOTS}/w41_exam_map.png")

        # ---- مرآتي: التأمل الاختباري محفوظ بوسمه ----
        await pg.click('button:has-text("مرآتي")')
        await pg.wait_for_timeout(400)
        body = await pg.inner_text("body")
        assert "رفض يُعلن أمام الصف" in body, "تأمل الاختبار غائب بالمرآة"
        assert "سأصمم المهمة بخيار شكل الإنجاز من البداية" in body, "نص التأمل غائب"
        print("MIRROR-EXAM: تأمل الاختبار محفوظ في المرآة ✓")

        # ---- ثبات بعد إعادة التحميل ----
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(1200)
        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(700)
        await pg.click('button:has-text("مرآتي")')
        await pg.wait_for_timeout(400)
        body = await pg.inner_text("body")
        assert "سأصمم المهمة بخيار شكل الإنجاز من البداية" in body, "تأمل الاختبار لم يثبت بعد التحميل"
        print("PERSIST: نتيجة الاختبار وتأمله ثابتان بعد التحميل ✓")

        # نظافة النص في شاشات المختبر كلها
        await pg.click('button:has-text("الاستقلال")')
        await pg.wait_for_timeout(300)
        body = await pg.inner_text("body")
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي: {leak[:5]}"
        print("TEXT-CLEAN: صفر أرقام وصفر لاتيني في شاشات الاستقلال ✓")

        await b.close()
        print("ALL-OK")

asyncio.run(main())
