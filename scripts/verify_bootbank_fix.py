# -*- coding: utf-8 -*-
"""فحص إصلاح «التطبيق لا يفتح» — شاشة التجهيز + فصل البيانات + عدم وجود أخطاء طرفية."""
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SNAP = "/home/z/my-project/scripts/"
errors = []


def east(n):
    return str(n).translate(str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩"))


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        # زيارة أولى — شاشة التجهيز قد تمر لحظيًّا على الخادم المحلي السريع
        await page.goto(BASE, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(600)
        try:
            boot_visible = await page.get_by_text("جارٍ تجهيز البنك التربوي").first.is_visible(timeout=1500)
        except Exception:
            boot_visible = False
        print(("✔" if boot_visible else "○"), "شاشة التجهيز ظهرت" if boot_visible else "شاشة التجهيز مرّت فورًا (الخادم المحلي سريع)")
        if boot_visible:
            await page.screenshot(path=SNAP + "fix_bootbank.png")

        # انتظار وصول واجهة التطبيق (شاشة التهيئة أو الرئيسية)
        await page.wait_for_selector("text=لنبدأ الرحلة", timeout=30000)
        await page.wait_for_timeout(2500)
        body = await page.inner_text("body")
        ok_boot = "جارٍ تجهيز البنك" not in body
        print(("✔" if ok_boot else "✘"), "التطبيق اكتمل التحميل بعد شاشة التجهيز")

        # تخطي التهيئة
        for txt in ("سارة", "لنبدأ الرحلة"):
            try:
                el = page.get_by_text(txt).first
                if await el.is_visible(timeout=1500):
                    await el.click()
                    await page.wait_for_timeout(600)
            except Exception:
                pass
        await page.wait_for_timeout(500)
        home = await page.inner_text("body")
        latin = re.findall(r"[A-Za-z]+", home)
        print(("✔" if not latin else "✘"), "الرئيسية بلا لاتيني", latin[:4] if latin else "")

        # دليل المعلم ثم محور التقويم ثم فصل جديد
        await page.get_by_text("دليل المعلم", exact=True).first.click()
        await page.wait_for_timeout(1200)
        await page.get_by_text("التقويم", exact=True).first.click()
        await page.wait_for_timeout(1500)
        m4 = await page.inner_text("body")
        print(("✔" if "أنواع التقويم ومراحله" in m4 else "✘"), "محور التقويم يفتح بفصوله الجديدة")

        # محور التدريس (قبل التوسعة) — يتأكد أن كل المحاور تقرأ من البيانات المفصولة
        await page.go_back()
        await page.wait_for_timeout(900)
        m5 = page.get_by_text("التدريس", exact=True).first
        if await m5.is_visible(timeout=2500):
            await m5.click()
            await page.wait_for_timeout(1400)
            m5t = await page.inner_text("body")
            print(("✔" if "تدريس الرياضيات" in m5t else "✘"), "محور التدريس يفتح من البيانات المفصولة")

        # زيارة ثانية — البيانات مخزّنة، والفتح فوري بلا شاشة تجهيز طويلة
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(1800)
        body2 = await page.inner_text("body")
        ok2 = "جارٍ تجهيز البنك" not in body2 or await page.get_by_text("دليل المعلم").first.is_visible(timeout=8000)
        print(("✔" if ok2 else "✘"), "الزيارة الثانية تعمل (كاش البيانات)")

        # أخطاء الطرفية
        real_errors = [e for e in errors if "favicon" not in e.lower()]
        print(("✔" if not real_errors else "✘"), f"صفر أخطاء طرفية ({len(real_errors)})")
        for e in real_errors[:6]:
            print("   -", e[:160])

        await browser.close()

    print("\n=== انتهى فحص الإصلاح ===")


asyncio.run(main())
