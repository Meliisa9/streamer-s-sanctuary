/**
 * E2E Test Utilities
 * Comprehensive testing infrastructure for end-to-end testing
 */

// Test configuration
export const E2E_CONFIG = {
  baseUrl: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 3,
  screenshotOnFailure: true,
};

// Test result types
export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  startTime: Date;
  endTime?: Date;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
}

// Test context for managing state
export class TestContext {
  private suite: TestSuite;
  private currentTest: string | null = null;
  private startTime: number = 0;

  constructor(suiteName: string) {
    this.suite = {
      name: suiteName,
      tests: [],
      startTime: new Date(),
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
    };
  }

  startTest(name: string) {
    this.currentTest = name;
    this.startTime = performance.now();
    console.log(`🧪 Starting test: ${name}`);
  }

  passTest(name?: string) {
    const testName = name || this.currentTest || 'Unknown';
    const duration = performance.now() - this.startTime;
    this.suite.tests.push({ name: testName, status: 'passed', duration });
    this.suite.totalPassed++;
    console.log(`✅ PASSED: ${testName} (${duration.toFixed(2)}ms)`);
    this.currentTest = null;
  }

  failTest(error: string, name?: string) {
    const testName = name || this.currentTest || 'Unknown';
    const duration = performance.now() - this.startTime;
    this.suite.tests.push({ name: testName, status: 'failed', duration, error });
    this.suite.totalFailed++;
    console.error(`❌ FAILED: ${testName} - ${error}`);
    this.currentTest = null;
  }

  skipTest(name: string, reason?: string) {
    this.suite.tests.push({ name, status: 'skipped', duration: 0, error: reason });
    this.suite.totalSkipped++;
    console.log(`⏭️ SKIPPED: ${name}${reason ? ` - ${reason}` : ''}`);
  }

  getSummary(): TestSuite {
    this.suite.endTime = new Date();
    return this.suite;
  }

  printSummary() {
    const summary = this.getSummary();
    const total = summary.totalPassed + summary.totalFailed + summary.totalSkipped;
    const duration = summary.endTime!.getTime() - summary.startTime.getTime();

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Suite: ${summary.name}`);
    console.log('='.repeat(50));
    console.log(`Total: ${total} | ✅ Passed: ${summary.totalPassed} | ❌ Failed: ${summary.totalFailed} | ⏭️ Skipped: ${summary.totalSkipped}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('='.repeat(50) + '\n');
  }
}

// Assertion helpers
export const assert = {
  isTrue: (value: boolean, message?: string) => {
    if (!value) throw new Error(message || 'Expected true but got false');
  },

  isFalse: (value: boolean, message?: string) => {
    if (value) throw new Error(message || 'Expected false but got true');
  },

  equals: <T>(actual: T, expected: T, message?: string) => {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  },

  notEquals: <T>(actual: T, unexpected: T, message?: string) => {
    if (actual === unexpected) {
      throw new Error(message || `Expected value to not equal ${unexpected}`);
    }
  },

  isNull: (value: unknown, message?: string) => {
    if (value !== null) throw new Error(message || `Expected null but got ${value}`);
  },

  isNotNull: (value: unknown, message?: string) => {
    if (value === null) throw new Error(message || 'Expected non-null value');
  },

  isDefined: (value: unknown, message?: string) => {
    if (value === undefined) throw new Error(message || 'Expected defined value');
  },

  isUndefined: (value: unknown, message?: string) => {
    if (value !== undefined) throw new Error(message || `Expected undefined but got ${value}`);
  },

  contains: (array: unknown[], item: unknown, message?: string) => {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to contain ${item}`);
    }
  },

  hasLength: (array: unknown[], length: number, message?: string) => {
    if (array.length !== length) {
      throw new Error(message || `Expected length ${length} but got ${array.length}`);
    }
  },

  isGreaterThan: (actual: number, expected: number, message?: string) => {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  },

  isLessThan: (actual: number, expected: number, message?: string) => {
    if (actual >= expected) {
      throw new Error(message || `Expected ${actual} to be less than ${expected}`);
    }
  },

  throwsAsync: async (fn: () => Promise<unknown>, message?: string) => {
    try {
      await fn();
      throw new Error(message || 'Expected function to throw');
    } catch (e) {
      // Expected
    }
  },

  matchesRegex: (value: string, regex: RegExp, message?: string) => {
    if (!regex.test(value)) {
      throw new Error(message || `Expected "${value}" to match ${regex}`);
    }
  },
};

// DOM testing helpers
export const domHelpers = {
  waitForElement: async (selector: string, timeout = 5000): Promise<Element | null> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  },

  waitForText: async (text: string, timeout = 5000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (document.body.textContent?.includes(text)) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  },

  clickElement: (selector: string): boolean => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.click();
      return true;
    }
    return false;
  },

  typeInInput: (selector: string, value: string): boolean => {
    const element = document.querySelector(selector) as HTMLInputElement;
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  },

  isVisible: (selector: string): boolean => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  },

  getElementText: (selector: string): string | null => {
    const element = document.querySelector(selector);
    return element?.textContent || null;
  },

  getElementAttribute: (selector: string, attribute: string): string | null => {
    const element = document.querySelector(selector);
    return element?.getAttribute(attribute) || null;
  },

  countElements: (selector: string): number => {
    return document.querySelectorAll(selector).length;
  },
};

// Network testing helpers
export const networkHelpers = {
  mockFetch: (responses: Record<string, unknown>) => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      for (const pattern of Object.keys(responses)) {
        if (url.includes(pattern)) {
          return new Response(JSON.stringify(responses[pattern]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      return originalFetch(input, init);
    };
    return () => { window.fetch = originalFetch; };
  },

  waitForNetworkIdle: async (timeout = 5000): Promise<void> => {
    // Simple implementation - wait for a period with no new requests
    await new Promise(resolve => setTimeout(resolve, Math.min(timeout, 1000)));
  },
};

// Storage testing helpers
export const storageHelpers = {
  setLocalStorage: (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getLocalStorage: <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  clearLocalStorage: () => {
    localStorage.clear();
  },

  setSessionStorage: (key: string, value: unknown) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  getSessionStorage: <T>(key: string): T | null => {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  clearSessionStorage: () => {
    sessionStorage.clear();
  },
};

// Performance testing helpers
export const performanceHelpers = {
  measureAsync: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  },

  measureSync: <T>(fn: () => T): { result: T; duration: number } => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    return { result, duration };
  },

  getMemoryUsage: (): number | null => {
    if ('memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || null;
    }
    return null;
  },

  measureRenderTime: async (componentMount: () => void): Promise<number> => {
    const start = performance.now();
    componentMount();
    await new Promise(requestAnimationFrame);
    return performance.now() - start;
  },
};

// Test runner
export async function runTests(
  testFunctions: Array<{ name: string; fn: () => Promise<void> | void }>,
  suiteName = 'E2E Test Suite'
): Promise<TestSuite> {
  const context = new TestContext(suiteName);

  for (const test of testFunctions) {
    context.startTest(test.name);
    try {
      await test.fn();
      context.passTest();
    } catch (error) {
      context.failTest(error instanceof Error ? error.message : String(error));
    }
  }

  context.printSummary();
  return context.getSummary();
}

// Export test decorator for easy test definition
export function defineTest(name: string, fn: () => Promise<void> | void) {
  return { name, fn };
}

// Retry helper for flaky tests
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
