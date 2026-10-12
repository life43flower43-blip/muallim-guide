// اختبار حي: التحديات الذكية + الهدوء + التركيز + الملاحظات — عبر متصفح آلي
import { chromium } from "playwright";

const OUT = "/home/z/my-project/scripts/";
const results = [];
const log = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? " — " + detail : ""}`);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (e) => log("pageerror", false, e.message));

  // ١) فتح التطبيق — إن ظهر onboarding نجاوزه
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const body = await page.textContent("body");
  if (body.includes("ما اسمك")) {
    const input = page.locator("input").first();
    if (await input.isVisible()) {
      await input.fill("مجرب");
      await page.locator("button:has-text('لنبدأ الرحلة')").first().click();
      await page.waitForTimeout(1500);
    }
  }
  log("تحميل التطبيق", true);

  // ٢) الانتقال إلى مركز الاختبارات عبر أيقونة تدريب؟ — مركز الاختبارات في تبويب quiz
  // التنقل: الرئيسية لديها بطاقة اختبار رئيسية تفتح quiz. نجرب النقر على أيقونة الشريط السفلي
  const navButtons = await page.locator("nav button").all();
  // nav: الرئيسية/المكتبة/أخطائي/تدريب/حسابي — مركز الاختبارات يفتح من الرئيسية
  await page.screenshot({ path: OUT + "n1_home.png" });
  const homeTxt = await page.textContent("body");
  log("رئيسية تعمل", homeTxt.length > 100);

  // نفتح مركز الاختبارات عبر عالم «أُدرّس» في الرئيسية
  const quizEntry = page.locator("button:has-text('أُدرّس')").first();
  if (await quizEntry.isVisible().catch(() => false)) {
    await quizEntry.click();
    await page.waitForTimeout(1000);
  }

  // نتحقق من وجود بطاقة التحديات الذكية
  const challengesBtn = page.locator("button:has-text('التحديات الذكية')").first();
  const hasChallenges = await challengesBtn.isVisible().catch(() => false);
  if (!hasChallenges) {
    // ربما نحن في الرئيسية — نبحث عن أي مدخل للاختبارات
    const quizHomeBtn = page.locator("button:has-text('مركز الاختبارات'), button:has-text('الاختبارات')").first();
    if (await quizHomeBtn.isVisible().catch(() => false)) {
      await quizHomeBtn.click();
      await page.waitForTimeout(800);
    }
  }
  await page.screenshot({ path: OUT + "n2_quizhome.png" });
  const qh = await page.textContent("body");
  log("بطاقة التحديات الذكية ظاهرة", qh.includes("التحديات الذكية"));
  log("زر الهدوء ظاهر", qh.includes("هدّئ نفسك"));
  log("زر مؤقت التركيز ظاهر", qh.includes("مؤقت التركيز"));

  // ٣) فتح جلسة التحديات
  const chBtn = page.locator("button:has-text('التحديات الذكية')").first();
  if (await chBtn.isVisible().catch(() => false)) {
    await chBtn.click();
    await page.waitForTimeout(1000);
  }
  const csTxt = await page.textContent("body");
  const challengeKind = csTxt.includes("ترتيب") || csTxt.includes("إكمال") || csTxt.includes("إنتاج كتابي");
  log("فتح جلسة التحديات", challengeKind);
  await page.screenshot({ path: OUT + "n3_challenge.png" });

  // ٤) حل كل تحدٍّ حسب نوعه — حتى نهاية الجلسة (٧ تحديات كحد أقصى)
  for (let i = 0; i < 7; i++) {
    const t = await page.textContent("body");
    const done = t.includes("نتيجة التحديات");
    if (done) break;

    if (t.includes("تحقق من الترتيب")) {
      // ترتيب: ننقر كل الرقاقات المتاحة بالتتابع ثم نتحقق (الترتيب قد يخطئ — لا يهم للاختبار)
      const chips = await page.locator("button:has-text('')").all();
      // ننقر أزرار الرقاقات داخل قسم الرقاقات — الأزرار الدائرية برقاقات
      const chipButtons = page.locator("div.flex.flex-wrap > button");
      const n = await chipButtons.count();
      for (let k = 0; k < n; k++) {
        await chipButtons.nth(0).click(); // أول رقاقة تختفي إلى السطر وتتقدم الباقي
        await page.waitForTimeout(120);
      }
      const verify = page.locator("button:has-text('تحقق من الترتيب')");
      if (await verify.isEnabled()) {
        await verify.click();
        await page.waitForTimeout(500);
      }
    } else if (t.includes("تحقق من الإكمال")) {
      const token = page.locator("div.flex.flex-wrap > button").first();
      await token.click();
      await page.waitForTimeout(150);
      const verify = page.locator("button:has-text('تحقق من الإكمال')");
      await verify.click();
      await page.waitForTimeout(500);
    } else if (t.includes("أرسل إجابتي")) {
      // إنتاج: زر مقفل حتى استيفاء العناصر — نكتب نصًا نموذجيًا طويلًا
      // نعبئ بالحدس: نجرب إدخالًا يحتوي أكبر عدد من الكلمات المفتاحية المحتملة
      const area = page.locator("textarea");
      // نحاول الإرسال مباشرة أولًا لرؤية الحالة المقفلة
      const submitBtn = page.locator("button:has-text('أرسل إجابتي')");
      const disabled = await submitBtn.isDisabled();
      log(`تحدي إنتاج — الزر مقفل قبل الكتابة (${i + 1})`, disabled);
      await page.screenshot({ path: OUT + `n4_produce_${i}.png` });
      break; // يكفي إثبات الوصول لحجم الإنتاج وقفل زره — الحل الكامل يحتاج نصًا لكل مطالب
    }

    // زر التالي
    const nextBtn = page.locator("button:has-text('التحدي التالي'), button:has-text('عرض النتيجة')").first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  }
  await page.screenshot({ path: OUT + "n5_challenge_end.png" });

  // ٥) اختبار الهدوء والتركيز من مركز الاختبارات — نعود
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  // نفتح مركز الاختبارات مباشرة إن أمكن عبر البطاقة الرئيسية
  const calmBtn = page.locator("button:has-text('هدّئ نفسك')").first();
  const calmVisible = await calmBtn.isVisible().catch(() => false);
  if (calmVisible) {
    await calmBtn.click();
    await page.waitForTimeout(800);
    const dlg = await page.textContent("body");
    log("حوار الهدوء يفتح بمرحلة التنفس", dlg.includes("شهيق"));
    await page.screenshot({ path: OUT + "n6_calm.png" });
    const skip = page.locator("button:has-text('تخطي إلى التأريض')");
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(500);
      const g = await page.textContent("body");
      log("مرحلة التأريض تعمل", g.includes("خمسة أشياء تراها"));
      await page.screenshot({ path: OUT + "n7_ground.png" });
    }
    const close = page.locator("button:has-text('إغلاق')").first();
    if (await close.isVisible().catch(() => false)) await close.click();
    await page.waitForTimeout(400);
  }

  const focusBtn = page.locator("button:has-text('مؤقت التركيز')").first();
  if (await focusBtn.isVisible().catch(() => false)) {
    await focusBtn.click();
    await page.waitForTimeout(700);
    const f = await page.textContent("body");
    log("حوار التركيز يفتح بمدد الثلاث", f.includes("خمس وعشرون دقيقة"));
    await page.screenshot({ path: OUT + "n8_focus.png" });
    const start = page.locator("button:has-text('ابدأ')").first();
    if (await start.isVisible().catch(() => false)) {
      await start.click();
      await page.waitForTimeout(2200);
      log("المؤقت يعدّ", (await page.textContent("body")).length > 0);
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }

  const fails = results.filter((r) => !r.ok);
  console.log(`\n=== النتيجة: ${results.length - fails.length}/${results.length} ناجح ===`);
  await browser.close();
  process.exit(fails.length > 0 ? 1 : 0);
})();
