# تحقق حزمة التطوير ٣٥: وضع العرض الثلاثي + مفتاح الاهتزاز + مشاركة التطبيق/المفهوم + تصفية أخطائي حسب المحور
import asyncio, json
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
SHOTS = "/home/z/my-project/scripts"

# بذور أخطاء عبر ثلاثة محاور (M1/M2/M4) — تُزرع قبل تحميل التطبيق لتُفعّل شرائح التصفية
SEED = {
    "state": {
        "name": "سارة",
        "onboarded": True,
        "attempts": {
            "Q001": {"qid": "Q001", "correct": False, "answer": "خطأ", "ts": 1760000001000, "box": 1},
            "Q065": {"qid": "Q065", "correct": False, "answer": "خطأ", "ts": 1760000002000, "box": 1},
            "Q105": {"qid": "Q105", "correct": False, "answer": "خطأ", "ts": 1760000003000, "box": 1},
        },
    },
    "version": 0,
}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844})
        pg = await ctx.new_page()
        await pg.add_init_script(
            f"localStorage.setItem('turbawy-app-v1', {json.dumps(json.dumps(SEED, ensure_ascii=False))});"
        )
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1800)

        body = await pg.inner_text("body")
        assert "ما اسمك" not in body, "البذرة لم تتجاوز الترحيب"
        print("SEEDED: دخول مباشر بلا ترحيب")

        # ---- وضع العرض الثلاثي ----
        await pg.click('nav button[aria-label="حسابي"]')
        await pg.wait_for_timeout(900)
        body = await pg.inner_text("body")
        assert "وضع العرض" in body and "فاتح" in body and "تلقائي" in body and "ليلي" in body
        has_dark = await pg.evaluate("document.documentElement.classList.contains('dark')")
        await pg.click('button:has-text("ليلي")')
        await pg.wait_for_timeout(400)
        d1 = await pg.evaluate("document.documentElement.classList.contains('dark')")
        await pg.click('button:has-text("تلقائي")')
        await pg.wait_for_timeout(400)
        d2 = await pg.evaluate("document.documentElement.classList.contains('dark')")
        await pg.screenshot(path=f"{SHOTS}/w35_display_mode.png", full_page=True)
        await pg.click('button:has-text("فاتح")')
        await pg.wait_for_timeout(400)
        d3 = await pg.evaluate("document.documentElement.classList.contains('dark')")
        print(f"DISPLAY-MODE: init={has_dark} (seed v0→light) night={d1} auto={d2} light={d3}")
        assert (has_dark, d1, d2, d3) == (False, True, False, False)

        # ---- مفتاح الاهتزاز ----
        vib = pg.locator('button:has-text("اهتزاز عند الإجابة")')
        assert await vib.count() == 1, "مفتاح الاهتزاز مفقود"
        p0 = await vib.get_attribute("aria-pressed")
        await vib.click()
        await pg.wait_for_timeout(300)
        p1 = await vib.get_attribute("aria-pressed")
        await vib.click()
        await pg.wait_for_timeout(200)
        p2 = await vib.get_attribute("aria-pressed")
        print("HAPTICS toggle:", p0, "->", p1, "->", p2)
        assert p0 == "true" and p1 == "false" and p2 == "true"

        # ---- مشاركة التطبيق ----
        await pg.click('button:has-text("شارك التطبيق مع زملائك")')
        await pg.wait_for_timeout(800)
        print("SHARE-APP: نقر بلا انهيار")

        # ---- حجم الخط: لا انحدار ----
        assert "حجم الخط" in await pg.inner_text("body")
        await pg.click('button:has-text("كبير")')
        await pg.wait_for_timeout(300)
        fs = await pg.evaluate("document.documentElement.style.fontSize")
        await pg.click('button:has-text("عادي")')
        print("FONT-SIZE regression:", repr(fs))
        assert fs == "17.5px"

        # ---- أخطائي: شرائح التصفية حسب المحور ----
        await pg.click('nav button[aria-label="أخطائي"]')
        await pg.wait_for_timeout(1000)
        body = await pg.inner_text("body")
        assert "الكل" in body, "شريحة الكل مفقودة"
        for s in ["نمو الطلاب", "المشاعر والذكاء", "التقويم"]:
            assert s in body, f"شريحة المحور مفقودة: {s}"
        all_count = body.count("— المفهوم")
        # صفّي على محور واحد ثم أعد العد
        await pg.click('button:has-text("التقويم")')
        await pg.wait_for_timeout(600)
        filtered = (await pg.inner_text("body")).count("— المفهوم")
        await pg.screenshot(path=f"{SHOTS}/w35_mistakes_filter.png", full_page=True)
        await pg.click('button:has-text("الكل")')
        await pg.wait_for_timeout(400)
        back = (await pg.inner_text("body")).count("— المفهوم")
        print(f"MISTAKES-FILTER: all={all_count} m4={filtered} back={back}")
        assert filtered < all_count and back == all_count

        # ---- مشاركة مفهوم من أخطائي ----
        await pg.click('button[aria-label="شارك المفهوم"]')
        await pg.wait_for_timeout(800)
        print("SHARE-CONCEPT: نقر بلا انهيار")

        # ---- مشاركة مفهوم من المكتبة (عبر البحث الذي يفتح التفاصيل مباشرة) ----
        await pg.click('nav button[aria-label="المكتبة"]')
        await pg.wait_for_timeout(1000)
        await pg.fill('input[placeholder="ابحث عن مفهوم..."]', "الوراثة")
        await pg.wait_for_timeout(1000)
        body = await pg.inner_text("body")
        assert "نتائج البحث" in body, "نتائج البحث لم تظهر"
        opened = await pg.evaluate(
            """() => {
              const b = [...document.querySelectorAll('button')].find(x =>
                x.innerText.includes('الوراثة وقوانينها'));
              if (b) { b.click(); return true; }
              return false;
            }"""
        )
        assert opened, "صف النتيجة غير موجود"
        await pg.wait_for_timeout(1000)
        assert "الشرح" in await pg.inner_text("body"), "نافذة المفهوم لم تفتح"
        await pg.click('button[aria-label="شارك المفهوم"]')
        await pg.wait_for_timeout(700)
        print("SHARE-LIBRARY: نقر بلا انهيار")

        # إغلاق نافذة المفهوم — إنها ثابتة فوق كل الصفحة وتحجب شريط التنقل
        await pg.click('button[aria-label="إغلاق"]')
        await pg.wait_for_timeout(600)

        # ---- لا انحدار: جلسة تعمل ----
        await pg.click('nav button[aria-label="الرئيسية"]')
        await pg.wait_for_timeout(800)
        await pg.click('button[aria-label="ابدأ الاختبار"]')
        await pg.wait_for_timeout(1800)
        assert "استمع إلى السؤال" in await pg.content()
        print("SESSION regression: OK")

        await b.close()
        print("ALL-OK")

asyncio.run(main())
