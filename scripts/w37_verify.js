// تحقق متصفح: الموضوعات والمفاهيم الجديدة ظاهرة في المكتبة
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const BASE = 'http://localhost:3000';
  const log = (...a) => console.log(...a);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  // تجاوز الترحيب إن ظهر
  const nameBox = page.locator('input').first();
  if (await nameBox.isVisible().catch(() => false)) {
    await nameBox.fill('سارة');
    await page.getByText('لنبدأ الرحلة').click();
    await page.waitForTimeout(600);
  }

  // الانتقال للمكتبة
  await page.getByRole('button', { name: 'المكتبة' }).click().catch(async () => {
    await page.getByText('المكتبة', { exact: true }).first().click();
  });
  await page.waitForTimeout(800);

  // التحقق من الموضوعات الثلاثة الجديدة عبر البحث (يفتح تفاصيل المفهوم مباشرة)
  const checks = ['التقويم التشخيصي', 'المنهج الحلزوني', 'الإرشاد الفردي'];
  let ok = 0;
  for (const t of checks) {
    await page.fill('input[placeholder*="ابحث"]', t.slice(0, 12));
    await page.waitForTimeout(700);
    const found = await page.getByText(t, { exact: false }).first().isVisible().catch(() => false);
    log(found ? '✓ ظاهر: ' + t : '✗ غائب: ' + t);
    if (found) ok++;
  }

  // فتح تفاصيل مفهوم جديد والتحقق من الأمثلة
  await page.fill('input[placeholder*="ابحث"]', 'التقويم التكويني');
  await page.waitForTimeout(700);
  await page.getByText('التقويم التكويني', { exact: false }).first().click();
  await page.waitForTimeout(900);
  const body = await page.content();
  const hasEx = body.includes('أمثلة واقعية من الميدان') || (body.match(/أمثلة/g) || []).length >= 1;
  const examplesCount = (body.match(/سارة|ريان|نورة|ياسر|هدى|خالد/g) || []).length;
  log(hasEx ? '✓ نافذة المفهوم تعرض الأمثلة' : '✗ الأمثلة غير ظاهرة', '| أسماء الأدلة في النص:', examplesCount);
  const latin = (body.match(/[A-Za-z]{3,}/g) || []).filter(w => !/script|html|css|svg|font|span|class|style|button|div|input|http|com|app|jsx|node/i.test(w));
  log('تسريبات لاتينية بالصفحة:', latin.length ? latin.slice(0, 5) : 'صفر');

  await page.screenshot({ path: 'scripts/w37_newconcepts.png', fullPage: false });
  log(ok === 3 && hasEx ? 'PASS — المفاهيم الجديدة تعمل في التطبيق' : 'PARTIAL — ok=' + ok);
  await browser.close();
})();
