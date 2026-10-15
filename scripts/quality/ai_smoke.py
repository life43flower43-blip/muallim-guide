# -*- coding: utf-8 -*-
# دخان المساعد الذكي: فتح البطاقة → الرأس واللافتة → الإعدادات → تحقق بمفتاح خاطئ
# → رسالة خطأ عربية داخل المحادثة (اختبار المسار الكامل عبر المزوّد)
# ملاحظة: نستخدم wait_for لا is_visible — فالثانية تعيد الحالة فوراً وتتجاهل المهلة.
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
OK = []

async def nuke_portals(page):
    await page.evaluate(
        "document.querySelectorAll('nextjs-portal').forEach(e => e.remove())"
    )

async def appears(locator, timeout_ms: int) -> bool:
    """هل يظهر العنصر خلال المهلة؟ — انتظار حقيقي بـ wait_for"""
    try:
        await locator.wait_for(state="visible", timeout=timeout_ms)
        return True
    except Exception:
        return False

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 800})
        await page.goto(BASE, wait_until="networkidle")
        # إزالة مؤشر تطوير Next.js الذي يعترض النقرات في وضع التطوير فقط
        await nuke_portals(page)
        # بوابة الترحيب إن ظهرت
        for txt in ("لنبدأ الرحلة", "ابدأ"):
            try:
                el = page.get_by_text(txt).first
                if await appears(el, 1200):
                    await el.click()
                    await page.wait_for_timeout(600)
            except Exception:
                pass

        # ١) بطاقة المساعد الذكي في الرئيسية
        card = page.get_by_text("المساعد الذكي", exact=True).first
        vis = await appears(card, 8000)
        OK.append(("بطاقة المساعد الذكي ظاهرة في الرئيسية", vis))
        await nuke_portals(page)
        await card.click()
        await page.wait_for_timeout(900)
        await nuke_portals(page)

        # ٢) رأس شاشة المساعد
        head = page.get_by_text("رفيقك التربوي الذي يجيب فوراً").first
        OK.append(("رأس شاشة المساعد ظاهر", await appears(head, 5000)))

        # ٣) لافتة عدم ربط المفتاح
        banner = page.get_by_text("لم تربط مفتاحك بعد").first
        OK.append(("لافتة «لم تربط مفتاحك بعد» ظاهرة", await appears(banner, 4000)))

        # ٤) فتح الإعدادات من زر ⚙
        await nuke_portals(page)
        await page.get_by_label("إعدادات المساعد الذكي").click()
        panel = page.get_by_text("ربط المفتاح").first
        OK.append(("لوحة ربط المفتاح فُتحت", await appears(panel, 4000)))

        # ٥) لصق مفتاح خاطئ والتحقق — يجب رسالة عربية من المزوّد عبر المسار الكامل
        await page.locator("input[type=password]").fill("sk-test-invalid-key-123")
        await page.get_by_text("تحقق وجلب الطرز", exact=True).click()
        err = page.get_by_text("المفتاح غير صالح").first
        vis = await appears(err, 45000)
        if not vis:
            await page.screenshot(path="/home/z/my-project/scripts/quality/out/ai_smoke_fail1.png")
        OK.append(("تحقق بمفتاح خاطئ أرجع رسالة عربية من المزوّد", vis))

        # ٦) إغلاق اللوحة — المفتاح الخاطئ محفوظ الآن، أرسل سؤالاً فيجيء خطأ داخل المحادثة
        await page.get_by_label("إغلاق الإعدادات").click()
        await page.wait_for_timeout(500)
        await nuke_portals(page)
        await page.locator("textarea").fill("اشرح لي مفهوم التعلم النشط")
        await page.get_by_label("إرسال السؤال").click()
        bubble = page.get_by_text("تعذر إتمام الطلب").first
        vis_b = await appears(bubble, 55000)
        if not vis_b:
            await page.screenshot(path="/home/z/my-project/scripts/quality/out/ai_smoke_fail2.png")
        OK.append(("فقاعة خطأ عربية داخل المحادثة عند فشل المفتاح", vis_b))

        # ٧) زر الإغلاق يعود للرئيسية
        await nuke_portals(page)
        await page.get_by_label("إغلاق المساعد الذكي").click()
        await page.wait_for_timeout(700)
        back = page.get_by_text("ابدأ الاختبار").first
        OK.append(("الإغلاق يعود للرئيسية", await appears(back, 5000)))

        await browser.close()

    print("\n=== نتائج دخان المساعد الذكي ===")
    fails = 0
    for name, ok in OK:
        print(("✅" if ok else "❌"), name)
        fails += 0 if ok else 1
    print(f"النتيجة: {len(OK)-fails}/{len(OK)}")
    if fails:
        raise SystemExit(1)

asyncio.run(main())
