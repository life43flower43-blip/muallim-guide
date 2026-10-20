#!/usr/bin/env python3
# فحص تجربة المستخدم متعدد الشاشات — يشغّل الخادم الإنتاجي بنفسه داخل الجلسة ثم يفحص
# النتائج إلى scripts/audit_out/ux_findings.md — تحليل فقط، لا تعديل
import asyncio, json, os, re, subprocess, time
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
OUT = "/home/z/my-project/scripts/audit_out"
os.makedirs(OUT, exist_ok=True)
VIEWPORTS = [(320, 568, "هاتف صغير"), (360, 740, "أندرويد متوسط"), (375, 667, "آيفون SE"),
             (414, 896, "آيفون بلس"), (768, 1024, "لوحي"), (1440, 900, "سطح مكتب")]

R = {"viewports": {}, "flows": [], "pwa": {}, "perf": {}, "console_all": [], "visible_latin": []}

def log(msg):
    print(msg, flush=True)

async def overflow_and_stats(page, W):
    stats = await page.evaluate("""(W) => {
        const doc = document.documentElement;
        const over = [];
        document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > W + 1 && r.left < W) {
                const cs = getComputedStyle(el);
                if (cs.position !== 'fixed' || r.right > W + 40) {
                    over.push({tag: el.tagName, cls: (el.className && el.className.baseVal !== undefined ? '' : String(el.className)).slice(0, 60), right: Math.round(r.right), text: (el.textContent || '').trim().slice(0, 30)});
                }
            }
        });
        let smallFont = 0;
        document.querySelectorAll('body *').forEach(el => {
            if (el.children.length === 0 && (el.textContent || '').trim().length > 2) {
                const fs = parseFloat(getComputedStyle(el).fontSize);
                if (fs < 12) smallFont++;
            }
        });
        let tinyTouch = 0;
        document.querySelectorAll('button, a, [role="button"]').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && r.height < 40 && (el.textContent || '').trim()) tinyTouch++;
        });
        const latin = (document.body.innerText || '').match(/[A-Za-z]{2,}/g) || [];
        const cjk = (document.body.innerText || '').match(/[\\u4e00-\\u9fff\\u3040-\\u30ff]/g) || [];
        return {scrollW: doc.scrollWidth, innerW: window.innerWidth, over: over.slice(0, 8), overCount: over.length, smallFont, tinyTouch, latin: [...new Set(latin)].slice(0, 10), cjkCount: cjk.length};
    }""", W)
    return stats

