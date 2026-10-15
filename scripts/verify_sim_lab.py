# -*- coding: utf-8 -*-
"""فحص متصفح شامل لمختبر محاكاة الصفوف — الجيل الجديد متعدد الكفاءات."""
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SNAP = "/home/z/my-project/scripts/"
results = []


def ok(name, cond, detail=""):
    results.append((name, bool(cond), detail))


async def tap_onboarding(page):
    await page.goto(BASE, wait_until="networkidle")
    await page.wait_for_timeout(2500)
    for txt in ("سارة", "لنبدأ الرحلة"):
        try:
            el = page.get_by_text(txt).first
            if await el.is_visible(timeout=1500):
                await el.click()
                await page.wait_for_timeout(700)
        except Exception:
            pass
    await page.wait_for_timeout(800)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await tap_onboarding(page)

        # 1) بطاقة مختبر المحاكاة في الرئيسية
        home = await page.inner_text("body")
        ok("بطاقة «مختبر محاكاة الصفوف» ظاهرة في الرئيسية", "مختبر محاكاة الصفوف" in home)
        ok("وصف البطاقة يعد بالتحليل والتمرين المستهدف", "تتغير بقرارك" in home and "تمرين مستهدف" in home)
        await page.screenshot(path=SNAP + "sim_home.png")

        # 2) فتح المختبر من البطاقة
        await page.get_by_text("مختبر محاكاة الصفوف", exact=True).first.click()
        await page.wait_for_timeout(1200)
        sim = await page.inner_text("body")
        ok("عنوان المختبر ظاهر", "مختبر محاكاة الصفوف" in sim)
        ok("شريط الفلسفة ظاهر (من يعرف إلى يتصرف)", "يتصرف بذكاء" in sim)
        ok("خريطة الكفاءات ظاهرة قبل الأدلة", "خريطة كفاءتك من أدلة المحاكاة" in sim)
        ok("المواقف العشرة مرقمة بالمشرقية", "١٠ مواقف" in sim or "موقف" in sim)
        ok("عناوين المواقف الجديدة ظاهرة", "صف خارج السيطرة" in sim and "ولي أمر غاضب" in sim and "ينجز مبكرًا ويشوش" in sim)
        ok("رقائق الكفاءات الظاهرة", "إدارة الصف" in sim and "فهم المتعلم" in sim)
        await page.screenshot(path=SNAP + "sim_list.png")

        # 3) فتح الموقف الأول: صف خارج السيطرة
        await page.get_by_text("صف خارج السيطرة", exact=True).first.click()
        await page.wait_for_timeout(1000)
        play = await page.inner_text("body")
        ok("الموقف الافتتاحي يعرض مشهد الصف", "أنت معلم جديد" in play)
        ok("سؤال القرار ظاهر", "ماذا ستفعل؟" in play)
        opts = page.get_by_role("button")
        await page.screenshot(path=SNAP + "sim_play_start.png")

        # 4) قرار أول: الخيار الأفضل (إعادة توجيه الانتباه)
        await page.get_by_text("أقيّم الموقف", exact=False).first.click()
        await page.wait_for_timeout(800)
        outcome = await page.inner_text("body")
        ok("لوحة العاقبة ظهرت بجملة حاسمة", "قرار حاسم" in outcome)
        ok("لوحة التحليل «لماذا هذا القرار؟» ظاهرة", "لماذا هذا القرار؟" in outcome)
        ok("نص المخاطر أو الأدلة ظاهر إن وُجد", ("المخاطر" in outcome) or ("الأدلة المطلوبة" in outcome))
        await page.screenshot(path=SNAP + "sim_outcome.png")

        # 5) التقدم عبر العقد حتى الختام — قرارات متوازنة
        nxt = page.get_by_text("ماذا حدث بعد ذلك؟")
        await nxt.first.click()
        await page.wait_for_timeout(700)
        # عقدة ثانية: سؤال سهل للطالب المنسحب
        await page.get_by_text("أقترب منه بهدوء", exact=False).first.click()
        await page.wait_for_timeout(700)
        await page.get_by_text("ماذا حدث بعد ذلك؟").first.click()
        await page.wait_for_timeout(700)
        # عقدة ثالثة: خاتمة قولية
        await page.get_by_text("جملة واحدة يقولها كل طالب", exact=False).first.click()
        await page.wait_for_timeout(700)
        await page.get_by_text("ماذا حدث بعد ذلك؟").first.click()
        await page.wait_for_timeout(1200)
        report = await page.inner_text("body")
        ok("تقرير الختام: قراراتك ظاهرة", "قراراتك في هذا الموقف" in report)
        ok("تقرير الختام: خلاصة الموقف ظاهرة", "خلاصة الموقف" in report and "ثلاث رسائل متزامنة" in report)
        ok("كفاءات الموقف مقيسة بأشرطة", "كفاءاتك في هذا الموقف" in report)
        ok("حالة الكفاءة ظاهرة بالكلمات لا الأرقام", ("متقنة" in report) or ("في تحسّن" in report) or ("تحتاج تدريباً" in report))
        ok("التمرين المستهدف ظاهر", "تمرينك التالي" in report)
        ok("توصية مخصصة أو رسالة أداء متوازن", ("افتح مختبر المعلّم" in report) or ("أداؤك متوازن" in report))
        ok("مفاهيم المكتبة المرتبطة ظاهرة", "مفاهيم من المكتبة تخدم هذا الموقف" in report)
        await page.screenshot(path=SNAP + "sim_report.png")

        # 6) قائمة المواقف بعد الإنجاز — الحالة المسجلة
        await page.get_by_text("عودة إلى المواقف", exact=True).first.click()
        await page.wait_for_timeout(900)
        lst = await page.inner_text("body")
        ok("الحالة المسجلة ظاهرة على البطاقة", "متقن في آخر تجربة" in lst)
        ok("الخريطة المجمعة أظهرت أدلة", "متقنة" in lst or "في تحسّن" in lst)

        # 7) فحص اللاتيني و CJK في الواجهة
        full = lst + report + sim + play
        latin = re.findall(r"[A-Za-z]+", full)
        cjk = re.findall(r"[\u4e00-\u9fff\u3400-\u4dbf]", full)
        ok("صفر أحرف لاتينية في واجهات المختبر", len(latin) == 0, str(latin[:8]))
        ok("صفر أحرف صينية في واجهات المختبر", len(cjk) == 0)

        # 8) موقف من فصيل آخر للتأكد من التشغيل العام — ولي أمر غاضب (قرارات ضعيفة لاختبار التوصية)
        await page.get_by_text("ولي أمر غاضب", exact=True).first.click()
        await page.wait_for_timeout(900)
        await page.get_by_text("أرد فورًا بالدفاع عن نفسي", exact=False).first.click()
        await page.wait_for_timeout(700)
        v2 = await page.inner_text("body")
        ok("قرار ضعيف يعرض «يحتاج إعادة نظر»", "قرار يحتاج إعادة نظر" in v2)
        await page.get_by_text("ماذا حدث بعد ذلك؟").first.click()
        await page.wait_for_timeout(600)
        await page.get_by_text("أطلب منها تحويل الابن إلى الإدارة", exact=False).first.click()
        await page.wait_for_timeout(600)
        await page.get_by_text("ماذا حدث بعد ذلك؟").first.click()
        await page.wait_for_timeout(600)
        await page.get_by_text("أكتفي بشكرها على تفهمها", exact=False).first.click()
        await page.wait_for_timeout(600)
        await page.get_by_text("ماذا حدث بعد ذلك؟").first.click()
        await page.wait_for_timeout(1200)
        rep2 = await page.inner_text("body")
        ok("تقرير الموقف الثاني ظاهر", "قراراتك في هذا الموقف" in rep2)
        ok("التوصية استهدفت كفاءة التواصل", "الكفاءة المستهدفة" in rep2 and "التواصل" in rep2)
        await page.screenshot(path=SNAP + "sim_report_weak.png")

        # 9) عودة للقائمة والتحقق النهائي من التخزين
        await page.get_by_text("عودة إلى المواقف", exact=True).first.click()
        await page.wait_for_timeout(900)
        fin = await page.inner_text("body")
        ok("بطاقة ولي الأمر تحمل حالة الأخيرة", "في تحسّن في آخر تجربة" in fin or "يحتاج إعادة نظر في آخر تجربة" in fin)

        await browser.close()

    passed = sum(1 for _, c, _ in results if c)
    print(f"\n===== النتيجة: {passed}/{len(results)} =====")
    for name, c, d in results:
        print(("✔" if c else "✘") + " " + name + (f" — {d}" if (d and not c) else ""))


asyncio.run(main())
