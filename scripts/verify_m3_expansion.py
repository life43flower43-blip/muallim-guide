# -*- coding: utf-8 -*-
"""فحص توسعة محور «كيف يتعلم الطلاب» (M3): ظهور الفصول الجديدة في تبويب «دليل المعلم»."""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900}, locale="ar")
        page = await ctx.new_page()
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(1500)

        # تجاوز شاشة البداية: «سارة» ثم «لنبدأ الرحلة»
        try:
            inp = page.locator("input").first
            await inp.fill("سارة", timeout=4000)
            btn = page.get_by_text("لنبدأ الرحلة")
            await btn.first.click(timeout=4000)
            await page.wait_for_timeout(1200)
        except Exception as e:
            print("ملاحظة في تجاوز البداية:", e)

        # الانتقال إلى تبويب «دليل المعلم» في الشريط السفلي
        tab = page.get_by_text("دليل المعلم", exact=True).last
        await tab.click()
        await page.wait_for_timeout(1200)
        await page.screenshot(path="scripts/m3_guide_top.png")

        # فتح بطاقة محور «كيف يتعلمون»
        card = page.get_by_text("كيف يتعلمون", exact=True).last
        await card.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path="scripts/m3_course_view.png")

        body = await page.inner_text("body")

        # فحص الفصول الجديدة
        new_chapters = [
            "واتسون والسلوكية المتطرفة",
            "نظرية جانيه والبناء التعليمي",
            "اكتساب المفاهيم وتعلم القواعد",
            "التفكير وحل المشكلات",
            "الانتباه بالتفصيل",
            "الإدراك وثباتاته",
            "أنواع الذاكرة",
            "تقنيات الحفظ والاستذكار",
            "استراتيجيات المعالجة المعرفية",
            "أهداف التعلم وتصنيف بلوم",
            "انتقال أثر التعلم",
            "التعلم التعاوني التفصيلي",
            "الدافعية المتقدمة",
            "الانفعالات والتعلم",
            "الوظائف التنفيذية",
            "الفهم العميق والسطحي",
            "الأساليب المعرفية",
            "تعلم المهارات واللعب",
            "التعلم القائم على المشكلات والمشروع",
            "الفروق الفردية التعلمية المتقدمة",
            "التغذية الراجعة التفصيلية",
            "المرونة العصبية وأساس التعلم",
        ]
        found = [ch for ch in new_chapters if ch in body]
        missing = [ch for ch in new_chapters if ch not in body]
        print(f"فصول جديدة ظاهرة: {len(found)} من {len(new_chapters)}")
        if missing:
            print("غائبة:", missing)

        # فتح فصل جديد للتأكد من ظهور المفاهيم
        target = page.get_by_text("المرونة العصبية وأساس التعلم").last
        await target.click()
        await page.wait_for_timeout(1500)
        body2 = await page.inner_text("body")
        checks = ["المرونة العصبية: أساس التعلم", "اللوزة والحصين", "قراءات الأعصاب"]
        for c in checks:
            print(f"  {'✔' if c in body2 else '✘'} {c}")
        await page.screenshot(path="scripts/m3_new_chapter.png")

        await browser.close()
        print("اكتمل الفحص")


asyncio.run(main())
