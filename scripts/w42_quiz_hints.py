# فحص أدلة الأسئلة في خريطة الكفاءات: أخطاء بمفاهيم مرتبطة بكفاءة تظهر كدليل نصي — وبلا أرقام
import asyncio
import json
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"

# حقن محاولات أسئلة: مفهوم C077 آخر إجابته خاطئة (كفاءة تحفيز المشاركة)،
# ومفهوم C100 آخر إجابته صحيحة (كفاءة بناء التقويم)، ومفهوم C281 خاطئ (بناء التقويم أيضاً)
QB = json.load(open("/home/z/my-project/src/data/qbank.json"))
def qid_of(cid):
    return next(q["id"] for q in QB["questions"] if q["conceptId"] == cid and q["type"] == "mcq")

WRONG_C = ["C077", "C281"]
GOOD_C = ["C100"]
seed = {"state": {"name": "سارة", "onboarded": True, "attempts": {}}, "version": 2}
# ترتيب: نجعل آخر محاولة لكل سؤال هي المطلوبة (تسلسل زمني حتمي غير مهم لأن Record يخزن آخر Attempt واحد لكل سؤال)
for i, cid in enumerate(WRONG_C):
    seed["state"]["attempts"][qid_of(cid)] = {"qid": qid_of(cid), "correct": False, "box": 1, "ts": 1750000000000 + i}
for i, cid in enumerate(GOOD_C):
    seed["state"]["attempts"][qid_of(cid)] = {"qid": qid_of(cid), "correct": True, "box": 3, "ts": 1750000001000 + i}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844})
        await ctx.add_init_script(f"localStorage.setItem('turbawy-app-v1', {json.dumps(json.dumps(seed, ensure_ascii=False))})")
        pg = await ctx.new_page()
        await pg.goto(BASE, wait_until="networkidle")
        await pg.add_style_tag(content="nextjs-portal{display:none!important}")
        await pg.wait_for_timeout(1500)
        await pg.click('nav button[aria-label="تدريب"]')
        await pg.wait_for_timeout(800)
        await pg.click('button:has-text("الخريطة")')
        await pg.wait_for_timeout(600)
        body = await pg.inner_text("body")
        assert "في اختباراتك ظهرت أخطاء بأسئلة مفاهيم تخدم هذه الكفاءة" in body, "دليل أخطاء الأسئلة غائب"
        assert "الدافعية الداخلية والخارجية" in body, "عنوان المفهوم الخاطئ غائب بالدليل"
        assert "أسئلة مفاهيم المكتبة المرتبطة بهذه الكفاءة تجيب عنها بدقة" in body, "دليل الدقة غائب"
        print("QUIZ-HINTS: أدلة الأسئلة تظهر بالخريطة — أخطاء وعناوين مفاهيمها ودقة الإتقان ✓")
        import re
        leak = re.findall(r"[0-9\u0660-\u0669A-Za-z]+", body)
        assert not leak, f"تسريب نصي: {leak[:5]}"
        print("TEXT-CLEAN: الخريطة بلا أرقام ولا لاتيني مع الأدلة الجديدة ✓")
        await pg.screenshot(path="/home/z/my-project/scripts/w42_quiz_hints.png")
        await b.close()
        print("ALL-OK")

asyncio.run(main())
