// اختبار ملاحظاتي — مسار دقيق: فصل ← مفهوم
import { chromium } from "playwright";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  if ((await p.textContent("body")).includes("ما اسمك")) {
    await p.locator("input").first().fill("مجرب");
    await p.locator("button:has-text('لنبدأ الرحلة')").first().click();
    await p.waitForTimeout(1500);
  }
  await p.locator("nav button").nth(1).click();
  await p.waitForTimeout(1000);
  // بحث مباشر عن مفهوم معروف
  await p.locator("input[placeholder*='بحث']").first().fill("الصدق");
  await p.waitForTimeout(1200);
  // فتح أول نتيجة بحث
  await p.locator("main button").filter({ hasText: "الصدق" }).first().click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: "/home/z/my-project/scripts/s5_chapter.png" });
  // أول مفهوم في الفصل — ننقر بطاقة نصها طويل نسبيًا
  const btns = p.locator("main button");
  const count = await btns.count();
  let clicked = false;
  for (let i = 0; i < count; i++) {
    const txt = (await btns.nth(i).textContent()) ?? "";
    if (txt.length > 30) {
      await btns.nth(i).click();
      clicked = true;
      await p.waitForTimeout(1000);
      break;
    }
  }
  const t = await p.textContent("body");
  console.log(
    t.includes("ملاحظاتي على هذا المفهوم")
      ? "PASS — قسم ملاحظاتي ظاهر في تفاصيل المفهوم"
      : `FAIL — (${clicked}) مقتطف: ` + t.slice(150, 400)
  );
  const ta = p.locator("textarea").first();
  if (await ta.isVisible().catch(() => false)) {
    await ta.fill("هذه ملاحظة تجريبية للاختبار");
    await p.locator("button:has-text('احفظ الملاحظة')").first().click();
    await p.waitForTimeout(500);
    const t2 = await p.textContent("body");
    console.log(
      t2.includes("هذه ملاحظة تجريبية للاختبار") ? "PASS — حفظ الملاحظة يعمل" : "FAIL — حفظ الملاحظة"
    );
  }
  await p.screenshot({ path: "/home/z/my-project/scripts/s6_detail.png" });
  await b.close();
})();
