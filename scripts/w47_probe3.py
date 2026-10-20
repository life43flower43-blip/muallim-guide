# تشخيص ٣: تسلسل w47 كامل (عرض+مشاركة+تعديل) ثم حسابي — مع طباعة المقطع وحالة المخزن
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844},
            permissions=["clipboard-read", "clipboard-write"])
        pg = await ctx.new_page()
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        if "ما اسمك" in await pg.inner_text("body"):
            await pg.fill("input", "سارة")
            await pg.click('button:has-text("لنبدأ الرحلة")')
            await pg.wait_for_timeout(1200)

        await pg.click('button:has-text("سجل التدريب الميداني")')
        await pg.wait_for_selector('text=كيف يعمل السجل؟', timeout=5000)
        await pg.click('button:has-text("تنفيذ حصة")')
        await pg.fill('input[aria-label="المدرسة"]', "مدرسة النور الابتدائية")
        await pg.fill('input[aria-label="موضوع الدرس"]', "دورة الماء في الطبيعة")
        await pg.fill('textarea[aria-label="ماذا تعلمت؟"]', "تعلمت أن سؤالًا واحدًا محكمًا يفتح الحصة كاملة")
        await pg.click('button:has-text("حصة جيدة")')
        await pg.click('button:has-text("احفظ الزيارة في السجل")')
        await pg.wait_for_selector('text=رحلتك الميدانية', timeout=5000)
        print("الزيارة حُفظت")

        await pg.click('div[role="button"]:has-text("مدرسة النور الابتدائية")')
        await pg.wait_for_selector('text=عودة إلى سجل الزيارات', timeout=5000)
        await pg.click('button:has-text("مشاركة أو نسخ")')
        await pg.wait_for_timeout(500)
        print("تمت المشاركة")

        await pg.click('button[aria-label="تعديل الزيارة"]')
        await pg.wait_for_selector('text=احفظ التعديل', timeout=5000)
        await pg.fill('input[aria-label="المدرسة"]', "مدرسة النور الابتدائية للبنين")
        await pg.click('button:has-text("احفظ التعديل")')
        await pg.wait_for_selector('text=رحلتك الميدانية', timeout=5000)
        print("تم التعديل")

        fv = await pg.evaluate("JSON.parse(localStorage.getItem('turbawy-app-v1')).state.fieldVisits.length")
        print(f"fieldVisits بعد التعديل: {fv}")

        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)
        # عدّ الأزرار المطابقة قبل النقر
        n = await pg.locator('button[aria-label="حسابي"]').count()
        print(f"أزرار حسابي المطابقة: {n}")
        await pg.click('button[aria-label="حسابي"] >> nth=0')
        await pg.wait_for_selector('text=ملف إنجازك المهني', timeout=5000)
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        start = body.find("ملف إنجازك المهني")
        print("=== مقطع البطاقة ===")
        print(body[start:start+450] if start != -1 else "غائبة!")
        await b.close()
        await ctx.close()

asyncio.run(main())
