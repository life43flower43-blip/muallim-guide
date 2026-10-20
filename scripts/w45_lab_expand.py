# فحص الدفعة الإنتاجية الثالثة: ثمانية مواقف تدريبية جديدة + موقفا استقلال جديدان
# التغطية: ظهور العناوين، تشغيل موقف روضة كاملاً بالتدريب، تشغيل اختبار استقلال بالوضع الصارم،
# أدلة الخريطة من الموقف الجديد، النظافة النصية، الثبات بعد التحميل.
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

NEW_TRAIN = [
    "إجابة واثقة خاطئة في نقاش صفّي",
    "نشاط جماعي يبتلع وقت الحصة",
    "صف صامت لا يرفع يداً",
    "نتائج اختبار قصير تكشف ثغرة واحدة",
    "انتقال من اللعب الحر إلى الطابور",
    "حفظ التعريف وفقدان المعنى",
    "منتهون مبكراً ومتعثرون لم يبدؤوا",
    "طفلة تخجل من إجابتها",
]
NEW_EXAM = [
    "مقاطعة بارعة من طالب يريد الصدارة",
    "واجب موحد يكشف تفاوتاً محزناً",
]

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

        # فتح المختبر من بطاقة الرئيسية
        await pg.click('button:has-text("مختبر المعلّم")')
        await pg.wait_for_timeout(900)

        # العناوين الثمانية الجديدة كلها ظاهرة في تبويب المواقف
        body = await pg.inner_text("body")
        for t in NEW_TRAIN:
            assert t in body, f"الموقف التدريبي الجديد غائب: {t}"
        print(f"LIST-EXPAND: المواقف الثمانية الجديدة كلها ظاهرة في تبويب المواقف ✓")
        await pg.screenshot(path=f"{SHOTS}/w45_lab_list.png")

        # تشغيل موقف الروضة الجديد كاملاً بوضع التدريب — انتظار حاسم بدل النوم الثابت
        await pg.click('button:has-text("انتقال من اللعب الحر إلى الطابور")')
        await pg.wait_for_timeout(700)
        for step in range(3):
            await pg.locator("button").filter(has=pg.locator("span:text-is('أ')")).first.click()
            await pg.wait_for_selector('button:has-text("ماذا حدث بعد ذلك؟")', timeout=6000)
            await pg.click('button:has-text("ماذا حدث بعد ذلك؟")')
            await pg.wait_for_timeout(450)
        await pg.wait_for_selector("textarea", timeout=6000)
        body = await pg.inner_text("body")
        assert "خلاصة الموقف" in body, "التحليل الختامي لم يظهر بعد الموقف الجديد"
        assert "الروضة" in body, "شارة المرحلة غائبة في موقف الروضة"
        print("KINDER-RUN: موقف الروضة كامل بثلاث عقد قرار وتحليل ختامي ✓")

        boxes = pg.locator("textarea")
        await boxes.nth(0).fill("جذبت انتباه الأطفال بلعبة انتباه معروفة قبل طلب الطابور")
        await boxes.nth(1).fill("صرخت فوق الضجيج في البداية فازداد الفوضى")
        await boxes.nth(2).fill("سأبني إشارة انتقال ثابتة نتدرب عليها يومياً")
        await pg.wait_for_selector('button:has-text("احفظ التجربة والتأمل")', timeout=6000)
        await pg.click('button:has-text("احفظ التجربة والتأمل")')
        await pg.wait_for_timeout(800)
        print("TRAIN-SAVE: تأمل موقف الروضة محفوظ والعودة للقائمة ✓")

        # تبويب الاستقلال: الموقفان الجديدان ظاهران
        await pg.click('button:has-text("الاستقلال")')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        for t in NEW_EXAM:
            assert t in body, f"موقف الاستقلال الجديد غائب: {t}"
        print("EXAM-LIST: موقفا استقلال جديدان ظاهران في التبويب ✓")

        # تشغيل موقف الاستقلال الجديد: بلا تقييم أثناء القرار، والتحليل عند الختام
        await pg.click('button:has-text("واجب موحد يكشف تفاوتاً محزناً")')
        await pg.wait_for_timeout(700)
        for step in range(3):
            await pg.locator("button").filter(has=pg.locator("span:text-is('أ')")).first.click()
            await pg.wait_for_timeout(550)
            body = await pg.inner_text("body")
            if step < 2:
                assert "ماذا حدث بعد ذلك؟" not in body, "ظهر تقييم/نتيجة أثناء اختبار الاستقلال"
        await pg.wait_for_selector("textarea", timeout=6000)
        body = await pg.inner_text("body")
        assert "نتيجة اختبار الاستقلال" in body, "شارة نتيجة الاستقلال غائبة عند الختام"
        assert "خلاصة الموقف" in body, "التحليل الختامي للاختبار غائب"
        print("EXAM-RUN: اختبار الاستقلال الجديد بلا تلميح أثناء القرار وتحليله عند الختام ✓")
        await pg.screenshot(path=f"{SHOTS}/w45_exam_end.png")

        boxes = pg.locator("textarea")
        await boxes.nth(0).fill("قبلت الورقة الفارغة دليلاً على ظرف لا على سلوك")
        await boxes.nth(1).fill("علقت على الورقة أمام الصف بدل الانفراد بالطفل")
        await boxes.nth(2).fill("سأصمم الواجب القادم بطبقات تناسب الجميع")
        await pg.wait_for_selector('button:has-text("احفظ نتيجة الاختبار والتأمل")', timeout=6000)
        await pg.click('button:has-text("احفظ نتيجة الاختبار والتأمل")')
        await pg.wait_for_timeout(800)

        # خريطة الكفاءات: الدليل يذكر الموقف الجديد الذي أُنجز للتو
        await pg.click('button:has-text("الخريطة")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "انتقال من اللعب الحر إلى الطابور" in body, "أدلة الخريطة لم تلتقط الموقف الجديد"
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي بالخريطة: {leak[:5]}"
        print("MAP-EVIDENCE: أدلة الخريطة تحمل الموقف الجديد ونصوصها نظيفة ✓")
        await pg.screenshot(path=f"{SHOTS}/w45_map.png")

        # الثبات بعد إعادة التحميل: فتح المختبر من الشريط والعودة للخريطة
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(1400)
        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(800)
        await pg.click('button:has-text("الخريطة")')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "انتقال من اللعب الحر إلى الطابور" in body, "الأدلة لم تثبت بعد إعادة التحميل"
        print("PERSIST: محاولات المواقف الجديدة وأدلة الخريطة ثابتة بعد التحميل ✓")

        await b.close()
        print("ALL-OK")

asyncio.run(main())
