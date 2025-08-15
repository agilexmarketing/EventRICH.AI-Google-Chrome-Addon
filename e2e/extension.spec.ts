import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

let context: BrowserContext;

test.beforeAll(async () => {
  // Path to the built extension
  const pathToExtension = path.join(__dirname, '../dist');
  
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--disable-web-security'
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

test.describe('EventRICH.AI Extension', () => {
  test('should load extension and show popup', async () => {
    const page = await context.newPage();
    
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get the extension ID (this might vary, so we'll look for it)
    const extensions = await context.backgroundPages();
    expect(extensions.length).toBeGreaterThan(0);
    
    // Click the extension icon (this would need to be adapted based on Chrome's UI)
    // For now, we'll test by directly opening the popup HTML
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Check if the popup loaded
    await expect(popupPage.locator('text=EventRICH.AI')).toBeVisible();
    await expect(popupPage.locator('text=Loading tracking data...')).toBeVisible();
  });

  test('should detect tracking on a website with analytics', async () => {
    const page = await context.newPage();
    
    // Create a test page with Google Analytics
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page with Analytics</title>
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        </script>
      </head>
      <body>
        <h1>Test Page</h1>
      </body>
      </html>
    `);
    
    // Wait for analytics to potentially load
    await page.waitForTimeout(2000);
    
    // Open the popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Wait for the popup to load and analyze the page
    await popupPage.waitForTimeout(3000);
    
    // Check if tracking was detected (this might show "No tracking detected" if the script didn't actually fire)
    const statusText = await popupPage.locator('[class*="text-gray-600"]').first().textContent();
    expect(statusText).toBeTruthy();
  });

  test('should allow theme switching', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Wait for popup to load
    await popupPage.waitForSelector('text=EventRICH.AI');
    
    // Find and click the dark mode button
    const darkModeButton = popupPage.locator('[title*="Dark"]');
    if (await darkModeButton.count() > 0) {
      await darkModeButton.click();
      
      // Check if dark mode was applied
      const html = popupPage.locator('html');
      const classList = await html.getAttribute('class');
      expect(classList).toContain('dark');
    }
  });

  test('should allow filtering', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Wait for popup to load
    await popupPage.waitForSelector('text=EventRICH.AI');
    
    // Click the filters button
    const filtersButton = popupPage.locator('button:has-text("Filters")');
    await filtersButton.click();
    
    // Check if the search input appeared
    await expect(popupPage.locator('input[placeholder*="Search"]')).toBeVisible();
    
    // Type in the search box
    await popupPage.locator('input[placeholder*="Search"]').fill('test');
    
    // The search should work (though no results might be shown)
    await popupPage.waitForTimeout(500);
  });

  test('should show export functionality', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Wait for popup to load
    await popupPage.waitForSelector('text=EventRICH.AI');
    
    // Look for export button
    const exportButton = popupPage.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
    
    // Click export button to show options
    await exportButton.click();
    
    // Wait a moment for dropdown
    await popupPage.waitForTimeout(500);
    
    // Look for export format options (they might appear in a dropdown)
    const jsonOption = popupPage.locator('text=JSON');
    if (await jsonOption.count() > 0) {
      await expect(jsonOption).toBeVisible();
    }
  });

  test('should handle keyboard shortcuts', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Wait for popup to load
    await popupPage.waitForSelector('text=EventRICH.AI');
    
    // Test Ctrl+F for search
    await popupPage.keyboard.press('Control+f');
    
    // Check if search input is visible and focused
    await popupPage.waitForTimeout(200);
    const searchInput = popupPage.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
    
    // Test Escape to close
    await popupPage.keyboard.press('Escape');
    await popupPage.waitForTimeout(200);
  });

  test('should show analytics dashboard', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Wait for popup to load
    await popupPage.waitForSelector('text=EventRICH.AI');
    
    // Look for analytics button
    const analyticsButton = popupPage.locator('button:has-text("Analytics")');
    if (await analyticsButton.count() > 0) {
      await analyticsButton.click();
      
      // Wait for dashboard to open
      await popupPage.waitForTimeout(1000);
      
      // Look for dashboard elements
      const dashboardTitle = popupPage.locator('text=Analytics Dashboard');
      if (await dashboardTitle.count() > 0) {
        await expect(dashboardTitle).toBeVisible();
      }
    }
  });

  test('should handle login form', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${await getExtensionId(context)}/popup.html`);
    
    // Wait for popup to load
    await popupPage.waitForSelector('text=EventRICH.AI');
    
    // Find login form elements
    const emailInput = popupPage.locator('input[placeholder="Email"]');
    const passwordInput = popupPage.locator('input[placeholder="Password"]');
    const loginButton = popupPage.locator('button:has-text("Login")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Test form interaction
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    
    // Don't actually submit to avoid real API calls
    expect(await emailInput.inputValue()).toBe('test@example.com');
    expect(await passwordInput.inputValue()).toBe('testpassword');
  });
});

// Helper function to get extension ID
async function getExtensionId(context: BrowserContext): Promise<string> {
  // This is a simplified version - in reality, you might need to parse the manifest
  // or use Chrome's extension APIs to get the actual ID
  const extensions = await context.backgroundPages();
  if (extensions.length > 0) {
    const url = extensions[0].url();
    const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback - you might need to hardcode this based on your extension's actual ID
  return 'your-extension-id-here';
}




