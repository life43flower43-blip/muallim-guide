# تشخيص ٢: نفس تسلسل الاختبار بالواجهة — زيارة عبر النموذج ثم حسابي
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844})
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
        await pg.fill('input[aria-label="المدرسة"]', "مدرسة النور الابتدائية")
        await pg.fill('input[aria-label="موضوع الدرس"]', "دورة الماء في الطبيعة")
        await pg.click('button:has-text("احفظ الزيارة في السجل")')
        await pg.wait_for_selector('text=رحلتك الميدانية', timeout=5000)
        print("الزيارة حُفظت ✓")

        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(800)
        await pg.click('button[aria-label="حسابي"]')
        await pg.wait_for_selector('text=ملف إنجازك المهني', timeout=5000)
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        start = body.find("ملف إنجازك المهني")
        print("=== مقطع بطاقة ملف الإنجاز ===")
        print(body[start:start+500] if start != -1 else "البطاقة غائبة!")

        # حالة المخزن الفعلية
        st = await pg.evaluate("JSON.parse(localStorage.getItem('turbawy-app-v1')).state.fieldVisits.length")
        print(f"fieldVisits في المخزن: {st}")
        await b.close()
        await ctx.close()

asyncio.run(main())
