import { FastifyReply, FastifyRequest } from 'fastify';

interface LoginAttempt {
  count: number;
  resetTime: number;
}

// In-memory store for login attempts (in production, use Redis)
const loginAttempts = new Map<string, LoginAttempt>();

// Configuration
const MAX_ATTEMPTS = 5; // Max 5 login attempts
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const BLOCK_DURATION = 15 * 60 * 1000; // Block for 15 minutes

/**
 * Rate limiter middleware for login endpoints
 * Prevents brute force attacks by limiting login attempts per IP/identifier
 *
 * Usage: app.post('/login', { preHandler: loginRateLimiter }, handler)
 */
export async function loginRateLimiter(request: FastifyRequest, reply: FastifyReply) {
  const ipAddress = request.ip || 'unknown';
  // For employee login, also consider the identifier (email/code)
  const identifier = (request.body as any)?.email || (request.body as any)?.companyCode || '';
  const key = `${ipAddress}:${identifier}`;

  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (attempt) {
    // Check if time window has passed
    if (now > attempt.resetTime) {
      // Reset counter
      loginAttempts.set(key, { count: 1, resetTime: now + TIME_WINDOW });
    } else {
      // Increment counter
      if (attempt.count >= MAX_ATTEMPTS) {
        // Too many attempts
        const remainingTime = Math.ceil((attempt.resetTime - now) / 1000);
        return reply.status(429).send({
          error: 'Too Many Login Attempts',
          message: `Too many login attempts. Please try again in ${remainingTime} seconds.`,
          retryAfter: remainingTime,
        });
      }
      attempt.count += 1;
    }
  } else {
    // First attempt
    loginAttempts.set(key, { count: 1, resetTime: now + TIME_WINDOW });
  }

  // Cleanup old entries periodically (every ~100 requests)
  if (Math.random() < 0.01) {
    const now = Date.now();
    const keysToDelete: string[] = [];
    loginAttempts.forEach((v, k) => {
      if (now > v.resetTime) {
        keysToDelete.push(k);
      }
    });
    keysToDelete.forEach(k => loginAttempts.delete(k));
  }
}

/**
 * Clear login attempts for a specific IP (call after successful login)
 */
export function clearLoginAttempts(ipAddress: string, identifier?: string) {
  const key = identifier ? `${ipAddress}:${identifier}` : ipAddress;
  loginAttempts.delete(key);
}

/**
 * Get remaining attempts for debugging/logging
 */
export function getLoginAttempts(ipAddress: string, identifier?: string): number {
  const key = identifier ? `${ipAddress}:${identifier}` : ipAddress;
  const attempt = loginAttempts.get(key);
  if (!attempt || Date.now() > attempt.resetTime) {
    return MAX_ATTEMPTS;
  }
  return Math.max(0, MAX_ATTEMPTS - attempt.count);
}
