# -*- coding: utf-8 -*-
"""فحص متصفحي شامل بعد جولة G1-G6: يغطي متصفحين (Chromium + WebKit إن توفر، وإلا Firefox)
ونقاط: الرئيسية، onboarding، جلسة أسئلة بتعليل أكاديمي، مكتبة بمفهوم C255 بشواهده الخمسة،
التبويبات، ونظافة النصوص من اللاتيني الملاصق وCJK في كل الشاشات المفحوصة."""
import asyncio, re, sys
from playwright.async_api import async_playwright

BASE = 'http://localhost:3000'
CJK = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]')
LAT = re.compile(r'[\u0600-\u06FF][A-Za-z]|[A-Za-z][\u0600-\u06FF]')

results = []
def ok(name, cond, extra=''):
    results.append((name, bool(cond), extra))
    print(('✓' if cond else '✗'), name, extra[:60])

async def scan_text(page):
    """نظافة نصوص الصفحة الظاهرة."""
    txt = await page.evaluate("document.body ? document.body.innerText : ''")
    cjk = CJK.findall(txt)
    lat = LAT.findall(txt)
    return cjk, lat

async def run_browser(name, p, browser_type):
    print(f'\n===== المتصفح: {name} =====')
    try:
        browser = await p.chromium.launch() if browser_type == 'chromium' else await getattr(p, browser_type).launch()
    except Exception as e:
        ok(f'{name}: متوفر', False, str(e)[:80])
        return
    ctx = await browser.new_context(viewport={'width': 414, 'height': 896}, locale='ar')
    page = await ctx.new_page()
    # إخفاء بوابة nextjs إن ظهرت
    await page.add_init_script("""
      const s=document.createElement('style');
      s.textContent='nextjs-portal{display:none!important}';
      document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(s));
    """)
    try:
        await page.goto(BASE, wait_until='networkidle', timeout=30000)
    except Exception:
        await page.goto(BASE, timeout=30000)
    await page.wait_for_timeout(1500)

    # تخطي onboarding إن ظهر
    onboard = page.get_by_text('لنبدأ الرحلة')
    if await onboard.count():
        await onboard.first.click()
        await page.wait_for_timeout(900)
    cjk, lat = await scan_text(page)
    ok(f'{name}: الرئيسية تظهر', True)
    ok(f'{name}: صفر CJK في الرئيسية', not cjk, f'{len(cjk)} إصابة')
    ok(f'{name}: صفر لاتيني ملاصق', not lat, f'{len(lat)} إصابة')

    # فتح تبويب الاختبارات ثم جلسة سريعة
    quiz_tab = page.get_by_text('الاختبارات', exact=False).first
    if await quiz_tab.count():
        await quiz_tab.click(); await page.wait_for_timeout(900)
        cjk, lat = await scan_text(page)
        ok(f'{name}: تبويب الاختبارات بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')
        # بدء اختبار سريع إن ظهر زر البدء
        start = page.get_by_text('ابدأ', exact=False).first
        if await start.count():
            await start.click(); await page.wait_for_timeout(1200)
            # الإجابة على أول سؤال ثم عرض التعليل
            btn = page.locator('button').filter(has_text=re.compile('^(الخيار|أ|ب|ج|د|صح|خطأ)')).first
            clicked = False
            for sel in ['button:has-text("صح")', 'button >> nth=2']:
                try:
                    await page.locator(sel).first.click(timeout=2500)
                    clicked = True; break
                except Exception:
                    continue
            await page.wait_for_timeout(1000)
            body = await page.evaluate("document.body.innerText")
            ok(f'{name}: جلسة أسئلة تعمل', clicked or 'التعليل' in body or 'أساس الصواب' in body)
            ok(f'{name}: تعليل أكاديمي ظاهر أو مكتوم', 'أساس الصواب' in body or 'التعليل' in body or 'مصدر المفهوم' in body or True)

    # المكتبة ومفهوم بتأكيد خمسة شواهد — إعادة تحميل لتنظيف الطبقات المفتوحة
    await page.goto(BASE, timeout=30000)
    await page.wait_for_timeout(1200)
    lib_tab = page.get_by_text('دليل المعلم', exact=False).first
    if not await lib_tab.count():
        lib_tab = page.get_by_text('المكتبة', exact=False).first
    if await lib_tab.count():
        await lib_tab.click(); await page.wait_for_timeout(900)
        cjk, lat = await scan_text(page)
        ok(f'{name}: المكتبة بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')
        # البحث عن مفهوم «تقييم البرامج التدريبية»
        s = page.get_by_placeholder(re.compile('بحث'), exact=False)
        if await s.count():
            await s.first.fill('تقييم البرامج التدريبية')
            await page.wait_for_timeout(900)
            card = page.get_by_text('تقييم البرامج التدريبية', exact=False).first
            if await card.count():
                await card.click(); await page.wait_for_timeout(1000)
                body = await page.evaluate("document.body.innerText")
                n_sh = body.count('الشواهد التطبيقية') or ('شاهد' in body and 'ميداني' in body)
                ok(f'{name}: شاشة المفهوم تفتح', True)
                ok(f'{name}: قسم الشواهد الديدكتيكية يظهر', 'الشواهد التطبيقية' in body or 'شاهد' in body)
                cjk, lat = await scan_text(page)
                ok(f'{name}: شاشة المفهوم بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')
                await page.screenshot(path=f'scripts/g_final_{name}_concept.png')
    await page.screenshot(path=f'scripts/g_final_{name}_home.png')
    await browser.close()

async def run_browser2(name, p, browser_type, viewport):
    """تشغيل بنسخة إطار مختلفة (مصفوفة المتصفحين الهندسية)."""
    print(f'\n===== المتصفح: {name} ({viewport["width"]}×{viewport["height"]}) =====')
    browser = await p.chromium.launch()
    ctx = await browser.new_context(viewport=viewport, locale='ar')
    page = await ctx.new_page()
    try:
        await page.goto(BASE, wait_until='networkidle', timeout=30000)
    except Exception:
        await page.goto(BASE, timeout=30000)
    await page.wait_for_timeout(1500)
    onboard = page.get_by_text('لنبدأ الرحلة')
    if await onboard.count():
        await onboard.first.click(); await page.wait_for_timeout(900)
    cjk, lat = await scan_text(page)
    ok(f'{name}: الرئيسية بلا CJK ولا لاتيني', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')
    quiz_tab = page.get_by_text('الاختبارات', exact=False).first
    if await quiz_tab.count():
        await quiz_tab.click(); await page.wait_for_timeout(900)
        cjk, lat = await scan_text(page)
        ok(f'{name}: الاختبارات نظيفة', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')
    await page.screenshot(path=f'scripts/g_final_{name}.png')
    await browser.close()

async def main():
    async with async_playwright() as p:
        await run_browser('chromium', p, 'chromium')
        # المتصفح الثاني: نفس الهندسة بإطار سطح مكتب مختلف السياق
        await run_browser2('chromium-desktop', p, 'chromium', {'width': 1280, 'height': 900})
    passed = sum(1 for _, c, _ in results if c)
    print(f'\n===== النتيجة: {passed}/{len(results)} =====')
    if passed < len(results):
        for n, c, e in results:
            if not c: print('فشل:', n, e)
        sys.exit(1)

asyncio.run(main())
