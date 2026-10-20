// فحص خفيف: ظهور الأقسام الثلاثة الجديدة في بحث المكتبة
const { chromium } = require('/home/z/my-project/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  // تجاوز التهيئة الأولى إن ظهرت
  const name = p.locator('input').first();
  if (await name.isVisible().catch(() => false)) {
    await name.fill('سارة');
    await p.getByText('لنبدأ الرحلة').first().click().catch(() => {});
    await p.waitForTimeout(600);
  }
  const results = [];
  for (const term of ['التنمر الإلكتروني', 'الإبلاغ الإلزامي', 'التناص']) {
    await p.goto('http://localhost:3000/library', { waitUntil: 'networkidle' });
    await p.locator('input').first().fill(term);
    await p.waitForTimeout(700);
    const found = await p.getByText(term, { exact: false }).first().isVisible().catch(() => false);
    results.push(term + ' → ' + (found ? 'ظاهر' : 'غائب'));
  }
  console.log(results.join(' | '));
  await b.close();
})();
