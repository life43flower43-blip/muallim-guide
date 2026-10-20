#!/usr/bin/env python3
# فحص تدريب فعلي على أسئلة مسار الذكاء الاصطناعي: إجابة + تغذية راجعة
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

    pg.get_by_role("button", name=re.compile("دليل المعلم")).last.click(force=True)
    pg.wait_for_timeout(2000)
    pg.get_by_text("الذكاء الاصطناعي").first.click(force=True)
    pg.wait_for_timeout(1800)
    pg.get_by_text("تطور الذكاء الاصطناعي").first.click(force=True)
    pg.wait_for_timeout(1500)
    pg.get_by_text("مفهوم الذكاء الاصطناعي ومجالاته").first.click(force=True)
    pg.wait_for_timeout(1800)
    # زر التدريب أسفل الشاشة — بالدور والنمط
    pg.screenshot(path="scripts/dbg_before_train.png")
    btn = pg.get_by_text(re.compile("تدريب على هذا المفهوم"))
    pr("أزرار التدريب الموجودة:", btn.count())
    btn.first.click(force=True)
    pg.wait_for_timeout(2500)
    t = pg.inner_text("body")
    pr("وصلنا لجلسة التدريب:", ("سمعت في ورشة تربوية" in t) or ("الذكاء الاصطناعي" in t))
    # أجب عن أي سؤال mcq ظاهر: أول خيار ثم «تحقق» ثم تأكد من التغذية الراجعة
    opts = pg.locator(".opt-btn")
    pr("عدد الخيارات الظاهرة:", opts.count())
    if opts.count():
        opts.first.click(force=True)
        pg.wait_for_timeout(800)
        grade = pg.get_by_text(re.compile("تحقق|تصحيح"))
        pr("زر التحقق موجود:", grade.count() > 0)
        grade.first.click(force=True)
        pg.wait_for_timeout(1800)
        t = pg.inner_text("body")
        pr("ظهرت التغذية الراجعة بعد الإجابة:",
           ("أحسنت" in t) or ("صحيح" in t) or ("الإجابة الصحيحة" in t) or ("لماذا" in t) or ("السبب" in t))
    pg.screenshot(path="scripts/smoke_ai_quiz.png")
    b.close()
pr("انتهى فحص التدريب")
