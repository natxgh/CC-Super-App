/**
 * DOM Probe — Spare Parts form slide panel (Category/Brand dropdown structure)
 */
import { test } from '@playwright/test';
import { LoginPage } from '../shared/pages/LoginPage';

const ORG = process.env.CP_ORG || 'BMA';
const USER = process.env.CP_USERNAME || 'ketwadee';
const PASS = process.env.CP_PASSWORD || 'Skyai@123';

test('probe: form slide panel HTML', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login({ org: ORG, username: USER, password: PASS });
  await page.goto('/cms/inventory/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);

  // Open Add form
  await page.getByRole('button', { name: /Create Spare Parts?/i }).click();
  await page.waitForTimeout(2000);

  // Find all fixed/absolute/right-panel divs that could be the slide panel
  const panelHTML = await page.evaluate(() => {
    // look for the panel: it has Cancel + Create Spare Parts buttons
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const btns = div.querySelectorAll('button');
      const btnTexts = [...btns].map(b => b.textContent?.trim()).filter(Boolean);
      if (btnTexts.includes('Cancel') && btnTexts.some(t => t?.includes('Create Spare Parts'))) {
        return div.innerHTML.slice(0, 8000);
      }
    }
    return 'not found';
  });
  console.log('\n=== FORM PANEL HTML ===\n', panelHTML);

  // Find Category/Brand dropdown structure specifically
  const dropdownInfo = await page.evaluate(() => {
    const labels = document.querySelectorAll('label');
    const results: any[] = [];
    for (const label of labels) {
      const text = label.textContent?.trim() || '';
      if (/Category|Brand/i.test(text)) {
        // check siblings and parent
        const parent = label.parentElement;
        results.push({
          labelText: text,
          parentTag: parent?.tagName,
          parentClass: parent?.className?.slice(0, 100),
          parentHTML: parent?.innerHTML?.slice(0, 500),
          nextSiblingTag: label.nextElementSibling?.tagName,
          nextSiblingClass: (label.nextElementSibling as HTMLElement)?.className?.slice(0, 100),
          nextSiblingHTML: label.nextElementSibling?.innerHTML?.slice(0, 300),
        });
      }
    }
    return results;
  });
  console.log('\n=== CATEGORY/BRAND DROPDOWN STRUCTURE ===\n', JSON.stringify(dropdownInfo, null, 2));

  // Also get all divs with "cursor-pointer" or "dropdown" in classes inside the panel
  const triggers = await page.evaluate(() => {
    const allEls = document.querySelectorAll('[class*="cursor-pointer"], [class*="dropdown"], [class*="select"]');
    return [...allEls].filter(el => {
      const text = el.textContent?.trim();
      return text && text.length < 100 && !el.closest('button');
    }).map(el => ({
      tag: el.tagName,
      cls: el.className?.slice(0, 100),
      text: el.textContent?.trim().slice(0, 50),
    })).slice(0, 20);
  });
  console.log('\n=== TRIGGER CANDIDATES ===\n', JSON.stringify(triggers, null, 2));

  await page.screenshot({ path: '/tmp/probe-form-panel.png', fullPage: false });
  console.log('\nScreenshot: /tmp/probe-form-panel.png');
});
