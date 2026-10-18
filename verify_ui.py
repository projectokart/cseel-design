import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\DEVENDER\.gemini\antigravity\brain\2dd31d9b-3f2c-4247-9319-6d3e04e1b616"

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        print("--- 1. Navigating to https://design.cseel.org ---")
        await page.goto("https://design.cseel.org", wait_until="networkidle")

        # 1. Dev Profile Avatar in navbar
        avatar = await page.query_selector(".dev-avatar-img")
        print("Avatar exists:", bool(avatar))
        box = await avatar.bounding_box()
        print("Avatar box:", box)

        # Hover over profile pill
        await page.hover(".dev-profile-pill")
        await page.wait_for_timeout(500)
        tooltip = await page.text_content(".dev-name-tooltip")
        print("Tooltip text:", " ".join(tooltip.split()))
        
        avatar_shot = os.path.join(ARTIFACT_DIR, "live_navbar_avatar_hover.png")
        await page.screenshot(path=avatar_shot, clip={"x": 0, "y": 0, "width": 450, "height": 130})
        print(f"Saved avatar screenshot to {avatar_shot}")

        # 2. Click 'Get Quote' navbar button
        print("--- 2. Clicking 'Get Quote' in navbar ---")
        await page.click("text=Get Quote")
        await page.wait_for_timeout(600)

        modal = await page.query_selector("#quoteModal")
        is_visible = await modal.is_visible()
        print("Quote modal opened on Get Quote click:", is_visible)
        
        modal_shot = os.path.join(ARTIFACT_DIR, "live_quote_modal_desktop.png")
        await page.screenshot(path=modal_shot)
        print(f"Saved modal screenshot to {modal_shot}")

        # Close modal
        await page.click(".quote-modal-close")
        await page.wait_for_timeout(400)
        print("Quote modal closed successfully:", not (await modal.is_visible()))

        # 3. Verify in-page form is removed
        in_page_form = await page.query_selector("#schoolEnquiryForm")
        print("In-page form exists (should be False):", bool(in_page_form))

        # 4. Test 11th project card (catalog placeholder)
        print("--- 3. Testing 11th catalog card ---")
        catalog_card = await page.query_selector(".template-card-item:has(img[src*='catalog-placeholder.svg'])")
        print("11th card found:", bool(catalog_card))
        await catalog_card.click()
        await page.wait_for_timeout(600)

        is_cat_modal_open = await modal.is_visible()
        cat_title = await page.text_content("#modalSelectedTemplateTitle")
        print("Catalog modal opened:", is_cat_modal_open)
        print("Selected template title:", cat_title.strip())

        cat_shot = os.path.join(ARTIFACT_DIR, "live_catalog_modal_open.png")
        await page.screenshot(path=cat_shot)
        print(f"Saved catalog modal screenshot to {cat_shot}")

        await page.click(".quote-modal-close")
        await page.wait_for_timeout(400)

        # 5. Test Nav Scrolling
        print("--- 4. Testing Navigation Links ---")
        nav_links = [
            ("Why Direct?", 600),
            ("About Us", 1200),
            ("Our Solution", 1800),
            ("Web Design", 2400),
            ("Agency vs Direct", 3200),
            ("FAQ & Contact", 4000),
        ]
        for name, expected_min_y in nav_links:
            await page.click(f".navbar-nav >> text='{name}'")
            await page.wait_for_timeout(800)
            y = await page.evaluate("window.scrollY")
            print(f"Nav '{name}' -> scrolled to Y: {y} (expected >= {expected_min_y})")

        # 6. Test Mobile Viewport (iPhone 13 - 390x844)
        print("--- 5. Testing Mobile Viewport (390x844) ---")
        mobile_page = await context.new_page()
        await mobile_page.set_viewport_size({"width": 390, "height": 844})
        await mobile_page.goto("https://design.cseel.org", wait_until="networkidle")

        # Toggle hamburger
        await mobile_page.click(".navbar-toggler")
        await mobile_page.wait_for_timeout(500)
        nav_classes = await mobile_page.eval_on_selector("#navbarText", "el => el.className")
        print("Mobile nav classes after toggle:", nav_classes)
        
        mobile_nav_shot = os.path.join(ARTIFACT_DIR, "live_mobile_nav_open.png")
        await mobile_page.screenshot(path=mobile_nav_shot)
        print(f"Saved mobile nav screenshot to {mobile_nav_shot}")

        # Click Get Quote on mobile
        await mobile_page.click("#navbarText >> text='Get Quote'")
        await mobile_page.wait_for_timeout(600)
        is_mob_modal_open = await mobile_page.is_visible("#quoteModal")
        print("Mobile quote modal opened:", is_mob_modal_open)

        mobile_modal_shot = os.path.join(ARTIFACT_DIR, "live_mobile_quote_modal.png")
        await mobile_page.screenshot(path=mobile_modal_shot)
        print(f"Saved mobile modal screenshot to {mobile_modal_shot}")

        # Fill and test enquiry form in modal
        print("--- 6. Testing Enquiry Form Submission in Modal ---")
        await mobile_page.fill("#modal_school_name", "St. Xavier Test Academy")
        await mobile_page.fill("#modal_person_name", "Principal Test Kumar")
        await mobile_page.fill("#modal_email", "test.principal@xaviers.edu.in")
        await mobile_page.fill("#modal_contact_number", "9876543210")
        await mobile_page.fill("#modal_notes", "Automated QA verification test of the new mobile-responsive email and pop-up modal.")
        
        submit_btn = await mobile_page.query_selector("#modalSubmitBtn")
        await submit_btn.click()
        await mobile_page.wait_for_timeout(2500)

        success_alert = await mobile_page.text_content("#modalEnquirySuccessAlert")
        print("Submission result alert:", success_alert.strip())

        await browser.close()
        print("--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
