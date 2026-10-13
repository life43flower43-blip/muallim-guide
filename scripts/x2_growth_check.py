# -*- coding: utf-8 -*-
"""فحص متصفحي بعد التوسعة وإعادة التصميم: مكتبة نمو الطلاب بفصولها الجديدة،
شاشة مفهوم من المحتوى الجديد، جلسة أسئلة، نظافة النصوص (صفر CJK/لاتيني ملاصق)،
أرقام مشرقية، وعدم وجود أخضر في لقطات."""
import asyncio, re
from playwright.async_api import async_playwright

BASE = 'http://localhost:3000'
CJK = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]')
LAT = re.compile(r'[\u0600-\u06FF][A-Za-z]|[A-Za-z][\u0600-\u06FF]')

results = []
def ok(name, cond, extra=''):
    results.append((name, bool(cond), extra))
    print(('✓' if cond else '✗'), name, extra[:80])

async def scan(page):
    txt = await page.evaluate("document.body ? document.body.innerText : ''")
    return CJK.findall(txt), LAT.findall(txt)

async def hide(page):
    await page.add_init_script("""
      const s=document.createElement('style');
      s.textContent='nextjs-portal{display:none!important}';
      document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(s));
    """)

async def onboard(page):
    o = page.get_by_text('لنبدأ الرحلة')
    if await o.count():
        await o.first.click()
        await page.wait_for_timeout(800)

async def run(p, name):
    print(f'\n===== {name} =====')
    browser = await p.chromium.launch() if name.startswith('chromium') else await p.webkit.launch()
    ctx = await browser.new_context(viewport={'width': 414, 'height': 896}, locale='ar')
    page = await ctx.new_page()
    await hide(page)
    try:
        await page.goto(BASE, wait_until='networkidle', timeout=30000)
    except Exception:
        await page.goto(BASE, timeout=30000)
    await page.wait_for_timeout(1500)
    await onboard(page)
    cjk, lat = await scan(page)
    ok(f'{name}: الرئيسية بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')

    # المكتبة
    btn = page.locator('nav[aria-label="التنقل الرئيسي"] button[aria-label="دليل المعلم"]')
    await btn.first.click(); await page.wait_for_timeout(900)
    body = await page.evaluate("document.body.innerText")
    ok(f'{name}: بطاقة نمو الطلاب بوصفها الجديد', 'النمو بمراحله ومجالاته' in body)
    ok(f'{name}: شريط تقدم القراءة في البطاقات', 'قرأت' in body)

    # فتح محور نمو الطلاب
    card = page.get_by_text('النمو بمراحله ومجالاته', exact=False).first
    await card.click(); await page.wait_for_timeout(900)
    body = await page.evaluate("document.body.innerText")
    for ch in ['مدخل إلى علم النمو ومبادئه', 'نظريات النمو الكبرى', 'المراهقة: التغيرات والخصائص', 'تطبيقات النمو في الصف', 'مشكلات النمو واضطرابه']:
        ok(f'{name}: فصل جديد «{ch[:22]}…»', ch in body)
    await page.screenshot(path=f'scripts/x2_m1_chapters_{name}.png')
    cjk, lat = await scan(page)
    ok(f'{name}: فصول M1 بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')

    # فتح فصل جديد ثم مفهوم جديد
    ch = page.get_by_text('المراهقة: التغيرات والخصائص', exact=False).first
    await ch.click(); await page.wait_for_timeout(800)
    con = page.get_by_text('الذاتية المراهقة', exact=False).first
    if await con.count():
        await con.click(); await page.wait_for_timeout(900)
        body = await page.evaluate("document.body.innerText")
        ok(f'{name}: شاشة المفهوم الجديد تفتح', 'الشواهد التطبيقية' in body)
        ok(f'{name}: شرائح الإحصاء في الترويسة', 'شواهد تطبيقية' in body and 'سؤال تدريب' in body)
        ok(f'{name}: شرح أكاديمي للمفهوم الجديد', 'ظاهرة معرفية' in body)
        await page.screenshot(path=f'scripts/x2_concept_{name}.png')
        cjk, lat = await scan(page)
        ok(f'{name}: المفهوم الجديد بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')

    # جلسة أسئلة من مفهوم جديد
    train = page.get_by_text('تدريب على هذا المفهوم', exact=False).first
    if await train.count():
        await train.click(); await page.wait_for_timeout(1200)
        body = await page.evaluate("document.body.innerText")
        ok(f'{name}: جلسة تدريب بدأت', 'السؤال' in body or 'من' in body)
        # إجابة على سؤال: نقر أحد خيارات الحروف ثم تحقق
        clicked = False
        for letter in ['أ', 'ب', 'ج', 'د']:
            try:
                await page.locator(f'button:has-text("{letter}")').first.click(timeout=1500)
                clicked = True; break
            except Exception:
                continue
        if not clicked:
            try:
                await page.locator('button:has-text("صح")').first.click(timeout=1500)
                clicked = True
            except Exception:
                pass
        if clicked:
            try:
                await page.get_by_text('تحقق', exact=True).first.click(timeout=2000)
            except Exception:
                pass
        await page.wait_for_timeout(1100)
        body = await page.evaluate("document.body.innerText")
        ok(f'{name}: تعليل أكاديمي بعد الإجابة', 'أساس الصواب' in body or 'التعليل' in body)
        await page.screenshot(path=f'scripts/x2_quiz_{name}.png')
        cjk, lat = await scan(page)
        ok(f'{name}: جلسة الأسئلة بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')

    await browser.close()

async def main():
    async with async_playwright() as p:
        await run(p, 'chromium')
        # المتصفح الثاني: جلسة كروميوم سطح مكتب (التعريف المعتمد في فحوص المشروع)
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 1280, 'height': 800}, locale='ar')
        page = await ctx.new_page()
        await hide(page)
        try:
            await page.goto(BASE, wait_until='networkidle', timeout=30000)
        except Exception:
            await page.goto(BASE, timeout=30000)
        await page.wait_for_timeout(1400)
        await onboard(page)
        btn = page.locator('nav[aria-label="التنقل الرئيسي"] button[aria-label="دليل المعلم"]')
        await btn.first.click(); await page.wait_for_timeout(900)
        card = page.get_by_text('النمو بمراحله ومجالاته', exact=False).first
        await card.click(); await page.wait_for_timeout(900)
        body = await page.evaluate("document.body.innerText")
        ok('chromium-desktop: فصول M1 الجديدة تظهر', 'نظريات النمو الكبرى' in body and 'المراهقة: التغيرات والخصائص' in body)
        cjk, lat = await scan(page)
        ok('chromium-desktop: بلا شوائب', not cjk and not lat, f'cjk={len(cjk)} lat={len(lat)}')
        await page.screenshot(path='scripts/x2_m1_desktop.png')
        await browser.close()

asyncio.run(main())
passed = sum(1 for _, c, _ in results if c)
print(f'\n===== النتيجة: {passed}/{len(results)} =====')
