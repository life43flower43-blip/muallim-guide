# -*- coding: utf-8 -*-
"""فحص متصفح شامل لتوسعة M3 «كيف يتعلم الطلاب» وM2 «الشخصية والذكاء» على الخادم الإنتاجي."""
import asyncio
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
PASS = []
FAIL = []


def ok(name, cond, extra=""):
    (PASS if cond else FAIL).append(f"{name} {extra}")
    print(("✓" if cond else "✗"), name, extra)


LAT = re.compile(r"[A-Za-z]")
CJK = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()

        await page.goto(BASE, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2500)

        # تخطي التهيئة
        for txt in ("سارة", "لنبدأ الرحلة"):
            try:
                el = page.get_by_text(txt).first
                if await el.is_visible(timeout=1200):
                    await el.click()
                    await page.wait_for_timeout(600)
            except Exception:
                pass

        body = await page.inner_text("body")
        ok("بلا حروف لاتينية في الرئيسية", not LAT.search(body))
        ok("بلا حروف CJK في الرئيسية", not CJK.search(body))

        # الذهاب لدليل المعلم
        tab = page.get_by_text("دليل المعلم", exact=True).first
        await tab.click()
        await page.wait_for_timeout(1500)

        # محور M3
        m3 = page.get_by_text("كيف يتعلمون", exact=False).first
        ok("بطاقة M3 ظاهرة", await m3.is_visible(timeout=3000))
        if await m3.is_visible(timeout=3000):
            await m3.click()
            await page.wait_for_timeout(1500)
            b3 = await page.inner_text("body")
            m3_chapters = [
                "طبيعة التعلم", "نظريات التعلم السلوكية",
                "نظريات التعلم المعرفية والبصيرة", "نظرية بياجيه المعرفية",
                "فيجوتسكي والبنائية الاجتماعية", "الذاكرة واستراتيجيات التذكر",
                "ما وراء المعرفة والتعلم الذاتي", "الدافعية والتعلم",
                "أنماط التعلم والفروق الفردية", "معوقات التعلم وصعوباته",
                "التعلم النشط واستراتيجياته", "تطبيقات التعلم في الصف",
                "التعلم في العصر الرقمي",
            ]
            found3 = [c for c in m3_chapters if c in b3]
            ok("فصول M3 الجديدة ظاهرة", len(found3) >= 10, f"({len(found3)}/13)")
            print("   فصول M3:", found3)
            ok("بلا لاتيني في شاشة M3", not LAT.search(b3))
            ok("بلا CJK في شاشة M3", not CJK.search(b3))
            await page.screenshot(path="scripts/m3x_m3_chapters.png")

            # فتح فصل بياجيه ثم مفهوم
            ch = page.get_by_text("نظرية بياجيه المعرفية", exact=False).first
            if await ch.is_visible(timeout=1500):
                await ch.click()
                await page.wait_for_timeout(1200)
                bc = await page.inner_text("body")
                ok("مفاهيم بياجيه ظاهرة", ("المخطط والاستيعاب" in bc) or ("العمليات المجردة" in bc))
                await page.screenshot(path="scripts/m3x_piaget_chapter.png")

        # الرجوع من شاشة الفصل/المحور إلى قائمة المحاور (مستويان محتملان)
        for _ in range(3):
            if await page.get_by_text("المشاعر والذكاء", exact=False).count() > 0:
                break
            back1 = page.get_by_label("عودة").first
            if await back1.is_visible(timeout=2000):
                await back1.click()
                await page.wait_for_timeout(1000)
            else:
                break

        # محور M2
        m2 = page.get_by_text("المشاعر والذكاء", exact=False).first
        ok("بطاقة M2 ظاهرة", await m2.is_visible(timeout=3000))
        if await m2.is_visible(timeout=3000):
            await m2.click()
            await page.wait_for_timeout(1500)
            b2 = await page.inner_text("body")
            m2_chapters = [
                "نظريات الذكاء الكبرى", "قياس الذكاء",
                "تكوين الشخصية وعواملها", "نظريات الشخصية الكبرى",
                "أنواع الشخصية وتصنيفاتها", "الشخصية والتعلم",
            ]
            found2 = [c for c in m2_chapters if c in b2]
            ok("فصول M2 الجديدة (الشخصية والذكاء) ظاهرة", len(found2) >= 5, f"({len(found2)}/6)")
            print("   فصول M2:", found2)
            ok("بلا لاتيني في شاشة M2", not LAT.search(b2))
            ok("بلا CJK في شاشة M2", not CJK.search(b2))
            await page.screenshot(path="scripts/m3x_m2_chapters.png")

            # فتح فصل نظريات الشخصية
            ch2 = page.get_by_text("نظريات الشخصية الكبرى", exact=False).first
            if await ch2.is_visible(timeout=1500):
                await ch2.click()
                await page.wait_for_timeout(1200)
                bp = await page.inner_text("body")
                ok("مفاهيم الشخصية ظاهرة", ("الهو والأنا" in bp) or ("فرويد" in bp) or ("إريكسون" in bp))
                await page.screenshot(path="scripts/m3x_personality_chapter.png")

        # فحص كاش الخدمة (قد لا يتوفر caches في كل سياق)
        try:
            ver = await page.evaluate(
                "(async () => { if (!('caches' in window)) return 'بلا'; return await caches.keys().then(k => k.join(',')); })()"
            )
            print("كاش المتصفح:", ver)
        except Exception as e:
            print("كاش المتصفح: تعذر القراءة —", type(e).__name__)

        await ctx.close()

        # جهاز ثانٍ: سطح مكتب — زيارة أولى بلا عامل خدمة (يحاكي المستخدم الجديد)
        ctx2 = await browser.new_context(viewport={"width": 1280, "height": 800})
        p2 = await ctx2.new_page()
        await p2.goto(BASE, wait_until="networkidle", timeout=60000)
        await p2.wait_for_timeout(2000)
        # تخطي التهيئة في الجهاز الثاني أيضًا
        for txt in ("سارة", "لنبدأ الرحلة"):
            try:
                el = p2.get_by_text(txt).first
                if await el.is_visible(timeout=1200):
                    await el.click()
                    await p2.wait_for_timeout(600)
            except Exception:
                pass
        # الانتقال إلى دليل المعلم ثم محور كيف يتعلمون للتأكد من المحتوى على جهاز نظيف
        t2 = p2.get_by_text("دليل المعلم", exact=True).first
        if await t2.is_visible(timeout=3000):
            await t2.click()
            await p2.wait_for_timeout(1200)
            m3d = p2.get_by_text("كيف يتعلمون", exact=False).first
            if await m3d.is_visible(timeout=3000):
                await m3d.click()
                await p2.wait_for_timeout(1500)
            b4 = await p2.inner_text("body")
            ok("جهاز سطح مكتب: فصول M3 ظاهرة", "نظرية بياجيه المعرفية" in b4 and "معوقات التعلم وصعوباته" in b4)
        else:
            b4 = await p2.inner_text("body")
            ok("جهاز سطح مكتب: الرئيسية سليمة", False, "— تبويب دليل المعلم غير ظاهر")
        b4 = await p2.inner_text("body")
        ok("جهاز سطح مكتب: بلا لاتيني", not LAT.search(b4))
        ok("جهاز سطح مكتب: بلا CJK", not CJK.search(b4))
        await p2.screenshot(path="scripts/m3x_desktop.png")
        await ctx2.close()
        await browser.close()

    print(f"\nالنتيجة: {len(PASS)} نجاح / {len(FAIL)} فشل")
    if FAIL:
        for f in FAIL:
            print("  ✗", f)
        raise SystemExit(1)


asyncio.run(main())
print("تم")