async def main():
    env = dict(os.environ, PORT="3000", HOSTNAME="127.0.0.1", NODE_ENV="production")
    proc = subprocess.Popen(["node", ".next/standalone/server.js"], cwd="/home/z/my-project",
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
    try:
        for _ in range(40):
            try:
                r = await asyncio.get_event_loop().run_in_executor(None, lambda: __import__("urllib.request", fromlist=["x"]).request.urlopen(f"{BASE}", timeout=2))
                if r.status == 200:
                    break
            except Exception:
                time.sleep(1)
        log("server ready")
        async with async_playwright() as pw:
            browser = await pw.chromium.launch()
            ctx = await browser.new_context(viewport={"width": 414, "height": 896}, locale="ar")
            page = await ctx.new_page()
            console_msgs = []
            page.on("console", lambda m: console_msgs.append(f"{m.type}: {m.text[:150]}") if m.type in ("error", "warning") else None)
            page.on("pageerror", lambda e: console_msgs.append(f"pageerror: {str(e)[:200]}"))
            page.on("requestfailed", lambda r: console_msgs.append(f"reqfail: {r.url[:120]}"))
            await page.goto(BASE, wait_until="networkidle", timeout=60000)
            await page.wait_for_timeout(1500)

            # أداء تحميل البنك (جلب مباشر مقيس داخل الصفحة)
            info = await page.evaluate("""async () => {
                const t0 = performance.now();
                const r = await fetch('/data/qbank.json', {cache: 'no-store'});
                const buf = await r.arrayBuffer();
                return {bytes: buf.byteLength, ms: Math.round(performance.now() - t0), enc: r.headers.get('content-encoding') || 'بلا ضغط'};
            }""")
            R["perf"]["qbank"] = info

            # PWA
            R["pwa"] = await page.evaluate("""async () => {
                const out = {};
                out.manifestLink = !!document.querySelector('link[rel="manifest"]');
                out.viewportMeta = document.querySelector('meta[name="viewport"]')?.content || '';
                try {
                    const m = await fetch('/manifest.json').then(r => r.json());
                    out.manifestName = m.name; out.dir = m.dir; out.lang = m.lang; out.display = m.display;
                    out.icons = (m.icons || []).map(i => i.src);
                    out.iconsOk = [];
                    for (const src of out.icons) {
                        try { const rr = await fetch(src); out.iconsOk.push(src + ':' + rr.status); } catch (e) { out.iconsOk.push(src + ':ERR'); }
                    }
                } catch (e) { out.manifestErr = String(e); }
                try { const s = await fetch('/sw.js'); out.swStatus = s.status; } catch (e) { out.swStatus = 'ERR'; }
                return out;
            }""")

            # تدفقات: المختبر الجديد والمحاكاة والمكتبة والأخطاء والحساب
            async def flow(name, fn):
                try:
                    await fn(page)
                    R["flows"].append({"name": name, "ok": True})
                    log(f"flow OK: {name}")
                except Exception as e:
                    R["flows"].append({"name": name, "ok": False, "err": str(e)[:200]})
                    log(f"flow FAIL: {name}: {str(e)[:120]}")

            def card(txt):
                async def f(p):
                    el = p.locator(f"text={txt}").first
                    await el.wait_for(state="visible", timeout=15000)
                    await el.click()
                    await p.wait_for_timeout(1200)
                return f

            async def go_home(p):
                await p.goto(BASE, wait_until="domcontentloaded")
                await p.wait_for_timeout(1500)

            async def onboard(p):
                await p.goto(BASE, wait_until="networkidle")
                await p.wait_for_timeout(2500)
                for txt in ("سارة", "لنبدأ الرحلة"):
                    try:
                        el = p.get_by_text(txt).first
                        if await el.is_visible(timeout=1500):
                            await el.click()
                            await p.wait_for_timeout(700)
                    except Exception:
                        pass
                await p.wait_for_timeout(800)

            await onboard(page)
            await flow("الرئيسية تُحمّل", go_home)
            await flow("فتح مختبر محاكاة الصفوف", card("مختبر محاكاة الصفوف"))
            await go_home(page)
            await flow("فتح المحاكاة الموقوتة", card("محاكاة"))
            await go_home(page)
            await flow("فتح تحديد المستوى", card("المستوى"))
            await go_home(page)
            await flow("فتح دليل المعلم", card("دليل المعلم"))

            # قياس عميق: شاشة المختبر الجديد على أصغر هاتف
            try:
                pg = await ctx.new_page()
                await pg.set_viewport_size({"width": 320, "height": 568})
                await pg.goto(BASE, wait_until="domcontentloaded", timeout=45000)
                await pg.wait_for_timeout(2000)
                for txt in ("سارة", "لنبدأ الرحلة"):
                    try:
                        el = pg.get_by_text(txt).first
                        if await el.is_visible(timeout=800):
                            await el.click()
                            await pg.wait_for_timeout(500)
                    except Exception:
                        pass
                el = pg.locator("text=مختبر محاكاة الصفوف").first
                await el.click()
                await pg.wait_for_timeout(1500)
                st = await overflow_and_stats(pg, 320)
                R["viewports"]["مختبر 320px"] = {"W": 320, **st}
                log(f"مختبر 320px: over={st['overCount']} latin={st['latin'][:3]}")
                await pg.close()
            except Exception as e:
                R["viewports"]["مختبر 320px"] = {"err": str(e)[:150]}

            # قياسات العرض لكل قياس — بعد عبور الترحيب (نفس السياق يحمل localStorage)
            for W, H, label in VIEWPORTS:
                pg = await ctx.new_page()
                await pg.set_viewport_size({"width": W, "height": H})
                try:
                    await pg.goto(BASE, wait_until="domcontentloaded", timeout=45000)
                    await pg.wait_for_timeout(2500)
                    for txt in ("سارة", "لنبدأ الرحلة"):
                        try:
                            el = pg.get_by_text(txt).first
                            if await el.is_visible(timeout=800):
                                await el.click()
                                await pg.wait_for_timeout(500)
                        except Exception:
                            pass
                    st = await overflow_and_stats(pg, W)
                    R["viewports"][label] = {"W": W, "H": H, **st}
                    log(f"{label} {W}px: scrollW={st['scrollW']} over={st['overCount']} smallFont={st['smallFont']} tinyTouch={st['tinyTouch']} latin={st['latin'][:3]}")
                except Exception as e:
                    R["viewports"][label] = {"W": W, "err": str(e)[:150]}
                    log(f"{label} FAIL: {str(e)[:100]}")
                await pg.close()

            R["console_all"] = console_msgs[:40]
            await browser.close()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()

asyncio.run(main())

# تقرير
md = ["# نتائج فحص تجربة المستخدم متعدد الشاشات", ""]
md.append(f"**الأداء:** qbank.json = {R['perf'].get('qbank', {}).get('bytes', 0)/1048576:.1f} ميغابايت، ترميز الخادم: {R['perf'].get('qbank', {}).get('enc')}")
md.append(f"**PWA:** {json.dumps(R['pwa'], ensure_ascii=False)[:600]}")
md.append("")
md.append("## التدفقات")
for f in R["flows"]:
    md.append(f"- {'✔' if f['ok'] else '✘'} {f['name']}" + ("" if f["ok"] else f" — {f.get('err', '')}"))
md.append("")
md.append("## القياسات")
for label, st in R["viewports"].items():
    if "err" in st:
        md.append(f"- {label}: خطأ — {st['err']}")
    else:
        flag = "⚠ تجاوز أفقي" if st["scrollW"] > st.get("innerW", st["W"]) + 1 else "سليم"
        md.append(f"- {label} ({st['W']}px): {flag} — عناصر فائضة: {st['overCount']}، خطوط <12px: {st['smallFont']}، أهداف لمس <40px: {st['tinyTouch']}، لاتيني ظاهر: {st['latin'][:5]}، CJK: {st['cjkCount']}")
        for o in st.get("over", []):
            md.append(f"    - فائض: <{o['tag']}> يمين={o['right']} «{o['text']}» cls={o['cls'][:50]}")
md.append("")
md.append("## كونسول (أخطاء/تحذيرات)")
md.extend(f"- {m}" for m in R["console_all"][:30] or ["- لا شيء"])
open(f"{OUT}/ux_findings.md", "w", encoding="utf-8").write("\n".join(md))
json.dump(R, open(f"{OUT}/ux_findings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("DONE")
