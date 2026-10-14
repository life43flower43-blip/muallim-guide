# -*- coding: utf-8 -*-
"""فحص متصفح شامل لمحور «تقويم التعلم وقياسه» بعد توسعة P24 — محاكاة جهاز المستخدم."""
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
        # زيارة أولى
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

        body = await page.inner_text("body")

        # 1) الانتقال إلى تبويب دليل المعلم في الشريط السفلي
        tab = page.get_by_text("دليل المعلم", exact=True).first
        await tab.click()
        await page.wait_for_timeout(1200)
        guide = await page.inner_text("body")
        ok("تبويب دليل المعلم يعمل", "ثقافة تربوية" in guide or "التقويم" in guide)

        # 2) فتح بطاقة محور التقويم (اسمها في الشريط: التقويم)
        card = page.get_by_text("التقويم", exact=True).first
        await card.click()
        await page.wait_for_timeout(1200)
        course = await page.inner_text("body")
        ok("بطاقة محور التقويم تفتح", "تقويم التعلم وقياسه" in course or "أنواع التقويم" in course)
        await page.screenshot(path=SNAP + "m4_course.png")

        # 3) الفصول الجديدة الـ١٧ ظاهرة
        chapters = [
            "أنواع التقويم ومراحله", "الصدق في الاختبارات", "الثبات والموضوعية",
            "أدوات التقويم المتنوعة", "أدوات التقويم والتقارير", "أسئلة الاختيار من متعدد",
            "أنواع الأسئلة الموضوعية الأخرى", "الأسئلة المقالية", "بناء الاختبارات وجدول المواصفات",
            "تحليل مفردات الاختبارات", "الإحصاء الوصفي في التقويم", "التقويم الأصيل والبديل",
            "تقويم المناهج والبرامج", "العدالة وأخلاقيات التقويم", "قلق الاختبار ومواجهته",
            "مهارات الاختبار والمراجعة", "التقويم في التعليم الجامعي",
        ]
        visible_count = 0
        for ch in chapters:
            # التمرير لأسفل لتحميل كل الفصول
            while not await page.get_by_text(ch, exact=False).first.is_visible():
                await page.mouse.wheel(0, 600)
                await page.wait_for_timeout(150)
                if await page.evaluate("window.scrollY + window.innerHeight >= document.body.scrollHeight - 50"):
                    break
            if await page.get_by_text(ch, exact=False).first.is_visible():
                visible_count += 1
        ok(f"الفصول الجديدة ظاهرة ({visible_count}/17)", visible_count == 17)
        await page.screenshot(path=SNAP + "m4_chapters.png")

        # 4) فتح فصل «قلق الاختبار ومواجهته»
        ch15 = page.get_by_text("قلق الاختبار ومواجهته", exact=False).first
        await ch15.scroll_into_view_if_needed()
        await ch15.click()
        await page.wait_for_timeout(1200)
        ch15_text = await page.inner_text("body")
        ok("فصل قلق الاختبار يفتح بمفاهيمه", "القلق الميسر" in ch15_text or "قلق الاختبار: تعريفه" in ch15_text)
        await page.screenshot(path=SNAP + "m4_anxiety_chapter.png")

        # 5) فتح مفهوم واحد وعرض الشرح والأسئلة
        concept = page.get_by_text("قلق الاختبار: تعريفه وطبيعته", exact=False).first
        await concept.scroll_into_view_if_needed()
        await concept.click()
        await page.wait_for_timeout(1500)
        detail = await page.inner_text("body")
        ok("تفاصيل المفهوم تظهر", len(detail) > 300)

        # 6) فحص الخلو من اللاتيني والصيني في الشاشات المعروضة
        for label, txt in [("دليل المعلم", guide), ("بطاقة التقويم", course)]:
            latin = re.findall(r"[A-Za-z]+", txt)
            cjk = re.findall(r"[\u4e00-\u9fff]", txt)
            ok(f"صفر لاتيني/صيني في {label}", len(latin) == 0 and len(cjk) == 0, f"latin={latin[:5]}")

        await browser.close()

    passed = sum(1 for _, c, _ in results if c)
    print(f"\n=== نتائج فحص P24: {passed}/{len(results)} ===")
    for name, cond, detail in results:
        print(("✔" if cond else "✘"), name, ("" if cond else f"→ {detail}"))
    if passed != len(results):
        raise SystemExit(1)


asyncio.run(main())
