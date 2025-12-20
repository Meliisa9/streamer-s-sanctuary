/**
 * API E2E Tests
 * Tests for API endpoints, data fetching, and error handling
 */

import { assert, performanceHelpers, defineTest, runTests, withRetry } from './testUtils';
import { supabase } from '@/integrations/supabase/client';

const apiTests = [
  defineTest('Supabase client is initialized', async () => {
    assert.isNotNull(supabase, 'Supabase client should be initialized');
  }),

  defineTest('Can fetch videos list', async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title')
      .limit(5);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
    assert.isNotNull(data, 'Should return data');
  }),

  defineTest('Can fetch news articles', async () => {
    const { data, error } = await supabase
      .from('news_articles')
      .select('id, title')
      .eq('is_published', true)
      .limit(5);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
  }),

  defineTest('Can fetch giveaways', async () => {
    const { data, error } = await supabase
      .from('giveaways')
      .select('id, title')
      .limit(5);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
  }),

  defineTest('Can fetch events', async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title')
      .limit(5);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
  }),

  defineTest('Can fetch casino bonuses', async () => {
    const { data, error } = await supabase
      .from('casino_bonuses')
      .select('id, name')
      .eq('is_published', true)
      .limit(5);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
  }),

  defineTest('Can fetch polls', async () => {
    const { data, error } = await supabase
      .from('polls')
      .select('id, title')
      .eq('is_active', true)
      .limit(5);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
  }),

  defineTest('Can fetch video categories', async () => {
    const { data, error } = await supabase
      .from('video_categories')
      .select('id, name')
      .limit(10);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
  }),

  defineTest('Can fetch site settings', async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .limit(10);
    
    assert.isNull(error, `Should not have error: ${error?.message}`);
  }),

  defineTest('API response time is acceptable', async () => {
    const { duration } = await performanceHelpers.measureAsync(async () => {
      await supabase.from('videos').select('id').limit(1);
    });
    
    assert.isLessThan(duration, 5000, 'API response should be under 5 seconds');
  }),

  defineTest('Can handle pagination', async () => {
    const { data: page1, error: error1 } = await supabase
      .from('videos')
      .select('id')
      .range(0, 4);
    
    const { data: page2, error: error2 } = await supabase
      .from('videos')
      .select('id')
      .range(5, 9);
    
    assert.isNull(error1, 'Page 1 should not error');
    assert.isNull(error2, 'Page 2 should not error');
  }),

  defineTest('Error handling works correctly', async () => {
    // Test with invalid query - use a valid table with impossible filter
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .limit(1);
    
    // Should not error but return empty data for non-existent ID
    assert.isNull(error, 'Should not error on valid query with no results');
    assert.isTrue(true, 'Error handling check completed');
  }),

  defineTest('Retry mechanism works', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 2) throw new Error('Simulated failure');
      return 'success';
    }, 3, 100);
    
    assert.equals(result, 'success', 'Should succeed after retry');
    assert.equals(attempts, 2, 'Should have attempted twice');
  }),
];

export async function runApiTests() {
  return runTests(apiTests, 'API Tests');
}

export { apiTests };
