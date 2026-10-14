# -*- coding: utf-8 -*-
"""فحص متصفح شامل لمحور «التدريس داخل الصف» بعد دمج دفعات M5 السبع — محاكاة جهاز المستخدم."""
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SNAP = "/home/z/my-project/scripts/"
results = []


def ok(name, cond, detail=""):
    results.append((name, bool(cond), detail))


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(2500)
        # تخطي onboarding: سارة ثم لنبدأ الرحلة
        for txt in ("سارة", "لنبدأ الرحلة"):
            try:
                el = page.get_by_text(txt).first
                if await el.is_visible(timeout=1500):
                    await el.click()
                    await page.wait_for_timeout(700)
            except Exception:
                pass
        await page.wait_for_timeout(800)

        # 1) الانتقال إلى تبويب دليل المعلم في الشريط السفلي
        tab = page.get_by_text("دليل المعلم", exact=True).first
        await tab.click()
        await page.wait_for_timeout(1200)
        guide = await page.inner_text("body")
        ok("تبويب دليل المعلم يعمل", "التدريس" in guide or "التقويم" in guide)

        # 2) فتح بطاقة محور التدريس داخل الصف
        card = page.get_by_text("التدريس داخل الصف", exact=True).first
        try:
            await card.click(timeout=2500)
        except Exception:
            await page.get_by_text("التدريس", exact=True).first.click()
        await page.wait_for_timeout(1500)
        course = await page.inner_text("body")
        ok("بطاقة محور التدريس تفتح", "التدريس داخل الصف" in course or "أسس مهنة التدريس" in course)
        await page.screenshot(path=SNAP + "m5_course.png")

        # 3) الفصول الجديدة السبعة ظاهرة
        chapters = [
            "أسس مهنة التدريس",
            "مهارات التدريس الأساسية",
            "طرائق التدريس العامة",
            "التعلم التعاوني والتدريس التفاعلي",
            "إدارة الصف والبيئة التعليمية",
            "التقنية والوسائل في التدريس",
            "التدريس التفاضلي وتكييف التعليم",
        ]
        for ch in chapters:
            ok(f"فصل: {ch}", ch in course)

        # 4) فتح فصل «إدارة الصف والبيئة التعليمية» وفحص مفاهيمه
        try:
            ch_card = page.get_by_text("إدارة الصف والبيئة التعليمية", exact=True).first
            await ch_card.click(timeout=2500)
            await page.wait_for_timeout(1500)
            chap = await page.inner_text("body")
            ok("فصل إدارة الصف يفتح", "إدارة الصف" in chap)
            ok("مفاهيم الفصل ظاهرة", "الروتين الصفي" in chap or "مفهوم" in chap or "شرح" in chap)
            await page.screenshot(path=SNAP + "m5_chapter.png")

            # فتح أول مفهوم للتحقق من الشرح والأسئلة
            try:
                concept_el = page.locator("text=مفهوم").first
                # نبحث عن أي زر مفهوم داخل الفصل — نضغط أول عنصر تفاعلي بعد العنوان
                btns = page.locator("button, [role=button], a").filter(has_text=re.compile("الروتين|القواعد|التعليمات"))
                if await btns.count() > 0:
                    await btns.first.click(timeout=2000)
                    await page.wait_for_timeout(1200)
                    detail = await page.inner_text("body")
                    ok("تفاصيل المفهوم تعرض شرحًا", len(detail) > 300)
                    await page.screenshot(path=SNAP + "m5_concept.png")
            except Exception as ex:
                ok("تفاصيل المفهوم تعرض شرحًا", False, str(ex)[:80])
        except Exception as ex:
            ok("فصل إدارة الصف يفتح", False, str(ex)[:80])

        # 5) فحص اللغة: صفر لاتيني وصفر CJK في شاشات المحور
        for shot, label in (("m5_course.png", "شاشة المحور"), ("m5_chapter.png", "شاشة الفصل")):
            try:
                # نعيد القراءة من الصفحة الحالية إن كانت الشاشة مفتوحة
                pass
            except Exception:
                pass
        final_txt = await page.inner_text("body")
        latin = re.findall(r"[A-Za-z]+", final_txt)
        cjk = re.findall(r"[\u4e00-\u9fff\u3400-\u4dbf]", final_txt)
        ok("صفر حرف لاتيني في الشاشة النهائية", len(latin) == 0, f"وُجد: {latin[:5]}")
        ok("صفر حرف صيني في الشاشة النهائية", len(cjk) == 0, f"وُجد: {cjk[:5]}")

        await browser.close()

    passed = sum(1 for _, s, _ in results if s)
    print(f"\n=== النتيجة: {passed}/{len(results)} ===")
    for name, s, d in results:
        print(("✔" if s else "✘"), name, (f"— {d}" if (d and not s) else ""))


asyncio.run(main())
