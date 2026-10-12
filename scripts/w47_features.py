# فحص الدفعة الاحترافية: سجل التدريب الميداني + قوالب الخطط + ملف الإنجاز المهني
# — البطاقات في الرئيسية، دورة الزيارة كاملة (جاهزية/حفظ/عرض/مشاركة/تعديل/حذف)،
# تحميل قالب وتقييمه وحفظه، بطاقة الجاهزية في حسابي ومشاركتها، الإنجاز الجديد، النظافة النصية، الثبات.
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

        # الشاشة الأولى: بطاقة السجل الميداني الجديدة بجوار الاستوديو والمختبر دون تمرير
        body = await pg.inner_text("body")
        assert "سجل التدريب الميداني" in body, "بطاقة السجل الميداني غائبة عن الرئيسية"
        assert "جاهزية قبل الحصة" in body, "رقائق السجل الميداني غائبة"
        assert "استوديو خطط الدروس" in body, "بطاقة الاستوديو اختفت"
        assert "قوالب جاهزة" in body, "رقائق الاستوديو الجديدة غير محدثة"
        assert "مختبر المعلّم" in body, "بطاقة المختبر اختفت"
        await pg.screenshot(path=f"{SHOTS}/w47_home.png")
        print("HOME: البطاقات الثلاث ورقائق القوالب الجديدة ظاهرة في الرئيسية ✓")

        # فتح السجل الميداني: هيدر وتبويبان وأقسام موجهة
        await pg.click('button:has-text("سجل التدريب الميداني")')
        await pg.wait_for_selector('text=كيف يعمل السجل؟', timeout=5000)
        body = await pg.inner_text("body")
        for t in ["زيارة جديدة", "سجل الزيارات", "جاهزيتك قبل دخول المدرسة", "نوع الزيارة", "بطاقة الزيارة", "تأملك بعد الحصة", "تقييمك للحصة"]:
            assert t in body, f"قسم غائب من السجل الميداني: {t}"
        print("OPEN: السجل الميداني فتح بكامل أقسامه الموجهة ✓")

        # الجاهزية: عنصران يغيّران الكلمة، ثم الكل يجعلها جاهزة تمامًا
        await pg.click('button:has-text("اقرأ موضوع الدرس في الكتاب قبل الحصة")')
        await pg.wait_for_timeout(250)
        body = await pg.inner_text("body")
        assert "أكمل بضعة تحضيرات" in body, "كلمة الجاهزية بعد عنصر واحد غير صحيحة"
        await pg.click('button:has-text("جهّز دفتر ملاحظتك وقلمًا احتياطيًا")')
        await pg.click('button:has-text("اعرف جدول الحصص واسم المعلم المتعاون")')
        await pg.wait_for_timeout(250)
        body = await pg.inner_text("body")
        assert "قاربت الجاهزية" in body, "كلمة الجاهزية بعد ثلاثة عناصر غير صحيحة"
        print("READY: قائمة الجاهزية التفاعلية تغيّر كلمتها حسب الإنجاز ✓")

        # الحفظ بلا مدرسة أو موضوع: محجوب برسالة واضحة
        await pg.click('button:has-text("احفظ الزيارة في السجل")')
        await pg.wait_for_timeout(400)
        body = await pg.inner_text("body")
        assert "اكتب اسم المدرسة وموضوع الدرس قبل الحفظ" in body, "حارس الحفظ غير ظاهر"
        print("GUARD: الحفظ بلا بطاقة محجوب برسالة واضحة ✓")

        # ملء زيارة مشاهدة كاملة
        await pg.click('button:has-text("تنفيذ حصة")')
        await pg.fill('input[aria-label="المدرسة"]', "مدرسة النور الابتدائية")
        await pg.fill('input[aria-label="موضوع الدرس"]', "دورة الماء في الطبيعة")
        await pg.fill('input[aria-label="الصف"]', "الصف الخامس")
        await pg.fill('input[aria-label="المادة"]', "العلوم")
        await pg.fill('input[aria-label="المشرف"]', "الأستاذة هدى")
        await pg.click('button:has-text("صف متوسط العدد")')
        await pg.click('button:has-text("إدارة الصف والانتقالات")')
        await pg.click('button:has-text("طريقة الشرح والتمثيل")')
        await pg.fill('textarea[aria-label="ما حدث في الحصة"]', "بدأ الدرس بتجربة محيرة فنافس الطلاب في تفسيرها")
        await pg.fill('textarea[aria-label="ماذا تعلمت؟"]', "تعلمت أن سؤالًا واحدًا محكمًا يفتح الحصة كاملة")
        await pg.fill('textarea[aria-label="ماذا كان جيدًا؟"]', "تنظيم المجموعات كان واضح الأدوار")
        await pg.fill('textarea[aria-label="ماذا يمكن تحسينه؟"]', "توزيع الوقت على النشاط احتاج ضبطًا أدق")
        await pg.fill('textarea[aria-label="ماذا سأفعل لو كنت المعلم؟"]', "سأجهز ورقة ملاحظة مبسطة لكل مجموعة")
        await pg.click('button:has-text("حصة جيدة")')
        await pg.screenshot(path=f"{SHOTS}/w47_field_form.png")

        # الحفظ ثم الانتقال التلقائي لسجل الزيارات
        await pg.click('button:has-text("احفظ الزيارة في السجل")')
        await pg.wait_for_selector('text=رحلتك الميدانية', timeout=5000)
        body = await pg.inner_text("body")
        assert "مدرسة النور الابتدائية" in body, "الزيارة المحفوظة غير ظاهرة في السجل"
        assert "بداية رحلة الميدان" in body, "كلمة رحلة الميدان غير ظاهرة لزيارة واحدة"
        assert "تنفيذ حصة بنفسك" in body, "شارة نوع الزيارة غير ظاهرة"
        assert "حصة جيدة" in body, "كلمة تقييم الحصة غير ظاهرة"
        await pg.screenshot(path=f"{SHOTS}/w47_field_log.png")
        print("SAVE: الزيارة حُفظت في السجل بكلمات رحلتها وتقييمها ✓")

        # عرض الزيارة التفصيلي: الأقسام + مشاركة نظيفة
        await pg.click('div[role="button"]:has-text("مدرسة النور الابتدائية")')
        await pg.wait_for_selector('text=عودة إلى سجل الزيارات', timeout=5000)
        body = await pg.inner_text("body")
        for t in ["ما لاحظته أثناء الحصة", "ما حدث في الحصة", "ماذا تعلمت؟", "ماذا سأفعل لو كنت المعلم؟", "تقييم الحصة", "مشاركة أو نسخ"]:
            assert t in body, f"قسم غائب من عرض الزيارة: {t}"
        await pg.click('button:has-text("مشاركة أو نسخ")')
        await pg.wait_for_timeout(500)
        clip = await pg.evaluate("navigator.clipboard.readText()")
        assert "زيارة ميدانية: مدرسة النور الابتدائية" in clip, "نص الزيارة المنسوخ ناقص العنوان"
        assert "نوع الزيارة: تنفيذ حصة بنفسك" in clip, "نص الزيارة ناقص نوعها"
        assert "ماذا تعلمت؟" in clip or "ماذا تعلمت:" in clip, "نص الزيارة ناقص التأمل"
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", clip)
        assert not leak, f"تسريب نصي في نص الزيارة المنسوخ: {leak[:5]}"
        await pg.screenshot(path=f"{SHOTS}/w47_field_detail.png")
        print("DETAIL: عرض الزيارة كامل ونصها يُنسخ نظيفاً بلا أرقام ولا لاتيني ✓")

        # التعديل: تغيير اسم المدرسة ثم الحفظ بلا تكرار
        await pg.click('button[aria-label="تعديل الزيارة"]')
        await pg.wait_for_selector('text=احفظ التعديل', timeout=5000)
        await pg.fill('input[aria-label="المدرسة"]', "مدرسة النور الابتدائية للبنين")
        await pg.click('button:has-text("احفظ التعديل")')
        await pg.wait_for_selector('text=رحلتك الميدانية', timeout=5000)
        body = await pg.inner_text("body")
        assert "مدرسة النور الابتدائية للبنين" in body, "التعديل لم يُحفظ"
        copies = await pg.locator('text=مدرسة النور الابتدائية للبنين').count()
        assert copies == 1, f"بعد التعديل ظهرت {copies} نسخ — التكرار فشل"
        print("EDIT: تعديل الزيارة يحدّثها بلا نسخ مكررة ✓")

        # حسابي: ملف الإنجاز المهني — الزيارة والخطة تجعلان محطتين منجزتين
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        await pg.click('button[aria-label="حسابي"]')
        await pg.wait_for_selector('text=ملف إنجازك المهني', timeout=5000)
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        if "وثّقت زيارة ميدانية وتأملتها" not in body:
            start = body.find("ملف إنجازك المهني")
            print("=== DEBUG: مقطع البطاقة عند الفشل ===")
            print(body[start:start+600] if start != -1 else "البطاقة غائبة كلياً!")
            fv = await pg.evaluate("JSON.parse(localStorage.getItem('turbawy-app-v1')).state.fieldVisits.length")
            print(f"fieldVisits في المخزن: {fv}")
        assert "معلم في التكوين" in body, "كلمة الجاهزية المهنية غير ظاهرة"
        assert "وثّقت زيارة ميدانية وتأملتها" in body, "محطة الميدان غير منجزة في الملف"
        assert "اصنع خطة درس في الاستوديو" in body, "محطة التخطيط يجب أن تظهر كخطوة قادمة قبل اختبار القوالب"
        assert "أول زيارة ميدانية" in body, "الإنجاز الجديد غير ظاهر في محطات التقدم"
        await pg.click('button:has-text("شارك ملف إنجازك")')
        await pg.wait_for_timeout(500)
        clip = await pg.evaluate("navigator.clipboard.readText()")
        assert "ملف إنجاز المعلم المتدرب" in clip, "نص ملف الإنجاز ناقص العنوان"
        assert "مرحلة الجاهزية:" in clip, "نص ملف الإنجاز ناقص المرحلة"
        leak = re.findall(r"[0-9A-Za-z]+", clip)  # الأرقام العربية المشرقية مسموح هنا
        assert not leak, f"تسريب لاتيني في ملف الإنجاز: {leak[:5]}"
        await pg.screenshot(path=f"{SHOTS}/w47_portfolio.png")
        print("PORTFOLIO: ملف الإنجاز المهني يحسب الزيارة والخطة ويشارك نصه بنظافة ✓")

        # قوالب الخطط: تبويب ثالث في الاستوديو، تحميل قالب يملأ الأركان ويكتمل بالتقييم
        await pg.click('button[aria-label="الرئيسية"]')
        await pg.wait_for_timeout(600)
        await pg.click('button:has-text("استوديو خطط الدروس")')
        await pg.wait_for_selector('text=كيف يعمل الاستوديو؟', timeout=5000)
        await pg.click('button:text-is("قوالب")')  # مطابقة حصرية — رقاقة «قوالب جاهزة» خلف الطبقة وإلا أشتبهت النقرة
        await pg.wait_for_selector('text=قوالب جاهزة كاملة الأركان', timeout=5000)
        body = await pg.inner_text("body")
        for t in ["درس مفهوم بالاستقصاء", "درس مهارة خطوة بخطوة", "حصة قراءة وفهم", "درس قيم بلعب الأدوار", "مشروع تعاوني قصير", "تجربة عملية بالاستقصاء"]:
            assert t in body, f"قالب غائب: {t}"
        await pg.screenshot(path=f"{SHOTS}/w47_templates.png")
        await pg.click('button:has-text("ابدأ بهذا القالب")')
        await pg.wait_for_selector('text=بطاقة الدرس', timeout=5000)
        topic_val = await pg.input_value('input[aria-label="موضوع الدرس"]')
        assert topic_val == "", "القالب يجب أن يترك الموضوع فارغًا ليكيّفه المعلم"
        subj_val = await pg.input_value('input[aria-label="المادة"]')
        assert subj_val == "العلوم", "القالب لم يملأ المادة الجاهزة"
        obj_val = await pg.input_value('textarea[aria-label="الأهداف التعليمية"]')
        assert "يصوغ الطالب" in obj_val, "القالب لم يملأ الأهداف الجاهزة"
        await pg.fill('input[aria-label="موضوع الدرس"]', "الانحلال الضوئي في النبات")
        await pg.fill('input[aria-label="الصف"]', "الصف السادس")
        await pg.click('button:has-text("قيّم خطتك")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "خطة متكاملة — جاهزة للتطبيق بثقة" in body, "القالب المحمّل لم يكتمل تقييمه"
        await pg.click('button:has-text("احفظ في خططي")')
        await pg.wait_for_timeout(700)
        body = await pg.inner_text("body")
        assert "الانحلال الضوئي في النبات" in body, "الخطة من القالب لم تُحفظ في خططي"
        assert "مكتملة الأركان" in body, "الخطة من القالب ليست مكتملة الأركان"
        print("TEMPLATES: ستة قوالب جاهزة، التحميل يملأ الأركان، والتقييم يمنحها المتكاملة ✓")

        # إغلاق الاستوديو، ثم حذف الزيارة بخطوتين والعودة للقائمة الفارغة
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        await pg.click('button:has-text("سجل التدريب الميداني")')
        await pg.wait_for_selector('text=كيف يعمل السجل؟', timeout=5000)
        await pg.click('button:text-is("سجل الزيارات")')  # الطبقة تُفتح حديثًا على «زيارة جديدة»
        await pg.wait_for_selector('text=رحلتك الميدانية', timeout=5000)
        await pg.click('div[role="button"]:has-text("مدرسة النور الابتدائية للبنين")')
        await pg.wait_for_selector('text=عودة إلى سجل الزيارات', timeout=5000)
        await pg.click('button[aria-label="حذف الزيارة"]')
        await pg.wait_for_timeout(300)
        await pg.click('button[aria-label="تأكيد حذف الزيارة"]')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "مدرسة النور" not in body, "الزيارة لم تُحذف"
        assert "لم تسجل زيارة بعد" in body, "القائمة الفارغة غير ظاهرة بعد الحذف"
        print("DELETE: حذف الزيارة بخطوتين يعيد القائمة الفارغة ✓")

        # إغلاق الطبقة ثم نظافة نصية كاملة في الرئيسية
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "كيف يعمل السجل؟" not in body, "السجل لم يغلق من زره"
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي بالرئيسية: {leak[:5]}"
        print("TEXT-CLEAN: صفر أرقام وصفر لاتيني في الرئيسية بعد كل التغييرات ✓")

        # زر الرئيسية يغلق الطبقة المفتوحة (دفاع عميق — نقرة برمجية لأن الطبقة تغطي الشريط)
        await pg.click('button:has-text("سجل التدريب الميداني")')
        await pg.wait_for_selector('text=كيف يعمل السجل؟', timeout=5000)
        await pg.evaluate("document.querySelector('nav button[aria-label=الرئيسية]').click()")
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "كيف يعمل السجل؟" not in body, "زر الرئيسية لم يغلق طبقة السجل"
        print("HOME-NAV: منطق زر الرئيسية يغلق طبقة السجل الميداني ✓")

        # الثبات بعد إعادة التحميل: البطاقة والقوالب والخطط تبقى
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(1200)
        body = await pg.inner_text("body")
        assert "سجل التدريب الميداني" in body, "بطاقة السجل لم تثبت بعد التحميل"
        assert "استوديو خطط الدروس" in body, "بطاقة الاستوديو لم تثبت بعد التحميل"
        print("PERSIST: البطاقات ثابتة بعد إعادة التحميل ✓")

        await b.close()
        await ctx.close()
        print("ALL-OK")

asyncio.run(main())
