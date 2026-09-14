const { chromium } = require('/opt/webbuilder-checks/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  const pages = [];
  const inspectAt = process.argv.indexOf('--inspect');
  const inspecting = inspectAt !== -1;
  const requestedViewport = process.argv[inspectAt + 1];
  const path = inspecting ? process.argv[inspectAt + 2] || '/' : '/';
  const screenshotPath = inspecting ? process.argv[inspectAt + 3] : undefined;
  const addError = message => {
    if (errors.length < 10) errors.push(String(message).slice(0, 500));
  };
  try {
    if (process.argv.includes('--preflight')) {
      console.log(JSON.stringify({ ok: true, checks: ['browser tooling'] }));
      return;
    }
    const viewports = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };
    for (const [name, viewport] of Object.entries(viewports)) {
      if (inspecting && name !== requestedViewport) continue;
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1,
        serviceWorkers: inspecting ? 'block' : 'allow' });
      page.setDefaultTimeout(5000);
      if (inspecting) {
        // Keep navigation local, including redirects. Assets can still load from CDNs.
        await page.route('**/*', route => {
          const request = route.request();
          if (request.isNavigationRequest() && new URL(request.url()).origin !== 'http://127.0.0.1:5173') {
            return route.abort();
          }
          return route.continue();
        });
      }
      page.on('pageerror', error => addError(error.message));
      if (inspecting) page.on('console', message => {
        if (message.type() === 'error') addError(message.text());
      });
      const observation = { viewport: name, width: viewport.width, height: viewport.height };
      try {
        const url = new URL(path, 'http://127.0.0.1:5173');
        if (url.origin !== 'http://127.0.0.1:5173') throw Error('Only local preview paths are allowed');
        const response = await page.goto(url.href, { waitUntil: 'networkidle', timeout: 20000 });
        if (new URL(page.url()).origin !== url.origin) throw Error('Preview navigated outside the local app');
        observation.http_status = response?.status() ?? null;
        if (!response || !response.ok()) addError('Preview HTTP failure');
        if (await page.locator('vite-error-overlay').count()) addError('Vite error overlay');
        const content = await page.locator('#root').evaluate(el => {
          // Collect visible text with a bounded DOM walk; never send full HTML.
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let text = '', node, visited = 0;
          while (text.length < 2000 && visited++ < 5000 && (node = walker.nextNode())) {
            const parent = node.parentElement;
            if (!parent || parent.closest('script,style') ||
                !parent.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })) continue;
            text += ' ' + node.textContent.slice(0, 2000 - text.length);
          }
          return { rendered: el.childElementCount > 0 && el.getBoundingClientRect().height > 0,
            text: text.trim().replace(/\s+/g, ' ').slice(0, 2000) };
        });
        if (!content.rendered) addError('React root did not render');
        if (content.text === 'Ready to build') addError('Preview still shows the untouched starter page');
        if (inspecting) Object.assign(observation, content, { title: (await page.title()).slice(0, 200) });
        if (screenshotPath) {
          // Viewport only: full-page images can grow with arbitrary generated content.
          const image = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: false,
            scale: 'css', animations: 'disabled', caret: 'hide',
            mask: [page.locator('input[type="password"]')] });
          if (image.length > 200000) throw Error('Screenshot exceeds the 200 KB limit');
          require('fs').writeFileSync(screenshotPath, image, { mode: 0o600 });
        }
      } catch (error) {
        addError(error.message);
      } finally {
        if (inspecting) pages.push(observation);
        await page.close();
      }
    }
    if (inspecting && !pages.length) addError('Unknown viewport');
    console.log(JSON.stringify({ ok: errors.length === 0, errors,
      ...(inspecting ? { checked: true, pages } : { checks: ['desktop render', 'mobile render', 'uncaught browser errors'] }) }));
    process.exitCode = errors.length ? 1 : 0;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
