/**
 * Security utilities and helpers
 * Provides security-focused functions for the application
 */

/**
 * Content Security Policy nonce generator
 * Used for inline scripts when CSP is enabled
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Safely parse JSON without throwing
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Check if running in secure context (HTTPS)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:';
}

/**
 * Mask sensitive data for logging (e.g., emails, tokens)
 */
export function maskSensitiveData(data: string, visibleChars = 3): string {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 8);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(data.length - visibleChars * 2, 10));
  return `${start}${masked}${end}`;
}

/**
 * Check if a string looks like it contains sensitive data
 */
export function containsSensitiveData(text: string): boolean {
  const patterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /auth/i,
    /bearer/i,
    /session/i,
    /credit[_-]?card/i,
    /ssn/i,
    /social[_-]?security/i,
  ];
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Validate origin for CORS-like checks
 */
export function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureRandomString(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

/**
 * Simple hash function for non-security-critical purposes
 * (e.g., cache keys, deduplication)
 */
export async function simpleHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Timing-safe string comparison (prevents timing attacks)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still compare to prevent length-based timing attacks
    b = a;
  }
  let result = a.length === b.length ? 0 : 1;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Sanitize error messages before displaying to users
 * Removes potentially sensitive internal details
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  const message = error instanceof Error ? error.message : String(error);
  
  // Remove stack traces and internal paths
  const sanitized = message
    .replace(/at\s+.*?\(.*?\)/g, '')
    .replace(/\/[a-zA-Z0-9_\-/.]+\.(ts|js|tsx|jsx):\d+:\d+/g, '')
    .replace(/node_modules/g, '')
    .replace(/Error:\s*/g, '')
    .trim();
  
  // If message contains potentially sensitive data, return generic message
  if (containsSensitiveData(sanitized)) {
    return 'An error occurred. Please try again.';
  }
  
  return sanitized || 'An unknown error occurred';
}

/**
 * Check if current session has potential session fixation risk
 */
export function checkSessionIntegrity(): boolean {
  // Check for suspicious session storage patterns
  const sessionKeys = Object.keys(sessionStorage);
  const localKeys = Object.keys(localStorage);
  
  // Flag if there are too many auth-related keys (potential tampering)
  const authKeyCount = [...sessionKeys, ...localKeys].filter(
    key => /auth|token|session|jwt/i.test(key)
  ).length;
  
  return authKeyCount <= 5; // Reasonable threshold
}

/**
 * Log security events (for audit purposes)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown> = {}
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: Object.fromEntries(
      Object.entries(details).map(([key, value]) => [
        key,
        typeof value === 'string' && containsSensitiveData(key)
          ? maskSensitiveData(value)
          : value,
      ])
    ),
    userAgent: navigator.userAgent,
    url: window.location.href.split('?')[0], // Remove query params
  };
  
  // In development, log to console
  if (import.meta.env.DEV) {
    console.info('[Security Event]', logEntry);
  }
  
  // In production, you might send to a security logging service
  // This is a placeholder for that functionality
}
