/**
 * E2E Test Suite Entry Point
 * Runs all E2E tests and generates comprehensive reports
 */

import { TestSuite } from './testUtils';
import { runAuthTests } from './auth.test';
import { runNavigationTests } from './navigation.test';
import { runComponentTests } from './components.test';
import { runApiTests } from './api.test';

export interface TestReport {
  suites: TestSuite[];
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalTests: number;
  duration: number;
  timestamp: Date;
}

/**
 * Run all E2E test suites
 */
export async function runAllE2ETests(): Promise<TestReport> {
  const startTime = Date.now();
  console.log('\n🚀 Starting E2E Test Suite\n');
  console.log('='.repeat(60));

  const suites: TestSuite[] = [];

  try {
    // Run each test suite
    console.log('\n📋 Running Authentication Tests...\n');
    suites.push(await runAuthTests());

    console.log('\n📋 Running Navigation Tests...\n');
    suites.push(await runNavigationTests());

    console.log('\n📋 Running Component Tests...\n');
    suites.push(await runComponentTests());

    console.log('\n📋 Running API Tests...\n');
    suites.push(await runApiTests());

  } catch (error) {
    console.error('Error running test suites:', error);
  }

  const duration = Date.now() - startTime;

  // Calculate totals
  const totalPassed = suites.reduce((sum, s) => sum + s.totalPassed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.totalFailed, 0);
  const totalSkipped = suites.reduce((sum, s) => sum + s.totalSkipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;

  // Print final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST REPORT');
  console.log('='.repeat(60));
  console.log(`\nTest Suites Run: ${suites.length}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏭️ Skipped: ${totalSkipped}`);
  console.log(`\nTotal Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`Pass Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(60) + '\n');

  if (totalFailed > 0) {
    console.log('\n❌ FAILED TESTS:');
    suites.forEach(suite => {
      suite.tests
        .filter(t => t.status === 'failed')
        .forEach(t => {
          console.log(`  - ${suite.name} > ${t.name}`);
          if (t.error) console.log(`    Error: ${t.error}`);
        });
    });
  }

  const report: TestReport = {
    suites,
    totalPassed,
    totalFailed,
    totalSkipped,
    totalTests,
    duration,
    timestamp: new Date(),
  };

  // Store report in session for later access
  sessionStorage.setItem('e2e_test_report', JSON.stringify(report));

  return report;
}

/**
 * Run a specific test suite by name
 */
export async function runTestSuite(suiteName: string): Promise<TestSuite | null> {
  switch (suiteName.toLowerCase()) {
    case 'auth':
    case 'authentication':
      return runAuthTests();
    case 'navigation':
    case 'nav':
      return runNavigationTests();
    case 'component':
    case 'components':
      return runComponentTests();
    case 'api':
      return runApiTests();
    default:
      console.error(`Unknown test suite: ${suiteName}`);
      return null;
  }
}

/**
 * Get the last test report from session storage
 */
export function getLastTestReport(): TestReport | null {
  const stored = sessionStorage.getItem('e2e_test_report');
  return stored ? JSON.parse(stored) : null;
}

// Export test utilities for external use
export * from './testUtils';
export { runAuthTests } from './auth.test';
export { runNavigationTests } from './navigation.test';
export { runComponentTests } from './components.test';
export { runApiTests } from './api.test';
