# فحص استوديو خطط الدروس: البطاقة بالرئيسية + الفتح منها + النموذج والتقييم والحفظ والتعديل والمشاركة + النظافة النصية والثبات
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(
            viewport={"width": 390, "height": 844},
            permissions=["clipboard-read", "clipboard-write"],
        )
        pg = await ctx.new_page()
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1200)

        # الشاشة الأولى: بطاقة الاستوديو ظاهرة بجوار بطاقة المختبر دون تمرير
        body = await pg.inner_text("body")
        assert "استوديو خطط الدروس" in body, "بطاقة الاستوديو غائبة عن الرئيسية"
        assert "أداة المعلم" in body, "شارة أداة المعلم غائبة"
        assert "مختبر المعلّم" in body, "بطاقة المختبر اختفت"
        await pg.screenshot(path=f"{SHOTS}/w46_home.png")
        print("HOME-CARD: بطاقة الاستوديو والشارة ظاهرتان في الرئيسية ✓")

        # الفتح من البطاقة: هيدر وتبويبان وحقول موجهة
        await pg.click('button:has-text("استوديو خطط الدروس")')
        await pg.wait_for_selector('text=كيف يعمل الاستوديو؟', timeout=5000)
        body = await pg.inner_text("body")
        for t in ["خطة جديدة", "خططي", "بطاقة الدرس", "الأهداف التعليمية", "خطوات التنفيذ", "الفروق الفردية"]:
            assert t in body, f"عنصر غائب من الاستوديو: {t}"
        print("OPEN: الاستوديو فتح من البطاقة بكامل أقسامه الموجهة ✓")

        # التقييم على خطة شبه فارغة: حكم «تحتاج إكمالًا» وبطاقة ناقصة
        await pg.click('button:has-text("قيّم خطتك")')
        await pg.wait_for_selector('text=تقييم الخطة', timeout=5000)
        body = await pg.inner_text("body")
        assert "خطة تحتاج إكمالًا" in body, "حكم الخطة الفارغة غير صحيح"
        assert "ناقص" in body, "حالة ناقص غير ظاهرة"
        print("REVIEW-EMPTY: التقييم القواعدي يكشف الناقص في الخطة الفارغة ✓")
        await pg.screenshot(path=f"{SHOTS}/w46_review_empty.png")

        # حفظ بلا موضوع: رسالة خطأ واضحة
        assert "اكتب موضوع الدرس قبل الحفظ" not in body, "رسالة الحفظ ظهرت مبكرا"
        await pg.click('button:has-text("احفظ في خططي")')
        await pg.wait_for_timeout(400)
        body = await pg.inner_text("body")
        assert "اكتب موضوع الدرس قبل الحفظ" in body, "حارس الموضوع غير ظاهر"
        print("GUARD: الحفظ بلا موضوع محجوب برسالة واضحة ✓")

        # ملء خطة كاملة الأركان
        await pg.fill('input[aria-label="موضوع الدرس"]', "جمع الكسور المتشابهة")
        await pg.fill('input[aria-label="المادة"]', "الرياضيات")
        await pg.fill('input[aria-label="الصف"]', "الصف الرابع الابتدائي")
        await pg.click('button:has-text("حصة كاملة")')
        await pg.fill('textarea[aria-label="الأهداف التعليمية"]', "يجمع الطالب كسرين متشابهين\nيصمم الطالب مسألة جمع من واقع حياته")
        await pg.fill('textarea[aria-label="المعرفة السابقة"]', "يعرف الطالب الكسر كجزء من كل")
        await pg.fill('textarea[aria-label="الوسائل والأدوات"]', "نماذج كسور ورقية\nسبورة وأقلام ملونة")
        await pg.click('button:has-text("التعلم التعاوني")')
        await pg.fill('textarea[aria-label="التهيئة"]', "أوزع نماذج كسور وأسألهم عن مقارنة قطعتين")
        await pg.fill('textarea[aria-label="العرض والتوضيح"]', "أبني قاعدة الجمع بأمثلة متدرجة على السبورة")
        await pg.fill('textarea[aria-label="التطبيق والنشاط"]', "نشاط ثنائي بورقة عمل متدرجة")
        await pg.fill('textarea[aria-label="التقويم"]', "بطاقة خروج بسؤالين سريعين")
        await pg.fill('textarea[aria-label="الغلق"]', "يلخص الطلاب القاعدة بكلماتهم")
        await pg.fill('textarea[aria-label="الأسئلة المفتاحية"]', "متى لا يصح أن نجمع كسورين مباشرة؟")
        await pg.fill('textarea[aria-label="الواجب"]', "تمرين متدرج من كتاب النشاط")
        await pg.fill('textarea[aria-label="الفروق الفردية"]', "للمتعثر نماذج محسوسة — وللمتفوق مسألة تحدٍ مفتوحة")
        await pg.click('button:has-text("قيّم خطتك")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "خطة متكاملة — جاهزة للتطبيق بثقة" in body, "حكم الخطة المكتملة غير صحيح"
        await pg.screenshot(path=f"{SHOTS}/w46_review_full.png")
        print("REVIEW-FULL: الخطة المكتملة تحصل على حكم متكامل ✓")

        # الحفظ ثم الانتقال لخططي
        await pg.click('button:has-text("احفظ في خططي")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "جمع الكسور المتشابهة" in body, "الخطة المحفوظة غير ظاهرة في خططي"
        assert "مكتملة الأركان" in body, "كلمة النضج غير ظاهرة"
        print("SAVE: الخطة حُفظت في خططي مع وصف نضجها ✓")
        await pg.screenshot(path=f"{SHOTS}/w46_mine.png")

        # عرض الخطة المحفوظة: كل الأقسام + زر المشاركة (ينسخ للحافظة في هذا المتصفح)
        await pg.click('div[role="button"]:has-text("جمع الكسور المتشابهة")')
        await pg.wait_for_selector('text=عودة إلى خططي', timeout=5000)
        body = await pg.inner_text("body")
        for t in ["الأهداف التعليمية", "استراتيجيات التدريس", "خطوات التنفيذ", "بطاقة خروج", "مشاركة أو نسخ", "تقييم الخطة"]:
            assert t in body, f"قسم غائب من عرض الخطة: {t}"
        await pg.click('button:has-text("مشاركة أو نسخ")')
        await pg.wait_for_timeout(500)
        clip = await pg.evaluate("navigator.clipboard.readText()")
        assert "خطة درس: جمع الكسور المتشابهة" in clip, "نص الخطة المنسوخ ناقص العنوان"
        assert "الأهداف التعليمية:" in clip, "نص الخطة المنسوخ ناقص الأهداف"
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", clip)
        assert not leak, f"تسريب نصي في نص الخطة المنسوخ: {leak[:5]}"
        print("COPY: نص الخطة يُنسخ كاملاً ونظيفاً بلا أرقام ولا لاتيني ✓")
        await pg.screenshot(path=f"{SHOTS}/w46_detail.png")

        # التعديل: تعديل الموضوع ثم الحفظ
        await pg.click('button[aria-label="تعديل الخطة"]')
        await pg.wait_for_timeout(500)
        await pg.fill('input[aria-label="موضوع الدرس"]', "جمع الكسور المتشابهة والاختلاف")
        await pg.click('button:has-text("احفظ التعديل")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "جمع الكسور المتشابهة والاختلاف" in body, "التعديل لم يُحفظ"
        copies = await pg.locator('text=جمع الكسور المتشابهة والاختلاف').count()
        assert copies == 1, f"بعد التعديل يظهر {copies} نسخ — التعديل كرّر أو فشل"
        print("EDIT: تعديل الخطة يحدّثها بلا نسخ مكررة ✓")

        # الحذف بخطوتين ثم القائمة الفارغة
        await pg.click('div[role="button"]:has-text("جمع الكسور المتشابهة والاختلاف")')
        await pg.wait_for_selector('text=عودة إلى خططي', timeout=5000)
        await pg.click('button[aria-label="حذف الخطة"]')
        await pg.wait_for_timeout(300)
        await pg.click('button[aria-label="تأكيد حذف الخطة"]')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "جمع الكسور" not in body, "الخطة لم تُحذف"
        print("DELETE: الحذف بخطوتين يعمل ويعيد القائمة الفارغة ✓")

        # إغلاق الاستوديو من زره ثم إعادة الفتح من البطاقة (حالة نظيفة)
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "كيف يعمل الاستوديو؟" not in body, "الاستوديو لم يغلق من زره"
        print("CLOSE: زر الإغلاق يعيد الرئيسية ✓")

        # النظافة النصية في الرئيسية بعد كل التغييرات
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي بالرئيسية: {leak[:5]}"
        print("TEXT-CLEAN: صفر أرقام وصفر لاتيني في الرئيسية ✓")

        # زر الرئيسية في الشريط يغلق الاستوديو المفتوح (دفاع عميق)
        # الطبقة تغطي الشريط بصرياً كالمختبر — لذا نستدعي النقرة برمجياً لاختبار المنطق
        await pg.click('button:has-text("استوديو خطط الدروس")')
        await pg.wait_for_selector('text=كيف يعمل الاستوديو؟', timeout=5000)
        await pg.evaluate("document.querySelector('nav button[aria-label=الرئيسية]').click()")
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "كيف يعمل الاستوديو؟" not in body, "زر الرئيسية لم يغلق الاستوديو"
        print("HOME-NAV: منطق زر الرئيسية يغلق طبقة الاستوديو ✓")

        # الثبات بعد إعادة التحميل: البطاقة تظل في الرئيسية
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(1200)
        body = await pg.inner_text("body")
        assert "استوديو خطط الدروس" in body, "بطاقة الاستوديو لم تثبت بعد التحميل"
        print("PERSIST: بطاقة الاستوديو ثابتة بعد إعادة التحميل ✓")

        await b.close()
        await ctx.close()
        print("ALL-OK")

asyncio.run(main())
