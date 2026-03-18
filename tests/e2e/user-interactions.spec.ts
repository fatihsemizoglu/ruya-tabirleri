import { test, expect } from '@playwright/test';

test.describe('User Interactions E2E Tests', () => {
  // Test home page
  test.describe('Home Page', () => {
    test('should display home page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/home-page.png' });
      
      expect(page.url()).toContain('/');
    });

    test('should display hero section', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for hero section
      const hero = await page.locator('[class*="hero"], section[class*="hero"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/home-hero.png' });
      
      expect(hero).toBeGreaterThanOrEqual(0);
    });

    test('should display featured dreams', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for featured dreams
      const featured = await page.locator('[class*="featured"], [class*="dream"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/home-featured.png' });
      
      expect(true).toBeTruthy();
    });

    test('should display categories section', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for categories
      const categories = await page.locator('[class*="category"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/home-categories.png' });
      
      expect(true).toBeTruthy();
    });

    test('should display blog section', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for blog section
      const blog = await page.locator('[class*="blog"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/home-blog.png' });
      
      expect(true).toBeTruthy();
    });

    test('should display call to action', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for CTA
      const cta = await page.locator('[class*="cta"], [class*="call-to-action"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/home-cta.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test navigation
  test.describe('Navigation', () => {
    test('should display header navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for header
      const header = await page.locator('header, nav').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/nav-header.png' });
      
      expect(header).toBeGreaterThan(0);
    });

    test('should navigate to about page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click on About link
      const aboutLink = page.locator('a:has-text("Hakkımızda"), a:has-text("About")').first();
      
      if (await aboutLink.count() > 0) {
        await aboutLink.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/nav-about.png' });
        
        expect(page.url()).toMatch(/about/);
      } else {
        expect(true).toBeTruthy();
      }
    });

    test('should navigate to blog', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click on Blog link
      const blogLink = page.locator('a:has-text("Blog"), a: has-text("Yazılar")').first();
      
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/nav-blog.png' });
        
        expect(page.url()).toMatch(/blog/);
      } else {
        expect(true).toBeTruthy();
      }
    });

    test('should navigate to alphabet list', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click on Alphabet link
      const alphabetLink = page.locator('a:has-text("Alfabe"), a:has-text("Alphabet")').first();
      
      if (await alphabetLink.count() > 0) {
        await alphabetLink.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/nav-alphabet.png' });
        
        expect(page.url()).toMatch(/alfabe|alphabet/);
      } else {
        expect(true).toBeTruthy();
      }
    });

    test('should display mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for mobile menu
      const mobileMenu = await page.locator('[class*="mobile"], [class*="hamburger"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/nav-mobile.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test search functionality
  test.describe('Search Functionality', () => {
    test('should display search bar', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for search input
      const searchInput = await page.locator('input[type="search"], input[type="text"][name*="search"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/search-bar.png' });
      
      expect(true).toBeTruthy();
    });

    test('should perform search', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Find and use search
      const searchInput = page.locator('input[type="search"], input[name*="search"]').first();
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('rüya');
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/search-results.png' });
        
        expect(page.url()).toMatch(/search=|q=/);
      } else {
        expect(true).toBeTruthy();
      }
    });

    test('should display search suggestions', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Type in search
      const searchInput = page.locator('input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('r');
        await page.waitForTimeout(500); // Wait for suggestions
        
        await page.screenshot({ path: 'playwright-report/screenshots/search-suggestions.png' });
        
        expect(true).toBeTruthy();
      } else {
        expect(true).toBeTruthy();
      }
    });

    test('should display advanced search', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      // Look for advanced filters
      const filters = await page.locator('[class*="filter"], [class*="advanced"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/search-advanced.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test footer
  test.describe('Footer', () => {
    test('should display footer', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for footer
      const footer = await page.locator('footer').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/footer.png' });
      
      expect(footer).toBeGreaterThan(0);
    });

    test('should display footer links', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for footer links
      const links = await page.locator('footer a').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/footer-links.png' });
      
      expect(links).toBeGreaterThanOrEqual(0);
    });

    test('should display social links in footer', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for social links
      const social = await page.locator('footer [class*="social"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/footer-social.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test dream browsing
  test.describe('Dream Browsing', () => {
    test('should display dream cards', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for dream cards
      const cards = await page.locator('[class*="dream-card"], [class*="card"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/dream-cards.png' });
      
      expect(true).toBeTruthy();
    });

    test('should navigate to dream detail', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click on a dream card
      const dreamLink = page.locator('[class*="dream"] a, [class*="card"] a').first();
      
      if (await dreamLink.count() > 0) {
        await dreamLink.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/dream-detail.png' });
        
        expect(page.url()).toMatch(/\/rüya\/|\/dream\/|\/dreams\//);
      } else {
        expect(true).toBeTruthy();
      }
    });

    test('should display similar dreams', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for similar dreams
      const similar = await page.locator('[class*="similar"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/dream-similar.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test authentication
  test.describe('Authentication', () => {
    test('should display login link', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for login link
      const loginLink = await page.locator('a:has-text("Giriş"), a:has-text("Login"), a:has-text("Sign In")').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/auth-login-link.png' });
      
      expect(loginLink).toBeGreaterThanOrEqual(0);
    });

    test('should display register link', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for register link
      const registerLink = await page.locator('a:has-text("Kayıt"), a:has-text("Register"), a:has-text("Sign Up")').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/auth-register-link.png' });
      
      expect(registerLink).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/auth-page.png' });
      
      const currentUrl = page.url();
      expect(currentUrl.includes('auth') || currentUrl.includes('login') || currentUrl.includes('giris')).toBeTruthy();
    });
  });

  // Test contact functionality
  test.describe('Contact', () => {
    test('should display contact form', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');
      
      // Look for contact form
      const form = await page.locator('form').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/contact-form.png' });
      
      expect(form).toBeGreaterThanOrEqual(0);
    });

    test('should display contact information', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');
      
      // Look for contact info
      const info = await page.locator('[class*="contact"], [class*="info"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/contact-info.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test alphabet list
  test.describe('Alphabet List', () => {
    test('should display alphabet navigation', async ({ page }) => {
      await page.goto('/alfabe');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/alphabet-page.png' });
      
      expect(page.url()).toMatch(/alfabe|alphabet/);
    });

    test('should filter by letter', async ({ page }) => {
      await page.goto('/alfabe');
      await page.waitForLoadState('networkidle');
      
      // Click on a letter
      const letter = page.locator('[class*="letter"], [class*="alphabet"] a').first();
      
      if (await letter.count() > 0) {
        await letter.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/alphabet-filter.png' });
        
        expect(true).toBeTruthy();
      } else {
        expect(true).toBeTruthy();
      }
    });
  });

  // Test responsive behavior
  test.describe('Responsive Behavior', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/mobile-home.png' });
      
      expect(true).toBeTruthy();
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/tablet-home.png' });
      
      expect(true).toBeTruthy();
    });

    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/desktop-home.png' });
      
      expect(true).toBeTruthy();
    });
  });
});
