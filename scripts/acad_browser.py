# -*- coding: utf-8 -*-
"""فحص متصفحي للعرض الأكاديمي: المضمون العلمي + الشواهد وسياقاتها + التعليل المقسم + نظافة النصوص."""
import asyncio, re, sys
from playwright.async_api import async_playwright

BASE = 'http://localhost:3000'
CJK = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]')

async def main():
    ok, fail = [], []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 390, 'height': 844})
        page = await ctx.new_page()
        try:
            await page.goto(BASE, wait_until='networkidle', timeout=45000)
            await page.add_style_tag(content="nextjs-portal{display:none!important}")
            await page.wait_for_timeout(800)
            body = await page.inner_text('body')
            if 'سارة' in body or 'لنبدأ الرحلة' in body:
                b = page.get_by_text('لنبدأ الرحلة')
                if await b.count():
                    await b.first.click(); await page.wait_for_timeout(600)

            # ١) دليل المعلم ← محور ← موضوع ← مفهوم
            await page.get_by_text('دليل المعلم', exact=True).first.click()
            await page.wait_for_timeout(900)
            # بطاقة المحور الأولى (زر card-soft فيه اسم محور)
            course_btns = page.locator('button.card-soft')
            n = await course_btns.count()
            await course_btns.nth(0).click(); await page.wait_for_timeout(800)
            chapter_btns = page.locator('button.card-soft')
            if await chapter_btns.count() > 0:
                await chapter_btns.nth(0).click(); await page.wait_for_timeout(800)
            concept_btns = page.locator('button.card-soft')
            if await concept_btns.count() > 0:
                await concept_btns.nth(0).click(); await page.wait_for_timeout(1000)
            body = await page.inner_text('body')
            checks = {
                'عنوان المضمون العلمي': 'المضمون العلمي' in body,
                'عنوان الشواهد التطبيقية': 'الشواهد التطبيقية من الميدان' in body,
                'شارة السياق تظهر': 'سياق:' in body,
                'بلا CJK في شاشة المفهوم': not CJK.search(body),
            }
            for k, v in checks.items():
                (ok if v else fail).append(('شاشة المفهوم: ' + k) if v else ('شاشة المفهوم: ' + k))
            ctx_n = body.count('سياق:')
            ok.append(f'عدد شارات السياق: {ctx_n}')
            await page.screenshot(path='/home/z/my-project/scripts/acad_concept.png')

            # إغلاق التفاصيل
            close = page.locator('button[aria-label="إغلاق"]').first
            if await close.count():
                await close.click(); await page.wait_for_timeout(600)

            # ٢) جلسة أسئلة سريعة
            await page.get_by_text('الاختبارات', exact=True).first.click()
            await page.wait_for_timeout(900)
            btn = page.get_by_text('الاختبار السريع').first
            if await btn.count():
                await btn.click(); await page.wait_for_timeout(900)
                start = page.get_by_text('ابدأ').first
                if await start.count():
                    await start.click(); await page.wait_for_timeout(900)
                # أجب ١٥ محاولة لالتقاط لوحة التعليل
                for i in range(15):
                    body_q = await page.inner_text('body')
                    if 'أساس الصواب' in body_q and i >= 1:
                        break
                    opts = page.locator('button').filter(has_text=re.compile(r'^[أ-ي].{3,}$'))
                    cnt = await opts.count()
                    if cnt >= 2:
                        await opts.nth(i % cnt).click()
                        await page.wait_for_timeout(700)
                        nxt = page.get_by_text('تالٍ', exact=False).first
                        if await nxt.count():
                            await nxt.click(); await page.wait_for_timeout(800)
                    else:
                        break
                body_q = await page.inner_text('body')
                checks2 = {
                    'لوحة أساس الصواب': 'أساس الصواب' in body_q,
                    'بلا CJK في الجلسة': not CJK.search(body_q),
                }
                for k, v in checks2.items():
                    (ok if v else fail).append(('جلسة الأسئلة: ' + k) if v else ('جلسة الأسئلة: ' + k))
                ok.append('لوحة موقف البدائل ظاهرة' if 'موقف البدائل' in body_q else 'لا شق بدائل في هذه الأسئلة (مقبول)')
                await page.screenshot(path='/home/z/my-project/scripts/acad_reason.png')
        except Exception as e:
            fail.append(f'استثناء: {e}')
        finally:
            await browser.close()
    print('=== النجاح ===')
    for s in ok: print(' ✓', s)
    print('=== الفشل ===')
    for s in fail: print(' ✗', s)
    sys.exit(1 if any('✗' in s for s in fail) or fail else 0)

asyncio.run(main())
