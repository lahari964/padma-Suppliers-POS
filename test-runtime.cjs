const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
  await page.goto('http://localhost:8080/new-bill');
  await page.waitForTimeout(2000);
  await browser.close();
  process.exit(0);
})();
