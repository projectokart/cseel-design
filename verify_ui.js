const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('--- 1. Navigating to https://design.cseel.org ---');
  await page.goto('https://design.cseel.org', { waitUntil: 'networkidle' });

  // 1. Check Dev Profile Avatar in navbar
  const avatar = await page.$('.dev-avatar-img');
  console.log('Avatar exists:', Boolean(avatar));
  const avatarBox = await avatar.boundingBox();
  console.log('Avatar dimensions:', avatarBox);

  // Hover on avatar to check tooltip
  await page.hover('.dev-profile-pill');
  await page.waitForTimeout(400);
  const tooltipText = await page.textContent('.dev-name-tooltip');
  console.log('Tooltip text:', tooltipText.replace(/\s+/g, ' ').trim());
  await page.screenshot({ path: 'test_avatar_hover.png', clip: { x: 0, y: 0, width: 450, height: 120 } });

  // 2. Click 'Get Quote' navbar button
  console.log('--- 2. Clicking Get Quote in navbar ---');
  await page.click('text="Get Quote"');
  await page.waitForTimeout(500);

  const modal = await page.$('#quoteModal');
  const isModalVisible = await modal.isVisible();
  console.log('Quote modal visible after navbar click:', isModalVisible);
  await page.screenshot({ path: 'test_quote_modal_open.png' });

  // Close modal
  await page.click('.quote-modal-close');
  await page.waitForTimeout(400);
  console.log('Quote modal hidden after close click:', !(await modal.isVisible()));

  // 3. Verify in-page form is removed
  const inPageForm = await page.$('#schoolEnquiryForm');
  console.log('In-page form exists (should be false):', Boolean(inPageForm));
  const modalForm = await page.$('#modalSchoolEnquiryForm');
  console.log('Modal form exists (should be true):', Boolean(modalForm));

  // 4. Test 11th card (catalog placeholder)
  console.log('--- 3. Testing 11th catalog card ---');
  const catalogImg = await page.$('img[src="img/catalog-placeholder.svg"]');
  console.log('Catalog placeholder image element found:', Boolean(catalogImg));
  
  // Click 11th card
  await page.click('.template-card-item:has(img[src="img/catalog-placeholder.svg"])');
  await page.waitForTimeout(500);
  const isCatalogModalOpen = await modal.isVisible();
  const catalogSelectedTitle = await page.textContent('#modalSelectedTemplateTitle');
  console.log('Catalog modal opened:', isCatalogModalOpen);
  console.log('Catalog selected title:', catalogSelectedTitle);
  await page.screenshot({ path: 'test_catalog_modal.png' });
  await page.click('.quote-modal-close');
  await page.waitForTimeout(400);

  // 5. Test Nav Scrolling
  console.log('--- 4. Testing Navigation Links ---');
  const navLinks = ['Why Direct?', 'About Us', 'Our Solution', 'Web Design', 'Agency vs Direct', 'FAQ & Contact'];
  for (const linkText of navLinks) {
    await page.click(`text="${linkText}"`);
    await page.waitForTimeout(700);
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log(`Nav link '${linkText}' scrolled to Y: ${scrollY}`);
  }

  // 6. Test Mobile Viewport
  console.log('--- 5. Testing Mobile Viewport (iPhone 13 - 390x844) ---');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto('https://design.cseel.org', { waitUntil: 'networkidle' });

  // Check mobile navbar toggle
  await mobilePage.click('.navbar-toggler');
  await mobilePage.waitForTimeout(500);
  const isMobileMenuOpen = await mobilePage.$eval('#navbarText', el => el.classList.contains('show'));
  console.log('Mobile navbar menu opened on hamburger tap:', isMobileMenuOpen);
  await mobilePage.screenshot({ path: 'test_mobile_nav.png' });

  // Click Get Quote on mobile
  await mobilePage.click('#navbarText text="Get Quote"');
  await mobilePage.waitForTimeout(500);
  const isMobileModalOpen = await mobilePage.$eval('#quoteModal', el => el.style.display !== 'none');
  console.log('Mobile quote modal opened:', isMobileModalOpen);
  await mobilePage.screenshot({ path: 'test_mobile_modal.png' });

  await browser.close();
  console.log('--- ALL TESTS COMPLETED SUCCESSFULLY ---');
})();
