# تشخيص: ماذا تعرض بطاقة ملف الإنجاز في حسابي؟
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

        # أضف زيارة ميدانية وخططاً مباشرة في المخزن
        await pg.evaluate("""
          const st = JSON.parse(localStorage.getItem('turbawy-app-v1'));
          st.state.fieldVisits = [{ id:'FV1', ts: Date.now(), kind:'teach', school:'مدرسة النور',
            grade:'الخامس', subject:'العلوم', supervisor:'', topic:'دورة الماء', size:'',
            observed:['إدارة الصف والانتقالات'], happened:'جرى شيء', learned:'تعلمت أ',
            good:'جيد', improve:'تحسين', wouldDo:'سأفعل', rating:'حصة جيدة' }];
          st.state.lessonPlans = [{ id:'LP1', ts: Date.now(), subject:'العلوم', grade:'السادس',
            topic:'الانحلال الضوئي', duration:'حصة كاملة',
            objectives:'يصوغ الطالب تعريف المفهوم بكلماته', prior:'س', materials:'م',
            strategies:['المناقشة والحوار'],
            phases:{open:'س',present:'ص',practice:'ع',assess:'ق',close:'غ'},
            keyQuestions:'س', homework:'و', differentiation:'ف' }];
          st.version = 4;
          localStorage.setItem('turbawy-app-v1', JSON.stringify(st));
        """)
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(1500)

        await pg.click('button[aria-label="حسابي"]')
        await pg.wait_for_timeout(1000)
        body = await pg.inner_text("body")
        start = body.find("ملف إنجازك المهني")
        print("=== مقطع بطاقة ملف الإنجاز ===")
        print(body[start:start+700] if start != -1 else "البطاقة غائبة كلياً!")
        await b.close()
        await ctx.close()

asyncio.run(main())
