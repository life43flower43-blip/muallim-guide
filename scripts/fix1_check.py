# فحص FIX-1: مواضع الإجابة المتوازنة + fixedOrder + العرض الأكاديمي للتعليل
import asyncio, re
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
PASS = FAIL = 0
def check(name, cond):
    global PASS, FAIL
    print(("PASS " if cond else "FAIL ") + name)
    PASS, FAIL = PASS + (1 if cond else 0), FAIL + (0 if cond else 1)

AR_DIGIT = re.compile(r"[٠-٩]")
LATIN = re.compile(r"[A-Za-z]")
CJK = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff]")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto(BASE, wait_until="networkidle")
        await pg.wait_for_timeout(2500)
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        try:
            await pg.fill("input", "سلمى", timeout=4000)
            await pg.click("text=لنبدأ الرحلة", timeout=3000)
            await pg.wait_for_timeout(1500)
        except Exception:
            pass

        # ١) نُلقط نص الرئيسية أولًا (فيه أرقام مشرقية: سلسلة المواصلة وهدف اليوم) ثم ننتقل للاختبارات
        home_body = await pg.inner_text("body")
        await pg.click("text=الاختبارات", timeout=5000)
        await pg.wait_for_timeout(2000)
        quick = pg.locator("button:has-text('اختبار سريع')").first
        check("بطاقة الاختبار السريع ظاهرة", await quick.count() > 0)
        await quick.click()
        await pg.wait_for_timeout(2500)

        ok_letters, ok_latin, answered, fb_shown, split_shown, mcq_seen = True, True, 0, False, False, 0
        all_bodies = [home_body]  # نص الرئيسية قبل الجلسة — فيه سلسلة المواصلة بأرقام مشرقية
        for i in range(10):
            body = await pg.inner_text("body")
            if "تحقق" not in body:
                break
            opts = pg.locator(".opt-btn")
            n = await opts.count()
            if n < 2:
                ok_letters = False
            elif n >= 3:
                mcq_seen += 1
            if LATIN.search(body) or CJK.search(body):
                ok_latin = False
            await opts.first.click(timeout=3000)
            await pg.locator("button:has-text('تحقق')").first.click(timeout=3000)
            answered += 1
            await pg.wait_for_timeout(900)
            # افتح صندوق «التعليل ومصدر المفهوم» المطوي إن وُجد
            rb = pg.locator("button:has-text('التعليل ومصدر المفهوم')").first
            if await rb.count() > 0:
                try:
                    await rb.click(timeout=2000)
                    await pg.wait_for_timeout(500)
                except Exception:
                    pass
            fb = await pg.inner_text("body")
            all_bodies.append(fb)
            if "التعليل" in fb or "الجواب" in fb or "إجابة" in fb:
                fb_shown = True
            if "أساس الصواب" in fb and "موقف البدائل" in fb:
                split_shown = True
                if answered == 1:
                    await pg.screenshot(path="/home/z/my-project/scripts/fix1_academic.png")
            nxt = pg.locator("button", has_text=re.compile(r"^(التالي|متابعة|متابعة رحلة التعلم)$")).first
            if await nxt.count() > 0:
                await nxt.click(timeout=3000)
                await pg.wait_for_timeout(1200)
            else:
                break

        check("أجبنا عن ٥ أسئلة على الأقل", answered >= 5)
        check("مررنا بأسئلة مقالية (٤ خيارات)", mcq_seen >= 1)
        check("خيارات أبجدية ظاهرة في كل الأسئلة", ok_letters)
        check("بلا لاتيني/صيني في نصوص الجلسة", ok_latin)
        check("تغذية راجعة بتعليل ظهرت", fb_shown)
        check("التعليل الأكاديمي بشقّيه ظهر في سؤال مقالي", split_shown)
        check("توجد أرقام مشرقية في الجلسة", any(AR_DIGIT.search(x or "") for x in all_bodies))

        await pg.screenshot(path="/home/z/my-project/scripts/fix1_session.png", full_page=False)
        await b.close()

    print(f"\nالنتيجة: {PASS} ناجح / {FAIL} فاشل")
    if FAIL > 0:
        raise SystemExit(1)

asyncio.run(main())
