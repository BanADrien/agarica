const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:8791/index.html?editor');
  await page.waitForTimeout(1500);

  const result = await page.evaluate(async () => {
    const before = await EditorScene.getEditor().fetchZoneData('zone1');
    const beforeExits = before.exits || (before.exit ? [before.exit] : []);
    await EditorScene.disconnectZoneExit('zone1', 0);
    const after = await EditorScene.getEditor().fetchZoneData('zone1');
    const afterExits = after.exits || (after.exit ? [after.exit] : []);
    return {
      beforeTarget: beforeExits[0] && beforeExits[0].targetScene,
      afterTarget: afterExits[0] && afterExits[0].targetScene,
    };
  });
  console.log('Disconnect result:', JSON.stringify(result));
  console.log('Errors:', JSON.stringify(errors));
  await browser.close();
})();
