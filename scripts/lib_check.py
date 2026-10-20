#!/usr/bin/env python3
# فحص المكتبة: ظهور مسار الذكاء الاصطناعي وفصوله — بنقرات قسرية وتمرير
from playwright.sync_api import sync_playwright
import re

def pr(*a):
    print(*a, flush=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 420, "height": 900})
    pg = ctx.new_page()
    pg.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(2000)

    if "ما اسمك" in pg.inner_text("body"):
        pg.get_by_placeholder(re.compile(".")).first.fill("م")
        pg.get_by_text("لنبدأ الرحلة").first.click()
        pg.wait_for_timeout(2000)
        pg.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(2000)

    # انتقل للمكتبة عبر الشريط السفلي — نقرة قسرية على الزر بالاسم
    nav = pg.get_by_role("button", name=re.compile("دليل المعلم"))
    pr("عدد أزرار «دليل المعلم»:", nav.count())
    nav.last.click(force=True)
    pg.wait_for_timeout(2500)

    body = pg.inner_text("body")
    pr("المكتبة فيها بطاقة «الذكاء الاصطناعي» (الاسم المختصر):", "الذكاء الاصطناعي" in body)
    pr("المكتبة فيها «المهارات»:", "المهارات" in body)

    # مرر إلى الأسفل خطوة إن لم يظهر المسار الجديد
    if "الذكاء الاصطناعي" not in body:
        pg.mouse.wheel(0, 2000)
        pg.wait_for_timeout(1200)
        body = pg.inner_text("body")
        pr("بعد التمرير — ظهر المسار؟", "الذكاء الاصطناعي" in body)

    pg.screenshot(path="scripts/smoke_library.png")
    ok_found = "الذكاء الاصطناعي" in pg.inner_text("body")
    if ok_found:
        pg.get_by_text("الذكاء الاصطناعي").first.click(force=True)
        pg.wait_for_timeout(2200)
        det = pg.inner_text("body")
        pr("فصل «تطور الذكاء الاصطناعي» ظاهر:", "تطور الذكاء الاصطناعي" in det)
        pr("مفهوم «مفهوم الذكاء الاصطناعي ومجالاته» ظاهر:", "مفهوم الذكاء الاصطناعي ومجالاته" in det)
        pg.screenshot(path="scripts/smoke_ai_course.png")
        pg.get_by_text("مفهوم الذكاء الاصطناعي ومجالاته").first.click(force=True)
        pg.wait_for_timeout(2000)
        pg.screenshot(path="scripts/smoke_ai_concept.png")
        conc = pg.inner_text("body")
        pr("شرح المفهوم ظاهر:", "علوم الحاسوب" in conc)
    b.close()
pr("انتهى الفحص")
