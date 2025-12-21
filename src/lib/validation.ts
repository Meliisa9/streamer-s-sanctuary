/**
 * Input validation and sanitization utilities
 * Provides comprehensive validation for all user inputs
 */

import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters');

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Username validation
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Display name validation
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(50, 'Display name must be less than 50 characters');

// Bio/description validation
export const bioSchema = z
  .string()
  .trim()
  .max(500, 'Bio must be less than 500 characters')
  .optional();

// URL validation
export const urlSchema = z
  .string()
  .trim()
  .url('Please enter a valid URL')
  .max(2048, 'URL must be less than 2048 characters')
  .optional()
  .or(z.literal(''));

// Safe URL validation (prevents javascript: and data: URLs)
export const safeUrlSchema = z
  .string()
  .trim()
  .refine((url) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Please enter a valid HTTP or HTTPS URL')
  .optional()
  .or(z.literal(''));

// Code validation (for admin access codes)
export const accessCodeSchema = z
  .string()
  .min(6, 'Access code must be at least 6 characters')
  .max(64, 'Access code must be less than 64 characters');

// Amount validation (for points, currency, etc.)
export const positiveNumberSchema = z
  .number()
  .positive('Amount must be positive')
  .finite('Amount must be a valid number');

export const nonNegativeNumberSchema = z
  .number()
  .nonnegative('Amount cannot be negative')
  .finite('Amount must be a valid number');

// Text content validation
export const shortTextSchema = z
  .string()
  .trim()
  .max(255, 'Text must be less than 255 characters');

export const longTextSchema = z
  .string()
  .trim()
  .max(10000, 'Text must be less than 10,000 characters');

// UUID validation
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

// Date validation
export const futureDateSchema = z
  .string()
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed > new Date();
  }, 'Date must be in the future');

export const pastDateSchema = z
  .string()
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, 'Date must be in the past');

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 10000); // Enforce max length
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(input: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return null;
  return Math.max(min, Math.min(max, num));
}

/**
 * Validate URL is safe (not javascript:, data:, etc.)
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Rate limiting helper - tracks action timestamps
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  
  // Clean old timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (validTimestamps.length >= maxRequests) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfterMs = windowMs - (now - oldestTimestamp);
    return { allowed: false, retryAfterMs };
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return { allowed: true };
}

/**
 * Clear rate limit for a key (useful after successful operations)
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate that a value is one of allowed options (enum-like validation)
 */
export function isValidOption<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T);
}
