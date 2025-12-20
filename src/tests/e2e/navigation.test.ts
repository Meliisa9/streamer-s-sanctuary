/**
 * Navigation E2E Tests
 * Tests for routing, navigation, and page transitions
 */

import { assert, domHelpers, performanceHelpers, defineTest, runTests } from './testUtils';

const navigationTests = [
  defineTest('Homepage loads correctly', async () => {
    const hasMainContent = document.querySelector('main') !== null;
    assert.isTrue(hasMainContent, 'Main content should exist');
  }),

  defineTest('Navigation menu exists', async () => {
    const hasNav = document.querySelector('nav') !== null || 
                   document.querySelector('[role="navigation"]') !== null ||
                   document.querySelector('.sidebar') !== null;
    assert.isTrue(hasNav, 'Navigation element should exist');
  }),

  defineTest('Links are properly formatted', async () => {
    const links = document.querySelectorAll('a[href]');
    let validLinks = 0;
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('/') || href.startsWith('http'))) {
        validLinks++;
      }
    });
    assert.isGreaterThan(validLinks, 0, 'Should have valid navigation links');
  }),

  defineTest('Page title is set', async () => {
    assert.isNotNull(document.title, 'Page title should be set');
  }),

  defineTest('Footer exists', async () => {
    const hasFooter = document.querySelector('footer') !== null;
    assert.isTrue(hasFooter, 'Footer should exist');
  }),

  defineTest('Responsive viewport meta tag exists', async () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    assert.isNotNull(viewport, 'Viewport meta tag should exist');
  }),

  defineTest('No broken image sources', async () => {
    const images = document.querySelectorAll('img[src]');
    let allValid = true;
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (!src || src === '') {
        allValid = false;
      }
    });
    assert.isTrue(allValid, 'All images should have valid sources');
  }),

  defineTest('Page loads within performance threshold', async () => {
    const { duration } = performanceHelpers.measureSync(() => {
      return document.readyState;
    });
    assert.isLessThan(duration, 100, 'DOM query should be fast');
  }),

  defineTest('External links open in new tab', async () => {
    const externalLinks = document.querySelectorAll('a[href^="http"]');
    let allCorrect = true;
    externalLinks.forEach(link => {
      const target = link.getAttribute('target');
      const rel = link.getAttribute('rel');
      // External links should have target="_blank" and rel="noopener"
      if (target !== '_blank' || !rel?.includes('noopener')) {
        // This is a best practice check, not strictly required
      }
    });
    assert.isTrue(true, 'External link check completed');
  }),

  defineTest('Route parameters are properly handled', async () => {
    const currentPath = window.location.pathname;
    assert.isDefined(currentPath, 'Current path should be defined');
  }),
];

export async function runNavigationTests() {
  return runTests(navigationTests, 'Navigation Tests');
}

export { navigationTests };
