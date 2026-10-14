# -*- coding: utf-8 -*-
"""فحص متصفح شامل لمحور «عالم المشاعر والذكاء» بعد دمج دفعات M2 الموجة الثانية — محاكاة جهاز المستخدم."""
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
        # تخطي onboarding
        for txt in ("سارة", "لنبدأ الرحلة"):
            try:
                el = page.get_by_text(txt).first
                if await el.is_visible(timeout=1500):
                    await el.click()
                    await page.wait_for_timeout(700)
            except Exception:
                pass
        await page.wait_for_timeout(800)

        # 1) تبويب دليل المعلم
        tab = page.get_by_text("دليل المعلم", exact=True).first
        await tab.click()
        await page.wait_for_timeout(1200)
        guide = await page.inner_text("body")
        ok("تبويب دليل المعلم يعمل", "المشاعر والذكاء" in guide)

        # 2) فتح بطاقة محور المشاعر والذكاء
        card = page.get_by_text("المشاعر والذكاء", exact=True).first
        await card.click()
        await page.wait_for_timeout(1500)
        course = await page.inner_text("body")
        ok("بطاقة محور المشاعر والذكاء تفتح", "أساسيات الانفعال" in course and "مفاهيم" in course)
        ok("الفصول الجديدة تحمل عدّاد ١٠ مفاهيم", course.count("١٠ مفاهيم") >= 14)
        await page.screenshot(path=SNAP + "m2_course.png")

        # 3) الفصول الجديدة الـ١٤ ظاهرة
        chapters = [
            "نظريات الانفعال الكبرى",
            "الأساس العصبي والفسيولوجي للانفعال",
            "الذكاء العاطفي: النموذج والقدرات",
            "الذكاء العاطفي في البيئة الصفية",
            "المشاعر الإيجابية والرفاه النفسي",
            "نظريات العامل وبنية الذكاء",
            "الذكاءات المتعددة عند جاردنر",
            "الذكاء الثلاثي والإبداع",
            "فرويد: التعمق في التحليل النفسي",
            "الدفاعات النفسية تفصيلًا",
            "ما بعد فرويد: يونغ وأدلر",
            "أنماط الشخصية النوعية",
            "السمات والأبعاد الكبرى",
            "قياس الشخصية وتقييمها",
        ]
        for ch in chapters:
            ok(f"فصل: {ch}", ch in course)

        # 4) فتح فصل «الدفاعات النفسية تفصيلًا» وفحص مفاهيمه
        try:
            ch_card = page.get_by_text("الدفاعات النفسية تفصيلًا", exact=True).first
            await ch_card.click(timeout=3000)
            await page.wait_for_timeout(1500)
            chap = await page.inner_text("body")
            ok("فصل الدفاعات النفسية يفتح", "التسامي" in chap or "الإزاحة" in chap)
            await page.screenshot(path=SNAP + "m2_chapter.png")
        except Exception as ex:
            ok("فصل الدفاعات النفسية يفتح", False, str(ex)[:80])

        # 5) فحص اللغة في الشاشة النهائية
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
