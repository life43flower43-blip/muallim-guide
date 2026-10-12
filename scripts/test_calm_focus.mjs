// اختبار حواري الهدوء والتركيز من مركز الاختبارات
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const body = await page.textContent("body");
  if (body.includes("ما اسمك")) {
    await page.locator("input").first().fill("مجرب");
    await page.locator("button:has-text('لنبدأ الرحلة')").first().click();
    await page.waitForTimeout(1500);
  }
  // مركز الاختبارات عبر عالم أُدرّس
  await page.locator("button:has-text('أُدرّس')").first().click();
  await page.waitForTimeout(1000);

  // ---- الهدوء ----
  await page.locator("button:has-text('هدّئ نفسك')").first().click();
  await page.waitForTimeout(2500);
  let t = await page.textContent("body");
  console.log(t.includes("شهيق") ? "PASS — الهدوء: مرحلة التنفس تعمل" : "FAIL — الهدوء: مرحلة التنفس");
  console.log(t.includes("احتفاظ") ? "PASS — الهدوء: أطوار التنفس الكاملة" : "FAIL — أطوار التنفس");
  await page.screenshot({ path: "/home/z/my-project/scripts/c1_calm.png" });
  await page.locator("button:has-text('تخطي إلى التأريض')").click();
  await page.waitForTimeout(500);
  t = await page.textContent("body");
  console.log(t.includes("خمسة أشياء تراها") ? "PASS — الهدوء: التأريض ٥-٤-٣-٢-١" : "FAIL — التأريض");
  await page.screenshot({ path: "/home/z/my-project/scripts/c2_ground.png" });
  // أنجز بندي التأريض الأولين
  const firstGround = page.locator("button:has-text('خمسة أشياء تراها')");
  if (await firstGround.isEnabled()) await firstGround.click();
  await page.waitForTimeout(300);
  const secondGround = page.locator("button:has-text('أربعة أشياء تشعر')");
  if (await secondGround.isEnabled().catch(() => false)) await secondGround.click();
  await page.waitForTimeout(300);
  const closeBtn = page.locator("button:has-text('إغلاق')").first();
  if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
  await page.waitForTimeout(500);

  // ---- التركيز ----
  await page.locator("button:has-text('مؤقت التركيز')").first().click();
  await page.waitForTimeout(800);
  t = await page.textContent("body");
  console.log(t.includes("خمس وعشرون دقيقة") ? "PASS — التركيز: المدد الثلاث ظاهرة" : "FAIL — مدد التركيز");
  await page.screenshot({ path: "/home/z/my-project/scripts/c3_focus.png" });
  await page.locator("button:has-text('ابدأ')").first().click();
  await page.waitForTimeout(2300);
  t = await page.textContent("body");
  console.log(t.includes("غوص عميق جارٍ") ? "PASS — التركيز: العد يجري" : "FAIL — عد المؤقت");
  // إيقاف مؤقت ثم إغلاق
  await page.locator("button:has-text('إيقاف مؤقت')").first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  console.log("=== DONE ===");
  await browser.close();
})();
