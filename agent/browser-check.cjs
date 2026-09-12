const { chromium } = require('/opt/webbuilder-checks/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle', timeout: 20000 });
      if (!response || !response.ok()) errors.push('Preview HTTP failure');
      if (await page.locator('vite-error-overlay').count()) errors.push('Vite error overlay');
      const rendered = await page.locator('#root').evaluate(el => el.childElementCount > 0 && el.getBoundingClientRect().height > 0);
      if (!rendered) errors.push('React root did not render');
      await page.close();
    }
    console.log(JSON.stringify({ ok: errors.length === 0, errors: errors.slice(0, 10), checks: ['desktop render', 'mobile render', 'uncaught browser errors'] }));
    process.exitCode = errors.length ? 1 : 0;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
