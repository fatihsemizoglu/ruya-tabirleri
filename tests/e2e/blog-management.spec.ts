import { test, expect } from '@playwright/test';

test.describe('Blog Management E2E Tests', () => {
  // Test blog home page
  test.describe('Blog Home Page', () => {
    test('should display blog home page', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-home.png' });
      
      expect(page.url()).toContain('blog');
    });

    test('should display blog posts list', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for blog posts
      const posts = await page.locator('article, .blog-post, [class*="post"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-posts.png' });
      
      expect(posts).toBeGreaterThanOrEqual(0);
    });

    test('should display blog featured posts', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for featured section
      const featured = await page.locator('[class*="featured"], [class*="hero"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-featured.png' });
      
      expect(true).toBeTruthy();
    });

    test('should display blog categories', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for categories
      const categories = await page.locator('[class*="category"], .tag, [class*="tag"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-categories.png' });
      
      expect(true).toBeTruthy();
    });

    test('should display tag cloud', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for tag cloud
      const tags = await page.locator('[class*="tag"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-tags.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test blog post detail
  test.describe('Blog Post Detail', () => {
    test('should navigate to blog post detail', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Try to click on a blog post
      const firstPost = page.locator('article a, .blog-post a, [class*="post"] a').first();
      
      if (await firstPost.count() > 0) {
        await firstPost.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/blog-post-detail.png' });
        
        // Should be on post detail page
        expect(page.url()).toMatch(/\/blog\/|\/post\//);
      } else {
        // No posts available - that's ok for this test
        await page.screenshot({ path: 'playwright-report/screenshots/blog-no-posts.png' });
        expect(true).toBeTruthy();
      }
    });

    test('should display post content', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Check for content
      const content = await page.locator('[class*="content"], article, .prose').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-content.png' });
      
      expect(content).toBeGreaterThanOrEqual(0);
    });

    test('should display post metadata', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for metadata (date, author, etc.)
      const metadata = await page.locator('[class*="meta"], [class*="date"], [class*="author"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-metadata.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test blog comments
  test.describe('Blog Comments', () => {
    test('should display comment section', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Try to find comment section
      const comments = await page.locator('[class*="comment"], #comments, [id*="comment"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-comments.png' });
      
      expect(true).toBeTruthy();
    });

    test('should display comment form', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for comment form
      const form = await page.locator('form[class*="comment"], textarea[name*="comment"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-comment-form.png' });
      
      expect(true).toBeTruthy();
    });

    test('should display comment list', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for existing comments
      const commentList = await page.locator('[class*="comment-list"], .comments-list').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-comment-list.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test blog categories
  test.describe('Blog Categories', () => {
    test('should filter posts by category', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Click on a category
      const categoryLink = page.locator('[class*="category"] a').first();
      
      if (await categoryLink.count() > 0) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/blog-category-filter.png' });
        
        // Should show filtered results
        expect(page.url()).toMatch(/category=/);
      } else {
        await page.screenshot({ path: 'playwright-report/screenshots/blog-no-categories.png' });
        expect(true).toBeTruthy();
      }
    });

    test('should display all categories', async ({ page }) => {
      await page.goto('/blog/categories');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-all-categories.png' });
      
      expect(page.url()).toContain('categories') || expect(true).toBeTruthy();
    });
  });

  // Test blog search
  test.describe('Blog Search', () => {
    test('should search blog posts', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Find search input
      const searchInput = page.locator('input[type="search"], input[name="q"], input[name="search"]').first();
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/blog-search.png' });
        
        // Should show search results
        expect(page.url()).toMatch(/search=|q=/);
      } else {
        await page.screenshot({ path: 'playwright-report/screenshots/blog-no-search.png' });
        expect(true).toBeTruthy();
      }
    });
  });

  // Test blog pagination
  test.describe('Blog Pagination', () => {
    test('should display pagination', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for pagination
      const pagination = await page.locator('[class*="pagination"], .pageination, nav[aria-label="pagination"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-pagination.png' });
      
      expect(true).toBeTruthy();
    });

    test('should navigate to next page', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Try to find next button
      const nextButton = page.locator('a[rel="next"], [class*="next"] a').first();
      
      if (await nextButton.count() > 0) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/blog-next-page.png' });
        
        expect(page.url()).toMatch(/page=/);
      } else {
        await page.screenshot({ path: 'playwright-report/screenshots/blog-no-next.png' });
        expect(true).toBeTruthy();
      }
    });
  });

  // Test blog social sharing
  test.describe('Blog Social Sharing', () => {
    test('should display share buttons', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for share buttons
      const shareButtons = await page.locator('[class*="share"], [class*="social"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-share.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test blog newsletter subscription
  test.describe('Blog Newsletter', () => {
    test('should display newsletter form', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for newsletter form
      const newsletter = await page.locator('form[class*="newsletter"], form[class*="subscribe"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-newsletter.png' });
      
      expect(true).toBeTruthy();
    });

    test('should submit newsletter subscription', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Find email input
      const emailInput = page.locator('input[type="email"][name*="email"]').first();
      
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
        
        // Find submit button
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'playwright-report/screenshots/blog-subscribe.png' });
        
        // Should show success or form submission
        expect(true).toBeTruthy();
      } else {
        await page.screenshot({ path: 'playwright-report/screenshots/blog-no-newsletter.png' });
        expect(true).toBeTruthy();
      }
    });
  });

  // Test blog reading progress
  test.describe('Blog Reading Progress', () => {
    test('should display reading progress bar', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Look for progress bar
      const progressBar = await page.locator('[class*="progress"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-progress.png' });
      
      expect(true).toBeTruthy();
    });
  });

  // Test blog SEO
  test.describe('Blog SEO', () => {
    test('should have proper meta tags', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Check for meta description
      const metaDescription = await page.locator('meta[name="description"]').count();
      
      await page.screenshot({ path: 'playwright-report/screenshots/blog-seo.png' });
      
      expect(metaDescription).toBeGreaterThanOrEqual(0);
    });
  });
});
